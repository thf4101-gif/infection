# 🏫 초등학교 보건실: 구글 감염병 관리대장 연동 & 배포 가이드 (setup.md)
*나이스(NEIS) 열 순서 자유 변동 완벽 대응 & 연동 오류 원인 해결 가이드*

이 문서는 코딩이 처음이신 초등학교 보건선생님께서 **「등교중지 필요한 질병 찾기」** 웹앱을 **구글 스프레드시트(감염병 관리대장)**와 연결할 때, **나이스 입력 항목 순서로 열을 바꾸셨거나 배포 후 연동이 안 되는 문제**를 100% 해결하실 수 있도록 작성된 종합 안내서입니다.

---

## 1. "연동이 안 돼요!" 가장 중요한 핵심 원인 4가지 분석 및 해결법

선생님께서 Apps Script 배포 후 웹 앱 URL을 등록했는데도 연동이 안 되는 주된 원인은 다음과 같습니다:

| 순위 | 원인 구분 | 증상 | 해결 방법 |
|:---:|:---|:---|:---|
| **1위** | **액세스 권한 설정** | 전송 시 실패 메시지 또는 로그인 요구 | 배포 시 **[액세스 권한이 있는 사용자]**를 반드시 **`모든 사용자(Anyone)`**로 설정해야 합니다. (학교 교육청 계정은 기본값이 '조직 내 사용자'나 '나만'으로 되어 있어 외부 웹앱 전송이 차단됩니다) |
| **2위** | **새 버전 미배포** | 코드 수정 후에도 옛날 방식으로 작동 | `Code.gs`를 수정한 뒤 저장(💾)만 누르면 반영되지 않습니다. 반드시 **[배포] → [배포 관리] → ✏️수정 아이콘 → 버전: [새 버전] 선택 → [배포]**를 눌러야 합니다. |
| **3위** | **브라우저 CORS 차단** | 브라우저가 전송 도중 요청 차단 | 최신 웹앱 코드에 `mode: 'no-cors'` 처리를 적용하여 브라우저의 리디렉션 차단 문제를 해결했습니다. 앱을 새로고침하여 최신 버전으로 이용해주세요. |
| **4위** | **URL 주소 형태 오류** | 404 오류 또는 주소 형식 오류 경고 | 복사한 주소 끝이 반드시 **`/exec`**여야 합니다. 스프레드시트 편집 주소(`.../edit`)나 개발자 테스트 주소(`.../dev`)는 작동하지 않습니다. |

> 💡 **1초 만에 배포 권한 확인하는 꿀팁!**  
> 웹앱 우측 상단 **[구글 시트 연동 설정]** 모달에서 주소를 입력한 뒤 **[🌐 1초 배포 진단]** 버튼을 눌러보세요.  
> 새 창에 `{"status":"ok", ...}`라는 영문이 뜨면 배포 권한이 100% 정상입니다! 만약 구글 로그인 창이 뜬다면 권한이 '모든 사용자'가 아닌 것이므로 1단계의 배포 설정을 다시 확인하세요.

---

## 2. Code.gs 전체 내용 복사하는 3가지 방법

선생님께서 코드를 가장 편하게 복사하실 수 있도록 웹앱에 3가지 편의 기능을 마련했습니다:

### 방법 A: 웹앱 모달에서 [원클릭 복사] (가장 추천 ⭐)
1. 웹앱 상단 우측의 **[📊 구글 시트 연동 설정]** 버튼을 누릅니다.
2. 1단계 상자의 파란색 **[📋 Code.gs 전체 코드 원클릭 복사하기]** 버튼을 클릭합니다.
3. 초록색으로 변하면서 "복사 완료!" 메시지가 뜨면 복사 완료입니다!

### 방법 B: [Code.gs 파일 다운로드] 버튼 사용
1. **[💾 Code.gs 파일 다운로드]** 버튼을 누르면 내 컴퓨터의 '다운로드' 폴더에 `Code.gs` 파일이 저장됩니다.
2. 메모장으로 해당 파일을 열어 **Ctrl + A(전체선택) → Ctrl + C(복사)**를 누르시면 됩니다.

### 방법 C: 모달의 [코드 직접 보기] 상자 클릭
1. **[👁️ 코드 직접 보기 / 전체선택]** 버튼을 누르면 검은색 코드 상자가 펼쳐집니다.
2. 코드 상자 안을 마우스로 한 번 클릭하기만 해도 전체 코드가 블록 지정(선택)되므로 **Ctrl + C**를 눌러 복사하시면 됩니다.

---

## 3. 구글 스프레드시트 & Apps Script 5분 연동 절차

### 1단계: 구글 스프레드시트 열기
1. 선생님께서 사용 중이신 학교 감염병 관리대장 구글 스프레드시트를 엽니다.
2. (나이스 순서로 열을 변경하셨어도 그대로 두시면 됩니다!)

### 2단계: Apps Script 열기
1. 스프레드시트 상단 메뉴에서 **[확장 프로그램]** → **[Apps Script]**를 클릭합니다.

### 3단계: 최신 `Code.gs` 코드 붙여넣기
1. 화면에 있는 기존 코드를 전부 지웁니다. (**Ctrl + A** 누른 뒤 **Delete**)
2. 위에서 복사한 `Code.gs` 전체 코드를 붙여넣습니다. (**Ctrl + V**)
3. 상단 툴바의 **💾 (저장 아이콘)**을 클릭합니다.

### 4단계: 웹 앱(Web App)으로 배포하기 (핵심 ⭐)
1. Apps Script 화면 우측 상단의 파란색 **[배포]** 버튼을 누릅니다.
   - *처음 배포하시는 경우*: **[새 배포]** 클릭
   - *이미 배포했던 경우*: **[배포 관리]** 클릭 → 우측 상단 **✏️(연필 아이콘)** 클릭 → 버전 드롭다운에서 **[새 버전(New Version)]** 반드시 선택!
2. 유형이 **[웹 앱(Web App)]**인지 확인합니다.
3. 아래 설정값을 정확하게 지정합니다:
   - **다음 사용자로 실행**: **`나(선생님 구글 계정)`**
   - **액세스 권한이 있는 사용자**: **`모든 사용자(Anyone)`** *(학교 계정 필수 확인!)*
4. 하단의 **[배포]** 버튼을 클릭합니다.
5. 화면에 나타나는 **[웹 앱 URL]** (끝이 `/exec`인 주소)을 복사합니다.

### 5단계: 웹앱에 배포 URL 등록
1. 웹앱의 **[구글 시트 연동 설정]** 창에 복사한 주소를 붙여넣고 **[저장하기]**를 누릅니다.
2. **[⚡ 연동 테스트 전송]**을 누르면 구글 시트로 신호가 가며 연동이 완료됩니다!

---

## 4. 나이스(NEIS) 열 순서 변경 시 자동 인식 원리

선생님께서 나이스 입력 편의를 위해 시트의 열 순서를 변경하셔도 스크립트가 1행의 제목을 분석하여 정확한 열을 스스로 찾아갑니다:

- **1행 제목 분석 기준 (대소문자/띄어쓰기 무관)**:
  - `연번` / `No` → 연번 열 (자동으로 1, 2, 3... 계산)
  - `질환명` / `병명` / `감염병` → 질환명 (수두, 인플루엔자 등)
  - `학년` → 학년
  - `반` → 반
  - `번호` / `출석번호` → 번호
  - `성명` / `이름` → 학생 성명
  - `성별` → 성별 (남/여)
  - `발생일` / `증상일자` → 증상 발생 일자
  - `입원여부` / `입원` → 입원 여부 (예/아니오)
  - `주증상` / `증상` → 주증상
  - `등교중지 기간` / `중지기간` → 산출된 등교중지 기간
  - `등교일` / `등교예정` → 등교 가능한 날
  - `나이스 보고여부` / `보고` → 나이스 보고 여부
  - `보고일` / `등록일` → 작성 일자
  - `비고` → 비고 (병원입원 또는 자가격리)

※ 만약 1행에 "2026학년도 감염병 관리대장" 같은 큰 제목이 병합되어 있고 2행에 실제 열 이름이 있어도, 스크립트가 2~5행을 검색하여 열 이름을 스스로 찾아냅니다.

---

## 5. 최신 `Code.gs` 전체 소스코드 (참고용)

선생님께서 여기서 직접 복사하실 수 있도록 전체 소스코드를 아래에 제공합니다:

```javascript
/**
 * 초등학교 감염병 관리대장 - Google Apps Script (Code.gs)
 * 나이스(NEIS) 연계 및 열 순서 자유 변동 완벽 자동 매핑
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "초등학교 감염병 관리대장 연동 시스템이 정상 작동 중입니다.",
    account: Session.getActiveUser().getEmail() || "인증됨",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

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

    const headerInfo = detectHeaderRow(sheet);
    const headerRow = headerInfo.row;
    const colMap = headerInfo.map;
    const maxCols = Math.max(sheet.getLastColumn(), 15);

    const checkCol = colMap.name || colMap.disease || 2;
    const targetRow = findFirstEmptyRow(sheet, headerRow, checkCol);

    let serialNo = targetRow - headerRow;
    if (colMap.serial && targetRow > headerRow + 1) {
      const prevVal = sheet.getRange(targetRow - 1, colMap.serial).getValue();
      const parsed = parseInt(prevVal, 10);
      if (!isNaN(parsed) && parsed > 0) {
        serialNo = parsed + 1;
      }
    }

    const gradeClassStr = rec.gradeClass || (rec.class ? (rec.grade + " " + rec.class) : rec.grade);

    if (colMap.serial) sheet.getRange(targetRow, colMap.serial).setValue(serialNo);
    if (colMap.disease) sheet.getRange(targetRow, colMap.disease).setValue(sanitize(rec.disease));
    if (colMap.grade) sheet.getRange(targetRow, colMap.grade).setValue(sanitize(rec.grade));
    if (colMap.class) sheet.getRange(targetRow, colMap.class).setValue(sanitize(rec.class));
    if (colMap.gradeClass) sheet.getRange(targetRow, colMap.gradeClass).setValue(sanitize(gradeClassStr));
    if (colMap.number) sheet.getRange(targetRow, colMap.number).setValue(sanitize(rec.number));
    if (colMap.name) sheet.getRange(targetRow, colMap.name).setValue(sanitize(rec.name));
    if (colMap.gender) sheet.getRange(targetRow, colMap.gender).setValue(sanitize(rec.gender));
    if (colMap.symptomDate) sheet.getRange(targetRow, colMap.symptomDate).setValue(sanitize(rec.symptomDate));
    if (colMap.hospitalized) sheet.getRange(targetRow, colMap.hospitalized).setValue(sanitize(rec.hospitalized));
    if (colMap.symptoms) sheet.getRange(targetRow, colMap.symptoms).setValue(sanitize(rec.symptoms || "특이사항 없음"));
    if (colMap.suspendPeriod) sheet.getRange(targetRow, colMap.suspendPeriod).setValue(sanitize(rec.suspendPeriod));
    if (colMap.returnDate) sheet.getRange(targetRow, colMap.returnDate).setValue(sanitize(rec.returnDate));
    if (colMap.neisReported) sheet.getRange(targetRow, colMap.neisReported).setValue(sanitize(rec.neisReported || "미보고"));
    if (colMap.reportDate) sheet.getRange(targetRow, colMap.reportDate).setValue(sanitize(rec.reportDate || Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd")));
    if (colMap.note) sheet.getRange(targetRow, colMap.note).setValue(sanitize(rec.note || (rec.hospitalized === "예" ? "병원입원" : "자가격리")));

    sheet.getRange(targetRow, 1, 1, maxCols).setVerticalAlignment("middle");

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: targetRow + "행에 성공적으로 등록되었습니다. (연번: " + serialNo + ")",
      row: targetRow
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

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

  const row1Values = sheet.getRange(1, 1, 1, maxCols).getValues()[0];
  return {
    row: 1,
    map: buildColumnMapping(row1Values)
  };
}

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
    } else if (raw.includes("발생") || raw.includes("발견") || raw.includes("발병") || (raw.includes("증상") && (raw.includes("일자") || raw.includes("일")))) {
      map.symptomDate = col;
    } else if (raw.includes("입원")) {
      map.hospitalized = col;
    } else if (raw.includes("주증상") || (raw.includes("증상") && !raw.includes("일자") && !raw.includes("일"))) {
      map.symptoms = col;
    } else if (raw.includes("중지") || raw.includes("격리") || (raw.includes("출석인정") && raw.includes("기간"))) {
      map.suspendPeriod = col;
    } else if (raw.includes("등교일") || raw.includes("등교예정") || raw.includes("등교가능")) {
      map.returnDate = col;
    } else if (raw.includes("나이스") || (raw.includes("보고") && raw.includes("여부"))) {
      map.neisReported = col;
    } else if (raw.includes("보고일") || raw.includes("등록일") || raw.includes("작성일")) {
      map.reportDate = col;
    } else if (raw.includes("비고") || raw.includes("특이사항") || raw.includes("참고")) {
      map.note = col;
    }
  }

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
```
