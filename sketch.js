
// Copyright (c) 2019 ml5 — MIT License
// Webcam classification (Teachable Machine) + p5.js

// ===== グローバル変数 =====
let classifier;
const modelURL = 'https://teachablemachine.withgoogle.com/models/bXy2kDNi/';

let video;
let latestResults = [];
let lastUpdateTime = 0;
const updateInterval = 500;   // 0.5 秒

// 表示用
let label  = '', label2 = '', label3 = '';
let conf   = '', conf2  = '', conf3  = '';

// ----------------- モデル読み込み --------------
function preload() {
  classifier = ml5.imageClassifier(modelURL + 'model.json');
}

// ----------------- セットアップ ----------------
function setup() {
  createCanvas(320, 300);

  video = createCapture(VIDEO, () => classifyVideo());
  video.size(320, 240);
  video.hide();
}

// ----------------- 分類ループ -----------------
function classifyVideo() {
  classifier.classify(video, gotResult);
}

function gotResult(err, results) {
  if (err) { console.error(err); return; }
  latestResults = results;          // 全件保存
  classifyVideo();                  // 連続分類
}

// ----------------- 描画 ------------------------
function draw() {
  background(0);

  /* ① 映像を鏡写しで描画 */
  push();
  translate(video.width, 0);
  scale(-1, 1);
  image(video, 0, 0);
  pop();

  /* ② 0.5 秒ごとにラベル更新（★ここが draw() の中！） */
  if (latestResults.length && millis() - lastUpdateTime > updateInterval) {
    const top = latestResults.slice(0, 3);                   // 上位3件
    [label, label2, label3] = top.map(r => r.label).concat(['', '', '']).slice(0, 3);
    [conf,  conf2,  conf3 ] = top.map(r => nf(r.confidence, 0, 2)).concat(['', '', '']).slice(0, 3);
    lastUpdateTime = millis();
  }

  /* ③ ラベルと信頼度を固定位置に描画 */
  fill(255);
  textSize(16);
  textAlign(CENTER);
  text(label,  width * 0.2, height - 30);  text(conf,  width * 0.2, height - 4);
  text(label2, width * 0.5, height - 30);  text(conf2, width * 0.5, height - 4);
  text(label3, width * 0.8, height - 30);  text(conf3, width * 0.8, height - 4);
}
