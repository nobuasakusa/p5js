
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

// ★★★ gotResult 関数を以下のように修正 ★★★
function gotResult(err, results) {
  let actualError = null;
  let actualResults = null;

  // デバッグ用に受け取った引数をそのまま表示
  // console.log('gotResult raw arguments: err =', err, ', results =', results);

  // err引数に結果らしきものが入っているかチェック
  if (err && Array.isArray(err) && err.length > 0 && err[0] && typeof err[0].label !== 'undefined' && typeof err[0].confidence !== 'undefined') {
    // err の中身が分類結果の形式である場合
    console.warn('gotResult: 最初の引数(err)に分類結果らしきデータが含まれていました。これを結果として扱います。err:', err);
    actualResults = err; // err を結果として採用
    actualError = null;  // エラーは無かったものとする (もし2番目の引数にも何かあれば、それは無視)
  } else if (err) {
    // err が上記条件に合致しない、真のエラーオブジェクトである場合
    actualError = err;
    actualResults = results; // この場合 results は undefined かもしれない
  } else {
    // err が null または undefined (エラーなし) の場合、results を結果として採用
    actualError = null;
    actualResults = results;
  }

  // エラー処理
  if (actualError) {
    console.error('gotResult: 分類エラーが発生しました。');
    console.error('--- エラーオブジェクト詳細ここから ---');
    console.error('エラーオブジェクト全体:', actualError);
    if (actualError.message) { console.error('エラーメッセージ (actualError.message):', actualError.message); }
    if (actualError.stack) { console.error('スタックトレース (actualError.stack):', actualError.stack); }
    // (必要に応じて、以前提案したより詳細なエラー情報出力コードを追加)
    console.error('--- エラーオブジェクト詳細ここまで ---');
    label = '分類エラー';
    conf = '';
    classifyVideo(); // エラー後も次の分類を試みる (エラーが頻発する場合はループを止める検討も)
    return;
  }

  // 結果処理
  if (actualResults && actualResults.length > 0) {
    console.log('gotResult: 分類結果を処理します。件数:', actualResults.length, '内容:', actualResults);
    latestResults = actualResults;
  } else {
    console.log('gotResult: 結果が空、または有効な結果がありませんでした。actualResults:', actualResults);
    // latestResults = []; // 結果がなければ空にする場合
  }

  classifyVideo(); // 次の分類をスケジュール
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
    // console.log('draw: ラベル情報を更新します。latestResults[0]:', latestResults[0]);
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

