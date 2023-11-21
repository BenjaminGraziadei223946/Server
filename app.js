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

/*const graphClient = Client.init({
  authProvider: (done) => {
    done(null, eyJ0eXAiOiJKV1QiLCJub25jZSI6InNXQktnUmEwME80NWgwSWxZRWhkMFZlaWlJV3VMdFdkT25qSVJBZlZJRTgiLCJhbGciOiJSUzI1NiIsIng1dCI6IjlHbW55RlBraGMzaE91UjIybXZTdmduTG83WSIsImtpZCI6IjlHbW55RlBraGMzaE91UjIybXZTdmduTG83WSJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jNDU4ZTU2Mi00NTRhLTRiZTktYTdkNy1lZjNkYjNlNWExZjQvIiwiaWF0IjoxNzAwMjExMDkxLCJuYmYiOjE3MDAyMTEwOTEsImV4cCI6MTcwMDI5Nzc5MSwiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFWUUFxLzhWQUFBQU1qd2VRL1dON3NJcWt5R0crTXdIa1RkamtPVlFuWDMyYmdUbldXdXlsb2FaWWpDa0UrajYxTkJrclNZV2VMdU9vS091UGx2d2hFVEg0cDNxbmFmKzFCTmZWclBnSU9qQk1CSTBKVUJIVVBJPSIsImFtciI6WyJwd2QiLCJyc2EiLCJtZmEiXSwiYXBwX2Rpc3BsYXluYW1lIjoiR3JhcGggRXhwbG9yZXIiLCJhcHBpZCI6ImRlOGJjOGI1LWQ5ZjktNDhiMS1hOGFkLWI3NDhkYTcyNTA2NCIsImFwcGlkYWNyIjoiMCIsImRldmljZWlkIjoiZTNiMTAwYWYtYWE1MS00MGU1LTlmYjUtODVkNTIwYWY1ZTAzIiwiZmFtaWx5X25hbWUiOiJHcmF6aWFkZWkiLCJnaXZlbl9uYW1lIjoiQmVuamFtaW4iLCJpZHR5cCI6InVzZXIiLCJpcGFkZHIiOiIxNDUuMTI4LjI0NS4zMyIsIm5hbWUiOiJCZW5qYW1pbiBHcmF6aWFkZWkgfCBNYXhhcm8iLCJvaWQiOiI3ZjA3ZDM2Zi1jOGUzLTQ0OGYtOTA3MS1jNzQ0NDZhMmE4MWIiLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMjI5NjgwNTE0OS0zODM4MjQ4NjYwLTI3NDA1NzM4OTYtMjg2NTIiLCJwbGF0ZiI6IjMiLCJwdWlkIjoiMTAwMzIwMDJFNTUyQjU5QiIsInJoIjoiMC5BVEVBWXVWWXhFcEY2VXVuMS04OXMtV2g5QU1BQUFBQUFBQUF3QUFBQUFBQUFBRGpBTWcuIiwic2NwIjoib3BlbmlkIHByb2ZpbGUgVXNlci5SZWFkIGVtYWlsIiwic2lnbmluX3N0YXRlIjpbImR2Y19tbmdkIiwiZHZjX2NtcCIsImR2Y19kbWpkIiwiaW5rbm93bm50d2siLCJrbXNpIl0sInN1YiI6Ims1TXdlVEVPQklheXZWRzZuekZYUWlDV29FeUE0MmZncUJLNHJRVEl1bU0iLCJ0ZW5hbnRfcmVnaW9uX3Njb3BlIjoiRVUiLCJ0aWQiOiJjNDU4ZTU2Mi00NTRhLTRiZTktYTdkNy1lZjNkYjNlNWExZjQiLCJ1bmlxdWVfbmFtZSI6ImJncmF6aWFkZWlAbWF4YXJvLm5sIiwidXBuIjoiYmdyYXppYWRlaUBtYXhhcm8ubmwiLCJ1dGkiOiJ0THZhZGt3TjJFQ05RNlNsdlRJX0FBIiwidmVyIjoiMS4wIiwid2lkcyI6WyI2MmU5MDM5NC02OWY1LTQyMzctOTE5MC0wMTIxNzcxNDVlMTAiLCJiNzlmYmY0ZC0zZWY5LTQ2ODktODE0My03NmIxOTRlODU1MDkiXSwieG1zX2NjIjpbIkNQMSJdLCJ4bXNfc3NtIjoiMSIsInhtc19zdCI6eyJzdWIiOiIxUUM1M2c3TFZSM0JmTFVDbmNqQWlZSFRaYnB4b0QxdTcta1RkazBXT3k4In0sInhtc190Y2R0IjoxNTEzNTkxODIwLCJ4bXNfdGRiciI6IkVVIn0.SoaazDMVhD2oXYsYQTfweZUtfksI37cOhYMoyeUC7mNYpNBvaqMIT5hpNML2a45Z7FB3Fo9GF2JI6DHhcGSyuHhXZM1HmH6hO9N9dLlerDToDlpw5MqNNZBidxJdYADUfSzvJBAVxTwPnlKKMSRD9rTGkTiHQEUBPVtBNWnDuTHlMPtF-FgHZaYyXYZ3p57zwEsf1Z3jY1KTk-OM_f1oZSAx_dT8NNY1GHz13evcSK6NVokGiawp1qNbMrlcdYLbUozkFgQ0By0ekB7WjnQ64lOmmFWLvFZiNRH6_Uhy9xp88aXE3P1AdDISC0ayM5OxEZV6fdlSfU0m-RqIlf2oew); // Provide the token
  }
});*/

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

app.post('/api/callback', async (req, res) => {
  const callId = req.body.callId; // Extract call ID from the request
  try {
    await answerCall(callId, eyJ0eXAiOiJKV1QiLCJub25jZSI6InNXQktnUmEwME80NWgwSWxZRWhkMFZlaWlJV3VMdFdkT25qSVJBZlZJRTgiLCJhbGciOiJSUzI1NiIsIng1dCI6IjlHbW55RlBraGMzaE91UjIybXZTdmduTG83WSIsImtpZCI6IjlHbW55RlBraGMzaE91UjIybXZTdmduTG83WSJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jNDU4ZTU2Mi00NTRhLTRiZTktYTdkNy1lZjNkYjNlNWExZjQvIiwiaWF0IjoxNzAwMjExMDkxLCJuYmYiOjE3MDAyMTEwOTEsImV4cCI6MTcwMDI5Nzc5MSwiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFWUUFxLzhWQUFBQU1qd2VRL1dON3NJcWt5R0crTXdIa1RkamtPVlFuWDMyYmdUbldXdXlsb2FaWWpDa0UrajYxTkJrclNZV2VMdU9vS091UGx2d2hFVEg0cDNxbmFmKzFCTmZWclBnSU9qQk1CSTBKVUJIVVBJPSIsImFtciI6WyJwd2QiLCJyc2EiLCJtZmEiXSwiYXBwX2Rpc3BsYXluYW1lIjoiR3JhcGggRXhwbG9yZXIiLCJhcHBpZCI6ImRlOGJjOGI1LWQ5ZjktNDhiMS1hOGFkLWI3NDhkYTcyNTA2NCIsImFwcGlkYWNyIjoiMCIsImRldmljZWlkIjoiZTNiMTAwYWYtYWE1MS00MGU1LTlmYjUtODVkNTIwYWY1ZTAzIiwiZmFtaWx5X25hbWUiOiJHcmF6aWFkZWkiLCJnaXZlbl9uYW1lIjoiQmVuamFtaW4iLCJpZHR5cCI6InVzZXIiLCJpcGFkZHIiOiIxNDUuMTI4LjI0NS4zMyIsIm5hbWUiOiJCZW5qYW1pbiBHcmF6aWFkZWkgfCBNYXhhcm8iLCJvaWQiOiI3ZjA3ZDM2Zi1jOGUzLTQ0OGYtOTA3MS1jNzQ0NDZhMmE4MWIiLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMjI5NjgwNTE0OS0zODM4MjQ4NjYwLTI3NDA1NzM4OTYtMjg2NTIiLCJwbGF0ZiI6IjMiLCJwdWlkIjoiMTAwMzIwMDJFNTUyQjU5QiIsInJoIjoiMC5BVEVBWXVWWXhFcEY2VXVuMS04OXMtV2g5QU1BQUFBQUFBQUF3QUFBQUFBQUFBRGpBTWcuIiwic2NwIjoib3BlbmlkIHByb2ZpbGUgVXNlci5SZWFkIGVtYWlsIiwic2lnbmluX3N0YXRlIjpbImR2Y19tbmdkIiwiZHZjX2NtcCIsImR2Y19kbWpkIiwiaW5rbm93bm50d2siLCJrbXNpIl0sInN1YiI6Ims1TXdlVEVPQklheXZWRzZuekZYUWlDV29FeUE0MmZncUJLNHJRVEl1bU0iLCJ0ZW5hbnRfcmVnaW9uX3Njb3BlIjoiRVUiLCJ0aWQiOiJjNDU4ZTU2Mi00NTRhLTRiZTktYTdkNy1lZjNkYjNlNWExZjQiLCJ1bmlxdWVfbmFtZSI6ImJncmF6aWFkZWlAbWF4YXJvLm5sIiwidXBuIjoiYmdyYXppYWRlaUBtYXhhcm8ubmwiLCJ1dGkiOiJ0THZhZGt3TjJFQ05RNlNsdlRJX0FBIiwidmVyIjoiMS4wIiwid2lkcyI6WyI2MmU5MDM5NC02OWY1LTQyMzctOTE5MC0wMTIxNzcxNDVlMTAiLCJiNzlmYmY0ZC0zZWY5LTQ2ODktODE0My03NmIxOTRlODU1MDkiXSwieG1zX2NjIjpbIkNQMSJdLCJ4bXNfc3NtIjoiMSIsInhtc19zdCI6eyJzdWIiOiIxUUM1M2c3TFZSM0JmTFVDbmNqQWlZSFRaYnB4b0QxdTcta1RkazBXT3k4In0sInhtc190Y2R0IjoxNTEzNTkxODIwLCJ4bXNfdGRiciI6IkVVIn0.SoaazDMVhD2oXYsYQTfweZUtfksI37cOhYMoyeUC7mNYpNBvaqMIT5hpNML2a45Z7FB3Fo9GF2JI6DHhcGSyuHhXZM1HmH6hO9N9dLlerDToDlpw5MqNNZBidxJdYADUfSzvJBAVxTwPnlKKMSRD9rTGkTiHQEUBPVtBNWnDuTHlMPtF-FgHZaYyXYZ3p57zwEsf1Z3jY1KTk-OM_f1oZSAx_dT8NNY1GHz13evcSK6NVokGiawp1qNbMrlcdYLbUozkFgQ0By0ekB7WjnQ64lOmmFWLvFZiNRH6_Uhy9xp88aXE3P1AdDISC0ayM5OxEZV6fdlSfU0m-RqIlf2oew);      // Answer the call using Graph AP
    res.status(200).send('Call handled');
  } catch (error) {
    console.error('Error handling call:', error);
    res.status(500).send('Error handling call');
  }
});

async function answerCall(callId, accessToken) {
  const graphApiEndpoint = `https://graph.microsoft.com/v1.0/communications/calls/${callId}/answer`;

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  const body = {
    // Define the callback URL and other necessary parameters as per your setup
    callbackUri: 'https://conversbotserver.azurewebsites.net/api/callback',
    acceptedModalities: ['audio'],
    mediaConfig: {
      '@odata.type': '#microsoft.graph.serviceHostedMediaConfig'
    }
  };

  try {
    const response = await axios.post(graphApiEndpoint, body, { headers: headers });
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
