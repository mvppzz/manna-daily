const homeDate = document.querySelector('.home-date');
const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const resultsScreen = document.getElementById('results-screen');
const quitModal = document.getElementById('quit-modal');
const defaultButton = document.getElementById('default-button');
const quitButton = document.getElementById('quit-button');
const confirmQuit = document.getElementById('confirm-quit');
const cancelQuit = document.getElementById('cancel-quit');
const submitButton = document.getElementById('submit-button');
const bookSelect = document.getElementById('book-select');
const chapterInput = document.getElementById('chapter-input');
const verseInput = document.getElementById('verse-input');
const verseDisplay = document.getElementById('verse-display');
const hintText = document.getElementById('hint-text');
const feedbackText = document.getElementById('feedback-text');
const scoreDisplay = document.getElementById('score-display');
const questionNumber = document.getElementById('question-number');
const finalScore = document.getElementById('final-score');
const correctCount = document.getElementById('correct-count');
const incorrectCount = document.getElementById('incorrect-count');
const accuracyPercentage = document.getElementById('accuracy-percentage');
const playerNameInput = document.getElementById('player-name');
const submitScoreButton = document.getElementById('submit-score-button');
const scoreSaveMessage = document.getElementById('score-save-message');
const leaderboardTableBody = document.querySelector('#leaderboard-table tbody');
const goHomeButton = document.getElementById('go-home-button');

const MAX_QUESTIONS = 10;
const MAX_ATTEMPTS = 3;
const MAX_FETCH_RETRIES = 6;
const FETCH_TIMEOUT_MS = 3000;
const FALLBACK_FETCH_DELAY_MS = 800;
const POINTS_PER_CORRECT = 10;
const LEADERBOARD_KEY = 'mannaDailyLeaderboard';

const books = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges',
    'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes',
    'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
    'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke',
    'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
    'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter',
    '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

const localVerses = [
    { book: 'John', chapter: 3, verse: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
    { book: 'Psalm', chapter: 23, verse: 1, text: 'The Lord is my shepherd; I shall not want.' },
    { book: 'Philippians', chapter: 4, verse: 13, text: 'I can do all things through Christ which strengtheneth me.' },
    { book: 'Proverbs', chapter: 3, verse: 5, text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
    { book: 'Romans', chapter: 8, verse: 28, text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
];

const defaultLeaderboard = [
    { name: 'Miriam', score: 88, correct: 9, accuracy: '90%', total: 10 },
    { name: 'Caleb', score: 74, correct: 8, accuracy: '80%', total: 10 },
    { name: 'Noah', score: 62, correct: 7, accuracy: '70%', total: 10 },
    { name: 'Abigail', score: 50, correct: 6, accuracy: '60%', total: 10 }
];

const state = {
    currentQuestion: 0,
    score: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    attemptsLeft: MAX_ATTEMPTS,
    currentVerse: null,
    gameActive: false,
    leaderboard: []
};

function updateHomeDate() {
    if (!homeDate) return;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    homeDate.textContent = new Date().toLocaleDateString('en-US', options);
}

function showScreen(screen) {
    mainMenu.classList.toggle('hidden', screen !== 'home');
    gameScreen.classList.toggle('hidden', screen !== 'game');
    resultsScreen.classList.toggle('hidden', screen !== 'results');
}

function setSubmitState(enabled) {
    submitButton.disabled = !enabled;
    submitButton.textContent = enabled ? 'Submit Answer' : 'Loading...';
}

function setFeedback(message, type = 'neutral') {
    feedbackText.textContent = message;
    feedbackText.classList.remove('success', 'warning', 'error');
    if (type) feedbackText.classList.add(type);
}

function updateScoreboard() {
    scoreDisplay.textContent = state.score;
    questionNumber.textContent = Math.min(state.currentQuestion + 1, MAX_QUESTIONS);
}

function resetInputs() {
    if (bookSelect) bookSelect.value = '';
    if (chapterInput) chapterInput.value = '';
    if (verseInput) verseInput.value = '';
}

function loadSettings() {
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved) {
        try {
            state.leaderboard = JSON.parse(saved);
        } catch {
            state.leaderboard = [...defaultLeaderboard];
        }
    } else {
        state.leaderboard = [...defaultLeaderboard];
    }
    renderLeaderboard();
}

function saveLeaderboard() {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(state.leaderboard));
}

function renderLeaderboard() {
    const sorted = [...state.leaderboard].sort((a, b) => b.score - a.score);
    leaderboardTableBody.innerHTML = '';
    sorted.forEach((player, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.name}</td>
            <td>${player.score}</td>
            <td>${player.correct}</td>
            <td>${player.accuracy}</td>
        `;
        leaderboardTableBody.appendChild(row);
    });
}

function resetGameState() {
    state.currentQuestion = 0;
    state.score = 0;
    state.correctAnswers = 0;
    state.incorrectAnswers = 0;
    state.attemptsLeft = MAX_ATTEMPTS;
    state.currentVerse = null;
    state.gameActive = true;
    setSubmitState(false);
    setFeedback('Loading the first verse...', 'neutral');
    resetInputs();
    updateScoreboard();
}

function startGame() {
    showScreen('game');
    resetGameState();
    loadNextQuestion();
}

function endGame() {
    state.gameActive = false;
    showScreen('results');
    finalScore.textContent = state.score;
    correctCount.textContent = state.correctAnswers;
    incorrectCount.textContent = state.incorrectAnswers;
    const totalAnswered = state.correctAnswers + state.incorrectAnswers;
    accuracyPercentage.textContent = totalAnswered > 0 ? `${Math.round((state.correctAnswers / totalAnswered) * 100)}%` : '0%';
    renderLeaderboard();
}

function loadNextQuestion() {
    if (state.currentQuestion >= MAX_QUESTIONS) {
        endGame();
        return;
    }
    state.attemptsLeft = MAX_ATTEMPTS;
    state.currentVerse = null;
    state.fetchRetries = 0;
    resetInputs();
    updateScoreboard();
    verseDisplay.textContent = 'Loading the next verse...';
    hintText.textContent = 'Choose a book, chapter, and verse to answer.';
    setSubmitState(false);
    fetchVerse();
}

function fetchVerse() {
    const randomBook = books[Math.floor(Math.random() * books.length)];
    const randomChapter = Math.floor(Math.random() * 3) + 1;
    const randomVerse = Math.floor(Math.random() * 5) + 1;
    const apiUrl = `https://bible-api.com/${encodeURIComponent(randomBook)}+${randomChapter}:${randomVerse}?translation=kjv`;
    const controller = new AbortController();
    let isSettled = false;

    const clearFetchTimers = () => {
        clearTimeout(fallbackTimer);
        clearTimeout(timeoutId);
    };

    const fallbackTimer = setTimeout(() => {
        if (isSettled) return;
        isSettled = true;
        controller.abort();
        applyLocalVerse();
    }, FALLBACK_FETCH_DELAY_MS);

    const timeoutId = setTimeout(() => {
        if (isSettled) return;
        controller.abort();
    }, FETCH_TIMEOUT_MS);

    fetch(apiUrl, { signal: controller.signal })
        .then(response => {
            if (isSettled) return null;
            if (!response.ok) {
                throw new Error(`API Error: Status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || isSettled) {
                return;
            }
            if (!data.verses || data.verses.length === 0) {
                throw new Error('No verse data found in response');
            }
            const verseInfo = data.verses[0];
            isSettled = true;
            clearFetchTimers();
            state.currentVerse = {
                text: verseInfo.text,
                book: data.book_name,
                chapter: parseInt(verseInfo.chapter, 10),
                verse: parseInt(verseInfo.verse, 10)
            };
            verseDisplay.textContent = `"${state.currentVerse.text.trim()}"`;
            hintText.textContent = 'Submit your best guess for this verse.';
            setFeedback('Ready to answer.', 'neutral');
            setSubmitState(true);
        })
        .catch(error => {
            if (isSettled) return;
            isSettled = true;
            clearFetchTimers();
            const isAbort = error.name === 'AbortError';
            const isNetworkIssue = error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
            const isRateLimited = error.message.includes('Status 429') || error.message.includes('Status 403');
            console.warn('Verse load failed:', error.message || 'Request aborted');

            if (isAbort || isNetworkIssue || isRateLimited) {
                applyLocalVerse();
                return;
            }

            state.fetchRetries = (state.fetchRetries || 0) + 1;
            if (state.fetchRetries < MAX_FETCH_RETRIES) {
                verseDisplay.textContent = 'Unable to load a verse right now. Retrying...';
                setFeedback('Trying another verse reference...', 'warning');
                setTimeout(fetchVerse, 800);
                return;
            }
            applyLocalVerse();
        });
}

function applyLocalVerse() {
    const verse = localVerses[Math.floor(Math.random() * localVerses.length)];
    state.currentVerse = {
        text: verse.text,
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse
    };
    verseDisplay.textContent = `"${state.currentVerse.text.trim()}"`;
    hintText.textContent = 'Submit your best guess for this verse.';
    setFeedback('Offline verse loaded. Please answer using the verse reference.', 'success');
    setSubmitState(true);
}

function handleSubmitAnswer() {
    if (!state.gameActive || !state.currentVerse) {
        setFeedback('Please wait until the verse has loaded.', 'warning');
        return;
    }

    const userBook = bookSelect.value.trim();
    const userChapter = parseInt(chapterInput.value, 10);
    const userVerse = parseInt(verseInput.value, 10);

    if (!userBook) {
        setFeedback('Please choose a book from the list first!', 'warning');
        return;
    }

    if (Number.isNaN(userChapter) || Number.isNaN(userVerse) || userChapter < 1 || userVerse < 1) {
        setFeedback('Please enter valid numbers for chapter and verse.', 'warning');
        return;
    }

    setSubmitState(false);
    const bookCorrect = userBook.toLowerCase() === state.currentVerse.book.toLowerCase();
    const chapterCorrect = userChapter === state.currentVerse.chapter;
    const verseCorrect = userVerse === state.currentVerse.verse;

    if (bookCorrect && chapterCorrect && verseCorrect) {
        state.score += POINTS_PER_CORRECT;
        state.correctAnswers += 1;
        state.currentQuestion += 1;
        setFeedback('Wonderful! You matched the verse exactly!', 'success');
        updateScoreboard();
        const nextAction = () => {
            if (state.currentQuestion >= MAX_QUESTIONS) {
                endGame();
            } else {
                loadNextQuestion();
            }
        };
        setTimeout(nextAction, 1400);
        return;
    }

    state.attemptsLeft -= 1;

    if (state.attemptsLeft <= 0) {
        state.incorrectAnswers += 1;
        state.currentQuestion += 1;
        const correctAnswer = `${state.currentVerse.book} ${state.currentVerse.chapter}:${state.currentVerse.verse}`;
        setFeedback(`No attempts left. The answer was ${correctAnswer}.`, 'error');
        const nextAction = () => {
            if (state.currentQuestion >= MAX_QUESTIONS) {
                endGame();
            } else {
                loadNextQuestion();
            }
        };
        setTimeout(nextAction, 1800);
        return;
    }

    let message = 'Not quite. Please try again.';
    if (bookCorrect && (!chapterCorrect || !verseCorrect)) {
        message = `Right book (${state.currentVerse.book}), but wrong chapter or verse. ${state.attemptsLeft} attempt(s) left.`;
    } else if (!bookCorrect) {
        message = `That answer is not correct. ${state.attemptsLeft} attempt(s) remaining.`;
    }
    setFeedback(message, 'warning');
    setSubmitState(true);
}

function showQuitModal(show) {
    quitModal.classList.toggle('hidden', !show);
}

function cancelQuitGame() {
    showQuitModal(false);
}

function confirmQuitGame() {
    showQuitModal(false);
    resetInputs();
    setFeedback('', 'neutral');
    showScreen('home');
    state.gameActive = false;
}

function savePlayerScore() {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        scoreSaveMessage.textContent = 'Please enter your name before saving.';
        scoreSaveMessage.style.color = 'var(--danger)';
        return;
    }

    const totalAnswered = state.correctAnswers + state.incorrectAnswers;
    const accuracy = totalAnswered > 0 ? `${Math.round((state.correctAnswers / totalAnswered) * 100)}%` : '0%';
    state.leaderboard.push({
        name: playerName,
        score: state.score,
        correct: state.correctAnswers,
        accuracy,
        total: totalAnswered
    });

    saveLeaderboard();
    renderLeaderboard();
    scoreSaveMessage.textContent = 'Your score was saved successfully!';
    scoreSaveMessage.style.color = 'var(--success)';
    playerNameInput.value = '';
}

function goHome() {
    resetInputs();
    setFeedback('', 'neutral');
    showScreen('home');
    state.gameActive = false;
}

function attachEventHandlers() {
    updateHomeDate();
    defaultButton.addEventListener('click', startGame);
    quitButton.addEventListener('click', () => showQuitModal(true));
    cancelQuit.addEventListener('click', cancelQuitGame);
    confirmQuit.addEventListener('click', confirmQuitGame);
    submitButton.addEventListener('click', handleSubmitAnswer);
    submitScoreButton.addEventListener('click', savePlayerScore);
    goHomeButton.addEventListener('click', goHome);
}

function initialize() {
    attachEventHandlers();
    loadSettings();
    showScreen('home');
}

initialize();
