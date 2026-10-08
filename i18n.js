/* 国際化。ブラウザが日本語環境なら ja、それ以外は en。ブラウザではグローバル MVI18n、Node では module.exports。 */
(function (root) {
  'use strict';

  const DEFAULT_LOCALE = 'en';

  const MESSAGES = Object.freeze({
    en: {
      'meta.title': 'LoopStep | Loop playback for dance practice',
      'meta.description': 'A local-first app for practicing dance by looping a section of a video.',
      'tagline': 'Repeat a section until it sticks.',
      'player.label': 'Video player',
      'video.label': 'Practice video',
      'drop.title': 'Drop a video here',
      'drop.or': 'or',
      'drop.choose': 'Choose a video file',
      'drop.note': 'Files are played on your device only and never uploaded.',
      'seek.label': 'Playback position',
      'play.play': 'Play',
      'play.pause': 'Pause',
      'restart.label': 'From start',
      'loop.label': 'Loop',
      'mirror.label': 'Mirror',
      'toggle.on': 'ON',
      'toggle.off': 'OFF',
      'settings.label': 'Settings',
      'range.legend': 'Loop range',
      'range.start': 'Start',
      'range.stop': 'Stop',
      'range.startBack': 'Move start back 0.1 s',
      'range.startForward': 'Move start forward 0.1 s',
      'range.stopBack': 'Move stop back 0.1 s',
      'range.stopForward': 'Move stop forward 0.1 s',
      'range.setStart': 'Set start to current position',
      'range.setStop': 'Set stop to current position',
      'speed.legend': 'Speed',
      'speed.group': 'Playback speed',
      'countin.legend': 'Count-in',
      'countin.group': 'Count-in seconds',
      'countin.none': 'None',
      'countin.3': '3 s',
      'countin.5': '5 s',
      'shortcuts.seek': '0.5 s seek',
      'shortcuts.seekFine': '0.1 s',
      'err.notNumber': 'Enter a number for the time.',
      'err.outOfRange': 'Specify a time within the video length.',
      'err.startAfterStop': 'Start must be before stop.',
      'err.stopBeforeStart': 'Stop must be after start.',
      'err.timeFormat': 'Use the format mm:ss.s (e.g. 01:05.5).',
      'err.notVideo': 'Please choose a video file.',
      'err.loadFailed': 'This video could not be loaded. Try another format (e.g. MP4).',
      'err.playFailed': 'Could not play: {message}',
    },
    ja: {
      'meta.title': 'LoopStep | 踊り練習ループ再生',
      'meta.description': '動画の区間を繰り返し再生して踊りを練習するローカル完結アプリ',
      'tagline': '区間リピートで、体に入れる。',
      'player.label': '動画プレーヤー',
      'video.label': '練習用動画',
      'drop.title': '動画をここにドロップ',
      'drop.or': 'または',
      'drop.choose': '動画ファイルを選ぶ',
      'drop.note': 'ファイルは端末内だけで再生され、送信されません。',
      'seek.label': '再生位置',
      'play.play': '再生',
      'play.pause': '停止',
      'restart.label': '最初から再生',
      'loop.label': 'ループ',
      'mirror.label': 'ミラー',
      'toggle.on': 'ON',
      'toggle.off': 'OFF',
      'settings.label': '設定',
      'range.legend': 'ループ区間',
      'range.start': 'スタート',
      'range.stop': 'ストップ',
      'range.startBack': 'スタートを0.1秒戻す',
      'range.startForward': 'スタートを0.1秒進める',
      'range.stopBack': 'ストップを0.1秒戻す',
      'range.stopForward': 'ストップを0.1秒進める',
      'range.setStart': '現在位置をスタートに',
      'range.setStop': '現在位置をストップに',
      'speed.legend': '再生速度',
      'speed.group': '再生速度',
      'countin.legend': 'カウントイン',
      'countin.group': 'カウントイン秒数',
      'countin.none': 'なし',
      'countin.3': '3秒',
      'countin.5': '5秒',
      'shortcuts.seek': '0.5秒シーク',
      'shortcuts.seekFine': '0.1秒',
      'err.notNumber': '時刻を数値で入力してください。',
      'err.outOfRange': '動画の長さの範囲内で指定してください。',
      'err.startAfterStop': 'スタートはストップより前にしてください。',
      'err.stopBeforeStart': 'ストップはスタートより後にしてください。',
      'err.timeFormat': 'mm:ss.s の形式で入力してください（例 01:05.5）。',
      'err.notVideo': '動画ファイルを選択してください。',
      'err.loadFailed': 'この動画は読み込めませんでした。別の形式（MP4など）をお試しください。',
      'err.playFailed': '再生できませんでした: {message}',
    },
  });

  /** 優先言語リストの先頭が ja 系なら 'ja'、それ以外は 'en' */
  function detectLocale(languages) {
    const list = Array.isArray(languages) ? languages : [];
    const first = typeof list[0] === 'string' ? list[0].toLowerCase() : '';
    return first === 'ja' || first.startsWith('ja-') ? 'ja' : DEFAULT_LOCALE;
  }

  /** キーを翻訳。{name} は params で置換。未定義キーは en、それも無ければキーを返す */
  function translate(locale, key, params) {
    const table = MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE];
    const template = table[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
    return template.replace(/\{(\w+)\}/g, (m, name) => (
      params && name in params ? String(params[name]) : m
    ));
  }

  const api = { MESSAGES, DEFAULT_LOCALE, detectLocale, translate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MVI18n = Object.freeze(api);
})(typeof globalThis !== 'undefined' ? globalThis : this);
