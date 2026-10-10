import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DAILY_QUESTION_COUNT,
    PACIFIC_TIME_ZONE,
    generateDistinctVerses,
    getOrCreateDailyChallenge,
    getPacificDateKey,
    validateDailyChallenge
} from '../daily-challenge.mjs';

test('Pacific date keys follow midnight in standard and daylight time', () => {
    assert.equal(getPacificDateKey(new Date('2026-01-10T07:59:59.000Z')), '2026-01-09');
    assert.equal(getPacificDateKey(new Date('2026-01-10T08:00:00.000Z')), '2026-01-10');
    assert.equal(getPacificDateKey(new Date('2026-07-10T06:59:59.000Z')), '2026-07-09');
    assert.equal(getPacificDateKey(new Date('2026-07-10T07:00:00.000Z')), '2026-07-10');
});

test('challenge generation returns ten distinct valid KJV references', async () => {
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
});

test('invalid verses are skipped and incomplete challenge generation fails', async () => {
    await assert.rejects(
        generateDistinctVerses(async () => ({ verses: [] }), 2),
        /distinct valid verses/
    );
});

test('failed verse retrieval never writes a generated daily challenge', async () => {
    let writes = 0;
    await assert.rejects(
        getOrCreateDailyChallenge({
            dateKey: '2026-10-10',
            readExisting: async () => null,
            generateVerses: async () => generateDistinctVerses(async () => {
                throw new Error('Network unavailable');
            }, 1),
            createIfAbsent: async challenge => {
                writes += 1;
                return challenge;
            }
        }),
        /Network unavailable/
    );
    assert.equal(writes, 0);
});

test('challenge validation rejects duplicate verses and incorrect dates', () => {
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
    assert.equal(validateDailyChallenge(challenge, '2026-10-10'), true);
    assert.equal(validateDailyChallenge(challenge, '2026-10-11'), false);
    challenge.verses[1] = { ...challenge.verses[1], id: challenge.verses[0].id };
    assert.equal(validateDailyChallenge(challenge, '2026-10-10'), false);
});

test('concurrent create-if-absent calls converge on one challenge', async () => {
    let stored = null;
    const readExisting = async () => stored;
    const createIfAbsent = async proposed => {
        await new Promise(resolve => setImmediate(resolve));
        stored ||= proposed;
        return stored;
    };
    const generateVerses = async () => Array.from({ length: DAILY_QUESTION_COUNT }, (_, index) => ({
        id: `genesis|1|${index + 1}`,
        text: `Verse ${index + 1}`,
        book: 'Genesis',
        chapter: 1,
        verse: index + 1
    }));
    const [first, second] = await Promise.all([
        getOrCreateDailyChallenge({ dateKey: '2026-10-10', readExisting, generateVerses, createIfAbsent }),
        getOrCreateDailyChallenge({ dateKey: '2026-10-10', readExisting, generateVerses, createIfAbsent })
    ]);
    assert.deepEqual(first, second);
    assert.deepEqual(first, stored);
});
