/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 초등학교 감염병 관리대장 - Google Apps Script (Code.gs)
 * 
 * [목적]
 * '등교중지 필요한 질병 찾기' 웹앱에서 전송된 학생 감염병 정보를
 * 구글 스프레드시트의 11개 표준 열(스키마)에 안전하게 누적 기록합니다.
 * 
 * [스프레드시트 11개 열 스키마]
 * 1. 학년 | 2. 반 | 3. 성별 | 4. 성명 | 5. 질환명 | 6. 증상 발생 일자 |
 * 7. 등교중지 기간 | 8. 등교일 | 9. 주증상 | 10. 입원여부 | 11. 나이스 보고여부
 */

// 1. 표준 헤더(11개 열) 정의
const EXPECTED_HEADERS = [
  "학년",
  "반",
  "성별",
  "성명",
  "질환명",
  "증상 발생 일자",
  "등교중지 기간",
  "등교일",
  "주증상",
  "입원여부",
  "나이스 보고여부"
];

/**
 * 웹앱 연결 상태 확인용 GET 요청 핸들러
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "초등학교 감염병 관리대장 Apps Script가 정상 실행 중입니다.",
    schema: EXPECTED_HEADERS
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 웹앱에서 학생 정보 기록 전송 시 호출되는 POST 요청 핸들러
 */
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // 시트가 비어있거나 첫 번째 줄에 헤더가 없으면 자동으로 헤더 생성 및 서식 적용
    setupHeadersIfMissing(sheet);

    // 전달된 데이터 추출
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        postData = {};
      }
    }

    // 핑(테스트) 요청 처리
    if (postData.action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "구글 시트 연동 테스트 완료"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const record = postData.record || {};

    // 필수 입력값 검증 (학년, 반, 성명, 질환명)
    if (!record.grade || !record.name || !record.disease) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "필수 정보(학년, 성명, 질환명)가 누락되었습니다."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 11개 스키마 순서에 맞추어 행 데이터 조립
    const rowData = [
      sanitizeText(record.grade),          // 1. 학년
      sanitizeText(record.class),          // 2. 반
      sanitizeText(record.gender),         // 3. 성별
      sanitizeText(record.name),           // 4. 성명
      sanitizeText(record.disease),        // 5. 질환명
      sanitizeText(record.symptomDate),    // 6. 증상 발생 일자
      sanitizeText(record.suspendPeriod),  // 7. 등교중지 기간
      sanitizeText(record.returnDate),     // 8. 등교일
      sanitizeText(record.symptoms),       // 9. 주증상
      sanitizeText(record.hospitalized),   // 10. 입원여부
      sanitizeText(record.neisReported)    // 11. 나이스 보고여부
    ];

    // 시트 마지막 줄에 새로운 행 추가
    sheet.appendRow(rowData);

    // 마지막 행 서식 (가운데 정렬 등)
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 11).setVerticalAlignment("middle");
    sheet.getRange(lastRow, 1, 1, 4).setHorizontalAlignment("center");
    sheet.getRange(lastRow, 6, 1, 3).setHorizontalAlignment("center");
    sheet.getRange(lastRow, 10, 1, 2).setHorizontalAlignment("center");

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "감염병 관리대장에 성공적으로 등록되었습니다.",
      row: lastRow
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 첫 행에 11개 열 헤더가 없으면 자동으로 생성하고 배경색/굵게 처리
 */
function setupHeadersIfMissing(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(EXPECTED_HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0284c7");
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 35);
    sheet.setFrozenRows(1);
    
    // 열 너비 자동 조정
    for (let i = 1; i <= EXPECTED_HEADERS.length; i++) {
      sheet.setColumnWidth(i, 110);
    }
    sheet.setColumnWidth(5, 160); // 질환명
    sheet.setColumnWidth(7, 200); // 등교중지 기간
    sheet.setColumnWidth(9, 200); // 주증상
  }
}

/**
 * 수식 인젝션 방지 및 텍스트 정제
 */
function sanitizeText(value) {
  if (value === null || value === undefined) return "";
  let str = String(value).trim();
  // '=' 또는 '+' 또는 '-'로 시작하여 스프레드시트 수식으로 오작동하는 것을 방지
  if (str.startsWith("=") || str.startsWith("+") || (str.startsWith("-") && isNaN(str))) {
    str = "'" + str;
  }
  return str;
}
