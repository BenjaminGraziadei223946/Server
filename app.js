const express = require('express');
const morgan = require('morgan');
const { CloudAdapter, ConfigurationServiceClientCredentialFactory, createBotFrameworkAuthenticationFromConfiguration } = require('botbuilder');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000; // Fallback to 3000 if PORT is not defined

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: process.env.MICROSOFT_APP_ID,
  MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD
});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

const adapter = new CloudAdapter(botFrameworkAuthentication);

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

    console.log('Access Token Retrieved Successfully');
    return response.data.access_token;
  } catch (error) {
    console.error('Error retrieving access token:', error.message);
    throw new Error('Failed to retrieve access token');
  }
}

adapter.onTurnError = async (context, error) => {
  console.error(`\n [onTurnError]: ${error}`);
  await context.sendActivity(`Oops. Something went wrong!`);
};

app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  console.log('GET Request to /');
  res.status(200).send('Server is healthy');
});

app.post('/api/calling', async (req, res) => {
  try {
    console.log('POST Request to /api/calling', req.body);
    res.status(200).send('Callback received');
  } catch (error) {
    console.error('Error in /api/calling:', error.message);
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
    callbackUri: 'https://conversbotserver.azurewebsites.net/api/calling',
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
