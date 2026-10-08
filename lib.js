/* 純粋ロジック。ブラウザではグローバル MVLib、Node では module.exports。 */
(function (root) {
  'use strict';

  const MIN_GAP = 0.1;
  const STEP = 0.1;
  const SECONDS_PER_MINUTE = 60;
  const SPEEDS = Object.freeze([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]);
  const KEY_PREFIX = 'loopstep:';

  const round1 = (n) => Math.round(n * 10) / 10;
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '00:00.0';
    const tenths = Math.round(sec * 10);
    const m = Math.floor(tenths / (SECONDS_PER_MINUTE * 10));
    const s = (tenths - m * SECONDS_PER_MINUTE * 10) / 10;
    return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
  }

  /** "m:ss.s" / "ss.s" を秒に。不正なら null */
  function parseTime(text) {
    if (typeof text !== 'string') return null;
    const m = text.trim().match(/^(?:(\d{1,3}):)?(\d{1,5})(?:\.(\d+))?$/);
    if (!m) return null;
    const mins = m[1] ? Number(m[1]) : 0;
    const secs = Number(`${m[2]}${m[3] ? '.' + m[3] : ''}`);
    if (m[1] && secs >= SECONDS_PER_MINUTE) return null;
    return mins * SECONDS_PER_MINUTE + secs;
  }

  function defaultRange(duration) {
    return { start: 0, stop: round1(Math.max(duration, 0)) };
  }

  /** error は i18n のメッセージキー (err.*) の接尾辞コード */
  function fail(range, error) {
    return { ok: false, range, error };
  }

  function setStart(range, value, duration) {
    if (!Number.isFinite(value)) return fail(range, 'notNumber');
    const v = round1(value);
    if (v < 0 || v > duration) return fail(range, 'outOfRange');
    if (v > range.stop - MIN_GAP + 1e-9) {
      return fail(range, 'startAfterStop');
    }
    return { ok: true, range: { ...range, start: v }, error: null };
  }

  function setStop(range, value, duration) {
    if (!Number.isFinite(value)) return fail(range, 'notNumber');
    const v = round1(value);
    if (v < 0 || v > round1(duration)) return fail(range, 'outOfRange');
    if (v < range.start + MIN_GAP - 1e-9) {
      return fail(range, 'stopBeforeStart');
    }
    return { ok: true, range: { ...range, stop: v }, error: null };
  }

  /** 保存データなどを動画長に合わせて安全な範囲へ補正 */
  function clampRange(range, duration) {
    const d = round1(duration);
    const start = clamp(round1(Number(range && range.start) || 0), 0, Math.max(d - MIN_GAP, 0));
    const rawStop = range && range.stop != null ? Number(range.stop) : NaN;
    const stop = clamp(Number.isFinite(rawStop) ? round1(rawStop) : d, start + MIN_GAP, d);
    return { start, stop: Math.max(stop, start) };
  }

  function stepSpeed(current, dir) {
    const idx = SPEEDS.indexOf(current);
    const base = idx === -1 ? SPEEDS.indexOf(1) : idx;
    return SPEEDS[clamp(base + (dir > 0 ? 1 : -1), 0, SPEEDS.length - 1)];
  }

  function storageKey(name, size) {
    return `${KEY_PREFIX}${name}:${size}`;
  }

  /** 保存済み設定の検証。不正な値は捨てる */
  function sanitizeSettings(raw) {
    const o = raw && typeof raw === 'object' ? raw : {};
    return {
      start: Number.isFinite(o.start) ? o.start : null,
      stop: Number.isFinite(o.stop) ? o.stop : null,
      speed: SPEEDS.includes(o.speed) ? o.speed : 1,
      mirror: o.mirror === true,
    };
  }

  const api = {
    MIN_GAP, STEP, SPEEDS, formatTime, parseTime, defaultRange, setStart, setStop,
    clampRange, stepSpeed, storageKey, sanitizeSettings, clamp, round1,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MVLib = Object.freeze(api);
})(typeof globalThis !== 'undefined' ? globalThis : this);
