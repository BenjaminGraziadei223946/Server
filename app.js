const express = require('express');
const morgan = require('morgan');
const speechSdk = require("microsoft-cognitiveservices-speech-sdk");
const { CloudAdapter, ConfigurationServiceClientCredentialFactory, createBotFrameworkAuthenticationFromConfiguration } = require('botbuilder');
const axios = require('axios');
const appInsights = require("applicationinsights");
const play = require('play-sound')(opts = {});

appInsights.setup("8924c1d5-6c8d-4105-ba42-f881f6cfe838");
appInsights.start();


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

    appInsights.defaultClient.trackTrace({ message: 'Access Token Retrieved Successfully', properties: response.data.access_token });
    return response.data.access_token;
  } catch (error) {
    appInsights.defaultClient.trackException({ exception: new Error('AccessToken Error') });
    throw new Error('Failed to retrieve access token');
  }
}

adapter.onTurnError = async (context, error) => {
  const errorMessage = '[onTurnError]: ${error}';
  appInsights.defaultClient.trackException({ exception: new Error(errorMessage) });
  await context.sendActivity(`Oops. Something went wrong!`);
};

function playAudio(audio) {
  play.play(audio, function(err){
    if (err) {
      appInsights.defaultClient.trackException({ exception: new Error ('Audio error, ${audio}') });
    }
  });
}

app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  appInsights.defaultClient.trackTrace({ message: 'GET Request to /' });
  res.status(200).send('Server is healthy');
});

app.post('/api/calling', async (req, res) => {
  try {
    appInsights.defaultClient.trackTrace({ message: 'POST Request to /api/calling', properties: req.body });
    const audio = req.body.value[0].recourceData[0].mediaStreams[0]

    res.status(200).send('Callback received');
  } catch (error) {
    errorMessage = 'Error in /api/calling: ${error.message}';
    appInsights.defaultClient.trackException({ exception: new Error(errorMessage) });
    res.status(500).send('Error handling callback');
  }
});

app.post('/api/callback', async (req, res) => {
  const callId = req.body.value[0].resourceData.id; // Extract call ID from the request
  try {
    appInsights.defaultClient.trackTrace({ message: 'Handling call', properties: { callId } });
    await answerCall(callId);      // Answer the call using Graph AP
    res.status(200).send('Call handled');
  } catch (error) {
    appInsights.defaultClient.trackException({ exception: new Error('Error Handling call') });
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
    appInsights.defaultClient.trackTrace({ message: 'Call answered', properties: response.data });
    return response.data;
  } catch (error) {
    appInsights.defaultClient.trackException({ exception: new Error(errorMessage) });
    throw error;
  }
}


async function handleRealTimeMedia(callId) {
  const speechConfig = speechSdk.SpeechConfig.fromSubscription("<Your_Speech_Service_Key>", "<Your_Service_Region>");
  const audioConfig = speechSdk.AudioConfig.fromStreamInput(audioStream);
  
  const recognizer = new speechSdk.SpeechRecognizer(speechConfig, audioConfig);

  recognizer.recognizeOnceAsync(result => {
    console.log(`Recognized: ${result.text}`);
    // Process the text as needed
  });
}


// Start the server
app.listen(port, () => {
  appInsights.defaultClient.trackTrace({ message: `Server is running on port ${port}` });
});
