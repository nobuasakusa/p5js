
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
  // モデルの読み込みが完了したら modelLoadedCallback を呼び出す
  classifier = ml5.imageClassifier(modelURL + 'model.json', modelLoadedCallback);
}

// モデル読み込み完了時のコールバック関数
function modelLoadedCallback() {
  console.log('preload (modelLoadedCallback): モデルの読み込みが完了しました！');
  modelReady = true;
  // ラベルを更新して状態を表示
  if (!videoReadyFlag) { // ビデオがまだ準備できていない場合
      label = 'カメラ準備中...';
  } else { // ビデオもモデルも準備完了
      label = '分類待機中...';
      // 分類を開始できる状態なら、ここで一度呼び出すことも検討可能
      // ただし、通常はsetup完了後の最初のclassifyVideoから始まる
  }
}

// ----------------- セットアップ (setup) ----------------
function setup() {
  createCanvas(320, 300); // キャンバスサイズは適宜調整してください
  console.log('setup: キャンバスを作成しました。');

  // ウェブカメラの映像をキャプチャし、準備ができたら videoReadyCallback を呼び出す
  video = createCapture(VIDEO, videoReadyCallback);
  video.size(320, 240); // ビデオの表示サイズ
  video.hide(); // p5.jsによって別途描画するため、元のHTML要素は隠す
  console.log('setup: ビデオキャプチャのセットアップが完了しました（準備待ち）。');
}

// ビデオ準備完了時のコールバック関数
function videoReadyCallback() {
  console.log('setup (videoReadyCallback): ビデオの準備が完了しました。');
  videoReadyFlag = true;
  if (modelReady) { // モデルも準備完了していれば分類開始
      label = '分類待機中...';
      classifyVideo(); // ★最初の分類を開始
  } else {
      label = 'モデル読込中...'; // モデルがまだの場合は待機表示
  }
}

// ----------------- 分類ループ (classifyVideo, gotResult) -----------------
function classifyVideo() {
  if (!modelReady) {
    console.warn('classifyVideo: モデルがまだ準備できていません。分類をスキップします。');
    // 状態に応じてリトライ処理を入れることも可能
    // setTimeout(classifyVideo, 1000); // 1秒後にリトライなど
    return;
  }
  if (!videoReadyFlag || !video.elt || video.elt.readyState !== 4) { // video.elt.readyState === 4 はビデオが再生可能な状態
    console.warn('classifyVideo: ビデオがまだ準備できていないか、再生可能ではありません。100ms後に再試行します。');
    setTimeout(classifyVideo, 100); // 少し待ってからリトライ
    return;
  }

  // console.log('classifyVideo: 分類を実行します...'); // ログが多すぎる場合はコメントアウト推奨
  classifier.classify(video, gotResult); // 現在のビデオフレームを分類
}

// 分類結果を受け取った時のコールバック関数
function gotResult(err, results) {
  if (err) {
    console.error('gotResult: 分類エラーが発生しました。', err);
    label = '分類エラー'; // エラー情報を表示
    conf = '';
    // エラー発生後も分類を続けるか、ここで停止するかは設計による
    // classifyVideo(); // すぐに次の分類を試みる場合
    return;
  }

  // console.log('gotResult: 分類結果を受け取りました。', results); // デバッグ用に結果全体を表示
  if (results && results.length > 0) {
    latestResults = results;  // 最新の分類結果を保存
    // console.log('gotResult: latestResultsが更新されました。件数:', latestResults.length);
  } else {
    console.log('gotResult: 結果が空、または有効な結果がありませんでした。');
    // latestResults を空にするか、前の結果を保持するかは仕様による
    // latestResults = []; // 結果がなければ空にする場合
  }

  // 次の分類をスケジュール（連続分類のため）
  classifyVideo();
}

// ----------------- 描画 (draw) ------------------------
function draw() {
  background(0); // 背景を黒で塗りつぶし

  /* ① 映像を鏡写しで描画 */
  if (videoReadyFlag && video) {
    push(); // 現在の描画設定を保存
    translate(video.width, 0); // 映像の幅だけ右に移動
    scale(-1, 1);              // 水平方向に反転（鏡写し）
    image(video, 0, 0, video.width, video.height); // ビデオ映像を描画
    pop();  // 保存した描画設定に戻す
  } else {
    // ビデオが準備できていない場合の代替表示
    fill(100);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('ビデオ準備中...', width / 2, height / 2 - 20); // ラベル表示より上
  }

  /* ② 0.5 秒ごとにラベル更新 */
  // console.log('Draw status - Model:', modelReady, 'Video:', videoReadyFlag, 'Results:', latestResults.length, 'TimeCond:', (millis() - lastUpdateTime > updateInterval));

  if (modelReady && videoReadyFlag && latestResults && latestResults.length > 0 && millis() - lastUpdateTime > updateInterval) {
    console.log('draw: ラベル情報を更新します。latestResultsの最初の要素:', latestResults[0]); // 更新時の結果の先頭を確認
    const top = latestResults.slice(0, 3); // 上位3件を取得 (モデルが4つタグでも、ここで3つに絞る)

    // 結果の有無を確認しながら代入 (ユーザーの指摘に基づき、常に3件以上ある想定でも安全のためチェック)
    label  = top[0] ? top[0].label : '---';
    conf   = top[0] ? nf(top[0].confidence, 0, 2) : ''; // nf()は数値を整形

    label2 = top[1] ? top[1].label : ''; // 2件目以降は空でも良い想定
    conf2  = top[1] ? nf(top[1].confidence, 0, 2) : '';

    label3 = top[2] ? top[2].label : '';
    conf3  = top[2] ? nf(top[2].confidence, 0, 2) : '';

    lastUpdateTime = millis(); // 最終更新時刻を記録
  } else if (modelReady && videoReadyFlag && latestResults && latestResults.length === 0 && label !== '分類待機中...' && label !== 'モデル読込中...' && label !== 'カメラ準備中...' && label !== '分類エラー' && label !== '対象なし') {
      // 結果が得られていたが、その後空になった場合（対象物がないなど）
      label = '対象なし';
      conf = '';
      label2 = ''; conf2 = '';
      label3 = ''; conf3 = '';
  }


  /* ③ ラベルと信頼度を固定位置に描画 */
  fill(255); // 文字色を白に設定
  textSize(16); // 文字サイズ
  textAlign(CENTER); // 文字の水平位置を中央揃え

  // テキストが重ならないように、また、キャンバス下部にはみ出ないようにY座標を調整
  const y_label = height - 35; // ラベルのY座標
  const y_conf  = height - 15; // 信頼度のY座標

  // console.log('Displaying texts:', label, conf, label2, conf2, label3, conf3); // 表示直前の値を確認

  text(label,  width * 0.25, y_label); text(conf,  width * 0.25, y_conf);
  text(label2, width * 0.5,  y_label); text(conf2, width * 0.5,  y_conf);
  text(label3, width * 0.75, y_label); text(conf3, width * 0.75, y_conf);
}

