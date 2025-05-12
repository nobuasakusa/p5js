
// Copyright (c) 2019 ml5 — MIT License
// Webcam classification (Teachable Machine) + p5.js

// ===== グローバル変数 =====
let classifier;
const modelURL = 'https://teachablemachine.withgoogle.com/models/bXy2kDNi/';


let video;
let latest = [];                  // 生の結果
let lastUpdate = 0;
const UPDATE_INTERVAL = 500;      // 0.5 秒

// 描画用（最大 3 件）
let label  = '', label2 = '', label3 = '';
let conf   = '', conf2  = '', conf3  = '';

// ---------------- セットアップ ----------------
function preload(){
  classifier = ml5.imageClassifier(modelURL + 'model.json');
}

function setup(){
  createCanvas(320, 300);

  video = createCapture(VIDEO, () => classifyVideo());
  video.size(320,240);
  video.hide();
}

// ---------------- 分類ループ -----------------
function classifyVideo(){
  classifier.classify(video, gotResult);
}

function gotResult(err, res){
  if(err){ console.error(err); return; }
  latest = res;                   // 生結果を保存
  classifyVideo();                // ループ継続
}

// ---------------- 描画 -----------------------
function draw(){
  background(0);

  /* 1. カメラ映像を鏡写しで表示 */
  push();
  translate(video.width,0); scale(-1,1);
  image(video,0,0);
  pop();

  /* 2. 0.5 秒ごとにラベルを更新 */
  if(latest.length && millis()-lastUpdate > UPDATE_INTERVAL){
    const t = latest.slice(0,3);          // 上位3件
    [label,label2,label3] = t.map(r=>r.label).concat(['','','']).slice(0,3);
    [conf,conf2,conf3]   = t.map(r=>nf(r.confidence,0,2)).concat(['','','']).slice(0,3);
    lastUpdate = millis();
  }

  /* 3. ラベルと信頼度を固定位置に描画 */
  fill(255); textSize(16); textAlign(CENTER);
  text(label,   width*0.2, height-30);  text(conf,   width*0.2, height-4);
  text(label2,  width*0.5, height-30);  text(conf2,  width*0.5, height-4);
  text(label3,  width*0.8, height-30);  text(conf3,  width*0.8, height-4);
}
