import { auth, db } from "./firebase.js";
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    getCountFromServer,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const homeDate = document.querySelector('.home-date');
const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const resultsScreen = document.getElementById('results-screen');
const authScreen = document.getElementById('auth-screen');
const quitModal = document.getElementById('quit-modal');
const defaultButton = document.getElementById('default-button');
const quitButton = document.getElementById('quit-button');
const confirmQuit = document.getElementById('confirm-quit');
const cancelQuit = document.getElementById('cancel-quit');
const submitButton = document.getElementById('submit-button');
const skipButton = document.getElementById('skip-button');
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
const submitScoreButton = document.getElementById('submit-score-button');
const scoreSaveMessage = document.getElementById('score-save-message');
const saveLoggedIn = document.getElementById('save-logged-in');
const saveLoggedOut = document.getElementById('save-logged-out');
const savePlayerLabel = document.getElementById('save-player-label');
const resultsLoginButton = document.getElementById('results-login-button');
const leaderboardTableBody = document.getElementById('leaderboard-table-body');
const leaderboardCurrentRow = document.getElementById('leaderboard-current-row');
const currentPlayerRank = document.getElementById('current-player-rank');
const currentPlayerScore = document.getElementById('current-player-score');
const goHomeButton = document.getElementById('go-home-button');
const authStatus = document.getElementById('auth-status');
const homeLoginButton = document.getElementById('home-login-button');
const homeLogoutButton = document.getElementById('home-logout-button');
const authNameInput = document.getElementById('auth-name');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const authLoginButton = document.getElementById('auth-login-button');
const authSignupButton = document.getElementById('auth-signup-button');
const authResetButton = document.getElementById('auth-reset-button');
const authBackButton = document.getElementById('auth-back-button');
const authMessage = document.getElementById('auth-message');

const MAX_QUESTIONS = 10;
const MAX_ATTEMPTS = 3;
const MAX_FETCH_RETRIES = 1;
const FETCH_TIMEOUT_MS = 1500;
const FETCH_RETRY_DELAY_MS = 300;
const POINTS_PER_CORRECT = 10;
const LEADERBOARD_SIZE = 10;
const MAX_NAME_LENGTH = 20;

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

const state = {
    currentQuestion: 0,
    score: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    attemptsLeft: MAX_ATTEMPTS,
    currentVerse: null,
    gameActive: false
};

let authReturnScreen = 'home';

function updateHomeDate() {
    if (!homeDate) return;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    homeDate.textContent = new Date().toLocaleDateString('en-US', options);
}

function getTodayKey() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}

function showScreen(screen) {
    mainMenu.classList.toggle('hidden', screen !== 'home');
    gameScreen.classList.toggle('hidden', screen !== 'game');
    resultsScreen.classList.toggle('hidden', screen !== 'results');
    authScreen.classList.toggle('hidden', screen !== 'auth');
}

function setSubmitState(enabled) {
    submitButton.disabled = !enabled;
    skipButton.disabled = !enabled;
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

function setAuthMessage(message, type = 'neutral') {
    authMessage.textContent = message;
    authMessage.classList.remove('success', 'warning', 'error');
    if (type) authMessage.classList.add(type);
}

function setAuthBusy(busy) {
    authLoginButton.disabled = busy;
    authSignupButton.disabled = busy;
    authResetButton.disabled = busy;
}

function getAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'That email address does not look right.';
        case 'auth/missing-password':
            return 'Please enter your password.';
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Email or password is incorrect.';
        case 'auth/email-already-in-use':
            return 'An account with that email already exists. Try logging in.';
        case 'auth/weak-password':
            return 'Password must be at least 6 characters.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a bit and try again.';
        case 'auth/network-request-failed':
            return 'Network problem. Check your connection and try again.';
        case 'auth/unauthorized-domain':
            return 'This website address is not authorized in Firebase yet.';
        default:
            return 'Something went wrong. Please try again.';
    }
}

function updateAuthUI(user) {
    const loggedIn = Boolean(user);
    const name = loggedIn ? (user.displayName || 'Player') : '';
    authStatus.textContent = loggedIn ? `Signed in as ${name}` : 'Playing as a guest';
    homeLoginButton.classList.toggle('hidden', loggedIn);
    homeLogoutButton.classList.toggle('hidden', !loggedIn);
    saveLoggedIn.classList.toggle('hidden', !loggedIn);
    saveLoggedOut.classList.toggle('hidden', loggedIn);
    savePlayerLabel.textContent = loggedIn ? `Saving as ${name}` : '';
    if (!resultsScreen.classList.contains('hidden')) {
        renderLeaderboard();
    }
}

function openAuthScreen(returnTo) {
    authReturnScreen = returnTo;
    authPasswordInput.value = '';
    setAuthMessage('', 'neutral');
    showScreen('auth');
}

function finishAuth() {
    authPasswordInput.value = '';
    setAuthMessage('', 'neutral');
    showScreen(authReturnScreen);
    updateAuthUI(auth.currentUser);
}

async function handleLogin() {
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;

    if (!email || !password) {
        setAuthMessage('Enter your email and password.', 'warning');
        return;
    }

    setAuthBusy(true);
    setAuthMessage('Logging in...', 'neutral');
    try {
        await signInWithEmailAndPassword(auth, email, password);
        finishAuth();
    } catch (error) {
        console.error('Login failed:', error);
        setAuthMessage(getAuthErrorMessage(error), 'error');
    }
    setAuthBusy(false);
}

async function handleSignUp() {
    const name = authNameInput.value.trim();
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;

    if (!name) {
        setAuthMessage('Pick a display name for the leaderboard.', 'warning');
        return;
    }

    if (name.length > MAX_NAME_LENGTH) {
        setAuthMessage(`Display name can be at most ${MAX_NAME_LENGTH} characters.`, 'warning');
        return;
    }

    if (!email || !password) {
        setAuthMessage('Enter your email and a password.', 'warning');
        return;
    }

    setAuthBusy(true);
    setAuthMessage('Creating your account...', 'neutral');
    try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        finishAuth();
    } catch (error) {
        console.error('Sign up failed:', error);
        setAuthMessage(getAuthErrorMessage(error), 'error');
    }
    setAuthBusy(false);
}

async function handlePasswordReset() {
    const email = authEmailInput.value.trim();

    if (!email) {
        setAuthMessage('Type your email above first, then click Forgot password.', 'warning');
        return;
    }

    setAuthBusy(true);
    try {
        await sendPasswordResetEmail(auth, email);
        setAuthMessage('If that email has an account, a reset link is on its way.', 'success');
    } catch (error) {
        console.error('Password reset failed:', error);
        setAuthMessage(getAuthErrorMessage(error), 'error');
    }
    setAuthBusy(false);
}

async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

function buildLeaderboardRow(values) {
    const row = document.createElement('tr');
    values.forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
    });
    return row;
}

function buildMessageRow(message) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = message;
    row.appendChild(cell);
    return row;
}

async function showCurrentPlayerRank(user, today) {
    try {
        const myDoc = await getDoc(doc(db, 'scores', `${user.uid}_${today}`));
        if (!myDoc.exists()) return;

        const myScore = myDoc.data().score;
        const higherScores = await getCountFromServer(
            query(
                collection(db, 'scores'),
                where('date', '==', today),
                where('score', '>', myScore)
            )
        );

        currentPlayerRank.textContent = `#${higherScores.data().count + 1}`;
        currentPlayerScore.textContent = `${myScore} pts`;
        leaderboardCurrentRow.classList.remove('hidden');
    } catch (error) {
        console.error('Could not load your rank:', error);
    }
}

async function renderLeaderboard() {
    leaderboardCurrentRow.classList.add('hidden');

    try {
        const today = getTodayKey();
        const topQuery = query(
            collection(db, 'scores'),
            where('date', '==', today),
            orderBy('score', 'desc'),
            limit(LEADERBOARD_SIZE)
        );
        const snapshot = await getDocs(topQuery);
        const user = auth.currentUser;
        let userInTop = false;
        const rows = [];

        snapshot.docs.forEach((docSnap, index) => {
            const player = docSnap.data();
            if (user && player.uid === user.uid) userInTop = true;
            rows.push(buildLeaderboardRow([
                index + 1,
                player.name,
                player.score,
                player.correct,
                `${player.accuracy}%`
            ]));
        });

        if (rows.length === 0) {
            rows.push(buildMessageRow('No scores yet today. Be the first!'));
        }

        leaderboardTableBody.replaceChildren(...rows);

        if (user && !userInTop) {
            await showCurrentPlayerRank(user, today);
        }
    } catch (error) {
        console.error('Leaderboard load failed:', error);
        leaderboardTableBody.replaceChildren(buildMessageRow('The leaderboard could not be loaded right now.'));
    }
}

function resetGameState() {
    state.currentQuestion = 0;
    state.score = 0;
    state.correctAnswers = 0;
    state.incorrectAnswers = 0;
    state.attemptsLeft = MAX_ATTEMPTS;
    state.currentVerse = null;
    state.gameActive = true;
    scoreSaveMessage.textContent = '';
    submitScoreButton.disabled = false;
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
            clearTimeout(timeoutId);
            state.currentVerse = {
                text: verseInfo.text,
                book: verseInfo.book_name || data.book_name || '',
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
            clearTimeout(timeoutId);
            const isAbort = error.name === 'AbortError';
            const isNetworkIssue = error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
            const isRateLimited = error.message.includes('Status 429') || error.message.includes('Status 403');
            console.warn('Verse load failed:', error.message || 'Request aborted');

            state.fetchRetries = (state.fetchRetries || 0) + 1;
            if (state.fetchRetries <= MAX_FETCH_RETRIES || isAbort || isNetworkIssue || isRateLimited) {
                verseDisplay.textContent = 'Still loading a verse...';
                setFeedback('The verse service is temporarily unavailable. Retrying...', 'warning');
                setTimeout(fetchVerse, FETCH_RETRY_DELAY_MS);
                return;
            }

            verseDisplay.textContent = 'Unable to load a verse right now.';
            hintText.textContent = 'Please try starting the game again.';
            setFeedback('The verse service is unavailable right now. Please try again.', 'error');
            setSubmitState(false);
        });
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
    const currentBook = (state.currentVerse.book || '').toString().trim();
    const bookCorrect = userBook.toLowerCase() === currentBook.toLowerCase();
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

function handleSkip() {
    if (!state.gameActive || !state.currentVerse) {
        setFeedback('Please wait until the verse has loaded.', 'warning');
        return;
    }

    setSubmitState(false);
    state.incorrectAnswers += 1;
    state.currentQuestion += 1;
    const skippedAnswer = `${state.currentVerse.book} ${state.currentVerse.chapter}:${state.currentVerse.verse}`;
    setFeedback(`Skipped. The answer was ${skippedAnswer}.`, 'warning');
    setTimeout(() => {
        if (state.currentQuestion >= MAX_QUESTIONS) {
            endGame();
        } else {
            loadNextQuestion();
        }
    }, 1800);
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

async function savePlayerScore() {
    const user = auth.currentUser;
    if (!user) {
        scoreSaveMessage.textContent = 'Please log in before saving your score.';
        scoreSaveMessage.style.color = 'var(--danger)';
        return;
    }

    const totalAnswered = state.correctAnswers + state.incorrectAnswers;
    const accuracy = totalAnswered > 0
        ? Math.round((state.correctAnswers / totalAnswered) * 100)
        : 0;
    const today = getTodayKey();
    const playerName = (user.displayName || 'Player').slice(0, MAX_NAME_LENGTH);

    submitScoreButton.disabled = true;
    scoreSaveMessage.textContent = 'Saving your score...';
    scoreSaveMessage.style.color = 'var(--muted)';

    try {
        await setDoc(doc(db, 'scores', `${user.uid}_${today}`), {
            uid: user.uid,
            name: playerName,
            score: state.score,
            correct: state.correctAnswers,
            total: totalAnswered,
            accuracy,
            date: today,
            createdAt: serverTimestamp()
        });

        scoreSaveMessage.textContent = 'Your score was saved successfully!';
        scoreSaveMessage.style.color = 'var(--success)';
        renderLeaderboard();
    } catch (error) {
        console.error('Saving score failed:', error);
        if (error.code === 'permission-denied') {
            scoreSaveMessage.textContent = 'Only one score can be saved per day, and it looks like you already saved today\'s.';
        } else {
            scoreSaveMessage.textContent = 'Your score could not be saved. Please try again.';
            submitScoreButton.disabled = false;
        }
        scoreSaveMessage.style.color = 'var(--danger)';
    }
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
    skipButton.addEventListener('click', handleSkip);
    submitScoreButton.addEventListener('click', savePlayerScore);
    goHomeButton.addEventListener('click', goHome);
    homeLoginButton.addEventListener('click', () => openAuthScreen('home'));
    homeLogoutButton.addEventListener('click', handleLogout);
    resultsLoginButton.addEventListener('click', () => openAuthScreen('results'));
    authLoginButton.addEventListener('click', handleLogin);
    authSignupButton.addEventListener('click', handleSignUp);
    authResetButton.addEventListener('click', handlePasswordReset);
    authBackButton.addEventListener('click', () => showScreen(authReturnScreen));
    authPasswordInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') handleLogin();
    });
}

function initialize() {
    attachEventHandlers();
    onAuthStateChanged(auth, updateAuthUI);
    showScreen('home');
}

initialize();