
// Copyright (c) 2019 ml5 — MIT License
// Webcam classification (Teachable Machine) + p5.js

// ===== グローバル変数 =====
let classifier;
const modelURL = 'https://teachablemachine.withgoogle.com/models/bXy2kDNi/';


let video;
let latestResults = [];
let lastUpdateTime = 0;
const updateInterval = 500;  // 0.5 秒 (ミリ秒)

// 表示用 (初期値を設定しておくと、状態が分かりやすくなります)
let label  = 'モデル読込中...', label2 = '', label3 = '';
let conf   = '', conf2  = '', conf3  = '';

let modelReady = false; // モデルの準備状態を追跡するフラグ
let videoReadyFlag = false; // ビデオの準備状態を追跡するフラグ

// ----------------- モデル読み込み (preload) --------------
function preload() {
  console.log('preload: モデルの読み込みを開始します...');
  classifier = ml5.imageClassifier(modelURL + 'model.json', modelLoadedCallback);
}

function modelLoadedCallback() {
  console.log('preload (modelLoadedCallback): モデルの読み込みが完了しました！');
  modelReady = true;
  if (!videoReadyFlag) {
      label = 'カメラ準備中...';
  } else {
      label = '分類待機中...';
  }
}

// ----------------- セットアップ (setup) ----------------
function setup() {
  createCanvas(320, 300);
  console.log('setup: キャンバスを作成しました。');
  video = createCapture(VIDEO, videoReadyCallback);
  video.size(320, 240);
  video.hide();
  console.log('setup: ビデオキャプチャのセットアップが完了しました（準備待ち）。');
}

function videoReadyCallback() {
  console.log('setup (videoReadyCallback): ビデオの準備が完了しました。');
  videoReadyFlag = true;
  if (modelReady) {
      label = '分類待機中...';
      classifyVideo();
  } else {
      label = 'モデル読込中...';
  }
}

// ----------------- 分類ループ (classifyVideo, gotResult) -----------------
function classifyVideo() {
  if (!modelReady) {
    console.warn('classifyVideo: モデルがまだ準備できていません。分類をスキップします。');
    return;
  }
  if (!videoReadyFlag || !video.elt || video.elt.readyState !== 4) {
    console.warn('classifyVideo: ビデオがまだ準備できていないか、再生可能ではありません。100ms後に再試行します。');
    setTimeout(classifyVideo, 100);
    return;
  }
  classifier.classify(video, gotResult);
}

// ★★★ gotResult 関数を以下のように修正（デバッグ強化版） ★★★
function gotResult(err, results) {
  console.log('--- gotResult DEBUG START ---');
  console.log('[DEBUG] raw err argument:', err);
  console.log('[DEBUG] raw results argument:', results);
  console.log('[DEBUG] typeof err:', typeof err);
  console.log('[DEBUG] err instanceof Error:', err instanceof Error);
  console.log('[DEBUG] Array.isArray(err):', Array.isArray(err));

  if (err) {
    console.log('[DEBUG] err object keys:', typeof err === 'object' && err !== null ? Object.keys(err) : 'not an object or null');
    console.log('[DEBUG] err.message:', err.message);
    console.log('[DEBUG] err.name:', err.name);
    console.log('[DEBUG] err.length (if any):', err.length);
    if (Array.isArray(err) && err.length > 0) {
      console.log('[DEBUG] err[0]:', err[0]);
      if (err[0]) {
        console.log('[DEBUG] typeof err[0].label:', typeof err[0].label);
        console.log('[DEBUG] err[0].label:', err[0].label);
        console.log('[DEBUG] typeof err[0].confidence:', typeof err[0].confidence);
        console.log('[DEBUG] err[0].confidence:', err[0].confidence);
      }
    }
  }
  console.log('--- gotResult DEBUG END ---');

  let actualError = null;
  let actualResults = null;

  // 判定ロジック：errが実質的に結果配列であるか？
  // 条件: errが存在し、配列であり、要素があり、最初の要素にlabelプロパティがある
  if (err && Array.isArray(err) && err.length > 0 && err[0] && typeof err[0].label !== 'undefined') {
    console.warn('gotResult: 最初の引数(err)を「結果」として扱います。err:', err);
    actualResults = err;
    actualError = null;
  } else if (err) { // err が存在するが上記条件に合致しない場合、エラーとして扱う
    actualError = err;
    actualResults = results; // この場合 results は通常 undefined
  } else { // err が null または undefined の場合 (正常ケース)
    actualError = null;
    actualResults = results;
  }

  // エラー処理
  if (actualError) {
    console.error('gotResult: 分類エラーとして処理します。actualError:', actualError); // ログメッセージ変更
    // (ここに以前提案した詳細なエラーオブジェクト出力コードを追加しても良い)
    label = '分類エラー';
    conf = '';
    classifyVideo();
    return;
  }

  // 結果処理
  if (actualResults && actualResults.length > 0) {
    console.log('gotResult: 分類結果を処理します。件数:', actualResults.length, '内容:', actualResults);
    latestResults = actualResults;
  } else {
    console.log('gotResult: 結果が空か有効な結果なし。actualResults:', actualResults);
  }

  classifyVideo();
}


// ----------------- 描画 (draw) ------------------------
function draw() {
  background(0);

  if (videoReadyFlag && video) {
    push();
    translate(video.width, 0);
    scale(-1, 1);
    image(video, 0, 0, video.width, video.height);
    pop();
  } else {
    fill(100);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('ビデオ準備中...', width / 2, height / 2 - 20);
  }

  if (modelReady && videoReadyFlag && latestResults && latestResults.length > 0 && millis() - lastUpdateTime > updateInterval) {
    const top = latestResults.slice(0, 3);

    label  = top[0] ? top[0].label : '---';
    conf   = top[0] ? nf(top[0].confidence, 0, 2) : '';
    label2 = top[1] ? top[1].label : '';
    conf2  = top[1] ? nf(top[1].confidence, 0, 2) : '';
    label3 = top[2] ? top[2].label : '';
    conf3  = top[2] ? nf(top[2].confidence, 0, 2) : '';

    lastUpdateTime = millis();
  } else if (modelReady && videoReadyFlag && latestResults && latestResults.length === 0 && label !== '分類待機中...' && label !== 'モデル読込中...' && label !== 'カメラ準備中...' && label !== '分類エラー' && label !== '対象なし') {
      label = '対象なし';
      conf = '';
      label2 = ''; conf2 = '';
      label3 = ''; conf3 = '';
  }

  fill(255);
  textSize(16);
  textAlign(CENTER);
  const y_label = height - 35;
  const y_conf  = height - 15;

  text(label,  width * 0.25, y_label); text(conf,  width * 0.25, y_conf);
  text(label2, width * 0.5,  y_label); text(conf2, width * 0.5,  y_conf);
  text(label3, width * 0.75, y_label); text(conf3, width * 0.75, y_conf);
}


