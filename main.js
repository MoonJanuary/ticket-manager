'use strict';
// TODO:ライセンス関係の署名を追加
// TODO:打検をして品質を上げる

// 定数
/** 明細の空行のHTML */
const HTML_HEADER = '<tr id="header"><th>ID</th><th>起票日</th><th>完了日</th><th>起票者</th><th>担当者</th><th>標題</th></tr>';
const HTML_DETAIL = '<tr class="detail"><td></td><td></td><td></td><td></td><td></td><td></td></tr>';

// グローバル変数
/** チケット情報のリスト */
let list = [];
/** チケット数 */
let cntTickets = 0;
/** 完了数 */
let cntClosed = 0;
/** 進捗(パーセンテージ、小数点以下切り捨て) */
let progress = 0;

// 要素の参照を取得
/** 選択したチケット */
const inputTickets = document.querySelector('#tickets');
/** 集計結果 */
const pResult = document.querySelector('#result');
/** 集計結果出力ボタン */
const btnOutputResult = document.querySelector('#outputResult');
/** 明細テーブルのボディ */
const tbodyDetails = document.querySelector('#details');

/**
 * 年月日表示形式変換(YYYYMMDD > YYYY/MM/DD)
 * @param yyyymmdd YYYYMMDD形式の年月日
 * @return YYYY/MM/DD形式の年月日
 */
function convertYYYYMMDD (yyyymmdd) {
  return yyyymmdd.substr(0, 4) + '/' + yyyymmdd.substr(4, 2) + '/' + yyyymmdd.substr(6, 2);
}

/**
 * ファイル選択ダイアログからファイルが選択された場合の処理
 * @event
 * */
inputTickets.addEventListener('change', (event) => {

  // 初期化
  list = [];
  tbodyDetails.textContent = null;
  cntClosed = 0;
  
  // 入力ファイルのリストを取得
  const target = event.target;
  const files = target.files;
  
  // 選択したファイル名からチケット情報のリストを作成(IDの昇順でソート)
  // TODO:ソートは数値以外が含まれても対応できるように考慮する。
  for (let file of files) {
    const data = file.name.replace('.txt', '').split('_');
    list.push({ id: data[0], issueDay: convertYYYYMMDD(data[1]), closingDay: convertYYYYMMDD(data[2]), issuer: data[3], worker: data[4], title: data[5] });
  }
  list.sort((a, b) => {return a.id - b.id;});
  
  // チケット情報のリストからテーブルを生成
  tbodyDetails.insertAdjacentHTML('beforeend', HTML_HEADER);
  let i = 1;
  for (let detail of list) {
  
    // 各セルに値を設定
    tbodyDetails.insertAdjacentHTML('beforeend', HTML_DETAIL);
    tbodyDetails.rows[i].cells[0].appendChild(document.createTextNode(detail.id));
    tbodyDetails.rows[i].cells[1].appendChild(document.createTextNode(detail.issueDay));
    tbodyDetails.rows[i].cells[2].appendChild(document.createTextNode(detail.closingDay));
    tbodyDetails.rows[i].cells[3].appendChild(document.createTextNode(detail.issuer));
    tbodyDetails.rows[i].cells[4].appendChild(document.createTextNode(detail.worker));
    tbodyDetails.rows[i].cells[5].appendChild(document.createTextNode(detail.title));
    i++;
    
    // 完了したチケット数をカウント
    if (detail.closingDay !== '0000/00/00') {
      cntClosed++;
    }
  }
  
  // チケット数を取得
  cntTickets = list.length;
  // 進捗率を算出
  // TODO:誤差の無い計算を理解して適するなら取り入れる。
  progress = Math.trunc(cntClosed / cntTickets * 100);
  
  // 集計結果を出力
  pResult.innerHTML = 'チケット数:' + cntTickets + '&nbsp完了数:' + cntClosed + '&nbsp進捗率:' + progress + '%';
});

/**
 * 集計結果出力ボタン押下時の処理
 * @event
 */
// 
btnOutputResult.addEventListener('click', () => {
  // チケットのリストをファイル出力用の文字列に編集
  let strBuffer = 'ID\t起票日\t完了日\t起票者\t担当者\t標題\n';
  for (let detail of list) {
    strBuffer += detail.id + '\t' + detail.issueDay + '\t' + detail.closingDay + '\t' + detail.issuer + '\t' + detail.worker + '\t' + detail.title + '\n';
  }
  
  // ファイル名を生成
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = ('00' + (date.getMonth()+1)).slice(-2);
  const dd = ('00' + date.getDate()).slice(-2);
  const outFileName = yyyy + mm + dd + '_' + cntTickets + '_' + cntClosed + '_' + progress + '.txt';
  
  // テキストをBLOBとして生成
  const blResultFile = new Blob([strBuffer], {type:'text/plain'});
  
  // ブラウザによりファイル出力処理を切り替え
  if (window.navigator.msSaveBlob) {
    // IE
    window.navigator.msSaveBlob(blResultFile, outFileName);
  } else if (window.URL && window.URL.createObjectURL) {
    // FireFox、Chrome、Safari
    const a = document.createElement('a');
    a.download = outFileName;
    a.href = window.URL.createObjectURL(blResultFile);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    // その他
    const base64ResultFile = 'data:text/plain,' + encodeURIComponent(pResult.textContent);
    window.open(base64ResultFile, '_blank');
  }
});
