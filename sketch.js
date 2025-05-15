
// Copyright (c) 2019 ml5 — MIT License
// Webcam classification (Teachable Machine) + p5.js

// ===== グローバル変数 =====
let classifier;
const modelURL = 'https://teachablemachine.withgoogle.com/models/FkkCfauKt/';


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
  console.log('setup: ビデオキャプチャのセットアップを開始しました（準備待ち）。');
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
    // console.warn('classifyVideo: モデルがまだ準備できていません。分類をスキップします。');
    return;
  }
  if (!videoReadyFlag || !video.elt || video.elt.readyState !== 4) {
    // console.warn('classifyVideo: ビデオがまだ準備できていないか、再生可能ではありません。100ms後に再試行します。');
    setTimeout(classifyVideo, 100); // 準備ができるまでリトライ
    return;
  }
  classifier.classify(video, gotResult);
}

function gotResult(err, results) {
  let actualError = null;
  let actualResults = null;

  // err引数に結果らしきものが入っているかチェック (このプログラムの特有処理)
  if (err && Array.isArray(err) && err.length > 0 && err[0] && typeof err[0].label !== 'undefined') {
    // console.warn('gotResult: 最初の引数(err)を「結果」として扱います。err:', err); // 特殊処理が作動したことを示すログ(必要に応じてコメント解除)
    actualResults = err;
    actualError = null;
  } else if (err) {
    actualError = err;
    actualResults = results;
  } else {
    actualError = null;
    actualResults = results;
  }

  if (actualError) {
    console.error('gotResult: 分類エラーが発生しました。エラー内容:', actualError);
    label = '分類エラー';
    conf = '';
    // エラー発生後も次の分類を試みる（エラーが頻発する場合はループを止める検討も）
    setTimeout(classifyVideo, 1000); // 1秒後にリトライ
    return;
  }

  if (actualResults && actualResults.length > 0) {
    // console.log('gotResult: 分類結果を処理します。件数:', actualResults.length); // 必要であれば結果件数ログを有効化
    latestResults = actualResults;
  } else {
    // console.log('gotResult: 結果が空か有効な結果なし。');
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
    // ビデオ準備中の表示は画面上の 'label' 変数に任せる
  }

  // ラベル更新ロジック (0.5秒ごと)
  if (modelReady && videoReadyFlag && latestResults && latestResults.length > 0 && millis() - lastUpdateTime > updateInterval) {
    const top = latestResults.slice(0, 3); // 上位3件

    label  = top[0] ? top[0].label : '---';
    conf   = top[0] ? nf(top[0].confidence, 0, 2) : '';
    label2 = top[1] ? top[1].label : '';
    conf2  = top[1] ? nf(top[1].confidence, 0, 2) : '';
    label3 = top[2] ? top[2].label : '';
    conf3  = top[2] ? nf(top[2].confidence, 0, 2) : '';

    lastUpdateTime = millis();
  } else if (modelReady && videoReadyFlag && latestResults && latestResults.length === 0 &&
             label !== '分類待機中...' && label !== 'モデル読込中...' && label !== 'カメラ準備中...' &&
             label !== '分類エラー' && label !== '対象なし') {
      // 結果が得られていたが、その後検出対象がなくなった場合
      label = '対象なし';
      conf = '';
      label2 = ''; conf2 = '';
      label3 = ''; conf3 = '';
  }

  // ラベルと信頼度の描画
  fill(255);
  textSize(16);
  textAlign(CENTER);
  const y_label = height - 35;
  const y_conf  = height - 15;

  text(label,  width * 0.15, y_label); text(conf,  width * 0.15, y_conf);
  text(label2, width * 0.50,  y_label); text(conf2, width * 0.50,  y_conf);
  text(label3, width * 0.85, y_label); text(conf3, width * 0.85, y_conf);
}
