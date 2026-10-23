/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 초등학교 감염병 관리대장 - Google Apps Script (Code.gs)
 * 
 * [나이스(NEIS) 연계 및 열 순서 자유 변동 완벽 자동 매핑]
 * 1. 선생님께서 시트의 열 순서를 어떻게 바꾸셔도 헤더 제목을 자동으로 분석하여
 *    해당하는 열에 데이터를 정확하게 기재합니다.
 * 2. 1행에 제목("2026학년도 감염병 관리대장" 등)이 있거나 병합되어 있어도
 *    2~5행의 실제 헤더 행을 스스로 찾아냅니다.
 * 3. 템플릿에 미리 서식이나 테두리가 50행까지 걸려 있어도,
 *    맨 아래로 밀려나지 않고 성명이 비어있는 첫 행부터 차례대로 작성합니다.
 * 4. 새 시트인 경우 나이스 표준 15개 열 헤더를 자동으로 생성합니다.
 */

// 1. 브라우저 주소창이나 진단 도구에서 웹 앱 URL 배포 상태를 즉시 점검하는 GET 핸들러
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "초등학교 감염병 관리대장 연동 시스템이 정상 작동 중입니다.",
    account: Session.getActiveUser().getEmail() || "인증됨",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// 2. 웹앱에서 데이터를 보냈을 때 시트에 안전하게 기재하는 POST 핸들러
function doPost(e) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();

    let postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        postData = {};
      }
    } else if (e && e.parameter) {
      postData = e.parameter;
    }

    // [테스트 핑 요청 처리]
    if (postData.action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "연동 테스트 성공! 스프레드시트와 정상 연결되었습니다.",
        sheetName: sheet.getName()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const rec = postData.record || postData || {};
    if (!rec.name && !rec.disease) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "학생 정보 또는 질환명이 전달되지 않았습니다."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1~5행을 검색하여 헤더 행 및 열 매핑 분석
    const headerInfo = detectHeaderRow(sheet);
    const headerRow = headerInfo.row;
    const colMap = headerInfo.map;
    const maxCols = Math.max(sheet.getLastColumn(), 15);

    // 실제 데이터가 비어 있는 첫 행 찾기 (헤더 행 다음부터 성명 열 기준 탐색)
    const checkCol = colMap.name || colMap.disease || 2;
    const targetRow = findFirstEmptyRow(sheet, headerRow, checkCol);

    // 연번 계산: 이전 행 연번 + 1, 또는 (targetRow - headerRow)
    let serialNo = targetRow - headerRow;
    if (colMap.serial && targetRow > headerRow + 1) {
      const prevVal = sheet.getRange(targetRow - 1, colMap.serial).getValue();
      const parsed = parseInt(prevVal, 10);
      if (!isNaN(parsed) && parsed > 0) {
        serialNo = parsed + 1;
      }
    }

    // 학년반 조합 (시트에 '학년반' 단일 열이 있을 때 대비)
    const gradeClassStr = rec.gradeClass || (rec.class ? `${rec.grade} ${rec.class}` : rec.grade);

    // [선생님께서 변경하신 열 순서에 맞추어 정확하게 셀에 기재]
    if (colMap.serial) sheet.getRange(targetRow, colMap.serial).setValue(serialNo);
    if (colMap.disease) sheet.getRange(targetRow, colMap.disease).setValue(sanitize(rec.disease));
    if (colMap.grade) sheet.getRange(targetRow, colMap.grade).setValue(sanitize(rec.grade));
    if (colMap.class) sheet.getRange(targetRow, colMap.class).setValue(sanitize(rec.class));
    if (colMap.gradeClass) sheet.getRange(targetRow, colMap.gradeClass).setValue(sanitize(gradeClassStr));
    if (colMap.number) sheet.getRange(targetRow, colMap.number).setValue(sanitize(rec.number));
    if (colMap.name) sheet.getRange(targetRow, colMap.name).setValue(sanitize(rec.name));
    if (colMap.gender) sheet.getRange(targetRow, colMap.gender).setValue(sanitize(rec.gender));
    if (colMap.symptomDate) sheet.getRange(targetRow, colMap.symptomDate).setValue(sanitize(rec.symptomDate));
    if (colMap.hospitalized) sheet.getRange(targetRow, colMap.hospitalized).setValue(sanitize(rec.treatmentStatus || rec.hospitalized));
    if (colMap.discoveryRoute && rec.discoveryRoute) sheet.getRange(targetRow, colMap.discoveryRoute).setValue(sanitize(rec.discoveryRoute));
    if (colMap.suspensionStatus && rec.suspensionStatus) sheet.getRange(targetRow, colMap.suspensionStatus).setValue(sanitize(rec.suspensionStatus));
    if (colMap.confirmedStatus && rec.confirmedStatus) sheet.getRange(targetRow, colMap.confirmedStatus).setValue(sanitize(rec.confirmedStatus));
    if (colMap.symptoms) sheet.getRange(targetRow, colMap.symptoms).setValue(sanitize(rec.symptoms || "특이사항 없음"));
    if (colMap.suspendPeriod) sheet.getRange(targetRow, colMap.suspendPeriod).setValue(sanitize(rec.suspendPeriod));
    if (colMap.returnDate) sheet.getRange(targetRow, colMap.returnDate).setValue(sanitize(rec.returnDate));
    if (colMap.neisReported) sheet.getRange(targetRow, colMap.neisReported).setValue(sanitize(rec.neisReported || "미보고"));
    if (colMap.reportDate) sheet.getRange(targetRow, colMap.reportDate).setValue(sanitize(rec.reportDate || Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd")));
    if (colMap.note) sheet.getRange(targetRow, colMap.note).setValue(sanitize(rec.remarks || rec.note || (rec.hospitalized === "예" ? "병원입원" : "자가격리")));

    // 시트 세로 가운데 정렬 적용
    sheet.getRange(targetRow, 1, 1, maxCols).setVerticalAlignment("middle");

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: `${targetRow}행에 성공적으로 등록되었습니다. (연번: ${serialNo})`,
      row: targetRow
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 1~5행을 검사하여 실제 헤더 행을 감지하고, 열 순서 매핑 사전을 생성
 */
function detectHeaderRow(sheet) {
  const maxSearchRows = Math.min(Math.max(sheet.getLastRow(), 1), 6);
  const maxCols = Math.max(sheet.getLastColumn(), 25);

  for (let r = 1; r <= maxSearchRows; r++) {
    const rowValues = sheet.getRange(r, 1, 1, maxCols).getValues()[0];
    const rowText = rowValues.map(v => String(v || "").replace(/\s+/g, "").toLowerCase()).join(" ");

    const keywords = ["성명", "이름", "질환", "병명", "학년", "반", "증상", "등교", "연번", "번호"];
    let matchCount = 0;
    keywords.forEach(kw => {
      if (rowText.includes(kw)) matchCount++;
    });

    if (matchCount >= 2) {
      return {
        row: r,
        map: buildColumnMapping(rowValues)
      };
    }
  }

  // 완전 새 시트인 경우 1행에 나이스 표준 15개 열 생성
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    const defaultHeaders = [
      "연번", "질환명", "학년", "반", "번호", "성명", "성별",
      "증상 발생 일자", "입원여부", "주증상", "등교중지 기간", "등교일",
      "감염병 나이스 보고 여부", "보고일", "비고"
    ];
    sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
    sheet.getRange(1, 1, 1, defaultHeaders.length)
      .setFontWeight("bold")
      .setBackground("#16375a")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(1, 35);
    return {
      row: 1,
      map: buildColumnMapping(defaultHeaders)
    };
  }

  // 1행을 기본으로 사용
  const row1Values = sheet.getRange(1, 1, 1, maxCols).getValues()[0];
  return {
    row: 1,
    map: buildColumnMapping(row1Values)
  };
}

/**
 * 헤더 텍스트를 분석하여 사용자가 바꾼 열 순서(몇 번째 열인지)를 자동 파악
 */
function buildColumnMapping(headers) {
  const map = {};
  for (let i = 0; i < headers.length; i++) {
    const raw = String(headers[i] || "").replace(/\s+/g, "").toLowerCase();
    const col = i + 1;
    if (!raw) continue;

    if (raw.includes("연번") || raw === "no" || raw === "no.") {
      map.serial = col;
    } else if (raw.includes("질환") || raw.includes("병명") || raw.includes("감염병명") || raw.includes("상병")) {
      map.disease = col;
    } else if (raw.includes("학년반") || raw.includes("학반")) {
      map.gradeClass = col;
    } else if (raw.includes("학년")) {
      map.grade = col;
    } else if (raw.includes("반") && !raw.includes("학년")) {
      map.class = col;
    } else if (raw.includes("번호") || raw.includes("출석번호") || raw.includes("학생번호")) {
      map.number = col;
    } else if (raw.includes("성명") || raw.includes("이름") || raw.includes("학생명")) {
      map.name = col;
    } else if (raw.includes("성별") || raw === "성") {
      map.gender = col;
    } else if (raw.includes("발생인지") || raw.includes("발생일") || (raw.includes("증상") && (raw.includes("일자") || raw.includes("일")))) {
      map.symptomDate = col;
    } else if (raw.includes("치료") || raw.includes("입원")) {
      map.hospitalized = col;
    } else if (raw.includes("발견") || raw.includes("경위")) {
      map.discoveryRoute = col;
    } else if (raw.includes("확진") || raw.includes("진단")) {
      map.confirmedStatus = col;
    } else if (raw.includes("주증상") || (raw.includes("증상") && !raw.includes("일자") && !raw.includes("일"))) {
      map.symptoms = col;
    } else if (raw.includes("중지여부") || (raw.includes("등교중지") && raw.includes("여부"))) {
      map.suspensionStatus = col;
    } else if (raw.includes("중지") || raw.includes("격리") || (raw.includes("출석인정") && raw.includes("기간"))) {
      map.suspendPeriod = col;
    } else if (raw.includes("완치") || raw.includes("등교일") || raw.includes("등교예정") || raw.includes("등교가능")) {
      map.returnDate = col;
    } else if (raw.includes("나이스") || (raw.includes("보고") && raw.includes("여부"))) {
      map.neisReported = col;
    } else if (raw.includes("보고일") || raw.includes("등록일") || raw.includes("작성일")) {
      map.reportDate = col;
    } else if (raw.includes("참고") || raw.includes("비고") || raw.includes("특이사항")) {
      map.note = col;
    }
  }

  // 매핑 실패 시 나이스 최신 15개 열 기본값 보정
  if (!map.disease && !map.name) {
    map.serial = 1;
    map.disease = 2;
    map.grade = 3;
    map.class = 4;
    map.number = 5;
    map.name = 6;
    map.gender = 7;
    map.symptomDate = 8;
    map.hospitalized = 9;
    map.symptoms = 10;
    map.suspendPeriod = 11;
    map.returnDate = 12;
    map.neisReported = 13;
    map.reportDate = 14;
    map.note = 15;
  }

  return map;
}

/**
 * 헤더 행 아래에서 지정한 열(성명 열 등)이 비어있는 첫 행을 찾음
 */
function findFirstEmptyRow(sheet, headerRow, checkCol) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  if (lastRow <= headerRow) return headerRow + 1;

  const searchCount = Math.max(lastRow - headerRow + 10, 50);
  const values = sheet.getRange(headerRow + 1, checkCol, searchCount, 1).getValues();

  for (let i = 0; i < values.length; i++) {
    const val = values[i][0];
    if (val === "" || val === null || val === undefined) {
      return headerRow + 1 + i;
    }
  }
  return headerRow + 1 + values.length;
}

function sanitize(val) {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();
  if (str.startsWith("=") || str.startsWith("+") || (str.startsWith("-") && isNaN(str))) {
    str = "'" + str;
  }
  return str;
}
