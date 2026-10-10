import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getAccuracy,
    getVerseId,
    reserveFreeplayVerse,
    shouldEndGame
} from '../game-logic.mjs';

test('freeplay reserves each verse once and allows a fresh shuffled cycle', () => {
    const used = new Set();
    const first = { book: 'Genesis', chapter: 1, verse: 1 };
    const second = { book: 'Exodus', chapter: 1, verse: 1 };

    assert.equal(getVerseId(first), 'genesis|1|1');
    assert.equal(reserveFreeplayVerse(first, used, 2), true);
    assert.equal(reserveFreeplayVerse({ ...first, book: 'GENESIS' }, used, 2), false);
    assert.equal(reserveFreeplayVerse(second, used, 2), true);
    assert.equal(reserveFreeplayVerse(first, used, 2), true);
    assert.equal(used.size, 1);
});

test('Freeplay accuracy handles empty and non-empty sessions', () => {
    assert.equal(getAccuracy(0, 0), 0);
    assert.equal(getAccuracy(2, 3), 67);
    assert.equal(getAccuracy(10, 10), 100);
});

test('only daily games end at the ten-question limit', () => {
    assert.equal(shouldEndGame('daily', 10, 10), true);
    assert.equal(shouldEndGame('daily', 9, 10), false);
    assert.equal(shouldEndGame('freeplay', 1000, 10), false);
});
