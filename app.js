const express = require('express');
const morgan = require('morgan');
const { CloudAdapter, ConfigurationServiceClientCredentialFactory, createBotFrameworkAuthenticationFromConfiguration } = require('botbuilder');
const { CommunicationIdentityClient } = require('@azure/communication-identity');
const { Client } = require('@microsoft/microsoft-graph-client');


const app = express();
const port = process.env.PORT;

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: process.env.MICROSOFT_APP_ID,
  MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD
});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

const adapter = new CloudAdapter(botFrameworkAuthentication);

//const acsClient = new CommunicationIdentityClient(process.env.ACS_CONNECTION_STRING);

const graphClient = Client.init({
  authProvider: (done) => {
    const token = process.env.GraphAccessToken;
    done(null, token); // Provide the token
  }
});

adapter.onTurnError = async (context, error) => {
  console.error(`\n [onTurnError]: ${ error }`);
  // Send a message to the user
  await context.sendActivity(`Oops. Something went wrong!`);
};

app.use(morgan('dev'));
app.use(express.json());
/*app.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    // Bot logic here
    if (context.activity.type === 'message') {
      await context.sendActivity(`You sent: ${context.activity.text}`);
    }
  });
});*/

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
  const graphApiEndpoint = `communications/calls/${callId}/answer`;

  const requestParameters = {
    method: 'POST',
    url: graphApiEndpoint,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      callbackUri: 'https://conversbotserver.azurewebsites.net/api/calling',
      acceptedModalities: ['audio'],
      mediaConfig: {
        '@odata.type': '#microsoft.graph.serviceHostedMediaConfig'
      }
    }
  };

  try {
    const response = await graphClient.api(requestParameters.url)
                                     .post(requestParameters.body);
    console.log('Call answered:', response);
    return response;
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
