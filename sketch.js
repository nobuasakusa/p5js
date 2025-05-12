
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

let labels = ['', '', ''];
let probs  = ['', '', ''];

// -------------- モデルを読む --------------
function preload() {
  classifier = ml5.imageClassifier(modelURL + 'model.json', () => {
    modelReady = true;
    tryStartClassification();
  });
}

// -------------- カメラを開く --------------
function setup() {
  createCanvas(320, 300);

  video = createCapture(VIDEO, () => {
    videoReady = true;
    tryStartClassification();
  });
  video.size(320, 240);
  video.hide();
}

// -------------- 両方そろったら分類開始 --------------
function tryStartClassification() {
  if (modelReady && videoReady) {
    classifyVideo();
  }
}

function classifyVideo() {
  // flipImage が無いので video を直接渡す
  classifier.classify(video, gotResult);
}

function gotResult(err, results) {
  if (err) { console.error(err); return; }
  latestResults = results;
  classifyVideo();           // 連続分類
}

// -------------- 描画 --------------
function draw() {
  background(0);

  // (A) 映像を鏡写しにして表示
  push();
  translate(video.width, 0);   // 右端を基準に
  scale(-1, 1);                // 左右反転
  image(video, 0, 0);
  pop();

  // (B) 0.5 秒おきにラベル更新
  if (latestResults && millis() - lastUpdate > UPDATE_INTERVAL) {
    for (let i = 0; i < 3; i++) {
      labels[i] = latestResults[i]?.label ?? '';
      probs[i]  = nf(latestResults[i]?.confidence ?? 0, 0, 2);
    }
    lastUpdate = millis();
  }

  // (C) テキスト描画
  fill(255);
  textSize(16);
  textAlign(CENTER);
  const xs = [width * 0.2, width * 0.5, width * 0.8];
  for (let i = 0; i < 3; i++) {
    text(labels[i], xs[i], height - 30);
    text(probs[i],  xs[i], height - 4);
  }
}
