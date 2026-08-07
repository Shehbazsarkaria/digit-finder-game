// ********************** DOM Elements **********************
const yesButton = document.getElementById("yesBtn");
const noButton = document.getElementById("noBtn");
const unsureButton = document.getElementById("unsureBtn");
const questionBox = document.getElementById("questionBox");
const questionNumber = document.getElementById("questionNum");
const clickSound = new Audio('audio files/mixkit-select-click-1109.wav');

// ********************** Game Variables **********************
const maxNum = 100;
let maxQuestions = 10;

// Variables that change during the game
let candidates = [];
let questionCount = 0;
let currentLogicFunction = null; // Stores which question is to be asked

// ********************** Helper Functions **********************

function playClick() {
    clickSound.currentTime = 0;
    clickSound.play();
}

// ********************** Navigation Logic **********************

// This is called by the HTML buttons (onclick="showPage(...)")
window.showPage = function(pageId) {
    playClick();

    // Hide all pages
    const pages = document.getElementsByClassName('page');
    for (let i = 0; i < pages.length; i++) {
        pages[i].classList.remove('active');
    }

    // Show the specific page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // If the game loop is opened, start the game
    if (pageId === 'gameLoop') {
        startGame();
    }

    if (pageId === 'statsPage') {
        loadAndDisplayStats();
    }
}

// ********************** Settings Logic **********************
// learned this from https://www.w3schools.com/js/js_json_stringify.asp
// Save settings to backend
function saveSettingsToBackend() {
    // Get values from the HTML inputs
    const settings = {
        maxGuesses: parseInt(document.getElementById('max-guesses').value),
        questionType: document.getElementById('question-type').value,
        allowRepeat: document.getElementById('allow-repeat').checked,
        allowRandom: document.getElementById('allow-random').checked
    };
    
    // Send the data to the server
    fetch('/gamesettings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Server response: ", data);
        alert('Settings saved!');
    })
}

// ********************** Load Settings **********************

// Load settings from backend
function loadSettingsFromBackend() {
    fetch('/loadsettings')
        .then(response => response.json())
        .then(settings => {
            document.getElementById('max-guesses').value = settings.maxGuesses;
            document.getElementById('question-type').value = settings.questionType;
            document.getElementById('allow-repeat').checked = settings.allowRepeat || true;
            document.getElementById('allow-random').checked = settings.allowRandom || true;

            console.log('Settings loaded from server!');
    });
}

// ********************** Stats Setup **********************
// Load stats for display
function loadAndDisplayStats() {
    fetch('/loadstats')
        .then(response => response.json())
        .then(stats => {
            console.log("Stats received from server:", stats);

            const total = document.getElementById('totalGames');
            // If no games have been played, then the game won't look for values that don't exist yet
            if (total) {
                total.textContent = stats.totalGames;
                document.getElementById('computerWins').textContent = stats.computerWins;
                document.getElementById('playerWins').textContent = stats.playerWins;
                document.getElementById('invalidAnswers').textContent = stats.invalidAnswers;
            }
        });
}

// ********************** Game Setup **********************

function startGame() {
    // Reset the candidates array
    candidates = [];

    // Repopulate the array with fresh data
    for (let i = 0; i <= maxNum; i++) {
        candidates.push(i);
    }

    questionCount = 0;

    // Get maxQuestions from localStorage everytime game starts
    const maxGuessesInput = document.getElementById('max-guesses');
    if (maxGuessesInput) {
        maxQuestions = parseInt(maxGuessesInput.value) || 10;
    } else {
        // Default value
        maxQuestions = 10;
    }

    // Reset and set initial image
    updateGenieImage();

    // This overwrites any previous logic from the last game
    yesButton.onclick = function() {
        playClick();
        handleInput(true);
    };
    noButton.onclick = function() {
        playClick();
        handleInput(false);
    };
    unsureButton.onclick = function() {
        playClick();
        skipQuestion();
    };

    // Make sure unsure button is visible
    unsureButton.style.display = "inline-flex";

    // Start the first round
    nextRound();
}

//function to update genie image with emotion
function updateGenieImage() {
    const genieImage = document.getElementById("genieImage");
    if (!genieImage) return;
    
    if (questionCount === 0 ) {
        // Start question - normal genie
        genieImage.src = "img/pibblegenie.png";
    } else {
        const percentage = (questionCount / maxQuestions) * 100;
        
        if (percentage <= 25) {
            genieImage.src = "img/pibblegenie.png";
        } else if (percentage <= 50) {
            genieImage.src = "img/pibblegenie-nervous.png";
        } else if (percentage <= 75) {
            genieImage.src = "img/pibblegenie-morenervous.png";
        } else {
            genieImage.src = "img/pibblegenie-mostnervous.png";
        }
    }
}

// ********************** Game Loop **********************

function nextRound() {
    // Check if there are no numbers left (Error)
    if (candidates.length === 0) {
        showPage('invalidAnswer');
        sendGameResult('invalidAnswer');
        return;
    }

    // Check if the number has been found
    if (candidates.length === 1) {
        endGame('found', candidates[0]);
        return;
    }

    // Check if out of guesses
    if (questionCount >= maxQuestions) {
        endGame('lost', 0);
        return;
    }

    // Increment question counter
    questionCount++;

    // Show the question number on the frontend
    if (questionNumber) {
        questionNumber.textContent = "Question " + questionCount;
    }
    updateGenieImage(); 

    // Decide which question to ask based on random chance
    // First question is always a filter question
    if (questionCount === 1) {
        askFilterQuestion();
    } else {
        let randomNum = Math.random();
        if (randomNum < 0.3) {
            askTriviaQuestion();
        } else {
            askBinarySearchQuestion();
        }
    }
}

function handleInput(userSaidYes) {
    // Run the logic function for the current question
    if (currentLogicFunction !== null) {
        // candidates becomes the new list of numbers
        candidates = currentLogicFunction(candidates, userSaidYes);

        // Debugging for console
        console.log("Numbers left: " + candidates.length);

        nextRound();
    }
}

function skipQuestion() {
    console.log("Skipped Question");
    // Just go to next round without changing the list
    nextRound();
}

// ********************** Question Logic **********************

function askFilterQuestion() {
    let coinFlip = Math.floor(Math.random() * 2);

    if (coinFlip === 0) {
        questionBox.textContent = "Is the number even?";

        // Define how to handle the answer
        currentLogicFunction = function(currentList, isYes) {
            let newList = [];
            for (let i = 0; i < currentList.length; i++) {
                let num = currentList[i];
                if (isYes) {
                    // User said yes (It is even), then keep evens
                    if (num % 2 === 0) {
                        newList.push(num);
                    }
                } else {
                    // User said no (It is not even) then keep odds
                    if (num % 2 !== 0) {
                        newList.push(num);
                    }
                }
            }
            return newList;
        };

    } else {
        questionBox.textContent = "Is the number a multiple of 10?";

        currentLogicFunction = function(currentList, isYes) {
            let newList = [];
            for (let i = 0; i < currentList.length; i++) {
                let num = currentList[i];
                if (isYes) {
                    if (num % 10 === 0) { newList.push(num); }
                } else {
                    if (num % 10 !== 0) { newList.push(num); }
                }
            }
            return newList;
        };
    }
}

function askBinarySearchQuestion() {
    // Find the middle number
    let middleIndex = Math.floor(candidates.length / 2);
    let pivot = candidates[middleIndex];

    questionBox.textContent = "Is the number greater than or equal to " + pivot + "?";

    currentLogicFunction = function(currentList, isYes) {
        let newList = [];
        for (let i = 0; i < currentList.length; i++) {
            let num = currentList[i];
            if (isYes) {
                // Keep numbers bigger or equal
                if (num >= pivot) {
                    newList.push(num);
                }
            } else {
                // Keep numbers smaller
                if (num < pivot) {
                    newList.push(num);
                }
            }
        }
        return newList;
    };
}

const memeNumbers = [21, 42, 67];
const pointyNumbers = [1, 4, 7];

function askTriviaQuestion() {
    let randomChoice = Math.floor(Math.random() * 2);

    if (randomChoice === 0) {
        // Meme question
        questionBox.textContent = "Is it a meme number (21, 42, 67)?";

        currentLogicFunction = function(currentList, isYes) {
            let newList = [];
            for (let i = 0; i < currentList.length; i++) {
                let num = currentList[i];
                let isMeme = false;

                // Check if in meme array
                if (memeNumbers.includes(num)) {
                    isMeme = true;
                }

                if (isYes) {
                    if (isMeme) {
                        newList.push(num);
                    }
                } else {
                    if (!isMeme) {
                        newList.push(num);
                    }
                }
            }
            return newList;
        };

    } else {
        // Pointy question
        questionBox.textContent = "Does the number have pointy digits (1, 4, 7)?";

        currentLogicFunction = function(currentList, isYes) {
            let newList = [];
            for (let i = 0; i < currentList.length; i++) {
                let num = currentList[i];

                // Check for pointy digits
                let numString = num.toString();
                let hasPointy = false;

                for (let j = 0; j < numString.length; j++) {
                    // Convert character back to number
                    let digit = parseInt(numString[j]);
                    if (pointyNumbers.includes(digit)) {
                        hasPointy = true;
                        break; // Stop checking if one has been found
                    }
                }

                if (isYes) {
                    if (hasPointy) {
                        newList.push(num);
                    }
                } else {
                    if (!hasPointy) {
                        newList.push(num);
                    }
                }
            }
            return newList;
        };
    }
}

// ********************** End Game Logic **********************

function endGame(result, finalNumber) {
    // Stop game logic
    currentLogicFunction = null;
    const genieImage = document.getElementById("genieImage");

    // Reset to normal genie
    if (genieImage) {
        genieImage.src = "img/pibblegenie.png";
    }

    // Hide unsure button
    unsureButton.style.display = "none";

    if (result === 'found') {
        questionBox.textContent = "I found it! Is your number " + finalNumber + "?";
        
        // Change buttons to navigation
        yesButton.onclick = function() {
            playClick();
            showPage('computerWin');
            //save win in stats
            sendGameResult('computerWin');
            //show the amount of attempts it took to guess the answer
            document.getElementById('computerAttempts').textContent = "I guessed your number in " + questionCount + " questions.";
        };
        noButton.onclick = function() {
            playClick();
            showPage('playerWin');
            //save win in stats
            sendGameResult('playerWin');
        };
    } else if (result === 'lost') {
        // Show game over page
        showPage('playerWin');
        sendGameResult('playerWin');
    }
}
// Send game result to backend
function sendGameResult(resultType) {
    // Create a scorecard for this specific game
    const gameResult = {
        totalGames: 1,
        computerWins: 0,
        playerWins: 0,
        invalidAnswers: 0
    };

    // Mark the winner
    if (resultType === 'computerWin') {
        gameResult.computerWins = 1;
    } else if (resultType === 'playerWin') {
        gameResult.playerWins = 1;
    } else if (resultType === 'invalidAnswer') {
        gameResult.invalidAnswers = 1;
    }

    // Send to the server with POST
    fetch('/gamestats', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameResult)
    })
    .then((response) => response.json())
        .then(data => {
            console.log("Stats saved successfully.")
            loadAndDisplayStats(); // Refreshes the stats display
        });
}

// Load settings when page loads
window.addEventListener('DOMContentLoaded', function() {
    loadSettingsFromBackend();  // Load from server
});
