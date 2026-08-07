// Help with syntax was found on Mozilla Development Network Web Docs and the express.js documentation:
// https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/Introduction#where_did_node_and_express_come_from
// https://expressjs.com/en/guide/using-middleware.html
// https://expressjs.com/en/5x/api.html#express.json
// https://www.w3schools.com/nodejs/nodejs_filesystem.asp

// ********************** Dependencies **********************

// Import Express framework to handle HTTP requests
const express = require('express');
// Import file system module to allow the server to read and write files on the computer
const fs = require('fs');
// Initialize the Express application
const app = express();
const PORT = 8000;

// ********************** Middleware **********************

/**
 * express.json - Express 5.x API Reference:
 *
 * This is a built-in middleware function in Express.
 * It parses incoming requests with JSON payloads and is based on body-parser.
 * Returns middleware that only parses JSON and only looks at requests where the Content-Type header matches the
 * type option.
 */
app.use(express.json());
/**
 * express.static - Express 5.x API Reference:
 *
 * Serves static files and is based on serve-static.
 */
const path = require('path');
app.use(express.static(__dirname));

// Defines the path to the JSON files where the settings and stats are saved
const SETTINGS_FILE = 'game_settings.json';
const STATS_FILE = 'game_stats.json'

// Initialize settings file if missing
if (!fs.existsSync(SETTINGS_FILE)) {
    console.log("System: Settings file not found. Creating default...")

    // Default values for the file to be created with.
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
      maxGuesses: 10,
      questionType: 'standard',
      allowRepeat: true,
      allowRandom : true
    }));
}

// Initalize stats file if missing
if (!fs.existsSync(STATS_FILE)) {
    console.log("System: Stats file not found. Creating default...");
    fs.writeFileSync(STATS_FILE, JSON.stringify({
        totalGames: 0,
        computerWins: 0,
        playerWins: 0,
        invalidAnswers: 0
    }, null, 2));
}

// ********************** Settings Routes **********************

/**
 * ROUTE: GET /loadsettings
 *
 * Retrieves the current game settings.
 * REST Principle: The GET method is used to retrieve resources.
 */
app.get('/loadsettings', (req, res) => {
    console.log("Request recieved: GET /loadsettings");

    try {
        // Checks if the file exists before reading
        if (fs.existsSync(SETTINGS_FILE)) {
            // Read the file contents as a string
            const data = fs.readFileSync(SETTINGS_FILE, 'utf8');

            // Parse the string into a JSON object and send it to the client
            res.json(JSON.parse(data));
        } else {
            // If the file is missing, return a default object
            res.json({maxGuesses: 10});
        }
    } catch (error) {
        // If file read fails, return HTTP 500 (server error)
        console.error("Error loading settings: ", error);
        res.status(500).json({error: 'Failed to load settings from server'});
    }
});

/**
 * ROUTE: POST /gamesettings
 *
 * Updates/overwrites the game settings.
 * REST Principle: The POST method is used to create/update resources.
 */
app.post('/gamesettings', (req, res) => {
    console.log("Request recieved: POST /gamesettings");

    try {
        // Access the data sent by the frontend through 'req.body'
        const newSettings = req.body;

        // Write the new data to the file, replace the old data
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));

        // Send a success response back to the frontend
        res.json({success: true, message: 'Settings saved successfully.'});

        console.log("Data saved to disk: ", newSettings);
    } catch (error) {
        // Return 500 if the write fails
        console.error("Error adding settings from server:", error);
        res.status(500).json({error: 'Failed to update/overwrite settings from server'});
    }
});

// ********************** Stats Routes **********************
/**
 * ROUTE: GET /loadstats
 *
 * Loads the user's game statistics.
 */
app.get('/loadstats', (req, res) => {
    if (fs.existsSync(STATS_FILE)) {
        const data = fs.readFileSync(STATS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } else {
        // Return fallback values as the default values
        res.json({ totalGames: 0, computerWins: 0, playerWins: 0, invalidAnswers: 0 });
    }
});

/**
 * ROUTE: POST /gamestats
 *
 * Updates the user's game statistics.
 * The frontend sends the results of one game; this is added to the total results then updated.
 */
app.post('/gamestats', (req, res) => {
    try {
        const incomingResult = req.body; // for example, { computerWins: 1 }

        // Read the existing stats
        let currentStats = { totalGames: 0, computerWins: 0, playerWins: 0, invalidAnswers: 0 };

        if (fs.existsSync(STATS_FILE)) {
            const fileData = fs.readFileSync(STATS_FILE, 'utf8');
            currentStats = JSON.parse(fileData);
        }

        // Add the new result to the existing totals
        currentStats.totalGames += incomingResult.totalGames;
        currentStats.computerWins += incomingResult.computerWins;
        currentStats.playerWins += incomingResult.playerWins;
        currentStats.invalidAnswers += incomingResult.invalidAnswers;

        // Save back to the file
        fs.writeFileSync(STATS_FILE, JSON.stringify(currentStats, null, 2));

        // Prints number of total games to console
        console.log("Stats updated. Total games: ", currentStats.totalGames);
        res.json({success: true, message: 'Stats updated successfully.'});
    } catch(error) {
        console.error("Error adding stats from server:", error);
        res.status(500).json({error: 'Failed to load stats'});
    }
})


// ********************** Server Startup **********************

// Start the server and listen for requests on the defined port
app.listen(PORT, () => {
    console.log(`Server is running. Access the game at http://localhost:${PORT}`);
});
