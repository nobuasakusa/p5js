
// Copyright (c) 2019 ml5 — MIT License
// Webcam classification (Teachable Machine) + p5.js

// ===== グローバル変数 =====
let classifier;
const modelURL = 'https://teachablemachine.withgoogle.com/models/bXy2kDNi/';

let video;
let modelReady = false;
let videoReady = false;

let latestResults = null;
let lastUpdate   = 0;
const UPDATE_INTERVAL = 500;   // 0.5 秒

// 画面に出すラベルと信頼度（上位 3 件）
let labels = ['', '', ''];
let probs  = ['', '', ''];

// ===== ① モデル読み込み =====
function preload() {
  // 第 2 引数にコールバックを渡すことで読み込み完了を検知
  classifier = ml5.imageClassifier(modelURL + 'model.json', modelLoaded);
}

// ===== ② セットアップ =====
function setup() {
  createCanvas(320, 300);

  // カメラの準備が完了したら videoReady = true
  video = createCapture(VIDEO, () => {
    videoReady = true;
    tryStartClassification();
  });
  video.size(320, 240);
  video.hide();               // 自分で描画するので隠す
}

// ===== モデル読み込み完了時 =====
function modelLoaded() {
  console.log('Model is ready');
  modelReady = true;
  tryStartClassification();
}

// ===== モデルとカメラ両方そろったら分類開始 =====
function tryStartClassification() {
  if (modelReady && videoReady) {
    classifyVideo();
  }
}

// ===== ビデオを分類 =====
function classifyVideo() {
  // 左右反転して人物と同じ向きに
  const flipped = ml5.flipImage(video);

  classifier.classify(flipped, (err, results) => {
    if (err) {
      console.error(err);
      return;
    }
    latestResults = results;      // 結果を保存
    flipped.remove();             // メモリ解放
    classifyVideo();              // 連続分類
  });
}

// ===== ③ メインループ =====
function draw() {
  background(0);

  // (a) カメラ映像
  image(video, 0, 0);

  // (b) 0.5 秒おきに表示データを更新
  if (latestResults && millis() - lastUpdate > UPDATE_INTERVAL) {
    for (let i = 0; i < 3; i++) {
      labels[i] = latestResults[i]?.label ?? '';
      probs[i]  = nf(latestResults[i]?.confidence ?? 0, 0, 2);
    }
    lastUpdate = millis();
  }

  // (c) ラベルと信頼度を描画
  fill(255);
  textSize(16);
  textAlign(CENTER);
  const xs = [width * 0.2, width * 0.5, width * 0.8];
  for (let i = 0; i < 3; i++) {
    text(labels[i], xs[i], height - 30);
    text(probs[i],  xs[i], height - 4);
  }
}
