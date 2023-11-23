const express = require('express');
const morgan = require('morgan');
const { CloudAdapter, ConfigurationServiceClientCredentialFactory, createBotFrameworkAuthenticationFromConfiguration } = require('botbuilder');
const { CommunicationIdentityClient } = require('@azure/communication-identity');
const { Client } = require('@microsoft/microsoft-graph-client');
require('dotenv').config();
const axios = require('axios');

const app = express();
const port = process.env.PORT;

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: process.env.MICROSOFT_APP_ID,
  MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD
});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

const adapter = new CloudAdapter(botFrameworkAuthentication);

//const acsClient = new CommunicationIdentityClient(process.env.ACS_CONNECTION_STRING);

async function getAccessToken() {
  const url = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.CLIENT_ID);
  params.append('client_secret', process.env.CLIENT_SECRET);
  params.append('scope', 'https://graph.microsoft.com/.default'); // Adjust scope if needed

  try {
    const response = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error retrieving access token:', error);
    throw error;
  }
}

adapter.onTurnError = async (context, error) => {
  console.error(`\n [onTurnError]: ${ error }`);
  // Send a message to the user
  await context.sendActivity(`Oops. Something went wrong!`);
};


app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Server is healthy');
});

app.post('/api/calling', async (req, res) => {
  try {
    // You can log the request or perform any basic checks if needed
    console.log('Received callback:', req.body);

    // Respond with a 200 OK status to acknowledge the request
    res.status(200).send('Callback received');
  } catch (error) {
    console.error('Error handling callback:', error);
    res.status(500).send('Error handling callback');
  }
});

app.post('/api/callback', async (req, res) => {
  const callId = req.body.callId; // Extract call ID from the request
  try {
    await answerCall(callId);      // Answer the call using Graph AP
    res.status(200).send('Call handled');
  } catch (error) {
    console.error('Error handling call:', error);
    res.status(500).send('Error handling call');
  }
});

async function answerCall(callId) {
  const accessToken = await getAccessToken();
  const graphApiEndpoint = `https://graph.microsoft.com/v1.0/communications/calls/${callId}/answer`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };

  const body = {
    callbackUri: 'https://conversbotserver.azurewebsites.net/api/callback',
    acceptedModalities: ['audio'],
    mediaConfig: {
      '@odata.type': '#microsoft.graph.serviceHostedMediaConfig'
    }
  };

  try {
    const response = await axios.post(graphApiEndpoint, body, { headers });
    console.log('Call answered:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error answering call:', error);
    throw error;
  }
}



async function handleRealTimeMedia(callId) {
  // Code to handle real-time media streams
  // This involves using ACS to manage audio streams, like receiving and sending audio
}


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
