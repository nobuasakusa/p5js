
// Copyright (c) 2019 ml5 — MIT License
// Webcam classification (Teachable Machine) + p5.js

// ===== グローバル変数 =====
let classifier;
const modelURL = 'https://teachablemachine.withgoogle.com/models/bXy2kDNi/';


let video;
let latestResults = [];            // 直近の生データ
let lastUpdateTime = 0;
const updateInterval = 500;        // 0.5 秒

// ラベルと信頼度を表示用に保持
let label  = '', label2 = '', label3 = '';
let conf   = '', conf2  = '', conf3  = '';

function preload() {
  // モデルだけ先に読む
  classifier = ml5.imageClassifier(modelURL + 'model.json');
}

function setup() {
  createCanvas(320, 300);

  // カメラ起動 → 準備完了したら分類開始
  video = createCapture(VIDEO, () => classifyVideo());
  video.size(320, 240);
  video.hide();
}

function draw() {
  background(0);

  // A) 映像を鏡写しで表示
  push();
  translate(video.width, 0);
  scale(-1, 1);
  image(video, 0, 0);
  pop();

  // B) 0.5 秒ごとに表示用変数を更新
  if (latestResults.length && millis() - lastUpdateTime > updateInterval) {
    // 上位3件（不足分は空文字）
    const top = latestResults.slice(0, 3);
    [label, label2, label3] = top.map(r => r.label).concat(['', '', '']).slice(0, 3);
    [conf, conf2, conf3]    = top.map(r => nf(r.confidence, 0, 2)).concat(['', '', '']).slice(0, 3);
    lastUpdateTime = millis();
  }

  // C) ラベルと信頼度を描画（0.2 / 0.5 / 0.8 の位置）
  fill(255);
  textSize(16);
  textAlign(CENTER);
  text(label,   width * 0.2, height - 30);
  text(conf,    width * 0.2, height -  4);
  text(label2,  width * 0.5, height - 30);
  text(conf2,   width * 0.5, height -  4);
  text(label3,  width * 0.8, height - 30);
  text(conf3,   width * 0.8, height -  4);
}

// --------- 分類ループ ------------------------------------------
function classifyVideo() {
  classifier.classify(video, gotResult);
}

function gotResult(err, results) {
  if (err) { console.error(err); return; }
  latestResults = results;       // ★ 生データを保存
  classifyVideo();               // 再帰的にループ
}
