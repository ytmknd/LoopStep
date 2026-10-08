'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('./i18n.js');

test('detectLocale returns ja when the primary language is Japanese', () => {
  assert.equal(I.detectLocale(['ja']), 'ja');
  assert.equal(I.detectLocale(['ja-JP', 'en-US']), 'ja');
});

test('detectLocale returns en for other languages and bad input', () => {
  assert.equal(I.detectLocale(['en-US']), 'en');
  assert.equal(I.detectLocale(['fr', 'ja']), 'en');
  assert.equal(I.detectLocale([]), 'en');
  assert.equal(I.detectLocale(undefined), 'en');
});

test('translate returns the message for the locale', () => {
  assert.equal(I.translate('ja', 'play.play'), '再生');
  assert.equal(I.translate('en', 'play.play'), 'Play');
});

test('translate falls back to en for unknown locales and the key for unknown keys', () => {
  assert.equal(I.translate('de', 'play.play'), 'Play');
  assert.equal(I.translate('en', 'no.such.key'), 'no.such.key');
});

test('translate substitutes params and keeps unknown placeholders', () => {
  assert.equal(I.translate('en', 'err.playFailed', { message: 'boom' }), 'Could not play: boom');
  assert.equal(I.translate('en', 'err.playFailed'), 'Could not play: {message}');
});

test('ja and en define exactly the same keys', () => {
  assert.deepEqual(Object.keys(I.MESSAGES.ja).sort(), Object.keys(I.MESSAGES.en).sort());
});
