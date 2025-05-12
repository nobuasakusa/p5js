
// Copyright (c) 2019 ml5 — MIT License
// Webcam classification (Teachable Machine) + p5.js

// ===== グローバル変数 =====
let classifier;
const modelURL = 'https://teachablemachine.withgoogle.com/models/bXy2kDNi/';

let video;
let latestResults = null;
let lastUpdate = 0;
const UPDATE_INTERVAL = 500;   // 0.5 秒

// 画面に出すラベルと信頼度（上位 3 件）
let labels   = ['', '', ''];
let probs    = ['', '', ''];

// ===== モデル読み込み =====
function preload() {
  classifier = ml5.imageClassifier(modelURL + 'model.json');
}

// ===== セットアップ =====
function setup() {
  createCanvas(320, 300);

  video = createCapture(VIDEO, () => {
    // カメラ準備完了後に最初の分類
    classifyVideo();
  });
  video.size(320, 240);
  video.hide();               // p5 の video 要素は自分で描画する
}

// ===== メインループ =====
function draw() {
  background(0);

  // (1) カメラ映像を描画
  image(video, 0, 0);

  // (2) 0.5 秒ごとに結果を更新
  if (latestResults && millis() - lastUpdate > UPDATE_INTERVAL) {
    for (let i = 0; i < 3; i++) {
      labels[i] = latestResults[i]?.label ?? '';
      probs[i]  = nf(latestResults[i]?.confidence ?? 0, 0, 2);
    }
    lastUpdate = millis();
  }

  // (3) ラベルと信頼度を描画
  fill(255);
  textSize(16);
  textAlign(CENTER);
  const xs = [width * 0.2, width * 0.5, width * 0.8];
  for (let i = 0; i < 3; i++) {
    text(labels[i], xs[i], height - 30);
    text(probs[i],  xs[i], height - 4);
  }
}

// ===== ビデオを分類 =====
function classifyVideo() {
  const flipped = ml5.flipImage(video);          // 左右反転
  classifier.classify(flipped, (err, results) => {
    if (err) { console.error(err); return; }
    latestResults = results;
    flipped.remove();                            // メモリ回収
    classifyVideo();                             // 連続分類
  });
}
