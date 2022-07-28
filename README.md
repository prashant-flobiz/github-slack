## Node app to handle slack commands for your slack channel

---

### How to Setup?

Run following commands in `/functions` directory to run app
- `yarn`
- `yarn dev`

### Setup environment
1. Setup [firebase CLI](https://firebase.google.com/docs/cli#install-cli-mac-linux)
2. Add environment variables to `.env` file

### How to deploy to firebase?

You need to login first to firebase CLI with `firebase login` and then: 
- `firebase deploy`

### Permissions
To run the commands `/build` and `/distribute`, you need to add your email to the `functions/utils/permissions.js`