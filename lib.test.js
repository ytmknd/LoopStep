const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('./lib.js');

test('formatTime formats mm:ss.s', () => {
  assert.equal(L.formatTime(0), '00:00.0');
  assert.equal(L.formatTime(65.25), '01:05.3');
  assert.equal(L.formatTime(59.96), '01:00.0');
  assert.equal(L.formatTime(-1), '00:00.0');
  assert.equal(L.formatTime(NaN), '00:00.0');
});

test('parseTime accepts valid forms', () => {
  assert.equal(L.parseTime('01:05.5'), 65.5);
  assert.equal(L.parseTime('5.5'), 5.5);
  assert.equal(L.parseTime(' 2:00 '), 120);
  assert.equal(L.parseTime('90'), 90);
});

test('parseTime rejects invalid input', () => {
  for (const s of ['', 'abc', '1:60', '-1', '1:2:3', '1.', null, undefined]) {
    assert.equal(L.parseTime(s), null, String(s));
  }
});

test('setStart rejects start >= stop', () => {
  const r = { start: 1, stop: 5 };
  assert.equal(L.setStart(r, 5, 10).ok, false);
  assert.equal(L.setStart(r, 4.95, 10).ok, false);
  const ok = L.setStart(r, 4.9, 10);
  assert.equal(ok.ok, true);
  assert.equal(ok.range.start, 4.9);
});

test('setStop rejects stop <= start and out of range', () => {
  const r = { start: 2, stop: 5 };
  assert.equal(L.setStop(r, 2, 10).ok, false);
  assert.equal(L.setStop(r, 11, 10).ok, false);
  assert.equal(L.setStop(r, NaN, 10).ok, false);
  assert.equal(L.setStop(r, 2.1, 10).range.stop, 2.1);
});

test('setters do not mutate input', () => {
  const r = Object.freeze({ start: 1, stop: 5 });
  L.setStart(r, 2, 10);
  assert.deepEqual(r, { start: 1, stop: 5 });
});

test('clampRange fixes bad saved values', () => {
  assert.deepEqual(L.clampRange({ start: -3, stop: 99 }, 10), { start: 0, stop: 10 });
  const c = L.clampRange({ start: 9, stop: 2 }, 10);
  assert.ok(c.stop > c.start || c.stop === 10);
  assert.deepEqual(L.clampRange(null, 10), { start: 0, stop: 10 });
});

test('stepSpeed moves and clamps', () => {
  assert.equal(L.stepSpeed(1, 1), 1.25);
  assert.equal(L.stepSpeed(1, -1), 0.75);
  assert.equal(L.stepSpeed(2, 1), 2);
  assert.equal(L.stepSpeed(0.25, -1), 0.25);
  assert.equal(L.stepSpeed(3, 1), 1.25);
});

test('sanitizeSettings drops invalid values', () => {
  assert.deepEqual(L.sanitizeSettings({ start: 'x', speed: 9, mirror: 'yes' }),
    { start: null, stop: null, speed: 1, mirror: false });
  assert.equal(L.sanitizeSettings({ speed: 0.5, mirror: true }).speed, 0.5);
  assert.equal(L.sanitizeSettings(null).speed, 1);
});

test('storageKey combines name and size', () => {
  assert.notEqual(L.storageKey('a.mp4', 1), L.storageKey('a.mp4', 2));
});
