// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
Webcam Image Classification using a pre-trained customized model and p5.js
This example uses p5 preload function to create the classifier
=== */

// Classifier Variable
let classifier;
// Model URL
let imageModelURL = 'https://teachablemachine.withgoogle.com/models/bXy2kDNi/';

// Video
let video;
let flippedVideo;
// To store the classification
let label = "";
let label2 = "";
let label3 = "";
// & confidence
let confidence = "";
let confidence2 = "";
let confidence3 = "";

let latestResults = null;
let latestConfidences = null;
let lastUpdateTime = 0;
const updateInterval = 1000; // 1.0秒

// Load the model first
function preload() {
  classifier = ml5.imageClassifier('https://teachablemachine.withgoogle.com/models/uz0fWPuJY/model.json');
}

function setup() {
  createCanvas(320, 300);
  // Create the video
  video = createCapture(VIDEO, () => {
    classifyVideo(); // カメラ準備完了後に分類開始
  });
  video.size(320, 240);
  video.hide();

  flippedVideo = ml5.flipImage(video);
  // Start classifying
  classifyVideo();
}

function draw() {
  background(0);
  if (video.loadedmetadata) {
    image(video, 0, 0);//そのまま表示
  }
}

  // Update the labels and confidence every 0.5 seconds
  if (latestResults && millis() - lastUpdateTime > updateInterval) {
    label = latestResults[0].label;
    confidence = latestConfidences[0];
    label2 = latestResults[1].label;
    confidence2 = latestConfidences[1];
    label3 = latestResults[2].label;
    confidence3 = latestConfidences[2];
    lastUpdateTime = millis();
  }

  // Draw the label
  fill(255);
  textSize(16);
  textAlign(CENTER);
  text(label, width * 0.2, height - 30);
  text(confidence, width * 0.2, height - 4);
  text(label2, width * 0.5, height - 30);
  text(confidence2, width * 0.5, height - 4);
  text(label3, width * 0.8, height - 30);
  text(confidence3, width * 0.8, height - 4);
}

// Get a prediction for the current video frame
function classifyVideo() {
  flippedVideo = ml5.flipImage(video);
  classifier.classify(flippedVideo, gotResult);
}

// When we get a result
function gotResult(error, results) {
  // If there is an error
  if (error) {
    console.error(error);
    return;
  }

  // Store the latest results and confidences
  latestResults = results;
  latestConfidences = results.map(r => nf(r.confidence, 0, 2));
  
  // Classifiy again!
  classifyVideo();
}
