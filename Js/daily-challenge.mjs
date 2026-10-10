export const DAILY_QUESTION_COUNT = 10;
export const PACIFIC_TIME_ZONE = 'America/Los_Angeles';

export function getPacificDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: PACIFIC_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function normalizeVerse(value) {
    if (!value || !Array.isArray(value.verses) || value.verses.length === 0) {
        return null;
    }
    const verse = value.verses[0];
    const book = String(verse.book_name || value.book_name || '').trim();
    const chapter = Number(verse.chapter);
    const verseNumber = Number(verse.verse);
    const text = String(verse.text || '').trim();
    if (!book || !Number.isInteger(chapter) || chapter < 1 ||
        !Number.isInteger(verseNumber) || verseNumber < 1 || !text) {
        return null;
    }
    return {
        id: `${book.toLowerCase()}|${chapter}|${verseNumber}`,
        text,
        book,
        chapter,
        verse: verseNumber
    };
}

export function validateDailyChallenge(challenge, expectedDate) {
    if (!challenge ||
        challenge.dateKey !== expectedDate ||
        challenge.timeZone !== PACIFIC_TIME_ZONE ||
        !Array.isArray(challenge.verses) ||
        challenge.verses.length !== DAILY_QUESTION_COUNT) {
        return false;
    }
    const ids = new Set();
    for (const verse of challenge.verses) {
        if (!verse || typeof verse.id !== 'string' ||
            typeof verse.text !== 'string' || !verse.text.trim() ||
            typeof verse.book !== 'string' || !verse.book.trim() ||
            !Number.isInteger(verse.chapter) || verse.chapter < 1 ||
            !Number.isInteger(verse.verse) || verse.verse < 1 ||
            ids.has(verse.id)) {
            return false;
        }
        ids.add(verse.id);
    }
    return true;
}

export async function generateDistinctVerses(fetchRandomVerse, count = DAILY_QUESTION_COUNT) {
    const verses = [];
    const ids = new Set();
    const maxAttempts = count * 30;
    for (let attempt = 0; attempt < maxAttempts && verses.length < count; attempt += 1) {
        const verse = normalizeVerse(await fetchRandomVerse());
        if (!verse || ids.has(verse.id)) continue;
        ids.add(verse.id);
        verses.push(verse);
    }
    if (verses.length !== count) {
        throw new Error(`Could not retrieve ${count} distinct valid verses.`);
    }
    return verses;
}

export async function getOrCreateDailyChallenge({
    dateKey,
    readExisting,
    generateVerses,
    createIfAbsent
}) {
    const existing = await readExisting();
    if (existing) {
        if (!validateDailyChallenge(existing, dateKey)) {
            throw new Error(`Stored daily challenge ${dateKey} is invalid.`);
        }
        return existing;
    }

    const proposed = {
        challengeId: `pacific-${dateKey}`,
        dateKey,
        timeZone: PACIFIC_TIME_ZONE,
        verses: await generateVerses()
    };
    const challenge = await createIfAbsent(proposed);
    if (!validateDailyChallenge(challenge, dateKey)) {
        throw new Error(`Stored daily challenge ${dateKey} is invalid.`);
    }
    return challenge;
}
