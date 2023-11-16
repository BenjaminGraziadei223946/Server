const express = require('express');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT; // Use the PORT environment variable provided by Azure or default to 3000

// Define routes and middleware here
app.use(morgan('dev'));
// Define a basic route for testing
app.get('/', (req, res) => {
  res.send('Hello, Azure Web App!');
});

app.get('/api/callback', (req, res) => {
    res.send('Getting called!');
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
