const functions = require("firebase-functions");
const express = require("express");
const bodyParser = require("body-parser");
const { github, slack, slackMessage } = require("./utils/apiClient");
const constants = require("./constants");
const {
  build: buildPermissions,
  distribute: distributePermissions
} = require("./utils/permissions");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const availableBuildTypes = ["debug", "qa", "offline", "release"];

// Uncomment this line to run locally
// app.listen(3000);

app.post("/build", async (req, res) => {
  const userWithPermissions = await hasPermissions(
    req.body,
    buildPermissions,
    res
  );
  if (!userWithPermissions.success) return;

  // Slack command
  const { text } = req.body;

  // Replace and trim unnecessary spaces might be present in slack command
  const branchAndBuild = String(text.replace(/\s{2,}/g, " ").trim()).split(" ");

  // Find branch and buildType from text
  const branch = branchAndBuild[0] ? branchAndBuild[0].trim() : "develop";
  const buildType = branchAndBuild[1] ? branchAndBuild[1].trim() : "qa";

  // Check if buildType is in allowed list or not
  if (!availableBuildTypes.includes(buildType.toLowerCase())) {
    res.json("Invalid Build Type");
    return;
  }

  // Build POST data for GitHub workflow trigger
  const data = {
    ref: branch,
    inputs: {
      buildType,
      buildMessage: `Successfully deployed \`${buildType.toUpperCase()}\` build by ${
        userWithPermissions.user.email
      } :rocket:`
    }
  };

  // API call to trigger manual `workflow_dispatch` event
  github
    .post(constants.BUILD_WORKFLOW_URL, data)
    .then(() => res.json(slackMessage("Build started :flo:")))
    .catch((error) =>
      res.json(
        slackMessage(
          `Error: ${error.response?.data?.message ?? "Command Failed :x:"}`
        )
      )
    );
});

// Uncomment the below code to log all the workflows to get ID
// github
//   .get("repos/<OWNER>/<REPO_NAME>/actions/workflows")
//   .then((response) => console.log(response.data.workflows))
//   .catch((err) => console.error(err));

app.post("/distribute", async (req, res) => {
  const userWithPermissions = await hasPermissions(
    req.body,
    distributePermissions,
    res
  );

  if (!userWithPermissions.success) return;

  // API call to trigger manual `workflow_dispatch` event
  github
    .post(constants.DISTRIBUTE_WORKFLOW_URL, { ref: "develop" })
    .then(() =>
      res.json(
        slackMessage(
          "Distribution started, testers will get an e-mail as soon as build generated"
        )
      )
    )
    .catch((error) =>
      res.json(
        slackMessage(
          `Error: ${error.response?.data?.message ?? "Command Failed :x:"}`
        )
      )
    );
});

const hasPermissions = async (payload, emails, res) => {
  const { user_id, channel_id } = payload;

  // Restrict all commands in #mobile-app-testing channel
  if (channel_id != constants.MY_CHANNEL_ID) {
    res.json(
      slackMessage("Command available only in #my-channel")
    );
    return {
      success: false
    };
  }

  // Get user info from user_id to verify access
  const slackResponse = await slack.get(`/users.info?user=${user_id}`);

  if (!emails.includes(slackResponse?.data?.user?.profile?.email ?? "")) {
    res.json(slackMessage("Unauthorized Access"));
    return {
      success: false
    };
  } else {
    return {
      success: true,
      user: slackResponse?.data?.user?.profile
    };
  }
};

exports.app = functions.https.onRequest(app);
