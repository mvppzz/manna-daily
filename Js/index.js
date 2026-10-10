import { auth, db } from "./firebase.js";
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut, updateProfile,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    linkWithCredential
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
const authGoogleButton = document.getElementById('auth-google-button');
const streakDisplay = document.getElementById('streak-display');
const roundValueDisplay = document.getElementById('round-value-display');
const hintButton = document.getElementById('hint-button');
const hintReveal = document.getElementById('hint-reveal');
const settingsButton = document.getElementById('settings-button');
const profileAvatarPreview = document.getElementById('profile-avatar-preview');
const avatarOptions = document.querySelectorAll('.avatar-option');
const avatarUploadInput = document.getElementById('avatar-upload');
const profileNameInput = document.getElementById('profile-name-input');
const profileSaveButton = document.getElementById('profile-save-button');
const profileMessage = document.getElementById('profile-message');
const settingsModal = document.getElementById('settings-modal');
const soundVolumeSlider = document.getElementById('sound-volume');
const musicVolumeSlider = document.getElementById('music-volume');
const soundVolumeLabel = document.getElementById('sound-volume-label');
const musicVolumeLabel = document.getElementById('music-volume-label');
const settingsCloseButton = document.getElementById('settings-close-button');

const MAX_QUESTIONS = 10;
const MAX_ATTEMPTS = 3;
const MAX_FETCH_RETRIES = 1;
const FETCH_TIMEOUT_MS = 1500;
const FETCH_RETRY_DELAY_MS = 300;
const LEADERBOARD_SIZE = 10;
const MAX_NAME_LENGTH = 20;
const BASE_SCORE = 1500;
const POINTS_LOST_PER_MISS = 500;
const MAX_HINTS = 3;
const HINT_COST = 150;
const NEW_TESTAMENT_START = 39;
const PROFILE_KEY = 'mannadaily-profile';
const SETTINGS_KEY = 'mannadaily-settings';
const AVATAR_SIZE = 128;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

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
    gameActive: false,
    streak: 0,
    hintsUsed: 0
};

let authReturnScreen = 'home';
let pendingGoogleCredential = null;

function loadStored(key, defaults) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return { ...defaults };
        return { ...defaults, ...JSON.parse(raw) };
    } catch (error) {
        console.warn('Could not read saved data:', error);
        return { ...defaults };
    }
}

function saveStored(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn('Could not save data:', error);
        return false;
    }
}

function clampVolume(value, fallback) {
    const number = Number(value);
    if (Number.isNaN(number)) return fallback;
    return Math.min(100, Math.max(0, Math.round(number)));
}

let draftAvatar = null;
const profile = loadStored(PROFILE_KEY, { username: '', avatarType: 'emoji', avatarValue: '📖' });
profile.username = String(profile.username || '').slice(0, MAX_NAME_LENGTH);
profile.avatarValue = String(profile.avatarValue || '📖');

const savedSettings = loadStored(SETTINGS_KEY, { soundVolume: 70, musicVolume: 50 });
let soundVolume = clampVolume(savedSettings.soundVolume, 70);
let musicVolume = clampVolume(savedSettings.musicVolume, 50);

function getCurrentTryNumber() {
    return MAX_ATTEMPTS - state.attemptsLeft + 1;
}

function getRoundValue() {
    const tryValue = BASE_SCORE - (getCurrentTryNumber() - 1) * POINTS_LOST_PER_MISS;
    const hintPenalty = state.hintsUsed * HINT_COST;
    return Math.max(0, tryValue - hintPenalty);
}

function getStreakMultiplier(streak) {
    if (streak >= 6) return 2.0;
    if (streak >= 4) return 1.5;
    if (streak >= 2) return 1.2;
    return 1;
}

function getTestament(bookName) {
    const index = books.findIndex(book => book.toLowerCase() === bookName.toLowerCase());
    if (index === -1) return null;
    return index >= NEW_TESTAMENT_START ? 'New Testament' : 'Old Testament';
}

function showHints() {
    const lines = [];
    if (state.hintsUsed >= 1) {
        const testament = getTestament(state.currentVerse.book);
        lines.push(testament ? `Hint 1: This verse is in the ${testament}.` : 'Hint 1: This verse is from the Bible.');
    }
    if (state.hintsUsed >= 2) {
        lines.push(`Hint 2: The book is ${state.currentVerse.book}.`);
    }
    if (state.hintsUsed >= 3) {
        lines.push(`Hint 3: The chapter is ${state.currentVerse.chapter}.`);
    }
    hintReveal.textContent = lines.join(' ');
}

function handleHint() {
    if (!state.gameActive || !state.currentVerse) {
        setFeedback('Please wait until the verse has loaded.', 'warning');
        return;
    }
    if (state.hintsUsed >= MAX_HINTS) return;

    state.hintsUsed += 1;
    showHints();
    updateScoreboard();
    setFeedback(`Hint used. This verse is now worth ${getRoundValue()} points.`, 'neutral');
    setSubmitState(true);
}

function goToNextQuestion() {
    if (state.currentQuestion >= MAX_QUESTIONS) {
        endGame();
    } else {
        loadNextQuestion();
    }
}

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
    hintButton.disabled = !enabled || state.hintsUsed >= MAX_HINTS;
    const hintsLeft = MAX_HINTS - state.hintsUsed;
    hintButton.textContent = hintsLeft > 0 ? `Hint (${hintsLeft} left, -${HINT_COST})` : 'No hints left';
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
    streakDisplay.textContent = state.streak;
    roundValueDisplay.textContent = getRoundValue();
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
    authGoogleButton.disabled = busy;
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
            return 'An account with that email already exists. Try logging in, or use Continue with Google if you signed up that way.';
        case 'auth/weak-password':
            return 'Password must be at least 6 characters.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a bit and try again.';
        case 'auth/network-request-failed':
            return 'Network problem. Check your connection and try again.';
        case 'auth/unauthorized-domain':
            return 'This website address is not authorized in Firebase yet.';
        case 'auth/popup-blocked':
            return 'The Google window was blocked. Allow pop-ups and try again.';
        default:
            return 'Something went wrong. Please try again.';
    }
}

function getPlayerName(user) {
    const custom = profile.username.trim();
    const name = custom || (user && user.displayName) || 'Player';
    return name.slice(0, MAX_NAME_LENGTH);
}

function updateAuthUI(user) {
    const loggedIn = Boolean(user);
    const name = loggedIn ? getPlayerName(user) : '';
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
        const credential = await signInWithEmailAndPassword(auth, email, password);
        if (pendingGoogleCredential) {
            try {
                await linkWithCredential(credential.user, pendingGoogleCredential);
            } catch (linkError) {
                console.error('Linking Google failed:', linkError);
            }
            pendingGoogleCredential = null;
        }
        finishAuth();
    } catch (error) {
        console.error('Login failed:', error);
        setAuthMessage(getAuthErrorMessage(error), 'error');
    }
    setAuthBusy(false);
}

async function handleGoogleLogin() {
    setAuthBusy(true);
    setAuthMessage('Opening Google...', 'neutral');
    try {
        await signInWithPopup(auth, new GoogleAuthProvider());
        finishAuth();
    } catch (error) {
        console.error('Google login failed:', error);
        if (error.code === 'auth/account-exists-with-different-credential') {
            pendingGoogleCredential = GoogleAuthProvider.credentialFromError(error);
            if (error.customData && error.customData.email) {
                authEmailInput.value = error.customData.email;
            }
            setAuthMessage('You already have an account with this email. Log in with your email and password once, and Google will be connected to it.', 'warning');
        } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            setAuthMessage('', 'neutral');
        } else {
            setAuthMessage(getAuthErrorMessage(error), 'error');
        }
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
    state.streak = 0;
    state.hintsUsed = 0;
    state.gameActive = true;
    hintReveal.textContent = '';
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
    state.hintsUsed = 0;
    state.currentVerse = null;
    state.fetchRetries = 0;
    hintReveal.textContent = '';
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
        const tryNumber = getCurrentTryNumber();
        state.streak += 1;

        let multiplier = 1;
        if (tryNumber === 1) {
            multiplier = getStreakMultiplier(state.streak);
        }

        const pointsEarned = Math.round(getRoundValue() * multiplier);
        state.score += pointsEarned;
        state.correctAnswers += 1;
        state.currentQuestion += 1;

        let message = `Wonderful! +${pointsEarned} points.`;
        if (multiplier > 1) {
            message = `Wonderful! +${pointsEarned} points (${multiplier}x streak bonus!)`;
        }
        setFeedback(message, 'success');
        updateScoreboard();
        setTimeout(goToNextQuestion, 1400);
        return;
    }

    state.attemptsLeft -= 1;

    if (state.attemptsLeft <= 0) {
        state.incorrectAnswers += 1;
        state.currentQuestion += 1;
        state.streak = 0;
        const correctAnswer = `${state.currentVerse.book} ${state.currentVerse.chapter}:${state.currentVerse.verse}`;
        setFeedback(`No attempts left. The answer was ${correctAnswer}. Streak reset.`, 'error');
        updateScoreboard();
        setTimeout(goToNextQuestion, 1800);
        return;
    }

    updateScoreboard();
    let message = 'Not quite. Please try again.';
    if (bookCorrect && (!chapterCorrect || !verseCorrect)) {
        message = `Right book (${state.currentVerse.book}), but wrong chapter or verse. ${state.attemptsLeft} attempt(s) left. Now worth ${getRoundValue()} points.`;
    } else if (!bookCorrect) {
        message = `That answer is not correct. ${state.attemptsLeft} attempt(s) remaining. Now worth ${getRoundValue()} points.`;
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
    state.streak = 0;
    updateScoreboard();
    const skippedAnswer = `${state.currentVerse.book} ${state.currentVerse.chapter}:${state.currentVerse.verse}`;
    setFeedback(`Skipped (0 points, streak reset). The answer was ${skippedAnswer}.`, 'warning');
    setTimeout(goToNextQuestion, 1800);
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
    const playerName = getPlayerName(user);

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

function toggleModal(modal, show) {
    modal.classList.toggle('hidden', !show);
}

function renderAvatar(element, avatarType, avatarValue) {
    element.replaceChildren();
    if (avatarType === 'image' && avatarValue.startsWith('data:image/')) {
        const image = document.createElement('img');
        image.src = avatarValue;
        image.alt = 'Profile picture';
        element.appendChild(image);
    } else {
        element.textContent = avatarValue;
    }
}

function openSettings() {
    draftAvatar = { avatarType: profile.avatarType, avatarValue: profile.avatarValue };
    profileNameInput.value = profile.username;
    profileMessage.textContent = '';
    renderAvatar(profileAvatarPreview, draftAvatar.avatarType, draftAvatar.avatarValue);
    toggleModal(settingsModal, true);
}

function chooseEmojiAvatar(emoji) {
    draftAvatar = { avatarType: 'emoji', avatarValue: emoji };
    renderAvatar(profileAvatarPreview, draftAvatar.avatarType, draftAvatar.avatarValue);
}

function resizeImageToDataUrl(file, size, onDone, onError) {
    const reader = new FileReader();
    reader.onerror = onError;
    reader.onload = () => {
        const image = new Image();
        image.onerror = onError;
        image.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const side = Math.min(image.width, image.height);
                const startX = (image.width - side) / 2;
                const startY = (image.height - side) / 2;
                canvas.getContext('2d').drawImage(image, startX, startY, side, side, 0, 0, size, size);
                onDone(canvas.toDataURL('image/jpeg', 0.8));
            } catch (error) {
                onError(error);
            }
        };
        image.src = reader.result;
    };
    reader.readAsDataURL(file);
}

function handleAvatarUpload() {
    const file = avatarUploadInput.files[0];
    avatarUploadInput.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        profileMessage.textContent = 'Please choose a JPG, PNG, WEBP, or GIF picture.';
        return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
        profileMessage.textContent = 'That picture is too big. Please choose one under 5 MB.';
        return;
    }

    profileMessage.textContent = 'Loading picture...';
    resizeImageToDataUrl(
        file,
        AVATAR_SIZE,
        dataUrl => {
            draftAvatar = { avatarType: 'image', avatarValue: dataUrl };
            renderAvatar(profileAvatarPreview, draftAvatar.avatarType, draftAvatar.avatarValue);
            profileMessage.textContent = 'Picture ready. Click Save to keep it.';
        },
        () => {
            profileMessage.textContent = 'That picture could not be loaded. Try another one.';
        }
    );
}

function saveProfile() {
    profile.username = profileNameInput.value.trim().slice(0, MAX_NAME_LENGTH);
    profile.avatarType = draftAvatar.avatarType;
    profile.avatarValue = draftAvatar.avatarValue;
    const saved = saveStored(PROFILE_KEY, profile);
    updateAuthUI(auth.currentUser);
    profileMessage.textContent = saved
        ? 'Profile saved!'
        : 'Could not save on this device (storage is full or blocked).';
}

function updateVolumeLabels() {
    soundVolumeLabel.textContent = `${soundVolume}%`;
    musicVolumeLabel.textContent = `${musicVolume}%`;
}

function handleSoundVolumeChange() {
    soundVolume = clampVolume(soundVolumeSlider.value, soundVolume);
    updateVolumeLabels();
    saveStored(SETTINGS_KEY, { soundVolume, musicVolume });
}

function handleMusicVolumeChange() {
    musicVolume = clampVolume(musicVolumeSlider.value, musicVolume);
    updateVolumeLabels();
    saveStored(SETTINGS_KEY, { soundVolume, musicVolume });
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
    hintButton.addEventListener('click', handleHint);
    submitScoreButton.addEventListener('click', savePlayerScore);
    goHomeButton.addEventListener('click', goHome);
    homeLoginButton.addEventListener('click', () => openAuthScreen('home'));
    homeLogoutButton.addEventListener('click', handleLogout);
    resultsLoginButton.addEventListener('click', () => openAuthScreen('results'));
    authLoginButton.addEventListener('click', handleLogin);
    authGoogleButton.addEventListener('click', handleGoogleLogin);
    authSignupButton.addEventListener('click', handleSignUp);
    authResetButton.addEventListener('click', handlePasswordReset);
    authBackButton.addEventListener('click', () => showScreen(authReturnScreen));
    authPasswordInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') handleLogin();
    });
    settingsButton.addEventListener('click', openSettings);
    profileSaveButton.addEventListener('click', saveProfile);
    settingsCloseButton.addEventListener('click', () => toggleModal(settingsModal, false));
    avatarUploadInput.addEventListener('change', handleAvatarUpload);
    avatarOptions.forEach(button => {
        button.addEventListener('click', () => chooseEmojiAvatar(button.dataset.emoji));
    });
    soundVolumeSlider.addEventListener('input', handleSoundVolumeChange);
    musicVolumeSlider.addEventListener('input', handleMusicVolumeChange);
    [settingsModal].forEach(modal => {
        modal.addEventListener('click', event => {
            if (event.target === modal) toggleModal(modal, false);
        });
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            toggleModal(settingsModal, false);
        }
    });
}

function initialize() {
    attachEventHandlers();
    soundVolumeSlider.value = soundVolume;
    musicVolumeSlider.value = musicVolume;
    updateVolumeLabels();
    onAuthStateChanged(auth, updateAuthUI);
    showScreen('home');
}

initialize();