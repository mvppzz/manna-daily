
let currentVerse = {};

function loadRandomVerse() {
    const verseDisplay = document.getElementById('verse-display');
    verseDisplay.textContent = "John 3:16 I hope...";

    // 1. A short test list of universally recognizable books
    const books = ["Genesis", "Exodus", "Matthew", "Mark", "Luke", "John", "Romans", "Psalms", "Proverbs"];
    const randomBook = books[Math.floor(Math.random() * books.length)];
    
    // 2. Generate a random chapter and verse (keeping numbers small so they always exist)
    const randomChapter = Math.floor(Math.random() * 5) + 1;
    const randomVerse = Math.floor(Math.random() * 5) + 1;

    // 3. Construct a standard API URL that doesn't rely on broken "/random" extensions
    const cleanUrl = `https://bible-api.com/${randomBook}+${randomChapter}:${randomVerse}`;

    // 4. Send it through an open CORS proxy so your local browser stops blocking it!
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`;

    fetch(proxyUrl)
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json(); // AllOrigins wraps the response in a JSON object
        })
        .then(proxyData => {
            // The real API response is tucked safely inside proxyData.contents as a text string
            const bibleData = JSON.parse(proxyData.contents); 
            const verseInfo = bibleData.verses[0];

            // 5. Save the answers exactly how we need them!
            currentVerse = {
                text: verseInfo.text,
                book: bibleData.book_name, // E.g., "Proverbs"
                chapter: parseInt(verseInfo.chapter),
                verse: parseInt(verseInfo.verse)
            };

            // 6. Push the text directly to your beautiful Lexicon paragraph!
            verseDisplay.textContent = `"${currentVerse.text.trim()}"`;
            
            // Your developer cheat sheet in the console
            console.log("Correct Answer:", currentVerse);
        })
        .catch(error => {
            console.error("Error fetching verse:", error);
            verseDisplay.textContent = "The scroll is stuck! Try clicking play again.";
        });
}


// date update home
const dateElement = document.querySelector('h3');
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
dateElement.textContent = new Date().toLocaleDateString('en-US', options);

// 1. Grab our HTML elements using their IDs
const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const playButton = document.getElementById('default-button');

// 2. Listen for the play button click
playButton.addEventListener('click', () => {
    // Hide the main menu
    mainMenu.style.display = 'none';
    
    // Show the game screen
    gameScreen.style.display = 'block';
    
    // Call the function to grab the verse from the API!
    loadRandomVerse();
});