
// Copyright (c) 2019 ml5 — MIT License
// Webcam classification (Teachable Machine) + p5.js

// ===== グローバル変数 =====
let classifier;
const modelURL = 'https://teachablemachine.withgoogle.com/models/bXy2kDNi/';

let video;
let modelReady = false;
let videoReady = false;

let results = [];     // ← 最新結果をここに丸ごと保持

// --------------- モデル読み込み -----------------
function preload() {
  classifier = ml5.imageClassifier(modelURL + 'model.json',
    () => { modelReady = true; tryStart(); });
}

// --------------- セットアップ -------------------
function setup() {
  createCanvas(320, 300);

  video = createCapture(VIDEO, () => {
    videoReady = true;
    tryStart();
  });
  video.size(320, 240);
  video.hide();
}

// モデルもカメラも準備 OK なら分類スタート
function tryStart() {
  if (modelReady && videoReady) classifyVideo();
}

// --------------- 分類ループ ---------------------
function classifyVideo() {
  classifier.classify(video, gotResult);
}

// 結果を受け取ったら配列ごと保存し、ただちに次フレームへ
function gotResult(err, r) {
  if (err) { console.error(err); return; }
  results = r;                 // ← ★ 1 行で更新
  classifyVideo();             // 連続分類
}

// --------------- 描画 ---------------------------
function draw() {
  background(0);

  /* A) カメラ映像を鏡写しで描く */
  push();
  translate(video.width, 0);
  scale(-1, 1);
  image(video, 0, 0);
  pop();

  /* B) ラベルと信頼度を常に描く */
  const n = results.length;    // クラス数（2,3,4…）
  if (n === 0) return;         // まだ結果が無い

  textSize(16);
  textAlign(CENTER);
  fill(255);

  // 横位置を均等割り
  for (let i = 0; i < n; i++) {
    const x = width * (i + 1) / (n + 1);
    const lbl = results[i].label;
    const prob = (results[i].confidence).toFixed(2); // 小数点2桁
    text(lbl,  x, height - 28);
    text(prob, x, height - 6);
  }
}
