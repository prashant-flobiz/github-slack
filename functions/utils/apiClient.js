const { default: axios } = require("axios");
require("dotenv").config();

// Github API client
exports.github = axios.create({
  baseURL: "https://api.github.com",
  auth: {
    username: process.env.USERNAME,
    password: process.env.PASSWORD
  },
  headers: {
    Accept: "application/vnd.github.everest-preview+json"
  }
});

// Slack API client
exports.slack = axios.create({
  baseURL: "https://slack.com/api",
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.SLACK_TOKEN}`
  }
});

// Slack Message Template
exports.slackMessage = (message) => {
  return {
    blocks: [{ type: "section", text: { type: "mrkdwn", text: message } }]
  };
};
