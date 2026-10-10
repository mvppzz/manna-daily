const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { HttpsError, onCall } = require('firebase-functions/v2/https');
const {
    DAILY_QUESTION_COUNT,
    PACIFIC_TIME_ZONE,
    generateDistinctVerses,
    getOrCreateChallenge,
    getPacificDateKey,
    validateChallenge
} = require('./src/daily-challenge');

initializeApp();
const db = getFirestore();

async function fetchRandomKjvVerse() {
    const response = await fetch('https://bible-api.com/?random=verse&translation=kjv', {
        signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
        throw new Error(`Verse API returned HTTP ${response.status}.`);
    }
    return response.json();
}

exports.getDailyChallenge = onCall({
    region: 'us-west1',
    timeoutSeconds: 120,
    memory: '256MiB'
}, async () => {
    const dateKey = getPacificDateKey();
    const challengeRef = db.collection('dailyChallenges').doc(dateKey);

    try {
        const challenge = await getOrCreateChallenge(challengeRef, async () => ({
            challengeId: `pacific-${dateKey}`,
            dateKey,
            timeZone: PACIFIC_TIME_ZONE,
            verses: await generateDistinctVerses(fetchRandomKjvVerse, DAILY_QUESTION_COUNT),
            createdAt: new Date()
        }));

        if (!validateChallenge(challenge, dateKey)) {
            throw new Error(`Stored daily challenge ${dateKey} is invalid.`);
        }
        return {
            challengeId: challenge.challengeId,
            dateKey: challenge.dateKey,
            timeZone: challenge.timeZone,
            verses: challenge.verses
        };
    } catch (error) {
        console.error('Could not load the daily challenge:', error);
        throw new HttpsError(
            'unavailable',
            'Today’s challenge is temporarily unavailable. Please try again.'
        );
    }
});
