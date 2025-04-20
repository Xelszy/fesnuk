// Load environment variables from .env file into process.env
const dotenv = require('dotenv').config();

// Import Express to handle HTTP requests
const express = require('express');
const app = express(); // Initialize the Express app
// Import CORS to enable Cross-Origin Resource Sharing
const cors = require("cors");
// Use the CORS middleware to allow requests from any origin (default behavior)
app.use(cors());
// Retrieve the API key stored in the .env file
const API_KEY = process.env.API_KEY;
// Route to handle the root URL and send a welcome message
app.get("/", (req, res) => res.send("Welcome to Jillian's Recipe API."));
// Route to handle requests for fetching recipe data
app.get('/api/get-data', async (req, res) => {
  try {
    // Get the search term from the query parameters since this api takes a query
    const searchTerm = req.query.query;
    // Fetch data from the API using the search term and API key
    const response = await fetch(`https://api.api-ninjas.com/v1/recipe?query=${searchTerm}`, {
      headers: {
        'X-Api-Key': API_KEY, // Add the API key in the header for authentication as per the api documentation
      }
    });
    // Parse the response JSON
    const data = await response.json();
    // Send the data back to the client as a JSON response
    res.json(data);
  } catch (error) {
    // If there's an error, send a 500 status code with a custom error message
    res.status(500).send('Internal Server Error');
  }
});
// Start the server and listen on port 3000
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

// fetching the recipe data from the proxied url
async function fetch_recipes(search_term) {
    await fetch(`https://localhost:3000/api/get-data?query=${search_term}`, {
    }).then(resp => resp.json())
        .then((data) => renderFoods(data))

}