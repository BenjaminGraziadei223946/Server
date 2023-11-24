const express = require('express');
const morgan = require('morgan');
const { CloudAdapter, ConfigurationServiceClientCredentialFactory, createBotFrameworkAuthenticationFromConfiguration } = require('botbuilder');
const axios = require('axios');
const appInsights = require("applicationinsights");

appInsights.setup("8924c1d5-6c8d-4105-ba42-f881f6cfe838");
appInsights.start();


const app = express();
const port = process.env.PORT;

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: process.env.MICROSOFT_APP_ID,
  MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD
});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

const adapter = new CloudAdapter(botFrameworkAuthentication);

let callId = null;
let userId = null;
let accessToken = null;

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

    appInsights.defaultClient.trackTrace({ message: 'Access Token Retrieved Successfully'});
    return response.data.access_token;
  } catch (error) {
    appInsights.defaultClient.trackException({ exception: new Error('AccessToken Error') });
    throw new Error('Failed to retrieve access token');
  }
}

adapter.onTurnError = async (context, error) => {
  const errorMessage = `[onTurnError]: ${error}`;
  appInsights.defaultClient.trackException({ exception: new Error(errorMessage) });
  await context.sendActivity(`Oops. Something went wrong!`);
};

app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  appInsights.defaultClient.trackTrace({ message: 'GET Request to /' });
  res.status(200).send('Server is healthy');
});

app.post('/api/calling', async (req, res) => {
  try {
    // Assuming callId, userId, and meetingId are available and valid
    const transcriptEndPoint = `https://graph.microsoft.com/beta/users/${user}/onlineMeetings/${meetingId}/transcripts`;

    const headers = {
      'Authorization': `Bearer ${accessToken}`
    };

    // Fetch the list of transcripts for the meeting
    const transcriptListResponse = await axios.get(transcriptEndPoint, { headers });
    const transcripts = transcriptListResponse.data.value;
    appInsights.defaultClient.trackTrace({ message: 'Transcript List', properties: { transcriptListResponse } });

    // Optional: Choose the specific transcript if there are multiple
    // This is a basic example; you might want to add more sophisticated selection logic
    const transcriptId = transcripts.length > 0 ? transcripts[0].id : null;

    if (transcriptId) {
      // Fetch the content of the selected transcript
      const transcriptContentEndpoint = `${transcriptEndPoint}/${transcriptId}/content`;
      const transcriptContentResponse = await axios.get(transcriptContentEndpoint, { headers });
      const transcriptContent = transcriptContentResponse.data;

      // Log the transcript content
      appInsights.defaultClient.trackTrace({ message: 'Transcript Content', properties: { transcriptContentResponse } });
    } else {
      throw new Error('No transcripts available for the specified meeting.');
    }

    res.status(200).send('Transcript fetched successfully');
  } catch (error) {
    const errorMessage = `Error in /api/calling: ${error.message}`;
    appInsights.defaultClient.trackException({ exception: new Error(errorMessage) });
    res.status(500).send('Error handling callback');
  }
});

app.post('/api/callback', async (req, res) => {
   callId = req.body.value[0].resourceData.id; // Extract call ID from the request
   userId = req.body.value[0].resourceData.source.identity.user.id; // Extract user ID from the request
  try {
    const body = req.body
    appInsights.defaultClient.trackTrace({ message: 'Handling call', properties: { callId } });
    appInsights.defaultClient.trackTrace({ message: 'Body', properties: { body } });
    await answerCall(callId);      // Answer the call using Graph AP
    res.status(200).send('Call handled');
  } catch (error) {
    appInsights.defaultClient.trackException({ exception: new Error('Error Handling call') });
    res.status(500).send('Error handling call');
  }
});

async function answerCall(callId) {
  accessToken = await getAccessToken();
  appInsights.defaultClient.trackTrace({ message: 'Access Token Retrieved Successfully', properties: { accessToken }});
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
    appInsights.defaultClient.trackTrace({ message: 'Call answered', properties: response.data });
    return response.data;
  } catch (error) {
    appInsights.defaultClient.trackException({ exception: new Error(errorMessage) });
    throw error;
  }
}


// Start the server
app.listen(port, () => {
  appInsights.defaultClient.trackTrace({ message: `Server is running on port ${port}` });
});
