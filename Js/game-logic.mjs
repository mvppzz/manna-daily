export function getVerseId(verse) {
    if (!verse || typeof verse.book !== 'string' ||
        !Number.isInteger(verse.chapter) || !Number.isInteger(verse.verse)) {
        return null;
    }
    return `${verse.book.toLowerCase()}|${verse.chapter}|${verse.verse}`;
}

export function reserveFreeplayVerse(verse, usedVerseIds, totalVerses) {
    if (usedVerseIds.size >= totalVerses) {
        usedVerseIds.clear();
    }
    const verseId = getVerseId(verse);
    if (!verseId || usedVerseIds.has(verseId)) {
        return false;
    }
    usedVerseIds.add(verseId);
    return true;
}

export function getAccuracy(correct, total) {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function shouldEndGame(gameMode, currentQuestion, dailyQuestionCount) {
    return gameMode === 'daily' && currentQuestion >= dailyQuestionCount;
}
