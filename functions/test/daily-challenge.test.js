const test = require('node:test');
const assert = require('node:assert/strict');
const {
    DAILY_QUESTION_COUNT,
    PACIFIC_TIME_ZONE,
    generateDistinctVerses,
    getOrCreateChallenge,
    getPacificDateKey,
    validateChallenge
} = require('../src/daily-challenge');

test('Pacific date keys follow midnight in standard and daylight time', () => {
    assert.equal(getPacificDateKey(new Date('2026-01-10T07:59:59.000Z')), '2026-01-09');
    assert.equal(getPacificDateKey(new Date('2026-01-10T08:00:00.000Z')), '2026-01-10');
    assert.equal(getPacificDateKey(new Date('2026-07-10T06:59:59.000Z')), '2026-07-09');
    assert.equal(getPacificDateKey(new Date('2026-07-10T07:00:00.000Z')), '2026-07-10');
});

test('daily challenge generation returns ten distinct valid references', async () => {
    let verseNumber = 0;
    const verses = await generateDistinctVerses(async () => {
        verseNumber += 1;
        return {
            verses: [{
                book_name: 'Genesis',
                chapter: 1,
                verse: verseNumber,
                text: `Verse ${verseNumber}`
            }]
        };
    });
    assert.equal(verses.length, DAILY_QUESTION_COUNT);
    assert.equal(new Set(verses.map(verse => verse.id)).size, DAILY_QUESTION_COUNT);
    assert.equal(verses[0].id, 'genesis|1|1');
});

test('invalid verses are skipped and an incomplete challenge fails', async () => {
    await assert.rejects(
        generateDistinctVerses(async () => ({ verses: [] }), 2),
        /distinct valid verses/
    );
});

test('challenge validation rejects duplicate or incorrect-date challenges', () => {
    const challenge = {
        challengeId: 'pacific-2026-10-10',
        dateKey: '2026-10-10',
        timeZone: PACIFIC_TIME_ZONE,
        verses: Array.from({ length: DAILY_QUESTION_COUNT }, (_, index) => ({
            id: `genesis|1|${index + 1}`,
            text: `Verse ${index + 1}`,
            book: 'Genesis',
            chapter: 1,
            verse: index + 1
        }))
    };
    assert.equal(validateChallenge(challenge, '2026-10-10'), true);
    assert.equal(validateChallenge(challenge, '2026-10-11'), false);
    challenge.verses[1] = { ...challenge.verses[1], id: challenge.verses[0].id };
    assert.equal(validateChallenge(challenge, '2026-10-10'), false);
});

test('concurrent initializers return the one atomically persisted challenge', async () => {
    let value = null;
    let generated = 0;
    const documentRef = {
        async get() {
            return { exists: value !== null, data: () => value };
        },
        async create(challenge) {
            await new Promise(resolve => setImmediate(resolve));
            if (value !== null) {
                const error = new Error('Already exists');
                error.code = 6;
                throw error;
            }
            value = challenge;
        }
    };
    const build = async () => {
        generated += 1;
        return { challengeId: `candidate-${generated}` };
    };
    const [first, second] = await Promise.all([
        getOrCreateChallenge(documentRef, build),
        getOrCreateChallenge(documentRef, build)
    ]);
    assert.equal(generated, 2);
    assert.deepEqual(first, second);
    assert.deepEqual(first, value);
});
