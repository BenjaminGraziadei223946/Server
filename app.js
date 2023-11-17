const express = require('express');
const morgan = require('morgan');
const { BotFrameworkAdapter } = require('botbuilder');
const { CommunicationIdentityClient } = require('@azure/communication-identity');
const { Client } = require('@microsoft/microsoft-graph-client');


const app = express();
const port = process.env.PORT;

const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword
});

const acsClient = new CommunicationIdentityClient(process.env.ACS_CONNECTION_STRING);

const graphClient = Client.init({
  authProvider: (done) => {
    done(null, process.env.GRAPH_API_TOKEN); // Provide the token
  }
});

adapter.onTurnError = async (context, error) => {
  console.error(`\n [onTurnError]: ${ error }`);
  // Send a message to the user
  await context.sendActivity(`Oops. Something went wrong!`);
};

app.use(morgan('dev'));
app.use(express.json());

app.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    // Bot logic here
    if (context.activity.type === 'message') {
      await context.sendActivity(`You sent: ${context.activity.text}`);
    }
  });
});

app.post('/api/calls', async (req, res) => {
  const callId = req.body.callId; // Extract call ID from the request
  await answerCall(callId);      // Answer the call using Graph API
  await handleRealTimeMedia(callId); // Manage real-time media with ACS
  res.status(200).send('Call handled');
});

async function answerCall(callId) {
  // Code to answer a call using Graph API
  const response = await graphClient.api(`/communications/calls/${callId}/answer`).post(/* Answer call payload */);
  // Handle the response
}


async function handleRealTimeMedia(callId) {
  // Code to handle real-time media streams
  // This involves using ACS to manage audio streams, like receiving and sending audio
}


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
