#!/usr/bin/env node

/**
 * 辞書データ生成スクリプト
 * 
 * 使用方法:
 * ANTHROPIC_API_KEY=your_api_key node generate-dictionary.js <開始行> <終了行>
 * 
 * 例:
 * - 最初の1000語を処理: ANTHROPIC_API_KEY=xxx node generate-dictionary.js 1 1000
 * - 続きの9000語を処理: ANTHROPIC_API_KEY=xxx node generate-dictionary.js 1001 10000
 * - さらに続きを処理: ANTHROPIC_API_KEY=xxx node generate-dictionary.js 10001 20000
 * 
 * 失敗した単語の再実行:
 * - 特定範囲の失敗を再実行: ANTHROPIC_API_KEY=xxx node generate-dictionary.js --retry-failed 1 1000
 * - すべての失敗を再実行: ANTHROPIC_API_KEY=xxx node generate-dictionary.js --retry-failed
 * 
 * ファイル:
 * - unigram_freq.csv: 入力となる単語リスト
 * - dictionary-generated.json: 生成された辞書データ
 * - dictionary-partial.json: 処理途中の部分的な結果
 * - batch-status.json: バッチの状態管理
 * - failed-words.json: 失敗した単語の記録（エラー内容含む）
 * 
 * 注意事項:
 * - 行番号はCSVファイルの実際の行番号です（ヘッダー行を除く）
 * - 1行目は "the", 2行目は "of" のように対応します
 * - 中断しても再実行時は結果取得から再開されます
 * - 最大10,000語まで1つのバッチで処理します
 * - JSON解析エラーが発生した単語は failed-words.json に記録され、--retry-failed で再実行可能
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');

// 設定値
const MAX_REQUESTS_PER_BATCH = 10000; // Batch APIの最大リクエスト数
const BATCH_STATUS_FILE = 'batch-status.json';
const PARTIAL_RESULT_FILE = 'dictionary-partial.json';
const FAILED_WORDS_FILE = 'failed-words.json';
const INPUT_CSV = 'unigram_freq.csv';
const OUTPUT_JSON = 'dictionary-generated.json';

// Claude API設定
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY環境変数が設定されていません');
  process.exit(1);
}

// コマンドライン引数の処理
const args = process.argv.slice(2);
let isRetryMode = false;
let startIndex, endIndex;

// --retry-failedオプションのチェック
if (args[0] === '--retry-failed') {
  isRetryMode = true;
  if (args.length === 3) {
    startIndex = parseInt(args[1]);
    endIndex = parseInt(args[2]);
  } else if (args.length === 1) {
    // 引数なしの場合は、failed-words.jsonからすべて読み込む
    startIndex = null;
    endIndex = null;
  } else {
    console.error('使用方法: node generate-dictionary.js --retry-failed [<開始行> <終了行>]');
    console.error('例: node generate-dictionary.js --retry-failed 1 1000');
    console.error('または: node generate-dictionary.js --retry-failed (すべての失敗を再実行)');
    process.exit(1);
  }
} else {
  // 通常モード
  if (args.length < 2) {
    console.error('使用方法: node generate-dictionary.js <開始行> <終了行>');
    console.error('例: node generate-dictionary.js 1 1000');
    console.error('失敗の再実行: node generate-dictionary.js --retry-failed [<開始行> <終了行>]');
    process.exit(1);
  }
  startIndex = parseInt(args[0]);
  endIndex = parseInt(args[1]);
}

let wordsPerRun = isRetryMode ? 0 : endIndex - startIndex + 1; // 後で再計算

if (!isRetryMode) {
  console.log(`処理範囲: ${startIndex}行目から${endIndex}行目 (${wordsPerRun}語)`);
}

// 状態管理
let batchStatus = {};
let partialResults = {};
let failedWords = {};
let startTime = Date.now();
let totalInputTokens = 0;
let totalOutputTokens = 0;

// 状態ファイルの読み込み
function loadState() {
  try {
    if (fs.existsSync(BATCH_STATUS_FILE)) {
      batchStatus = JSON.parse(fs.readFileSync(BATCH_STATUS_FILE, 'utf8'));
    }
    if (fs.existsSync(PARTIAL_RESULT_FILE)) {
      partialResults = JSON.parse(fs.readFileSync(PARTIAL_RESULT_FILE, 'utf8'));
    }
    if (fs.existsSync(FAILED_WORDS_FILE)) {
      failedWords = JSON.parse(fs.readFileSync(FAILED_WORDS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('状態ファイルの読み込みエラー:', error.message);
  }
}

// 状態ファイルの保存
function saveState() {
  fs.writeFileSync(BATCH_STATUS_FILE, JSON.stringify(batchStatus, null, 2));
  fs.writeFileSync(PARTIAL_RESULT_FILE, JSON.stringify(partialResults, null, 2));
  if (Object.keys(failedWords).length > 0) {
    fs.writeFileSync(FAILED_WORDS_FILE, JSON.stringify(failedWords, null, 2));
  }
}

// CSVから指定範囲の単語を読み込む
async function loadWords(start, end) {
  const words = [];
  const fileStream = fs.createReadStream(INPUT_CSV);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  for await (const line of rl) {
    lineNumber++;
    if (lineNumber === 1) continue; // ヘッダーをスキップ
    if (lineNumber < start + 1) continue; // +1はヘッダー分
    if (lineNumber > end + 1) break;

    const [word, count] = line.split(',');
    words.push({ word, count: parseInt(count), lineNumber: lineNumber - 1 });
  }

  return words;
}

// 失敗した単語を読み込む
function loadFailedWords(filterStart = null, filterEnd = null) {
  const words = [];
  
  if (!fs.existsSync(FAILED_WORDS_FILE)) {
    console.log('失敗した単語はありません。');
    return words;
  }
  
  try {
    const failed = JSON.parse(fs.readFileSync(FAILED_WORDS_FILE, 'utf8'));
    
    for (const [batchKey, batch] of Object.entries(failed)) {
      // バッチキーから範囲を抽出
      const match = batchKey.match(/batch_(\d+)_(\d+)/);
      if (!match) continue;
      
      const batchStart = parseInt(match[1]);
      const batchEnd = parseInt(match[2]);
      
      // フィルタリング
      if (filterStart !== null && filterEnd !== null) {
        if (batchStart !== filterStart || batchEnd !== filterEnd) {
          continue;
        }
      }
      
      // 失敗した単語を追加
      for (const failure of batch.failures) {
        words.push({
          word: failure.word,
          lineNumber: failure.lineNumber,
          count: 0, // カウントは不明なので0
          previousError: failure.error,
          batchKey
        });
      }
    }
    
  } catch (error) {
    console.error('失敗単語ファイルの読み込みエラー:', error.message);
  }
  
  return words;
}

// Claude APIでバッチをsubmit
async function submitBatchAPI(words) {
  const requests = words.map((wordData, idx) => ({
    custom_id: `word_${wordData.lineNumber}_${wordData.word}`,
    params: {
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `次の英単語について、辞書エントリーをJSON形式で生成してください。

重要な指示:
- definitionsは使用頻度順に並べてください（最もよく使われる意味を最初に）
- 単語が持つ主要な意味をすべて含めてください（1個の場合も10個の場合もあります）
- 同じ品詞でも意味が異なる場合は、それぞれ別のエントリーとして記載してください
- あまり使われない専門的・古語的な意味は除外してください
- synonymsとantonymsは適切な数だけ含めてください（0個でも5個でも構いません）
- 重要: すべての文字列値は必ず二重引用符("")で囲んでください。特に日本語の値も必ず引用符で囲むこと
- examples配列には必ず英語の例文のみを含めてください。日本語の例文は使用しないこと

形式:
{
  "word": "単語",
  "pronunciation": "/発音記号/",
  "definitions": [
    {
      "partOfSpeech": "名詞",
      "meaning": "最も一般的な意味（例：銀行）",
      "examples": ["例文1", "例文2"]
    },
    {
      "partOfSpeech": "動詞",
      "meaning": "2番目によく使われる意味",
      "examples": ["例文3", "例文4"]
    },
    {
      "partOfSpeech": "名詞",
      "meaning": "3番目の意味（例：土手）",
      "examples": ["例文5", "例文6"]
    }
  ],
  "synonyms": ["類義語1", "類義語2", "類義語3"],
  "antonyms": ["対義語1"]
}

単語: ${wordData.word}

JSONだけを出力してください。説明は不要です。`
      }]
    }
  }));

  const requestBody = JSON.stringify({
    requests
  });

  // 推定トークン数とコスト計算
  const estimatedInputTokens = requests.length * 200; // 1リクエストあたり約200トークン
  const estimatedOutputTokens = requests.length * 150; // 1レスポンスあたり約150トークン
  const estimatedCost = (estimatedInputTokens * 0.4 + estimatedOutputTokens * 2) / 1000000;

  console.log(`\n${words.length}語を1つのバッチとして送信中...`);
  console.log(`推定コスト: $${estimatedCost.toFixed(4)}`);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages/batches',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'message-batches-2024-09-24'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const response = JSON.parse(data);
          console.log(`バッチID: ${response.id} が作成されました`);
          resolve(response.id);
        } else {
          reject(new Error(`API Error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

// バッチの状態を確認
async function checkBatchStatus(batchId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: `/v1/messages/batches/${batchId}`,
      method: 'GET',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'message-batches-2024-09-24'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`API Error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// バッチ結果を取得
async function getBatchResults(resultsUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(resultsUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          // JSONL形式なので行ごとに処理
          const results = data.trim().split('\n').map(line => JSON.parse(line));
          resolve(results);
        } else {
          reject(new Error(`Failed to fetch results: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// 結果を処理してJSONに変換
function processResults(results) {
  const processed = {};
  let successCount = 0;
  let errorCount = 0;
  
  for (const result of results) {
    if (result.result?.type === 'succeeded') {
      // custom_idから単語を取得 (word_行番号_単語)
      const parts = result.custom_id.split('_');
      const word = parts.slice(2).join('_'); // 単語にアンダースコアが含まれる場合に対応
      const content = result.result.message.content;
      
      // contentから実際のテキストを取得
      let contentText;
      if (Array.isArray(content) && content[0]?.text) {
        contentText = content[0].text;
      } else {
        console.error(`予期しないcontent構造:`, content);
        errorCount++;
        continue;
      }
      
      try {
        // JSONを抽出（コードブロックなどを除去）
        const jsonMatch = contentText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          processed[word] = parsed;
          successCount++;
          
          // トークン使用量を記録
          if (result.result.usage) {
            totalInputTokens += result.result.usage.input_tokens || 0;
            totalOutputTokens += result.result.usage.output_tokens || 0;
          }
        }
      } catch (error) {
        console.error(`単語 "${word}" のJSON解析エラー:`, error.message);
        errorCount++;
        
        // 失敗した単語を記録
        const batchKey = `batch_${startIndex}_${endIndex}`;
        if (!failedWords[batchKey]) {
          failedWords[batchKey] = {
            timestamp: new Date().toISOString(),
            failures: []
          };
        }
        
        // 行番号を取得
        const lineNumber = parseInt(parts[1]);
        failedWords[batchKey].failures.push({
          word,
          lineNumber,
          error: error.message,
          customId: result.custom_id,
          rawContent: contentText // デバッグ用に生のコンテンツも保存
        });
      }
    } else {
      const parts = result.custom_id.split('_');
      const word = parts.slice(2).join('_');
      const lineNumber = parseInt(parts[1]);
      console.error(`単語 "${word}" の処理エラー:`, result.result?.error?.message || 'Unknown error');
      errorCount++;
      
      // APIエラーも記録
      const batchKey = `batch_${startIndex}_${endIndex}`;
      if (!failedWords[batchKey]) {
        failedWords[batchKey] = {
          timestamp: new Date().toISOString(),
          failures: []
        };
      }
      
      failedWords[batchKey].failures.push({
        word,
        lineNumber,
        error: result.result?.error?.message || 'Unknown error',
        customId: result.custom_id,
        errorType: 'api_error'
      });
    }
  }
  
  console.log(`\n処理結果: ${successCount}件成功, ${errorCount}件エラー`);
  return processed;
}

// 進捗と統計を表示
function showProgress(processedWords, totalWords) {
  const elapsedTime = (Date.now() - startTime) / 1000; // 秒
  const wordsPerSecond = processedWords / elapsedTime;
  const remainingWords = totalWords - processedWords;
  const estimatedTimeRemaining = remainingWords / wordsPerSecond;
  
  const currentCost = (totalInputTokens * 0.4 + totalOutputTokens * 2) / 1000000;
  const estimatedTotalCost = currentCost * (totalWords / processedWords);
  
  console.log('\n=== 進捗状況 ===');
  console.log(`処理済み: ${processedWords}/${totalWords}語 (${(processedWords/totalWords*100).toFixed(1)}%)`);
  console.log(`経過時間: ${Math.floor(elapsedTime/60)}分${Math.floor(elapsedTime%60)}秒`);
  console.log(`推定残り時間: ${Math.floor(estimatedTimeRemaining/60)}分${Math.floor(estimatedTimeRemaining%60)}秒`);
  console.log(`現在のコスト: $${currentCost.toFixed(4)}`);
  console.log(`推定総コスト: $${estimatedTotalCost.toFixed(4)}`);
  console.log(`入力トークン: ${totalInputTokens}, 出力トークン: ${totalOutputTokens}`);
}

// メイン処理
async function main() {
  loadState();
  
  let words;
  let batchKey;
  
  if (isRetryMode) {
    console.log('失敗した単語を読み込み中...');
    words = loadFailedWords(startIndex, endIndex);
    
    if (words.length === 0) {
      console.log('再実行する単語がありません。');
      return;
    }
    
    console.log(`${words.length}個の失敗した単語を再実行します:`);
    words.forEach(w => console.log(`  - ${w.word} (行${w.lineNumber})`));
    
    // リトライ用のバッチキー
    const timestamp = Date.now();
    if (startIndex !== null && endIndex !== null) {
      batchKey = `retry_${startIndex}_${endIndex}_${timestamp}`;
    } else {
      batchKey = `retry_all_${timestamp}`;
    }
    
    // wordsPerRunを更新
    wordsPerRun = words.length;
    
    // 失敗した単語をクリア（成功したらsaveStateで保存される）
    if (startIndex !== null && endIndex !== null) {
      const originalBatchKey = `batch_${startIndex}_${endIndex}`;
      if (failedWords[originalBatchKey]) {
        delete failedWords[originalBatchKey];
      }
    } else {
      // すべてクリア
      failedWords = {};
    }
    
  } else {
    console.log('CSVファイルから単語を読み込み中...');
    words = await loadWords(startIndex, endIndex);
    console.log(`${words.length}語を読み込みました`);
    
    // バッチキーを生成（実行範囲ごとに一意）
    batchKey = `batch_${startIndex}_${endIndex}`;
    
    // すでに完了している場合は結果を表示して終了
    if (batchStatus[batchKey]?.status === 'completed') {
      console.log('このバッチは既に完了しています');
      showProgress(Object.keys(partialResults).length, wordsPerRun);
      return;
    }
  }
  
  // バッチIDが存在しない場合は新規submit
  if (!batchStatus[batchKey]?.batchId) {
    console.log(`\n${words.length}語を1つのバッチとして送信します...`);
    
    // 10,000語を超える場合は分割が必要
    if (words.length > MAX_REQUESTS_PER_BATCH) {
      console.error(`エラー: ${words.length}語は最大リクエスト数(${MAX_REQUESTS_PER_BATCH})を超えています`);
      console.error(`実行を分割してください。例: 1-${MAX_REQUESTS_PER_BATCH}, ${MAX_REQUESTS_PER_BATCH + 1}-${endIndex}`);
      process.exit(1);
    }
    
    try {
      const batchId = await submitBatchAPI(words);
      batchStatus[batchKey] = {
        batchId,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        wordCount: words.length,
        startIndex,
        endIndex
      };
      saveState();
    } catch (error) {
      console.error('バッチの送信エラー:', error.message);
      process.exit(1);
    }
  }
  
  // バッチの完了を待つ
  const batchId = batchStatus[batchKey].batchId;
  console.log(`\nバッチの完了を待機中... (ID: ${batchId})`);
  console.log(`処理範囲: ${startIndex}-${endIndex} (${words.length}語)`);
  
  let checkInterval = 30000; // 30秒
  let lastCheck = Date.now();
  
  while (true) {
    try {
      const status = await checkBatchStatus(batchId);
      const elapsedMinutes = Math.floor((Date.now() - new Date(batchStatus[batchKey].submittedAt)) / 60000);
      console.log(`\n[${new Date().toLocaleTimeString()}] 状態: ${status.processing_status}`);
      console.log(`経過時間: ${elapsedMinutes}分`);
      
      if (status.request_counts) {
        const { succeeded, errored, canceled, expired } = status.request_counts;
        const total = batchStatus[batchKey].wordCount; // 送信したリクエスト数を使用
        console.log(`進捗: ${succeeded || 0}/${total} 成功`);
        if (errored > 0) console.log(`エラー: ${errored}件`);
        if (canceled > 0) console.log(`キャンセル: ${canceled}件`);
        if (expired > 0) console.log(`期限切れ: ${expired}件`);
      }
      
      if (status.processing_status === 'ended') {
        if (status.results_url) {
          console.log('\n結果を取得中...');
          const results = await getBatchResults(status.results_url);
          const processed = processResults(results);
          
          // 部分結果に追加
          Object.assign(partialResults, processed);
          batchStatus[batchKey].status = 'completed';
          batchStatus[batchKey].completedAt = new Date().toISOString();
          saveState();
          
          showProgress(Object.keys(partialResults).length, wordsPerRun);
          break;
        } else {
          console.error('エラー: 結果URLが見つかりません');
          break;
        }
      }
      
      // 次のチェックまで待機
      console.log(`\n次のチェックまで${checkInterval/1000}秒待機...`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
    } catch (error) {
      console.error('バッチ状態確認エラー:', error.message);
      console.log(`\nエラー後の再試行まで${checkInterval/1000}秒待機...`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }
  
  // 最終結果の保存
  console.log('\n最終結果を保存中...');
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(partialResults, null, 2));
  console.log(`${Object.keys(partialResults).length}語の辞書データを ${OUTPUT_JSON} に保存しました`);
  
  // 失敗した単語がある場合は表示
  // リトライモードの場合はbatchKeyが異なるので、通常モードの場合のみチェック
  if (!isRetryMode) {
    const failedBatchKey = `batch_${startIndex}_${endIndex}`;
    if (failedWords[failedBatchKey]?.failures?.length > 0) {
      console.log(`\n⚠️  ${failedWords[failedBatchKey].failures.length}個の単語が失敗しました:`);
      failedWords[failedBatchKey].failures.forEach(f => {
        console.log(`  - ${f.word} (行${f.lineNumber}): ${f.error}`);
      });
      console.log(`\n失敗した単語の詳細は ${FAILED_WORDS_FILE} に保存されました`);
      console.log(`再実行するには: node generate-dictionary.js --retry-failed ${startIndex} ${endIndex}`);
    }
  }
  
  // 最終統計
  showProgress(Object.keys(partialResults).length, wordsPerRun);
}

// 実行
main().catch(console.error);