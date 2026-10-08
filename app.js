(function () {
  'use strict';
  const L = window.MVLib;

  const SEEK_COARSE = 0.5;
  const SEEK_FINE = 0.1;
  const COUNTIN_TICK_MS = 1000;
  const SEEK_RESOLUTION = 0.01;

  const $ = (id) => document.getElementById(id);
  const el = {
    video: $('video'), dropzone: $('dropzone'), file: $('file'), filename: $('filename'),
    play: $('play'), playLabel: $('play-label'), loop: $('loop'), loopState: $('loop-state'),
    mirror: $('mirror'), mirrorState: $('mirror-state'), seek: $('seek'),
    current: $('current'), duration: $('duration'), region: $('region'), playhead: $('playhead'),
    startInput: $('start-input'), stopInput: $('stop-input'), message: $('message'),
    speedButtons: $('speed-buttons'), speedReadout: $('speed-readout'), countin: $('countin'),
    groups: ['range-group', 'speed-group', 'countin-group'].map($),
  };

  let state = { range: { start: 0, stop: 0 }, speed: 1, mirror: false, loop: true, countIn: 0, fileKey: null };
  let countToken = 0;
  let objectUrl = null;

  const update = (patch) => { state = { ...state, ...patch }; };
  const duration = () => (Number.isFinite(el.video.duration) ? el.video.duration : 0);
  const isLoaded = () => duration() > 0;

  // ---- 表示 ----
  function showMessage(text) {
    el.message.textContent = text || '';
    const invalid = text ? 'true' : 'false';
    el.startInput.setAttribute('aria-invalid', invalid);
    el.stopInput.setAttribute('aria-invalid', invalid);
  }

  function renderRegion() {
    const d = duration() || 1;
    const a = state.range.start / d;
    const w = (state.range.stop - state.range.start) / d;
    el.region.style.transform = `translateX(${a * 100}%) scaleX(${Math.max(w, 0)})`;
  }

  function renderInputs() {
    el.startInput.value = L.formatTime(state.range.start);
    el.stopInput.value = L.formatTime(state.range.stop);
    renderRegion();
  }

  function renderPlayhead() {
    const t = el.video.currentTime;
    const d = duration();
    el.current.textContent = L.formatTime(t);
    el.playhead.style.setProperty('--pos', d ? String(L.clamp(t / d, 0, 1)) : '0');
    if (document.activeElement !== el.seek) el.seek.value = String(t);
  }

  function renderToggles() {
    el.loop.setAttribute('aria-pressed', String(state.loop));
    el.loopState.textContent = state.loop ? 'ON' : 'OFF';
    el.mirror.setAttribute('aria-pressed', String(state.mirror));
    el.mirrorState.textContent = state.mirror ? 'ON' : 'OFF';
    el.video.classList.toggle('is-mirrored', state.mirror);
    el.speedReadout.textContent = `${state.speed}x`;
    for (const b of el.speedButtons.children) {
      b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === state.speed));
    }
  }

  function renderPlayState() {
    el.playLabel.textContent = el.video.paused ? '再生' : '停止';
  }

  // ---- 永続化 ----
  function saveSettings() {
    if (!state.fileKey) return;
    try {
      const { start, stop } = state.range;
      localStorage.setItem(state.fileKey, JSON.stringify({ start, stop, speed: state.speed, mirror: state.mirror }));
    } catch (_) { /* localStorage が使えなくても動作を継続 */ }
  }

  function loadSettings(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? L.sanitizeSettings(JSON.parse(raw)) : null;
    } catch (_) { return null; }
  }

  // ---- 操作 ----
  function applyRangeResult(result) {
    if (!result.ok) { showMessage(result.error); renderInputs(); return false; }
    showMessage('');
    update({ range: result.range });
    renderInputs();
    saveSettings();
    return true;
  }

  const setStartAt = (t) => applyRangeResult(L.setStart(state.range, t, duration()));
  const setStopAt = (t) => applyRangeResult(L.setStop(state.range, t, duration()));

  function setSpeed(speed) {
    update({ speed });
    el.video.playbackRate = speed;
    renderToggles();
    saveSettings();
  }

  function setMirror(on) { update({ mirror: on }); renderToggles(); saveSettings(); }
  function setLoop(on) { update({ loop: on }); renderToggles(); }

  function seekTo(t) {
    if (!isLoaded()) return;
    el.video.currentTime = L.clamp(t, 0, duration());
    renderPlayhead();
  }

  function seekBy(delta) { seekTo(el.video.currentTime + delta); }

  function cancelCountIn() {
    countToken += 1;
    el.countin.classList.remove('is-active');
    el.countin.replaceChildren();
  }

  function showCount(n) {
    const span = document.createElement('span');
    span.textContent = String(n);
    el.countin.replaceChildren(span);
    el.countin.classList.add('is-active');
  }

  async function runCountIn(seconds) {
    const token = ++countToken;
    for (let n = seconds; n > 0; n -= 1) {
      showCount(n);
      await new Promise((r) => setTimeout(r, COUNTIN_TICK_MS));
      if (token !== countToken) return false;
    }
    el.countin.classList.remove('is-active');
    el.countin.replaceChildren();
    return true;
  }

  async function startFromRangeStart() {
    el.video.pause();
    seekTo(state.range.start);
    if (state.countIn > 0 && !(await runCountIn(state.countIn))) return;
    await safePlay();
  }

  async function safePlay() {
    try { await el.video.play(); } catch (err) {
      if (err && err.name !== 'AbortError') showMessage(`再生できませんでした: ${err.message}`);
    }
  }

  function togglePlay() {
    if (!isLoaded()) return;
    if (countToken && el.countin.classList.contains('is-active')) { cancelCountIn(); return; }
    if (!el.video.paused) { el.video.pause(); return; }
    const t = el.video.currentTime;
    const outside = t < state.range.start || t >= state.range.stop - 0.05;
    if (outside) startFromRangeStart(); else safePlay();
  }

  // ---- ループ判定 (requestAnimationFrame) ----
  function onFrame() {
    renderPlayhead();
    const v = el.video;
    const counting = el.countin.classList.contains('is-active');
    if (isLoaded() && !v.paused && !counting && v.currentTime >= state.range.stop) {
      if (state.loop) startFromRangeStart(); else { v.pause(); seekTo(state.range.stop); }
    }
    requestAnimationFrame(onFrame);
  }

  // ---- ファイル読み込み ----
  function enableControls(enabled) {
    for (const g of el.groups) g.disabled = !enabled;
    for (const b of [el.play, el.loop, el.mirror]) b.disabled = !enabled;
    el.seek.disabled = !enabled;
  }

  function loadFile(file) {
    if (!file) return;
    if (!file.type.startsWith('video/') && !/\.(mp4|mov|m4v|webm|ogv|mkv)$/i.test(file.name)) {
      showMessage('動画ファイルを選択してください。');
      return;
    }
    cancelCountIn();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    update({ fileKey: L.storageKey(file.name, file.size) });
    el.filename.textContent = file.name;
    el.video.classList.remove('is-loaded');
    showMessage('');
    el.video.src = objectUrl;
  }

  function onMetadata() {
    const d = duration();
    const saved = loadSettings(state.fileKey);
    const base = L.defaultRange(d);
    const range = saved ? L.clampRange({ start: saved.start ?? base.start, stop: saved.stop ?? base.stop }, d) : base;
    update({ range, speed: saved ? saved.speed : 1, mirror: saved ? saved.mirror : false });
    el.video.preservesPitch = true;
    el.video.playbackRate = state.speed;
    el.seek.max = String(d);
    el.seek.step = String(SEEK_RESOLUTION);
    el.duration.textContent = L.formatTime(d);
    el.video.classList.add('is-loaded');
    enableControls(true);
    renderInputs(); renderToggles(); renderPlayState(); renderPlayhead();
  }

  function onVideoError() {
    if (!el.video.src) return;
    enableControls(false);
    el.video.classList.remove('is-loaded');
    showMessage('この動画は読み込めませんでした。別の形式（MP4など）をお試しください。');
  }

  // ---- イベント配線 ----
  function commitInput(input, setter) {
    const t = L.parseTime(input.value);
    if (t === null) { showMessage('mm:ss.s の形式で入力してください（例 01:05.5）。'); return; }
    setter(t);
  }

  function nudge(kind, dir) {
    const cur = state.range[kind];
    (kind === 'start' ? setStartAt : setStopAt)(cur + dir * L.STEP);
  }

  function bindTimeInput(input, setter) {
    input.addEventListener('change', () => commitInput(input, setter));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') commitInput(input, setter); });
  }

  function bindDrop() {
    const dz = el.dropzone;
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('is-dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('is-dragover'));
    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('is-dragover');
      loadFile(e.dataTransfer && e.dataTransfer.files[0]);
    });
  }

  function buildSpeedButtons() {
    for (const s of L.SPEEDS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.dataset.speed = String(s);
      b.textContent = `${s}x`;
      b.addEventListener('click', () => setSpeed(s));
      el.speedButtons.append(b);
    }
  }

  const KEY_ACTIONS = {
    ' ': togglePlay,
    a: () => setStartAt(el.video.currentTime),
    b: () => setStopAt(el.video.currentTime),
    l: () => setLoop(!state.loop),
    m: () => setMirror(!state.mirror),
    ArrowLeft: (e) => seekBy(-(e.shiftKey ? SEEK_FINE : SEEK_COARSE)),
    ArrowRight: (e) => seekBy(e.shiftKey ? SEEK_FINE : SEEK_COARSE),
    ArrowUp: () => setSpeed(L.stepSpeed(state.speed, 1)),
    ArrowDown: () => setSpeed(L.stepSpeed(state.speed, -1)),
  };

  function onKeydown(e) {
    const tag = e.target.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey || !isLoaded()) return;
    if (e.key === ' ' && tag === 'BUTTON') return;
    const action = KEY_ACTIONS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!action) return;
    e.preventDefault();
    action(e);
  }

  function bind() {
    el.file.addEventListener('change', () => loadFile(el.file.files[0]));
    el.video.addEventListener('loadedmetadata', onMetadata);
    el.video.addEventListener('error', onVideoError);
    el.video.addEventListener('play', renderPlayState);
    el.video.addEventListener('pause', renderPlayState);
    el.video.addEventListener('click', togglePlay);
    el.seek.addEventListener('input', () => seekTo(Number(el.seek.value)));
    el.play.addEventListener('click', togglePlay);
    el.loop.addEventListener('click', () => setLoop(!state.loop));
    el.mirror.addEventListener('click', () => setMirror(!state.mirror));
    $('set-start').addEventListener('click', () => setStartAt(el.video.currentTime));
    $('set-stop').addEventListener('click', () => setStopAt(el.video.currentTime));
    for (const b of document.querySelectorAll('[data-nudge]')) {
      b.addEventListener('click', () => nudge(b.dataset.nudge, Number(b.dataset.dir)));
    }
    bindTimeInput(el.startInput, setStartAt);
    bindTimeInput(el.stopInput, setStopAt);
    for (const r of document.querySelectorAll('input[name="countin"]')) {
      r.addEventListener('change', () => update({ countIn: Number(r.value) }));
    }
    document.addEventListener('keydown', onKeydown);
    bindDrop();
  }

  buildSpeedButtons();
  bind();
  renderToggles();
  requestAnimationFrame(onFrame);
})();
