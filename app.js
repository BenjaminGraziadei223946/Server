const express = require('express');
const morgan = require('morgan');
const { BotFrameworkAdapter } = require('botbuilder');

const app = express();
const port = process.env.PORT;
const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword
});

adapter.onTurnError = async (context, error) => {
  console.error(`\n [onTurnError]: ${ error }`);
  // Send a message to the user
  await context.sendActivity(`Oops. Something went wrong!`);
};

// Define routes and middleware here
app.use(morgan('dev'));
// Define a basic route for testing
app.get('/', (req, res) => {
  res.send('Hello, Azure Web App!');
});

app.post('/api/callback', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
      // Route to main dialog.
      if (context.activity.type === 'conversationUpdate') {
        // Handle conversation update logic here
        // This is where you might detect the start of a call
        if (context.activity.membersAdded && context.activity.membersAdded.length > 0) {
            // Iterate over all new members added to the conversation
            for (const member of context.activity.membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    // Respond to the member (user or bot) who joined the conversation
                    await context.sendActivity('Welcome to the call!');
                }
            }
        }
    } else if (context.activity.type === 'message') {
        // Handle messages sent during the call
        await context.sendActivity(`You said: ${context.activity.text}`);
    }
  });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
