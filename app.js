/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 등교중지 필요한 질병 찾기 - app.js
 * 초등학교 보건교사를 위한 감염병 등교중지 판정 및 감염병 관리대장 연동 로직
 * 
 * [법적 근거]
 * 1. 『감염병 예방 및 관리에 관한 법률』 제41조 (2025.1.1. 기준 제1급~제4급 법정감염병 전체 수록)
 * 2. 『학교보건법』 제8조(등교중지) 및 동법 시행령 제22조
 * 3. 교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」
 * 4. 교육부 훈령 제477호 「학교생활기록 작성 및 관리지침」 별표 8 (출결상황 관리) 3호 가목
 */

(function () {
  'use strict';

  const COMMON_ATTENDANCE_RULE = '교육부 훈령 제477호 「학교생활기록 작성 및 관리지침」 별표 8 (출결상황 관리) 3호 가목 [출석인정결석]';

  /* ============================================================
     1. 법정 감염병 (2025.1.1. 기준 1~4급 및 세부 병원체 전체 수록)
  ============================================================ */
  const DISEASE_DATABASE = [
    // ------------------------------------------------------------
    // [제4급 감염병] - 급성호흡기감염증 하위 병원체 (초등학교 다빈도 발병)
    // ------------------------------------------------------------
    {
      id: 'adenovirus',
      name: '아데노바이러스 감염증 (Adenovirus)',
      aliases: ['아데노', '아데노바이러스', 'adenovirus', '급성호흡기', '급성호흡기감염증', '인후결막열', '눈곱감기'],
      code: 'B34.0 / J12.0',
      legalGrade: '제4급 법정감염병 (급성호흡기감염증)',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 4,
      periodDesc: '발열(고열), 인후통, 결막염 등 주요 급성 증상이 호전될 때까지 (통상 3~5일간 권고)',
      releaseCondition: '해열제 복용 없이 정상체온을 회복하고 전신 증상 및 결막 충혈이 호전된 후 의사의 등교 가능 소견 시.',
      legalCriteria: '교육부 학생 감염병 예방 매뉴얼 학교장 승인 등교중지 권고 및 출석인정 대상',
      primaryLaw: '「학교보건법」 제8조(등교중지) 및 「감염병예방법」 제4급 표본감시',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 제2편 Ⅱ. 급성호흡기감염증 관리 기준',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「급성호흡기감염증 관리지침」 - 증상 호전 및 해열 시까지 등교·등원 자제 권고',
      documentReq: '진료확인서 또는 의사소견서 (상병명 또는 호흡기 바이러스 검사결과 명시)',
      teacherNotice: '고열(39도 이상)과 인후통, 결막염(눈곱)이 동반되는 경우가 많음. 전염성이 강하므로 학급 내 손씻기 및 비말 차단 지도.',
      neisDuty: '보고대상 (학교별 표본/일일현황)'
    },
    {
      id: 'rsv',
      name: '호흡기세포융합바이러스 감염증 (RSV)',
      aliases: ['rsv', '호흡기세포융합바이러스', '급성호흡기', '급성호흡기감염증', '모세기관지염'],
      code: 'J12.1 / J20.5',
      legalGrade: '제4급 법정감염병 (급성호흡기감염증)',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 5,
      periodDesc: '발열 및 천명음(쌕쌕거림), 심한 기침이 호전될 때까지 (통상 5~7일간 권고)',
      releaseCondition: '발열 소실 및 호흡곤란, 기침 증상이 현저히 완화되어 일상 학습이 가능한 상태.',
      legalCriteria: '교육부 학생 감염병 예방 매뉴얼 등교중지 권고 및 출석인정 대상',
      primaryLaw: '「학교보건법」 제8조 및 「감염병예방법」 제4급 감염병',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 제2편 Ⅱ. 급성호흡기감염증',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「호흡기바이러스 감시 및 관리지침」 - 증상 소실 시까지 격리 권고',
      documentReq: '진료확인서 또는 소견서',
      teacherNotice: '저학년에서 모세기관지염 및 천식양 증상으로 진행 가능. 기침 예절 및 비말 접촉 주의.',
      neisDuty: '보고대상'
    },
    {
      id: 'mycoplasma',
      name: '마이코플라스마 폐렴균 감염증',
      aliases: ['마이코', '마이코플라스마', '마이코플라즈마', 'mycoplasma', '급성호흡기', '급성호흡기감염증', '보행폐렴'],
      code: 'J15.7 / A49.3',
      legalGrade: '제4급 법정감염병 (급성호흡기감염증)',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 5,
      periodDesc: '발열이 내리고 발작적 기침 등 주요 임상 증상이 호전될 때까지 (통상 4~7일)',
      releaseCondition: '적절한 항균제(마크로라이드계 등) 치료 시작 후 해열 및 의사의 등교 가능 소견 시.',
      legalCriteria: '교육부 학생 감염병 관리 지침 학교장 인정 결석(출석인정) 대상',
      primaryLaw: '「학교보건법」 제8조(학교장 재량 등교중지)',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 제2편 Ⅱ. 급성호흡기감염증 지침',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「마이코플라스마 폐렴균 감염증 진료지침」 - 발열 호전 시까지 등교 자제',
      documentReq: '진료확인서 또는 소견서',
      teacherNotice: '3~4년 주기로 초등학교에서 유행 발생. 마크로라이드계 내성 주의 및 충분한 휴식 권고.',
      neisDuty: '보고대상'
    },
    {
      id: 'parainfluenza',
      name: '파라인플루엔자바이러스 감염증',
      aliases: ['파라', '파라인플루엔자', 'parainfluenza', '급성호흡기', '급성호흡기감염증', '크룹', '후두염'],
      code: 'J12.2 / J20.4',
      legalGrade: '제4급 법정감염병 (급성호흡기감염증)',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 4,
      periodDesc: '발열 및 컹컹거리는 쇠소리 기침(크룹 증상)이 호전될 때까지',
      releaseCondition: '체온 정상화 및 호흡기 급성 증상 호전.',
      legalCriteria: '교육부 학생 감염병 관리 지침 출석인정 결석 대상',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 급성호흡기감염증',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침 - 급성기 호흡기 증상 호전 시까지 등교 자제',
      documentReq: '진료확인서 또는 소견서',
      teacherNotice: '목소리가 쉬고 컹컹거리는 기침 시 후두개염 감별 필요.',
      neisDuty: '보고대상'
    },
    {
      id: 'hmpv',
      name: '사람 메타뉴모바이러스 감염증 (hMPV)',
      aliases: ['메타뉴모', 'hmpv', '사람메타뉴모바이러스', '급성호흡기', '급성호흡기감염증'],
      code: 'J12.8 / B34.8',
      legalGrade: '제4급 법정감염병 (급성호흡기감염증)',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 4,
      periodDesc: '발열 및 호흡기 증상(가래, 기침) 호전 시까지',
      releaseCondition: '해열 후 24시간 경과 및 전신 상태 양호.',
      legalCriteria: '교육부 학생 감염병 관리 지침 기준',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 호흡기 감염병 관리지침',
      documentReq: '진료확인서 또는 소견서',
      teacherNotice: '봄철 및 환절기 유행. 비말 전파 차단 손씻기 강조.',
      neisDuty: '보고대상'
    },
    {
      id: 'bocavirus',
      name: '사람 보카바이러스 감염증 (Bocavirus)',
      aliases: ['보카', '보카바이러스', 'bocavirus', '급성호흡기', '급성호흡기감염증'],
      code: 'B34.8 / J12.8',
      legalGrade: '제4급 법정감염병 (급성호흡기감염증)',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 3,
      periodDesc: '주요 호흡기 증상 및 발열 호전 시까지',
      releaseCondition: '정상 체온 회복 및 기침 호전 시.',
      legalCriteria: '교육부 학생 감염병 관리 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 호흡기바이러스 지침',
      documentReq: '진료확인서 또는 소견서',
      teacherNotice: '소아에서 발열, 콧물, 기침 및 위장관 증상 동반 가능.',
      neisDuty: '보고대상'
    },
    {
      id: 'rhinovirus',
      name: '리노바이러스 감염증 (Rhinovirus)',
      aliases: ['리노', '리노바이러스', 'rhinovirus', '급성호흡기', '급성호흡기감염증', '코감기'],
      code: 'J00 / B34.8',
      legalGrade: '제4급 법정감염병 (급성호흡기감염증)',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '법적 등교중지 대상이 아니며 일상 등교 가능 (고열 시 휴식 권고)',
      releaseCondition: '발열이 없고 학습 활동이 가능한 상태.',
      legalCriteria: '단순 감기 바이러스로 원칙적 등교중지 비대상',
      primaryLaw: '「학교보건법」 (등교중지 비대상)',
      manualSource: '교육부 학생 감염병 예방 매뉴얼',
      attendanceRule: '증상 심하여 결석 시 일반 질병결석 처리',
      kdcaGuide: '질병관리청 호흡기 감염 관리지침',
      documentReq: '해당 없음 (결석 시 처방전)',
      teacherNotice: '마스크 착용 및 손위생 권장.',
      neisDuty: '해당없음'
    },

    // ------------------------------------------------------------
    // [제4급 감염병] - 주요 질환 및 장관감염증
    // ------------------------------------------------------------
    {
      id: 'influenza',
      name: '인플루엔자 / 독감 (Influenza)',
      aliases: ['독감', '인플루엔자', 'flu', 'a형독감', 'b형독감', '신종플루'],
      code: 'J09-J11',
      legalGrade: '제4급 법정감염병 (표본감시)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 5,
      periodDesc: '해열제 복용 없이 정상체온 회복 후 24시간이 경과할 때까지 (해열제 투약 시: 마지막 해열제 투약 시점부터 48시간 경과 관찰 후 등교 가능)',
      releaseCondition: '해열제 없이 정상체온 회복 후 24시간 경과 시. (단, 해열제를 투약한 경우에는 마지막 해열제 투약 시점부터 48시간 경과 관찰 후 등교 가능)',
      legalCriteria: '「학교보건법」 제8조 및 질병관리청·교육부 『2026 시설별 인플루엔자 관리 지침』',
      primaryLaw: '「학교보건법」 제8조(등교중지) 및 동법 시행령 제22조',
      manualSource: '질병관리청·교육부 『2026 시설별 인플루엔자 관리 지침(어린이집·유치원·학교용)』 제2장 등교(등원) 중지 기간 적용 안내',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 『2026-2027절기 인플루엔자 관리지침』 - 해열제 없이 정상체온 회복 후 24시간 경과 (해열제 투약 시 48시간 관찰)',
      documentReq: '진료확인서 또는 의사소견서/진단서 (인플루엔자 확진 검사 결과 또는 상병명 명시)',
      teacherNotice: '『2026 시설별 인플루엔자 관리 지침(질병관리청·교육부)』 기준: 해열제 없이 정상체온 회복 후 24시간 경과 시 등교 가능. 단, 해열제를 투약한 경우에는 마지막 해열제 투약 시점부터 48시간 경과 관찰 후 등교 가능함을 학부모에게 필히 안내.',
      neisDuty: '보고대상'
    },
    {
      id: 'hfmd',
      name: '수족구병 (Hand-Foot-and-Mouth Disease)',
      aliases: ['수족구', '수족구병', 'hfmd', '손발입병', '엔테로바이러스'],
      code: 'B08.4',
      legalGrade: '제4급 법정감염병 (표본감시)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 6,
      periodDesc: '열이 내리고 입안 궤양 및 손·발의 수포가 호전되어 전염력이 없어질 때까지 (통상 5~7일간)',
      releaseCondition: '열이 완전히 내리고 입안 수포 및 피부 병변이 회복되어 의사로부터 전염력 소실 확인을 받은 상태.',
      legalCriteria: '교육부 학생 감염병 관리지침 상 학교장 승인 등교중지 권고 및 출석인정 결석 대상',
      primaryLaw: '「학교보건법」 제8조(등교중지) 및 동법 시행령 제22조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 제2편 Ⅱ. 수족구병 등교중지 기준',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「수족구병 관리지침」 - 병변 건조 및 전염력 소실 확인 시까지 격리',
      documentReq: '진료확인서 또는 의사소견서 (등교 가능 소견 기재 권장)',
      teacherNotice: '저학년 및 유치원에서 집단 발병 위험 큼. 배변 후 손씻기 지도 및 식기류·장난감 소독 철저.',
      neisDuty: '보고대상'
    },
    {
      id: 'covid19',
      name: '코로나바이러스감염증-19 (COVID-19)',
      aliases: ['코로나', '코로나19', 'covid', 'covid-19', '코비드', 'sars-cov-2'],
      code: 'U07.1',
      legalGrade: '제4급 법정감염병',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 5,
      periodDesc: '주요 증상(발열 등) 호전 후 24시간 경과 시까지 등교 자제 권고 (통상 5일 권고)',
      releaseCondition: '해열제 없이 열이 내리고 호흡기 증상이 현저히 호전된 후 24시간 경과.',
      legalCriteria: '중앙방역대책본부 및 교육부 일상적 관리 지침 (자율 격리 권고 및 출석인정)',
      primaryLaw: '「학교보건법」 제8조(학교장 재량 등교중지)',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 제2편 Ⅱ. 코로나19 관리 기준',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「코로나19 대응 지침」 - 주요 증상 호전 후 24시간 경과 시까지 격리 권고',
      documentReq: '진료확인서, 소견서, 또는 신속항원검사 양성 결과서',
      teacherNotice: '격리 의무는 해제되었으나 학교 감염 확산 방지를 위해 증상 소실 시까지 등교 자제 및 마스크 착용 지도.',
      neisDuty: '보고대상'
    },
    {
      id: 'norovirus',
      name: '노로바이러스 감염증 (장관감염증)',
      aliases: ['노로', '노로바이러스', 'norovirus', '장관감염증', '겨울장염'],
      code: 'A08.1',
      legalGrade: '제4급 법정감염병 (장관감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 2,
      periodDesc: '구토, 설사 등 모든 임상 증상이 소실된 후 48시간(2일)까지 등교중지',
      releaseCondition: '설사 및 구토가 완전히 멈춘 후 48시간 경과.',
      legalCriteria: '식품위생 및 학교 급식실 감염 예방 지침 준수 (출석인정)',
      primaryLaw: '「학교보건법」 제8조 및 「식품위생법」 관련 집단급식 위생지침',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 수인성·식품매개 감염병 지침',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「노로바이러스 감염증 관리지침」 - 증상 소실 후 48시간 등교 제한',
      documentReq: '진료확인서 또는 처방전/소견서',
      teacherNotice: '증상 소실 후에도 48시간 이상 바이러스 배출. 급식 종사자 및 학생 화장실 락스 희석액(1000ppm) 소독 철저.',
      neisDuty: '보고대상'
    },
    {
      id: 'rotavirus',
      name: '그룹 A형 로타바이러스 감염증 (장관감염증)',
      aliases: ['로타', '로타바이러스', 'rotavirus', '장관감염증', '쌀뜨물설사'],
      code: 'A08.0',
      legalGrade: '제4급 법정감염병 (장관감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 3,
      periodDesc: '설사, 구토, 발열 등 증상이 멈춘 후 24~48시간까지 등교중지',
      releaseCondition: '배변 상태 정상화 및 전신 증상 회복 시.',
      legalCriteria: '교육부 학생 감염병 관리 지침 출석인정 대상',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 장관감염증',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 수인성 감염병 관리지침',
      documentReq: '진료확인서 또는 소견서',
      teacherNotice: '기저귀 교대 및 배변 후 손씻기 지도 철저.',
      neisDuty: '보고대상'
    },
    {
      id: 'salmonella',
      name: '살모넬라균 감염증 (장관감염증)',
      aliases: ['살모넬라', '살모넬라균', 'salmonella', '식중독', '장관감염증'],
      code: 'A02',
      legalGrade: '제4급 법정감염병 (장관감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 3,
      periodDesc: '설사 및 발열 증상이 소실된 후 48시간까지',
      releaseCondition: '설사 증상 소실 및 의사의 진료 확인.',
      legalCriteria: '학교 집단급식 식중독 예방 지침 출석인정 대상',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 수인성·식품매개감염병 지침',
      documentReq: '진료확인서',
      teacherNotice: '계란, 가금류 등 오염 식품 섭취력 조사 및 집단 발생 여부 파악.',
      neisDuty: '보고대상'
    },
    {
      id: 'enterovirus',
      name: '엔테로바이러스 감염증',
      aliases: ['엔테로', '엔테로바이러스', 'enterovirus', '바이러스뇌수막염'],
      code: 'B34.1 / A88.0',
      legalGrade: '제4급 법정감염병 (표본감시)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 5,
      periodDesc: '발열 등 급성 증상이 호전될 때까지',
      releaseCondition: '발열 및 두통 소실, 의사 진단.',
      legalCriteria: '교육부 감염병 관리지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 엔테로바이러스 관리지침',
      documentReq: '진료확인서 또는 소견서',
      teacherNotice: '수족구병 및 무균성 뇌수막염 원인체. 위생 지도.',
      neisDuty: '보고대상'
    },
    {
      id: 'enterobiasis',
      name: '요충증 (Enterobiasis)',
      aliases: ['요충', '요충증', 'enterobius', '항문가려움'],
      code: 'B80',
      legalGrade: '제4급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '구충제(알벤다졸 등) 복용 후 정상 등교 (등교중지 불필요)',
      releaseCondition: '치료약제 1회 복용 후 즉시 등교 가능.',
      legalCriteria: '등교중지 비대상 질환',
      primaryLaw: '「학교보건법」 (등교중지 비대상)',
      manualSource: '교육부 학생 감염병 관리 지침',
      attendanceRule: '해당 없음 (정상 등교)',
      kdcaGuide: '질병관리청 기생충 감염병 관리지침',
      documentReq: '해당 없음',
      teacherNotice: '가족 및 같은 반 유증상자 동시 투약 권고, 속옷 삶아 빨기, 손톱 깎기.',
      neisDuty: '해당없음'
    },

    // ------------------------------------------------------------
    // [제2급 감염병] - 전파가능성을 고려하여 격리가 필요한 법정감염병
    // ------------------------------------------------------------
    {
      id: 'varicella',
      name: '수두 (Varicella)',
      aliases: ['수두', 'varicella', 'chickenpox', '물집', '수포'],
      code: 'B01',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 6,
      periodDesc: '모든 수포(물집)에 딱지(가피)가 앉을 때까지 (보통 발진 시작 후 5~7일간)',
      releaseCondition: '전신의 모든 발진에 딱지가 형성되어 딱지가 떨어지거나 마른 상태. 새로운 물집이 더 이상 생기지 않아야 함.',
      legalCriteria: '「학교보건법」 제8조 및 「감염병예방법」 제41조 강제 격리 조치 대상',
      primaryLaw: '「학교보건법」 제8조(등교중지) 및 「감염병의 예방 및 관리에 관한 법률」 제41조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 제2편 제2장 주요 감염병별 등교중지 기준',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「수두 관리지침」 - 가피 형성 시까지 등교중지',
      documentReq: '의사 소견서 또는 진료확인서 (병명, 전염력이 소실되어 등교가 가능하다는 문구 기재 필수)',
      teacherNotice: '전염력이 매우 강하므로 즉시 귀가 조치. 가피가 완전히 형성될 때까지 등교를 중지시키고 학급 내 추가 수포 환자 모니터링 필요.',
      neisDuty: '보고대상'
    },
    {
      id: 'measles',
      name: '홍역 (Measles)',
      aliases: ['홍역', 'measles', '코플릭반점'],
      code: 'B05',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 4,
      periodDesc: '발진(붉은 반점)이 나타난 후 4일까지 격리 및 등교중지',
      releaseCondition: '발진 발생 후 최소 4일이 지나고 전염력이 소실되었다는 의사의 진단.',
      legalCriteria: '「감염병예방법」 제41조 강제 격리 및 교육부 지침 필수 등교중지 대상',
      primaryLaw: '「감염병의 예방 및 관리에 관한 법률」 제41조(격리) 및 「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 제2편 Ⅱ. 홍역 대응 지침',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「홍역 대응 매뉴얼」 - 발진 발생 후 4일까지 격리',
      documentReq: '의사 소견서 또는 진단서 (전염력 소실 확인)',
      teacherNotice: '공기감염 질환으로 전염성이 극도로 높음. 보건소 및 교육지원청 즉시 유선 보고 필수.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'pertussis',
      name: '백일해 (Pertussis)',
      aliases: ['백일해', 'pertussis', '발작성기침'],
      code: 'A37',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 5,
      periodDesc: '적절한 항생제(마크로라이드계) 복용 시작 후 5일까지 (치료받지 않은 경우 기침 멈출 때까지 최소 3주)',
      releaseCondition: '유효 항생제 5일간 복용 완료 또는 발작성 기침 소실 확인.',
      legalCriteria: '제2급 법정감염병 격리 기준 준수',
      primaryLaw: '「감염병의 예방 및 관리에 관한 법률」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 백일해 대응 지침',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「백일해 관리지침」 - 항생제 투여 후 5일간 등교중지',
      documentReq: '진료확인서 또는 처방내역 포함 의사소견서 (항생제 5일 복용 완료 확인)',
      teacherNotice: '최근 학교 내 유행 빈번. 기침 예절 지도 및 접촉자 예방투약 여부 보건소 협의.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'mumps',
      name: '유행성이하선염 / 볼거리 (Mumps)',
      aliases: ['볼거리', '유행성이하선염', 'mumps', '이하선염', '귀밑샘'],
      code: 'B26',
      legalGrade: '제2급 법정감염병 (2025 개정)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 5,
      periodDesc: '귀밑샘(이하선) 부종(종창) 시작 후 5일까지 등교중지',
      releaseCondition: '이하선 종창 발생 후 5일 경과 및 부종이 가라앉고 통증 완화된 상태.',
      legalCriteria: '법정감염병 관리지침 및 교육부 출석인정 결석 대상',
      primaryLaw: '「감염병의 예방 및 관리에 관한 법률」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 유행성이하선염 관리 기준',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「유행성이하선염 관리지침」 - 종창 시작 후 5일까지 비말 격리',
      documentReq: '진료확인서 또는 의사소견서 (진단명 및 격리기간 명시)',
      teacherNotice: '침샘 부종 전부터 바이러스 배출. 학급 비말 차단 및 식사 시 거리두기 지도.',
      neisDuty: '보고대상'
    },
    {
      id: 'rubella',
      name: '풍진 (Rubella)',
      aliases: ['풍진', 'rubella', '독일홍역'],
      code: 'B06',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 7,
      periodDesc: '발진이 나타난 후 7일까지 등교중지',
      releaseCondition: '발진 발생일로부터 7일이 경과하고 전염력 소실 소견 시.',
      legalCriteria: '법정감염병 관리지침 및 교육부 출석인정 결석 대상',
      primaryLaw: '「감염병의 예방 및 관리에 관한 법률」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 풍진 지침',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「풍진 관리지침」 - 발진 후 7일간 격리',
      documentReq: '진료확인서 또는 의사소견서',
      teacherNotice: '임신 중인 교직원과의 접촉을 엄격히 차단해야 함 (선천성 풍진 증후군 예방).',
      neisDuty: '보고대상'
    },
    {
      id: 'scarlet_fever',
      name: '성홍열 (Scarlet Fever)',
      aliases: ['성홍열', 'scarlet fever', '딸기혀', '사구체신염'],
      code: 'A38',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 1,
      periodDesc: '적절한 항생제 치료 시작 후 24시간이 경과할 때까지',
      releaseCondition: '항생제 투여 후 24시간 경과 및 발열 소실.',
      legalCriteria: '교육부 학생 감염병 예방 관리 지침 기준',
      primaryLaw: '「감염병의 예방 및 관리에 관한 법률」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 성홍열 지침',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「성홍열 관리지침」 - 유효 항생제 투약 개시 후 24시간 격리',
      documentReq: '진료확인서 (항생제 투약 개시 일시 표기 권장)',
      teacherNotice: '항생제 투여 24시간 후 전염력이 소실되나, 류마티스열 합병증 예방을 위해 전 기간 복약 지도.',
      neisDuty: '보고대상'
    },
    {
      id: 'tuberculosis',
      name: '결핵 (활동성 폐결핵, Tuberculosis)',
      aliases: ['결핵', '폐결핵', 'tb', 'tuberculosis', '객혈'],
      code: 'A15',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '항결핵제 복용 후 최소 2주 이상 경과 및 전염성 소실 확인 시까지',
      releaseCondition: '객담 항산균 도말검사 결과 음성 확인 또는 전염력이 없다는 호흡기내과 의사의 진단서 제출.',
      legalCriteria: '「결핵예방법」 제13조에 따른 등교중지 및 격리',
      primaryLaw: '「결핵예방법」 제13조 및 「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 결핵 관리 지침',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「국가결핵관리지침」 - 항결핵제 복용 2주 후 객담검사 음성 확인',
      documentReq: '의사 진단서 또는 소견서 (전염성 소실 명시)',
      teacherNotice: '보건소 역학조사관과 연계하여 같은 반 학생 및 교직원 접촉자 역학조사 진행.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'cholera',
      name: '콜레라 (Cholera)',
      aliases: ['콜레라', 'cholera', '쌀뜨물변'],
      code: 'A00',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 3,
      periodDesc: '증상 소실 후 48시간 경과 뒤 24시간 간격 대변배양검사 2회 연속 음성 시까지',
      releaseCondition: '대변 검사 음성 확인서 제출.',
      legalCriteria: '제2급 법정감염병 격리 기준',
      primaryLaw: '「감염병예방법」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 콜레라 관리지침',
      documentReq: '검사결과서 또는 진단서',
      teacherNotice: '보건소 즉시 신고 질환.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'typhoid',
      name: '장티푸스 (Typhoid Fever)',
      aliases: ['장티푸스', '살모넬라타이피'],
      code: 'A01.0',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 5,
      periodDesc: '항생제 치료 종료 48시간 후 24시간 간격 대변배양검사 3회 연속 음성일 때까지',
      releaseCondition: '대변 배양검사 3회 연속 음성 판정.',
      legalCriteria: '감염병 관리법 격리 기준 준수',
      primaryLaw: '「감염병예방법」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 장티푸스 지침',
      documentReq: '검사결과서 또는 진단서',
      teacherNotice: '음용수 관리 및 위생 점검.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'paratyphoid',
      name: '파라티푸스 (Paratyphoid Fever)',
      aliases: ['파라티푸스', 'paratyphoid', '살모넬라파라타이피'],
      code: 'A01.1-A01.4',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 5,
      periodDesc: '항생제 치료 종료 48시간 후 24시간 간격 대변배양검사 3회 연속 음성일 때까지',
      releaseCondition: '대변 배양검사 3회 연속 음성 판정 확인서 제출 시.',
      legalCriteria: '「감염병예방법」 제41조 제2급 법정감염병 격리 기준 준수',
      primaryLaw: '「감염병의 예방 및 관리에 관한 법률」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 수인성·식품매개 감염병 지침',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 「파라티푸스 관리지침」 - 배양검사 3회 음성 시까지 격리',
      documentReq: '검사결과서 또는 진단서/의사소견서',
      teacherNotice: '제2급 법정감염병으로 보건소 및 교육지원청 즉시 신고 대상. 급식소 및 화장실 소독 철저.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'shigellosis',
      name: '세균성이질 (Shigellosis)',
      aliases: ['세균성이질', '이질', 'shigella', '혈변'],
      code: 'A03',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 3,
      periodDesc: '항생제 치료 종료 48시간 후 24시간 간격 대변배양검사 2회 연속 음성일 때까지',
      releaseCondition: '보건소 또는 의료기관 대변 배양검사 음성 확인서 제출 시.',
      legalCriteria: '제2급 법정감염병 격리해제 기준',
      primaryLaw: '「감염병예방법」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 세균성이질 지침',
      documentReq: '검사결과서 또는 의사소견서',
      teacherNotice: '급식 위생 점검 및 보건소 즉시 신고.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'ehec',
      name: '장출혈성대장균감염증 (EHEC)',
      aliases: ['장출혈성대장균', '햄버거병', 'ehec', 'o157', '용혈성요독증후군'],
      code: 'A04.3',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 3,
      periodDesc: '항생제 투여 종료 48시간 경과 후 24시간 간격 대변검사 2회 연속 음성 시까지',
      releaseCondition: '대변검사 음성 확인서 제출.',
      legalCriteria: '제2급 법정감염병 격리 기준',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 장출혈성대장균감염증 관리지침',
      documentReq: '대변검사 음성 확인서',
      teacherNotice: '소아에서 용혈성요독증후군(HUS) 합병증 위험 주의 깊게 모니터링.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'hepatitis_a',
      name: 'A형간염 (Viral Hepatitis A)',
      aliases: ['a형간염', '간염', '황달', 'hav'],
      code: 'B15',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 7,
      periodDesc: '황달 발생 후 1주일간 (또는 증상 시작 후 1주일간) 등교중지',
      releaseCondition: '황달 증상 발현 후 1주일 경과 및 의사의 등교 가능 소견.',
      legalCriteria: '교육부 학생 감염병 관리 지침 출석인정 결석 대상',
      primaryLaw: '「감염병예방법」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 A형간염 관리지침',
      documentReq: '진료확인서 또는 의사소견서',
      teacherNotice: '분변-경구 경로 전파. 손씻기 및 조개류 익혀 먹기 안내.',
      neisDuty: '보고대상'
    },
    {
      id: 'meningococcal',
      name: '수막구균 감염증 (Meningococcal Disease)',
      aliases: ['수막구균', '뇌수막염', '세균성뇌수막염', '수막염'],
      code: 'A39',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 1,
      periodDesc: '적절한 항생제 치료 개시 후 24시간까지 격리',
      releaseCondition: '항생제 치료 개시 후 24시간 경과 및 증상 호전.',
      legalCriteria: '법정감염병 관리법 준수',
      primaryLaw: '「감염병예방법」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 수막구균 관리지침',
      documentReq: '의사 소견서 또는 진단서',
      teacherNotice: '치명률이 높음. 밀접접촉자 예방적 항생제 투약 신속 협의.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'mpox',
      name: '엠폭스 (Mpox)',
      aliases: ['엠폭스', '원숭이두창', 'mpox'],
      code: 'B04',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '모든 피부 병변의 가피가 탈락하고 새로운 피부가 재생될 때까지',
      releaseCondition: '전신 피부 병변 딱지 완전 탈락 및 의사 확인.',
      legalCriteria: '법정감염병 격리 기준 준수',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 엠폭스 관리지침',
      documentReq: '의사 소견서 또는 진단서',
      teacherNotice: '밀접 피부 접촉 차단.',
      neisDuty: '보고대상 (즉시보고)'
    },

    // ------------------------------------------------------------
    // [제1급 법정감염병 (17종 전체)] - 음압격리 및 즉시 신고/등교중지
    // ------------------------------------------------------------
    {
      id: 'diphtheria',
      name: '디프테리아 (Diphtheria)',
      aliases: ['디프테리아', 'diphtheria', '위막'],
      code: 'A36',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '항생제 치료 완료 24시간 후 24시간 간격 호흡기 분비물 배양 2회 연속 음성 시까지',
      releaseCondition: '배양검사 2회 연속 음성 및 전염력 소실 의사 진단서 제출.',
      legalCriteria: '「감염병예방법」 제41조 제1급 법정감염병 격리 조치 대상',
      primaryLaw: '「감염병의 예방 및 관리에 관한 법률」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 디프테리아 관리지침',
      documentReq: '의사 진단서 및 배양검사 음성 결과서',
      teacherNotice: '제1급 감염병으로 즉시 유선 보고 및 접촉자 예방접종·예방투약 실시.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'mers',
      name: '중동호흡기증후군 (MERS)',
      aliases: ['메르스', 'mers', '중동호흡기증후군', '메르스코로나'],
      code: 'U04.9',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '임상 증상 소실 후 24시간 간격 호흡기 검체 PCR 검사 2회 연속 음성 시까지',
      releaseCondition: '국가지정 입원치료병상 격리해제 기준 충족 및 PCR 2회 음성 확인.',
      legalCriteria: '「감염병예방법」 제41조 강제 격리 입원 치료 대상',
      primaryLaw: '「감염병의 예방 및 관리에 관한 법률」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 MERS 대응 지침',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 MERS 대응 지침',
      documentReq: '의사 진단서 및 격리해제 통지서',
      teacherNotice: '교육지원청 및 보건소 즉시 보고, 학급 밀접접촉자 파악 및 능동감시.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'sars',
      name: '중증급성호흡기증후군 (SARS)',
      aliases: ['사스', 'sars', '중증급성호흡기증후군'],
      code: 'U04.9',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '해열 및 호흡기 증상 완전 소실 후 의료진 격리해제 판정 시까지',
      releaseCondition: '국가지정 격리병상 퇴원 및 의사의 전염력 소실 진단서 제출.',
      legalCriteria: '「감염병예방법」 제41조 제1급 법정감염병',
      primaryLaw: '「감염병예방법」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부 학생 감염병 예방 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 SARS 관리지침',
      documentReq: '의사 진단서',
      teacherNotice: '제1급 감염병으로 음압격리 대상 및 즉시 보고 필수.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'avian_influenza',
      name: '동물인플루엔자 인체감염증 (조류독감 인체감염)',
      aliases: ['조류독감', '동물인플루엔자', 'ai인체감염', 'h5n1', 'h7n9'],
      code: 'J09',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 10,
      periodDesc: '증상 소실 후 24시간 간격 PCR 검사 2회 음성 확인 시까지',
      releaseCondition: '임상 증상 호전 및 바이러스 검사 음성 판정.',
      legalCriteria: '제1급 법정감염병 격리 기준 준수',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 AI 인체감염증 관리지침',
      documentReq: '의사 진단서',
      teacherNotice: '가금류 접촉력 파악 및 즉시 격리/보고.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'novel_influenza',
      name: '신종인플루엔자 (Novel Influenza)',
      aliases: ['신종인플루엔자', '신종플루', 'novel flu'],
      code: 'J09',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 7,
      periodDesc: '해열 후 24시간 경과 및 항바이러스제 치료 완료 시까지',
      releaseCondition: '체온 정상화 및 의사의 등교 가능 소견.',
      legalCriteria: '제1급 법정감염병 긴급 관리 지침',
      primaryLaw: '「감염병예방법」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부 학생 감염병 예방 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 신종인플루엔자 관리지침',
      documentReq: '진료확인서 또는 소견서',
      teacherNotice: '대유행 대비 학급 위생 및 모니터링 강화.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'ebola',
      name: '에볼라바이러스병 (Ebola Virus Disease)',
      aliases: ['에볼라', 'ebola', '에볼라출혈열'],
      code: 'A98.4',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 21,
      periodDesc: '임상 증상 소실 및 PCR 검사 음성 확인 후 격리해제 시까지',
      releaseCondition: '국가지정 입원치료병상 퇴원 기준 충족 확인서.',
      legalCriteria: '제1급 법정감염병 즉시 격리 대상',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 바이러스성 출혈열 관리지침',
      documentReq: '의사 진단서',
      teacherNotice: '치명률이 극도로 높으므로 즉시 신고 및 방역 조치.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'marburg',
      name: '마버그열 (Marburg Hemorrhagic Fever)',
      aliases: ['마버그', '마버그열', 'marburg'],
      code: 'A98.3',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 21,
      periodDesc: '임상 증상 호전 및 바이러스 음성 확인 시까지',
      releaseCondition: '의료진 격리해제 통지서 및 진단서 제출.',
      legalCriteria: '제1급 법정감염병 격리 기준',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 출혈열 관리지침',
      documentReq: '의사 진단서',
      teacherNotice: '즉시 유선 보고.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'lassa',
      name: '라싸열 (Lassa Fever)',
      aliases: ['라싸열', '라싸', 'lassa'],
      code: 'A96.2',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 21,
      periodDesc: '급성 증상 소실 및 의사의 완치 판정 시까지',
      releaseCondition: '의사 진단서 제출.',
      legalCriteria: '제1급 법정감염병 격리 대상',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 출혈열 관리지침',
      documentReq: '의사 진단서',
      teacherNotice: '보건소 즉시 신고.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'cchf',
      name: '크리미안콩고출혈열 (Crimean-Congo Hemorrhagic Fever)',
      aliases: ['크리미안콩고', 'cchf', '크리미안콩고출혈열'],
      code: 'A98.0',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '증상 호전 및 혈액 바이러스 소실 시까지',
      releaseCondition: '전문의 진단서 제출.',
      legalCriteria: '제1급 법정감염병',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '의사 진단서',
      teacherNotice: '즉시 보고 대상.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'saf',
      name: '남아메리카출혈열 (South American Hemorrhagic Fever)',
      aliases: ['남아메리카출혈열', '아르헨티나출혈열', '볼리비아출혈열'],
      code: 'A96.0',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 21,
      periodDesc: '격리해제 판정 시까지',
      releaseCondition: '의사 진단서 제출.',
      legalCriteria: '제1급 법정감염병',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '의사 진단서',
      teacherNotice: '즉시 보고.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'rvf',
      name: '리프트밸리열 (Rift Valley Fever)',
      aliases: ['리프트밸리열', 'rvf'],
      code: 'A92.4',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '완치 시까지',
      releaseCondition: '의사 진단서 제출.',
      legalCriteria: '제1급 법정감염병',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '의사 진단서',
      teacherNotice: '즉시 보고.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'smallpox',
      name: '두창 (Smallpox)',
      aliases: ['두창', '천연두', 'smallpox'],
      code: 'B03',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 21,
      periodDesc: '모든 가피가 완전히 탈락할 때까지 격리',
      releaseCondition: '전신 가피 탈락 및 의사 진단서.',
      legalCriteria: '제1급 법정감염병 즉시 격리',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 두창 지침',
      documentReq: '의사 진단서',
      teacherNotice: '즉시 국가 방역망 가동 보고.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'plague',
      name: '페스트 (Plague)',
      aliases: ['페스트', '흑사병', 'plague'],
      code: 'A20',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 10,
      periodDesc: '유효 항생제 투여 후 가래 또는 병변 검사 음성 시까지',
      releaseCondition: '항생제 투약 완료 및 균 음성 확인 진단서.',
      legalCriteria: '제1급 법정감염병 격리',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 페스트 지침',
      documentReq: '의사 진단서',
      teacherNotice: '즉시 보고.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'anthrax',
      name: '탄저 (Anthrax)',
      aliases: ['탄저', 'anthrax', '탄저균'],
      code: 'A22',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '임상 증상 호전 및 치료 완료 시까지',
      releaseCondition: '의사 진단서 제출.',
      legalCriteria: '제1급 법정감염병',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 탄저 지침',
      documentReq: '의사 진단서',
      teacherNotice: '즉시 보고.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'botulism',
      name: '보툴리눔독소증 (Botulism)',
      aliases: ['보툴리눔', '보툴리눔독소증', 'botulism'],
      code: 'A05.1',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '신경학적 증상 호전 및 일상 학습 가능 시까지',
      releaseCondition: '의사 진단서 제출.',
      legalCriteria: '제1급 법정감염병',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 보툴리눔 지침',
      documentReq: '의사 진단서',
      teacherNotice: '즉시 보고.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'tularemia',
      name: '야토병 (Tularemia)',
      aliases: ['야토병', 'tularemia'],
      code: 'A21',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '항생제 치료 완료 및 증상 소실 시까지',
      releaseCondition: '의사 진단서 제출.',
      legalCriteria: '제1급 법정감염병',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 야토병 지침',
      documentReq: '의사 진단서',
      teacherNotice: '즉시 보고.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'emerging_infection',
      name: '신종감염병증후군 (Emerging Infectious Syndrome)',
      aliases: ['신종감염병증후군', '신종감염병', 'emerging disease'],
      code: 'U07.9',
      legalGrade: '제1급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '질병관리청 및 방역당국 역학조사관 지침에 따른 격리해제 시까지',
      releaseCondition: '보건당국 격리해제 통지서 및 진단서 제출.',
      legalCriteria: '제1급 법정감염병 긴급 방역 조치 대상',
      primaryLaw: '「감염병예방법」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부 감염병 위기대응 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 신종감염병 대응 매뉴얼',
      documentReq: '의사 진단서 또는 격리해제서',
      teacherNotice: '학교 및 교육지원청 위기대응팀 가동 및 즉시 상황 보고.',
      neisDuty: '보고대상 (즉시보고)'
    },

    // ------------------------------------------------------------
    // [제2급 법정감염병 추가]
    // ------------------------------------------------------------
    {
      id: 'polio',
      name: '폴리오 (소아마비, Poliomyelitis)',
      aliases: ['폴리오', '소아마비', 'polio'],
      code: 'A80',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '분변에서 바이러스 불검출 확인 시까지 (통상 2~4주 격리)',
      releaseCondition: '바이러스 검사 음성 확인 및 의사 소견서 제출.',
      legalCriteria: '제2급 법정감염병 격리 기준',
      primaryLaw: '「감염병예방법」 제41조 및 「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 폴리오 관리지침',
      documentReq: '의사 소견서 또는 진단서',
      teacherNotice: '즉시 유선 보고 대상.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'hib',
      name: 'b형헤모필루스인플루엔자 (Hib)',
      aliases: ['b형헤모필루스', 'hib', '헤모필루스'],
      code: 'A41.3 / G00.0',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 2,
      periodDesc: '적절한 항생제 치료 개시 후 24~48시간까지',
      releaseCondition: '항생제 치료 후 증상 호전 및 의사 소견.',
      legalCriteria: '제2급 법정감염병 기준',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 Hib 관리지침',
      documentReq: '진료확인서 또는 소견서',
      teacherNotice: '소아 뇌수막염/후두개염 유발 가능. 주의 관찰.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'pneumococcal',
      name: '폐렴구균 감염증 (Pneumococcal Disease)',
      aliases: ['폐렴구균', '폐렴사상균', 'streptococcus pneumoniae'],
      code: 'A40.3 / J13',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 2,
      periodDesc: '항생제 치료 개시 후 24시간 경과 및 발열 호전 시까지',
      releaseCondition: '해열 및 호흡기 증상 호전, 의사 소견.',
      legalCriteria: '제2급 법정감염병 기준',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 폐렴구균 관리지침',
      documentReq: '진료확인서',
      teacherNotice: '침습성 폐렴구균 감염 주의.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'leprosy',
      name: '한센병 (Leprosy)',
      aliases: ['한센병', '나병', 'leprosy'],
      code: 'A30',
      legalGrade: '제2급 법정감염병',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 7,
      periodDesc: '다제요법 치료 시작 후 전염력 소실 소견 시까지',
      releaseCondition: '전문의 소견서 제출 시 즉시 등교 가능.',
      legalCriteria: '제2급 법정감염병',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 한센병 지침',
      documentReq: '진료확인서 또는 의사소견서',
      teacherNotice: '치료 시작 즉시 전염력 소실되므로 편견 없는 지도 배려.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'vrsa',
      name: '반코마이신내성황색포도알균(VRSA) 감염증',
      aliases: ['vrsa', '반코마이신내성황색포도알균'],
      code: 'U82.0',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 7,
      periodDesc: '임상 증상 호전 및 의사의 격리해제 진단 시까지',
      releaseCondition: '의사 소견서 또는 진단서.',
      legalCriteria: '제2급 법정감염병 기준',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 다제내성균 지침',
      documentReq: '의사 소견서',
      teacherNotice: '철저한 접촉 격리 및 손위생.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'cre',
      name: '카바페넴내성장내세균목(CRE) 감염증',
      aliases: ['cre', 'cpe', '카바페넴내성'],
      code: 'U83.0',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 7,
      periodDesc: '감염 증상 치료 완료 및 의사의 등교 가능 소견 시까지',
      releaseCondition: '의사 진단서 제출.',
      legalCriteria: '제2급 법정감염병 격리 기준',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 CRE 감염증 관리지침',
      documentReq: '의사 소견서',
      teacherNotice: '의료기관 내 전파 주의 질환.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'hepatitis_e',
      name: 'E형간염 (Hepatitis E)',
      aliases: ['e형간염', '간염e', 'hev'],
      code: 'B17.2',
      legalGrade: '제2급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 7,
      periodDesc: '황달 발현 후 1주일 또는 증상 호전 시까지',
      releaseCondition: '의사의 등교 가능 소견서 제출.',
      legalCriteria: '제2급 법정감염병',
      primaryLaw: '「감염병예방법」 제41조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 E형간염 관리지침',
      documentReq: '진료확인서 또는 소견서',
      teacherNotice: '분변-경구 경로 감염 예방 손씻기.',
      neisDuty: '보고대상 (24시간 이내)'
    },

    // ------------------------------------------------------------
    // [제3급 법정감염병 (26종)]
    // ------------------------------------------------------------
    {
      id: 'tetanus',
      name: '파상풍 (Tetanus)',
      aliases: ['파상풍', 'tetanus', '개구장애'],
      code: 'A35',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '사람 간 전파되지 않으므로 등교중지 불필요 (입원 치료 시 질병결석 처리)',
      releaseCondition: '임상 증상 호전 및 일상 학습 가능 시.',
      legalCriteria: '사람 간 전파 없음 (등교중지 비대상)',
      primaryLaw: '「학교보건법」 (등교중지 비대상)',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '치료 결석 시 일반 질병결석 처리',
      kdcaGuide: '질병관리청 파상풍 관리지침',
      documentReq: '진료확인서 (결석 시)',
      teacherNotice: '상처 소독 및 예방접종 권고.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'hepatitis_b',
      name: 'B형간염 (Hepatitis B)',
      aliases: ['b형간염', 'hbv', '간염b'],
      code: 'B16',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '혈액 및 체액 매개 감염으로 일상 학교생활을 통한 전파 위험 없어 등교중지 불필요',
      releaseCondition: '급성기 호전 후 일상 등교.',
      legalCriteria: '등교중지 비대상 (출석 인정 불필요)',
      primaryLaw: '「학교보건법」 (등교중지 비대상)',
      manualSource: '교육부 학생 감염병 관리 매뉴얼',
      attendanceRule: '급성기 입원 결석 시 질병결석 처리',
      kdcaGuide: '질병관리청 B형간염 관리지침',
      documentReq: '해당 없음',
      teacherNotice: '상처 혈액 노출 주의, 식사나 신체 접촉으로 전염되지 않으므로 차별 금지.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'japanese_encephalitis',
      name: '일본뇌염 (Japanese Encephalitis)',
      aliases: ['일본뇌염', '뇌염', '작은빨간집모기'],
      code: 'A83.0',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '모기 매개 질환으로 사람 간 전파 없어 등교중지 비대상 (치료 후 회복 시 등교)',
      releaseCondition: '신경학적 회복 및 의사의 학습 가능 소견.',
      legalCriteria: '사람 간 전염력 없음',
      primaryLaw: '「학교보건법」 (등교중지 비대상)',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '입원 치료 기간 질병결석 처리',
      kdcaGuide: '질병관리청 일본뇌염 관리지침',
      documentReq: '진단서 또는 소견서',
      teacherNotice: '모기 기피제 사용 및 예방접종 완료 여부 확인.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'hepatitis_c',
      name: 'C형간염 (Hepatitis C)',
      aliases: ['c형간염', 'hcv', '간염c'],
      code: 'B18.2',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '혈액 매개 감염으로 일상 학교생활 등교 가능 (등교중지 불필요)',
      releaseCondition: '일상 등교 가능.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '해당 없음',
      kdcaGuide: '질병관리청 C형간염 관리지침',
      documentReq: '해당 없음',
      teacherNotice: '상처 출혈 시 처치 철저.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'malaria',
      name: '말라리아 (Malaria)',
      aliases: ['말라리아', '학질', '얼룩날개모기'],
      code: 'B50-B54',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '모기 매개 질환으로 사람 간 직접 전파 없음 (해열 및 컨디션 회복 후 등교)',
      releaseCondition: '발열 호전 및 의사의 등교 가능 소견.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '결석 시 일반 질병결석 처리',
      kdcaGuide: '질병관리청 말라리아 관리지침',
      documentReq: '진료확인서',
      teacherNotice: '모기 기피제 사용 및 환기창 방충망 점검.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'legionella',
      name: '레지오넬라증 (Legionellosis)',
      aliases: ['레지오넬라', '레지오넬라증', '냉방병'],
      code: 'A48.1',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '냉각탑수 흡입 매개로 사람 간 전파 없음 (증상 회복 후 등교)',
      releaseCondition: '체온 정상화 및 호흡기 증상 호전.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 레지오넬라증 관리지침',
      documentReq: '진료확인서',
      teacherNotice: '학교 냉난방 수처리 및 청소 점검.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'vibrio_vulnificus',
      name: '비브리오패혈증 (Vibrio vulnificus Sepsis)',
      aliases: ['비브리오패혈증', '비브리오', '어패류패혈증'],
      code: 'A54.4',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '어패류 섭취 또는 상처 바닷물 접촉 매개로 사람 간 전파 없음',
      releaseCondition: '의사의 완치 판정 시.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 비브리오패혈증 관리지침',
      documentReq: '진단서',
      teacherNotice: '해산물 익혀 먹기 및 피부 상처 시 바닷물 접촉 금지 안내.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'tsutsugamushi',
      name: '쯔쯔가무시증 (Scrub Typhus)',
      aliases: ['쯔쯔가무시', '털진드기', '가피'],
      code: 'A75.3',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '털진드기 유충 매개로 사람 간 전파 없음 (항생제 치료 및 해열 후 등교)',
      releaseCondition: '해열 및 전신 증상 회복 시.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 쯔쯔가무시증 관리지침',
      documentReq: '진료확인서',
      teacherNotice: '가을철 야외학습 시 긴옷 착용 및 돗자리 사용 지도.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'leptospirosis',
      name: '렙토스피라증 (Leptospirosis)',
      aliases: ['렙토스피라', 'leptospira'],
      code: 'A27',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '동물 소변 오염 매개로 사람 간 전파 없음 (치료 후 회복 시 등교)',
      releaseCondition: '체온 정상화 및 의사 소견.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '수해 지역 오염된 물 접촉 피하기.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'brucellosis',
      name: '브루셀라증 (Brucellosis)',
      aliases: ['브루셀라', 'brucella'],
      code: 'A23',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '살균 안 된 유제품 섭취 등 매개, 사람 간 전파 극히 희박',
      releaseCondition: '치료 후 증상 호전.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '유제품 섭취 주의.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'rabies',
      name: '공수병 / 광견병 (Rabies)',
      aliases: ['공수병', '광견병', 'rabies'],
      code: 'A82',
      legalGrade: '제3급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 14,
      periodDesc: '전문 의료기관 입원 치료 및 완치 시까지',
      releaseCondition: '의사 진단서 제출.',
      legalCriteria: '제3급 법정감염병',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 공수병 관리지침',
      documentReq: '의사 진단서',
      teacherNotice: '야생동물에 물렸을 경우 즉시 상처 세척 및 백신 접종.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'hfrs',
      name: '신증후군출혈열 (Hemorrhagic Fever with Renal Syndrome)',
      aliases: ['신증후군출혈열', '유행성출혈열', '한타바이러스'],
      code: 'A98.5',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '설치류 배설물 매개로 사람 간 전파 없음 (치료 후 회복 시 등교)',
      releaseCondition: '신기능 정상화 및 의사 소견.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 신증후군출혈열 관리지침',
      documentReq: '진료확인서',
      teacherNotice: '야외활동 시 풀밭에 눕지 않기.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'cjd',
      name: '크로이츠펠트-야콥병 (CJD)',
      aliases: ['cjd', '크로이츠펠트야콥병', '프리온'],
      code: 'A81.0',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '일상 접촉으로 전파되지 않음',
      releaseCondition: '해당 없음.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '해당 없음',
      kdcaGuide: '질병관리청 CJD 지침',
      documentReq: '해당 없음',
      teacherNotice: '특이 접촉 없음.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'yellow_fever',
      name: '황열 (Yellow Fever)',
      aliases: ['황열', 'yellow fever'],
      code: 'A95',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '모기 매개 질환으로 사람 간 전파 없음',
      releaseCondition: '의사의 완치 판정.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '해외 유입 모니터링.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'dengue',
      name: '뎅기열 (Dengue Fever)',
      aliases: ['뎅기열', 'dengue'],
      code: 'A90',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '모기 매개 질환으로 사람 간 전파 없음 (해열 후 등교)',
      releaseCondition: '체온 정상화 및 전신 상태 호전.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 뎅기열 관리지침',
      documentReq: '진료확인서',
      teacherNotice: '해외 여행력 확인 및 모기 기피.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'q_fever',
      name: '큐열 (Q Fever)',
      aliases: ['큐열', 'q fever'],
      code: 'A78',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '가축 접촉 매개로 사람 간 전파 극히 희박',
      releaseCondition: '증상 호전.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 큐열 지침',
      documentReq: '진료확인서',
      teacherNotice: '주의 관찰.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'west_nile',
      name: '웨스트나일열 (West Nile Fever)',
      aliases: ['웨스트나일', 'west nile'],
      code: 'A92.3',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '모기 매개로 사람 간 전파 없음',
      releaseCondition: '회복 시 등교.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '모기 방제.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'lyme',
      name: '라임병 (Lyme Disease)',
      aliases: ['라임병', 'lyme', '유주성홍반'],
      code: 'A69.2',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '진드기 매개로 사람 간 전파 없음 (항생제 치료 중 정상 등교 가능)',
      releaseCondition: '일상 등교 가능.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '정상 등교',
      kdcaGuide: '질병관리청 라임병 지침',
      documentReq: '해당 없음',
      teacherNotice: '야외활동 시 진드기 물림 주의.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'tick_borne_encephalitis',
      name: '진드기매개뇌염 (Tick-borne Encephalitis)',
      aliases: ['진드기매개뇌염', 'tbe'],
      code: 'A84',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '진드기 매개로 사람 간 전파 없음',
      releaseCondition: '회복 후 등교.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 지침',
      documentReq: '진단서',
      teacherNotice: '진드기 기피제 사용.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'melioidosis',
      name: '유비저 (Melioidosis)',
      aliases: ['유비저', 'melioidosis'],
      code: 'A24.1',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '오염된 토양/물 매개로 사람 간 전파 극히 희박',
      releaseCondition: '치료 후 증상 호전.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 유비저 지침',
      documentReq: '진료확인서',
      teacherNotice: '피부 상처 관리.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'chikungunya',
      name: '치쿤구니야열 (Chikungunya Fever)',
      aliases: ['치쿤구니야', '치쿤구니야열'],
      code: 'A92.0',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '모기 매개로 사람 간 전파 없음 (통증 완화 후 등교)',
      releaseCondition: '발열 및 관절통 호전.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '모기 회피.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'sfts',
      name: '중증열성혈소판감소증후군 (SFTS)',
      aliases: ['sfts', '중증열성혈소판감소증후군', '살인진드기', '소참진드기'],
      code: 'A93.8',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '진드기 매개로 사람 간 일상 전파 없음 (단, 중증 치료 후 회복 시 등교)',
      releaseCondition: '혈액 수치 정상화 및 전문의 등교 가능 소견.',
      legalCriteria: '등교중지 비대상 (체액 직접 접촉 주의)',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '입원 기간 질병결석 처리',
      kdcaGuide: '질병관리청 SFTS 관리지침',
      documentReq: '진단서 또는 소견서',
      teacherNotice: '치명률이 높으므로 혈액/체액 접촉 주의 및 야외 진드기 예방 수칙 준수.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'zika',
      name: '지카바이러스감염증 (Zika Virus Infection)',
      aliases: ['지카', '지카바이러스', 'zika'],
      code: 'A92.5',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '모기 매개 질환으로 일상 학교생활을 통한 전파 없음',
      releaseCondition: '증상 호전 시 등교.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 지카바이러스 지침',
      documentReq: '진료확인서',
      teacherNotice: '모기 기피제 사용.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'epidemic_typhus',
      name: '발진티푸스 (Epidemic Typhus)',
      aliases: ['발진티푸스', '몸이'],
      code: 'A75.0',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '몸이 매개로 사람 간 직접 전파 없음 (치료 후 등교)',
      releaseCondition: '치료 완료 및 의사 소견.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '개인 위생 지도.',
      neisDuty: '보고대상 (24시간 이내)'
    },
    {
      id: 'murine_typhus',
      name: '발진열 (Murine Typhus)',
      aliases: ['발진열', '벼룩'],
      code: 'A75.2',
      legalGrade: '제3급 법정감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '쥐벼룩 매개로 사람 간 전파 없음',
      releaseCondition: '치료 완료.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '환경 위생 점검.',
      neisDuty: '보고대상 (24시간 이내)'
    },

    // ------------------------------------------------------------
    // [제4급 법정감염병 추가 (표본감시 질환)]
    // ------------------------------------------------------------
    {
      id: 'chlamydia_pneumoniae',
      name: '클라미디아 폐렴균 감염증',
      aliases: ['클라미디아', '클라미디아폐렴', 'chlamydia pneumoniae'],
      code: 'J16.0 / A49.8',
      legalGrade: '제4급 법정감염병 (급성호흡기감염증)',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 5,
      periodDesc: '발열 호전 및 기침 증상이 가라앉을 때까지',
      releaseCondition: '항생제 치료 및 증상 호전 의사 소견 시.',
      legalCriteria: '교육부 급성호흡기감염증 지침 출석인정 결석 대상',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 학생 감염병 관리 지침',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 호흡기 감염병 관리지침',
      documentReq: '진료확인서',
      teacherNotice: '장기 기침 시 마스크 착용 지도.',
      neisDuty: '보고대상'
    },
    {
      id: 'human_coronavirus',
      name: '사람 코로나바이러스 감염증 (일반 코로나)',
      aliases: ['사람코로나', '일반코로나', 'human coronavirus'],
      code: 'B34.2',
      legalGrade: '제4급 법정감염병 (급성호흡기감염증)',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '일반 감기 원인 바이러스로 등교중지 대상 아님 (고열 시 휴식)',
      releaseCondition: '정상 체온 회복 시.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '질병결석 처리',
      kdcaGuide: '질병관리청 지침',
      documentReq: '해당 없음',
      teacherNotice: 'COVID-19와 다른 단순 감기 바이러스임.',
      neisDuty: '보고대상'
    },
    {
      id: 'campylobacter',
      name: '캄필로박터균 감염증 (장관감염증)',
      aliases: ['캄필로박터', 'campylobacter', '닭고기식중독'],
      code: 'A04.5',
      legalGrade: '제4급 법정감염병 (장관감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 3,
      periodDesc: '설사 및 복통 등 급성 증상 소실 후 48시간까지',
      releaseCondition: '배변 정상화 및 의사 소견.',
      legalCriteria: '학교 급식 및 수인성 감염병 예방 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 수인성·식품매개 감염병 지침',
      documentReq: '진료확인서',
      teacherNotice: '생닭 세척 시 교차오염 주의 안내.',
      neisDuty: '보고대상'
    },
    {
      id: 'vibrio_parahaemolyticus',
      name: '장염비브리오균 감염증 (장관감염증)',
      aliases: ['장염비브리오', 'vibrio parahaemolyticus'],
      code: 'A04.8',
      legalGrade: '제4급 법정감염병 (장관감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 2,
      periodDesc: '설사 및 구토 증상 소실 후 48시간까지',
      releaseCondition: '증상 소실 확인.',
      legalCriteria: '식중독 예방 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '해산물 섭취력 확인.',
      neisDuty: '보고대상'
    },
    {
      id: 'clostridium_perfringens',
      name: '클로스트리듐 퍼프린젠스 감염증 (장관감염증)',
      aliases: ['퍼프린젠스', '클로스트리듐'],
      code: 'A04.8',
      legalGrade: '제4급 법정감염병 (장관감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 2,
      periodDesc: '설사 및 복통 소실 후 24~48시간까지',
      releaseCondition: '증상 호전.',
      legalCriteria: '식중독 관리 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '집단 급식 배식 후 관리 점검.',
      neisDuty: '보고대상'
    },
    {
      id: 'staphylococcus_aureus_enteritis',
      name: '황색포도알균 감염증 (장관감염증)',
      aliases: ['황색포도알균', '포도상구균장염'],
      code: 'A04.8',
      legalGrade: '제4급 법정감염병 (장관감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 2,
      periodDesc: '구토 및 설사 증상 소실 후 24시간까지',
      releaseCondition: '증상 소실.',
      legalCriteria: '식품위생 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '손 상처 조리 식품 주의.',
      neisDuty: '보고대상'
    },
    {
      id: 'etec',
      name: '장독소성대장균(ETEC) 감염증 (장관감염증)',
      aliases: ['etec', '장독소성대장균', '여행자설사'],
      code: 'A04.1',
      legalGrade: '제4급 법정감염병 (장관감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 3,
      periodDesc: '수양성 설사 멈춘 후 48시간까지',
      releaseCondition: '배변 정상화.',
      legalCriteria: '수인성 감염병 관리 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '물 끓여 마시기 지도.',
      neisDuty: '보고대상'
    },
    {
      id: 'epec',
      name: '장병원성대장균(EPEC) 감염증 (장관감염증)',
      aliases: ['epec', '장병원성대장균'],
      code: 'A04.0',
      legalGrade: '제4급 법정감염병 (장관감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 3,
      periodDesc: '설사 및 발열 소실 후 48시간까지',
      releaseCondition: '임상 증상 호전.',
      legalCriteria: '감염병 관리 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '배변 후 손씻기 지도.',
      neisDuty: '보고대상'
    },
    {
      id: 'eiec',
      name: '장침습성대장균(EIEC) 감염증 (장관감염증)',
      aliases: ['eiec', '장침습성대장균'],
      code: 'A04.2',
      legalGrade: '제4급 법정감염병 (장관감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 3,
      periodDesc: '발열 및 혈변 등 증상 소실 후 48시간까지',
      releaseCondition: '증상 호전.',
      legalCriteria: '감염병 관리 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '철저한 손위생.',
      neisDuty: '보고대상'
    },
    {
      id: 'astrovirus',
      name: '아스트로바이러스 감염증 (장관감염증)',
      aliases: ['아스트로', '아스트로바이러스'],
      code: 'A08.3',
      legalGrade: '제4급 법정감염병 (장관감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 2,
      periodDesc: '설사 멈춘 후 48시간까지',
      releaseCondition: '증상 소실.',
      legalCriteria: '감염병 관리 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '화장실 소독.',
      neisDuty: '보고대상'
    },
    {
      id: 'sapovirus',
      name: '사포바이러스 감염증 (장관감염증)',
      aliases: ['사포', '사포바이러스'],
      code: 'A08.3',
      legalGrade: '제4급 법정감염병 (장관감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 2,
      periodDesc: '구토 및 설사 소실 후 48시간까지',
      releaseCondition: '증상 소실.',
      legalCriteria: '감염병 관리 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '소독 철저.',
      neisDuty: '보고대상'
    },
    {
      id: 'amoebiasis',
      name: '이질아메바증 (Amebiasis)',
      aliases: ['이질아메바', '아메바성이질'],
      code: 'A06',
      legalGrade: '제4급 법정감염병 (기생충·원충)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 3,
      periodDesc: '항원충제 치료 완료 및 증상 소실 시까지',
      releaseCondition: '의사 소견서 제출.',
      legalCriteria: '법정감염병 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '위생 점검.',
      neisDuty: '보고대상'
    },
    {
      id: 'giardiasis',
      name: '람블편모충증 (Giardiasis)',
      aliases: ['람블편모충', '편모충'],
      code: 'A07.1',
      legalGrade: '제4급 법정감염병 (원충감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 3,
      periodDesc: '설사 증상 소실 및 치료 완료 시까지',
      releaseCondition: '의사 소견.',
      legalCriteria: '감염병 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '음용수 안전 관리.',
      neisDuty: '보고대상'
    },
    {
      id: 'cryptosporidiosis',
      name: '크립토스포리디움증 (Cryptosporidiosis)',
      aliases: ['크립토스포리디움', '와포자충'],
      code: 'A07.2',
      legalGrade: '제4급 법정감염병 (원충감염증)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 3,
      periodDesc: '설사 멈춘 후 48시간까지',
      releaseCondition: '증상 호전.',
      legalCriteria: '감염병 지침',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '수영장 물 접촉 주의.',
      neisDuty: '보고대상'
    },
    {
      id: 'syphilis',
      name: '매독 (Syphilis)',
      aliases: ['매독', 'syphilis', '트레포네마'],
      code: 'A51-A53',
      legalGrade: '제4급 법정감염병 (표본감시)',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '일상적인 학교생활 접촉으로 전파되지 않음',
      releaseCondition: '일상 등교 가능.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '해당 없음',
      kdcaGuide: '질병관리청 매독 지침',
      documentReq: '해당 없음',
      teacherNotice: '비밀 보장 및 편견 방지.',
      neisDuty: '보고대상'
    },
    {
      id: 'ascariasis',
      name: '회충증 (Ascariasis)',
      aliases: ['회충', '회충증', 'ascaris'],
      code: 'B77',
      legalGrade: '제4급 법정감염병 (기생충감염증)',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '구충제 복용 후 정상 등교 (등교중지 불필요)',
      releaseCondition: '치료약제 복용 후 즉시 등교 가능.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '정상 등교',
      kdcaGuide: '질병관리청 기생충 지침',
      documentReq: '해당 없음',
      teacherNotice: '채소류 씻어 먹기 및 손씻기.',
      neisDuty: '해당없음'
    },
    {
      id: 'trichuriasis',
      name: '편충증 (Trichuriasis)',
      aliases: ['편충', '편충증'],
      code: 'B79',
      legalGrade: '제4급 법정감염병 (기생충감염증)',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '구충제 복용 후 정상 등교 가능',
      releaseCondition: '투약 후 등교.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '정상 등교',
      kdcaGuide: '질병관리청 기생충 지침',
      documentReq: '해당 없음',
      teacherNotice: '위생 교육.',
      neisDuty: '해당없음'
    },
    {
      id: 'clonorchiasis',
      name: '간흡충증 (Clonorchiasis)',
      aliases: ['간흡충', '간디스토마'],
      code: 'B66.1',
      legalGrade: '제4급 법정감염병 (기생충감염증)',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '민물고기 생식 매개로 사람 간 전파 없음 (등교 가능)',
      releaseCondition: '치료약 복용 중 등교 가능.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '정상 등교',
      kdcaGuide: '질병관리청 기생충 지침',
      documentReq: '해당 없음',
      teacherNotice: '민물고기 익혀 먹기 안내.',
      neisDuty: '해당없음'
    },
    {
      id: 'paragonimiasis',
      name: '폐흡충증 (Paragonimiasis)',
      aliases: ['폐흡충', '폐디스토마'],
      code: 'B66.4',
      legalGrade: '제4급 법정감염병 (기생충감염증)',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '민물 게/가재 생식 매개로 사람 간 전파 없음',
      releaseCondition: '등교 가능.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '정상 등교',
      kdcaGuide: '질병관리청 기생충 지침',
      documentReq: '해당 없음',
      teacherNotice: '민물 갑각류 익혀 먹기.',
      neisDuty: '해당없음'
    },
    {
      id: 'fasciolopsiasis',
      name: '장흡충증 (Fasciolopsiasis)',
      aliases: ['장흡충', '흡충증'],
      code: 'B66.5',
      legalGrade: '제4급 법정감염병 (기생충감염증)',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '사람 간 전파 없음 (등교 가능)',
      releaseCondition: '등교 가능.',
      legalCriteria: '등교중지 비대상',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '정상 등교',
      kdcaGuide: '질병관리청 지침',
      documentReq: '해당 없음',
      teacherNotice: '위생 지도.',
      neisDuty: '해당없음'
    },
    {
      id: 'vre',
      name: '반코마이신내성장알균(VRE) 감염증',
      aliases: ['vre', '반코마이신내성장알균'],
      code: 'U82.1',
      legalGrade: '제4급 법정감염병 (표본감시)',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 5,
      periodDesc: '급성 감염 증상 호전 시까지',
      releaseCondition: '의사 소견.',
      legalCriteria: '의료관련 감염병 지침',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '접촉 주의 및 손위생.',
      neisDuty: '보고대상'
    },
    {
      id: 'mrsa',
      name: '메티실린내성황색포도알균(MRSA) 감염증',
      aliases: ['mrsa', '메티실린내성'],
      code: 'U82.2',
      legalGrade: '제4급 법정감염병 (표본감시)',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 3,
      periodDesc: '피부 상처 병변의 삼출액이 멈추거나 밀폐 드레싱 완료 시까지',
      releaseCondition: '병변 피복 및 의사 소견.',
      legalCriteria: '의료관련 감염병 지침',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '상처 부위 밴드 피복 지도.',
      neisDuty: '보고대상'
    },
    {
      id: 'mrpa',
      name: '다제내성녹농균(MRPA) 감염증',
      aliases: ['mrpa', '다제내성녹농균'],
      code: 'U83.1',
      legalGrade: '제4급 법정감염병 (표본감시)',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 3,
      periodDesc: '증상 호전 시까지',
      releaseCondition: '의사 소견.',
      legalCriteria: '의료관련 감염병 지침',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '위생 지도.',
      neisDuty: '보고대상'
    },
    {
      id: 'mrab',
      name: '다제내성아시네토바커균(MRAB) 감염증',
      aliases: ['mrab', '다제내성아시네토바커'],
      code: 'U83.2',
      legalGrade: '제4급 법정감염병 (표본감시)',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 3,
      periodDesc: '증상 호전 시까지',
      releaseCondition: '의사 소견.',
      legalCriteria: '의료관련 감염병 지침',
      primaryLaw: '「학교보건법」',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서',
      teacherNotice: '손소독 지도.',
      neisDuty: '보고대상'
    },

    // ------------------------------------------------------------
    // [기타 학교보건 관리 다빈도 질환]
    // ------------------------------------------------------------
    {
      id: 'ekc',
      name: '유행성 각결막염 (아폴로/유행성눈병)',
      aliases: ['유행성각결막염', '눈병', '각결막염', 'ekc', '아데노바이러스눈병'],
      code: 'B30.0',
      legalGrade: '지정감염병 (안과 표본감시)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 7,
      periodDesc: '안과 전문의로부터 전염력이 소실되었다는 판정이 있을 때까지 (보통 발병 후 1~2주)',
      releaseCondition: '충혈, 눈곱, 이물감이 호전되고 의사의 등교 가능 소견을 받았을 때.',
      legalCriteria: '교육부 학생 감염병 관리 지침 출석인정 결석 대상',
      primaryLaw: '「학교보건법」 제8조(등교중지) 및 동법 시행령 제22조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 안과 감염병 지침',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 안과 감염병 관리지침',
      documentReq: '안과 진료확인서 또는 소견서 (등교 가능 문구 명시)',
      teacherNotice: '직간접 접촉으로 전파력이 매우 강함. 수건 및 개인물품 분리 사용 교육.',
      neisDuty: '보고대상'
    },
    {
      id: 'ahc',
      name: '급성 출혈성 결막염 (아폴로눈병)',
      aliases: ['아폴로눈병', '출혈성결막염', '급성출혈성결막염', '엔테로바이러스눈병'],
      code: 'B30.3',
      legalGrade: '지정감염병 (안과 표본감시)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 4,
      periodDesc: '증상 시작 후 최소 4일간 또는 의사의 전염력 소실 소견 시까지',
      releaseCondition: '결막하 출혈 및 분비물 호전, 안과 의사의 등교 가능 소견.',
      legalCriteria: '교육부 학생 감염병 관리 지침 기준',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 안과 지침',
      documentReq: '안과 진료확인서',
      teacherNotice: '손위생 철저, 손잡이 및 책상 소독 실시.',
      neisDuty: '보고대상'
    },
    {
      id: 'meningitis',
      name: '뇌수막염 (Meningitis)',
      aliases: ['뇌수막염', '수막염', 'meningitis'],
      code: 'G03',
      legalGrade: '비법정 감염병 (학교보건 관리 대상)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 7,
      periodDesc: '발열, 두통, 구토 등 급성 증상이 소실되고 의사의 등교 가능 진단이 있을 때까지',
      releaseCondition: '증상 호전 및 전염력 소실에 관한 의사의 진단서(소견서) 제출 시.',
      legalCriteria: '「학교보건법」 제8조 및 교육부 학생 감염병 관리 지침 출석인정 결석 대상',
      primaryLaw: '「학교보건법」 제8조(등교중지)',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 뇌수막염 관리지침',
      documentReq: '진료확인서 또는 의사소견서/진단서',
      teacherNotice: '급성기 안정 가료 필요. 원인균/바이러스 감별 및 건강 상태 추적 관찰.',
      neisDuty: '보고대상'
    },
    {
      id: 'aseptic_meningitis',
      name: '무균성수막염 (Aseptic Meningitis / 바이러스 수막염)',
      aliases: ['무균성수막염', '무균성뇌수막염', '바이러스뇌수막염', 'aseptic'],
      code: 'A87',
      legalGrade: '비법정 감염병 (학교보건 관리 대상)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 5,
      periodDesc: '발열, 두통, 구토 증상이 완전히 호전될 때까지 (통상 5~7일간)',
      releaseCondition: '해열 및 전신 증상 회복 후 의사의 등교 가능 소견 시.',
      legalCriteria: '「학교보건법」 제8조 및 교육부 학생 감염병 예방 관리 지침 기준',
      primaryLaw: '「학교보건법」 제8조(등교중지)',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 엔테로바이러스/무균성수막염 관리지침',
      documentReq: '진료확인서 또는 의사소견서',
      teacherNotice: '엔테로바이러스 등이 주원인. 배변 후 손씻기 지도 및 개인 물품 분리 사용.',
      neisDuty: '보고대상'
    },
    {
      id: 'scabies',
      name: '옴 (Scabies)',
      aliases: ['옴', 'scabies', '옴진드기', '야간가려움'],
      code: 'B86',
      legalGrade: '학교 감염병 관리 대상',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 1,
      periodDesc: '적절한 옴 치료제(연고)를 전신에 도포 치료 완료 후 다음 날까지',
      releaseCondition: '치료 연고 1회 전신 도포 완료 및 의사의 진료 확인.',
      legalCriteria: '학교 보건 관리 기준 출석인정 대상',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 피부 기생충 관리지침',
      documentReq: '진료확인서 (옴 치료 완료 명시)',
      teacherNotice: '동거 가족 전원 동시 치료 필수. 침구류 및 의복 50도 이상 온수 세탁.',
      neisDuty: '해당없음'
    },
    {
      id: 'impetigo',
      name: '농가진 (전염성 농가진, Impetigo)',
      aliases: ['농가진', '전염성농가진', '물집농가진', '딱지농가진'],
      code: 'L01',
      legalGrade: '학교 감염병 관리 대상',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 2,
      periodDesc: '항생제 치료 시작 후 24~48시간 경과 및 병변에 진물이 멈추고 마를 때까지',
      releaseCondition: '병변 부위가 건조해지고 새로운 수포가 생기지 않으며, 소견서 상 전염력 소실 확인 시.',
      legalCriteria: '교육부 학생 감염병 관리 지침 출석인정 결석 대상',
      primaryLaw: '「학교보건법」 제8조',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」',
      attendanceRule: COMMON_ATTENDANCE_RULE,
      kdcaGuide: '질병관리청 지침',
      documentReq: '진료확인서 또는 소견서',
      teacherNotice: '접촉으로 쉽게 번지므로 병변 부위 거즈나 밴드로 밀폐 드레싱.',
      neisDuty: '해당없음'
    },
    {
      id: 'head_lice',
      name: '머릿이 (Head Lice)',
      aliases: ['머릿이', '서캐', '이', 'pediculosis'],
      code: 'B85.0',
      legalGrade: '학교 감염병 관리 대상',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '머릿이 치료 샴푸/제제 1회 적용 후 즉시 등교 가능 (등교중지 불필요)',
      releaseCondition: '치료 샴푸 1차 적용 완료 후 참빗으로 서캐 제거. 등교 즉시 가능.',
      legalCriteria: '학업 결손 방지를 위해 등교중지 하지 않음 (질병관리청/교육부 지침)',
      primaryLaw: '「학교보건법」 (등교중지 비대상)',
      manualSource: '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」 머릿이 지침',
      attendanceRule: '해당 없음 (정상 출석)',
      kdcaGuide: '질병관리청 머릿이 관리지침',
      documentReq: '서류 불필요',
      teacherNotice: '학생이 수치심이나 따돌림을 겪지 않도록 비밀 보장 및 세심한 배려 지도.',
      neisDuty: '해당없음'
    },
    {
      id: 'common_cold',
      name: '일반 감기 / 급성 비인두염 (Common Cold)',
      aliases: ['감기', '코감기', '목감기', '비인두염', '몸살'],
      code: 'J00',
      legalGrade: '비법정 감염병',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '법적 등교중지 대상 아님 (단, 고열 시 담임교사 확인 하에 병결 가능)',
      releaseCondition: '발열이 없고 일상 수업 참여가 가능한 상태.',
      legalCriteria: '법정 감염병 출석인정 대상 아님 (질병결석 처리)',
      primaryLaw: '「학교보건법」 (등교중지 비대상)',
      manualSource: '교육부 감염병 매뉴얼',
      attendanceRule: '교육부 훈령 학교생활기록부 지침상 [질병결석] 처리',
      kdcaGuide: '질병관리청 일반 호흡기 지침',
      documentReq: '결석계 및 진료영수증/처방전 (질병결석 인정용)',
      teacherNotice: '인플루엔자나 코로나19와 감별 필요.',
      neisDuty: '해당없음'
    },
    {
      id: 'allergic_rhinitis',
      name: '알레르기 비염 / 결막염 / 아토피',
      aliases: ['알레르기', '알레르기비염', '비염', '알레르기결막염', '아토피'],
      code: 'J30',
      legalGrade: '비법정 (비전염성 만성질환)',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '비전염성 질환으로 등교중지 대상이 아닙니다.',
      releaseCondition: '언제든 정상 등교 가능.',
      legalCriteria: '해당 없음',
      primaryLaw: '「학교보건법」 (비전염성 질환)',
      manualSource: '교육부 학생 만성질환 관리 지침',
      attendanceRule: '해당 없음 (정상 출석)',
      kdcaGuide: '질병관리청 가이드라인',
      documentReq: '해당 없음',
      teacherNotice: '전염되지 않으므로 안심 지도.',
      neisDuty: '해당없음'
    }
  ];

  /* ============================================================
     2. 앱 상태 관리 (State)
  ============================================================ */
  const STATE = {
    selectedDisease: null,
    sheetUrl: localStorage.getItem('school_sheet_url') || '',
    history: JSON.parse(localStorage.getItem('school_disease_history') || '[]')
  };

  /* ============================================================
     3. DOM 요소 참조
  ============================================================ */
  const elements = {
    diseaseSearchInput: document.getElementById('diseaseSearchInput'),
    btnClearSearch: document.getElementById('btnClearSearch'),
    btnSearchSubmit: document.getElementById('btnSearchSubmit'),
    autocompleteList: document.getElementById('autocompleteList'),
    quickChipsContainer: document.getElementById('quickChipsContainer'),

    inputGrade: document.getElementById('inputGrade'),
    inputClass: document.getElementById('inputClass'),
    inputNumber: document.getElementById('inputNumber'),
    inputName: document.getElementById('inputName'),
    inputGender: document.getElementById('inputGender'),
    inputSymptomDate: document.getElementById('inputSymptomDate'),
    inputTreatmentStatus: document.getElementById('inputTreatmentStatus'),
    inputHospitalized: document.getElementById('inputHospitalized'),
    inputDiseaseCategory: document.getElementById('inputDiseaseCategory'),
    inputDiseaseSelect: document.getElementById('inputDiseaseSelect'),
    inputCustomDisease: document.getElementById('inputCustomDisease'),
    inputDiscoveryRoute: document.getElementById('inputDiscoveryRoute'),
    inputSuspensionStatus: document.getElementById('inputSuspensionStatus'),
    inputConfirmedStatus: document.getElementById('inputConfirmedStatus'),
    inputSymptoms: document.getElementById('inputSymptoms'),
    inputRemarks: document.getElementById('inputRemarks'),
    inputSuspendStartDate: document.getElementById('inputSuspendStartDate'),
    inputReturnDate: document.getElementById('inputReturnDate'),
    inputNeisReported: document.getElementById('inputNeisReported'),
    studentRecordForm: document.getElementById('studentRecordForm'),

    btnFindStudent: document.getElementById('btnFindStudent'),
    btnNeisSave: document.getElementById('btnNeisSave'),
    btnNeisReset: document.getElementById('btnNeisReset'),
    btnToggleNeisNotice: document.getElementById('btnToggleNeisNotice'),
    neisNoticeBanner: document.getElementById('neisNoticeBanner'),

    studentSearchModal: document.getElementById('studentSearchModal'),
    btnCloseStudentModal: document.getElementById('btnCloseStudentModal'),
    btnCloseStudentModalBtn: document.getElementById('btnCloseStudentModalBtn'),
    btnApplyStudentName: document.getElementById('btnApplyStudentName'),
    searchStudentNameInput: document.getElementById('searchStudentNameInput'),
    studentSampleList: document.getElementById('studentSampleList'),

    selectedDiseaseBadge: document.getElementById('selectedDiseaseBadge'),
    decisionBasisEmpty: document.getElementById('decisionBasisEmpty'),
    decisionBasisContent: document.getElementById('decisionBasisContent'),
    exampleSuspendPeriod: document.getElementById('exampleSuspendPeriod'),
    exampleReturnDate: document.getElementById('exampleReturnDate'),
    calcPeriodHint: document.getElementById('calcPeriodHint'),
    basisLegalGrade: document.getElementById('basisLegalGrade'),
    basisDiseaseCode: document.getElementById('basisDiseaseCode'),
    basisNeisDuty: document.getElementById('basisNeisDuty'),

    basisPrimaryLaw: document.getElementById('basisPrimaryLaw'),
    basisManualSource: document.getElementById('basisManualSource'),
    basisAttendanceRule: document.getElementById('basisAttendanceRule'),
    basisKdcaGuide: document.getElementById('basisKdcaGuide'),

    basisCriteria: document.getElementById('basisCriteria'),
    basisReleaseCondition: document.getElementById('basisReleaseCondition'),
    basisDocumentReq: document.getElementById('basisDocumentReq'),
    basisTeacherNotice: document.getElementById('basisTeacherNotice'),

    decisionBanner: document.getElementById('decisionBanner'),
    decisionIcon: document.getElementById('decisionIcon'),
    decisionStatusTitle: document.getElementById('decisionStatusTitle'),
    decisionStatusPill: document.getElementById('decisionStatusPill'),
    decisionSummaryText: document.getElementById('decisionSummaryText'),
    btnSaveToSheet: document.getElementById('btnSaveToSheet'),
    btnCopyResult: document.getElementById('btnCopyResult'),
    btnResetForm: document.getElementById('btnResetForm'),
    actionFeedback: document.getElementById('actionFeedback'),

    historyCount: document.getElementById('historyCount'),
    historyTableBody: document.getElementById('historyTableBody'),
    btnClearHistory: document.getElementById('btnClearHistory'),

    btnOpenSheetSettings: document.getElementById('btnOpenSheetSettings'),
    sheetStatusBadge: document.getElementById('sheetStatusBadge'),
    sheetModal: document.getElementById('sheetModal'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    inputAppsScriptUrl: document.getElementById('inputAppsScriptUrl'),
    btnDiagnoseUrl: document.getElementById('btnDiagnoseUrl'),
    btnTestConnection: document.getElementById('btnTestConnection'),
    btnSaveSheetUrl: document.getElementById('btnSaveSheetUrl'),
    modalTestResult: document.getElementById('modalTestResult'),

    btnDownloadCodeGs: document.getElementById('btnDownloadCodeGs'),
    btnToggleCodeView: document.getElementById('btnToggleCodeView'),
    codeViewContainer: document.getElementById('codeViewContainer'),
    codeGsTextarea: document.getElementById('codeGsTextarea'),

    noticeModal: document.getElementById('noticeModal'),
    btnCloseNoticeModal: document.getElementById('btnCloseNoticeModal'),
    btnCloseNoticeModalBtn: document.getElementById('btnCloseNoticeModalBtn'),
    btnReCopyNotice: document.getElementById('btnReCopyNotice'),
    noticeTextarea: document.getElementById('noticeTextarea'),
    noticeCharCount: document.getElementById('noticeCharCount'),

    toastContainer: document.getElementById('toastContainer')
  };

  /* ============================================================
     4. 유틸리티 함수
  ============================================================ */
  function formatDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function addDays(dateStr, days) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + days);
    return formatDate(d);
  }

  function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function setFeedback(msg, type = 'success') {
    elements.actionFeedback.className = `feedback-msg ${type}`;
    elements.actionFeedback.textContent = msg;
    elements.actionFeedback.classList.remove('hidden');
    setTimeout(() => {
      elements.actionFeedback.classList.add('hidden');
    }, 5000);
  }

  /* ============================================================
     5. 초기화 및 빠른 칩 세팅
  ============================================================ */
  function initApp() {
    const todayStr = formatDate(new Date());
    elements.inputSymptomDate.value = todayStr;
    if (elements.inputSuspendStartDate) {
      elements.inputSuspendStartDate.value = todayStr;
    }

    initNeisDiseaseOptions();
    updateSheetBadge();

    // 2025 법정감염병 기준 초등학교 다빈도 10대 감염병 칩 (아데노바이러스 포함!)
    const popularDiseases = [
      '아데노바이러스', '수두', '독감', '수족구병', '마이코플라스마', 'RSV', '백일해', '성홍열', '코로나19', '노로바이러스'
    ];

    elements.quickChipsContainer.innerHTML = '';
    popularDiseases.forEach(nameQuery => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip-btn';
      btn.textContent = nameQuery;
      btn.addEventListener('click', () => {
        searchAndSelectDisease(nameQuery);
      });
      elements.quickChipsContainer.appendChild(btn);
    });

    renderHistoryTable();
    bindEvents();
  }

  function updateSheetBadge() {
    if (STATE.sheetUrl && STATE.sheetUrl.trim().startsWith('http')) {
      elements.sheetStatusBadge.textContent = '연동됨';
      elements.sheetStatusBadge.className = 'sheet-badge connected';
    } else {
      elements.sheetStatusBadge.textContent = '미연결';
      elements.sheetStatusBadge.className = 'sheet-badge disconnected';
    }
  }

  /* ============================================================
     6. 검색 및 자동완성 (급성호흡기감염증, 아데노바이러스 등 정밀 매칭)
  ============================================================ */
  function findDiseases(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase().replace(/\s+/g, '');
    return DISEASE_DATABASE.filter(item => {
      const nameClean = item.name.toLowerCase().replace(/\s+/g, '');
      const codeClean = item.code.toLowerCase().replace(/\s+/g, '');
      const gradeClean = item.legalGrade.toLowerCase().replace(/\s+/g, '');

      if (nameClean.includes(q)) return true;
      if (codeClean.includes(q)) return true;
      if (gradeClean.includes(q)) return true;

      return item.aliases.some(alias => alias.toLowerCase().replace(/\s+/g, '').includes(q));
    });
  }

  function handleSearchInput() {
    const query = elements.diseaseSearchInput.value;
    if (query.trim()) {
      elements.btnClearSearch.classList.add('show');
    } else {
      elements.btnClearSearch.classList.remove('show');
      elements.autocompleteList.classList.add('hidden');
      return;
    }

    const matches = findDiseases(query);
    renderAutocomplete(matches);
  }

  function renderAutocomplete(list) {
    elements.autocompleteList.innerHTML = '';
    if (list.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'autocomplete-item';
      emptyItem.textContent = '일치하는 감염병 정보가 없습니다. (질병명이나 병원체명을 확인해주세요)';
      emptyItem.style.color = '#94a3b8';
      emptyItem.style.cursor = 'default';
      elements.autocompleteList.appendChild(emptyItem);
      elements.autocompleteList.classList.remove('hidden');
      return;
    }

    list.slice(0, 10).forEach(item => {
      const row = document.createElement('div');
      row.className = 'autocomplete-item';

      const left = document.createElement('div');
      left.className = 'autocomplete-name-group';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'autocomplete-name';
      nameSpan.textContent = item.name;

      const metaSpan = document.createElement('span');
      metaSpan.className = 'autocomplete-meta';
      metaSpan.textContent = `${item.legalGrade} | 코드: ${item.code}`;

      left.appendChild(nameSpan);
      left.appendChild(metaSpan);

      const badge = document.createElement('span');
      badge.className = 'autocomplete-badge';
      if (item.status === 'required') {
        badge.textContent = '등교중지';
        badge.style.backgroundColor = '#fee2e2';
        badge.style.color = '#dc2626';
      } else if (item.status === 'recommended') {
        badge.textContent = '등교권고';
        badge.style.backgroundColor = '#fef3c7';
        badge.style.color = '#d97706';
      } else {
        badge.textContent = '등교가능';
        badge.style.backgroundColor = '#dcfce7';
        badge.style.color = '#16a34a';
      }

      row.appendChild(left);
      row.appendChild(badge);

      row.addEventListener('click', () => {
        selectDisease(item);
        elements.autocompleteList.classList.add('hidden');
      });

      elements.autocompleteList.appendChild(row);
    });

    elements.autocompleteList.classList.remove('hidden');
  }

  function searchAndSelectDisease(query) {
    elements.diseaseSearchInput.value = query;
    elements.btnClearSearch.classList.add('show');
    const matches = findDiseases(query);
    if (matches.length > 0) {
      selectDisease(matches[0]);
    }
    elements.autocompleteList.classList.add('hidden');
  }

  /* ============================================================
     7. 4세대 나이스 병명 연계 및 질병 선택 갱신
  ============================================================ */
  // 붉은색 표기 대상 감염병 (홍역, 결핵, 장출혈성대장균감염증, A형간염, 장티푸스, 파라티푸스, 세균성이질, 콜레라)
  const RED_DISEASE_IDS = new Set([
    'measles',        // 홍역
    'tuberculosis',    // 결핵
    'ehec',           // 장출혈성대장균감염증
    'hepatitis_a',    // A형간염
    'typhoid',        // 장티푸스
    'paratyphoid',    // 파라티푸스
    'shigellosis',    // 세균성이질
    'cholera'         // 콜레라
  ]);

  // 법정 감염병 우선순위 목록 (질병관리청 KDCA 공식 법정감염병 전체 수록 및 그림 화면 image_68b42ef0.png 순서 최우선 배치)
  const LEGAL_PRIORITY_ORDER = [
    // 1) 그림 파일(image_68b42ef0.png) 상단에 표시된 9대 감염병 순서 (최우선 배치)
    { id: 'influenza', label: '인플루엔자' },
    { id: 'measles', label: '홍역', isRed: true },
    { id: 'varicella', label: '수두' },
    { id: 'tuberculosis', label: '결핵', isRed: true },
    { id: 'mumps', label: '유행성이하선염' },
    { id: 'pertussis', label: '백일해' },
    { id: 'scarlet_fever', label: '성홍열' },
    { id: 'hfmd', label: '수족구병' },
    { id: 'covid19', label: '코로나바이러스감염증-19' },

    // 2) 사용자 요청 붉은색 표기 법정 감염병 (홍역, 결핵 외 6종)
    { id: 'ehec', label: '장출혈성대장균감염증', isRed: true },
    { id: 'hepatitis_a', label: 'A형간염', isRed: true },
    { id: 'typhoid', label: '장티푸스', isRed: true },
    { id: 'paratyphoid', label: '파라티푸스', isRed: true },
    { id: 'shigellosis', label: '세균성이질', isRed: true },
    { id: 'cholera', label: '콜레라', isRed: true },

    // 3) 학교보건 다빈도 법정감염병 (호흡기/장관)
    { id: 'mycoplasma', label: '마이코플라스마 폐렴균 감염증' },
    { id: 'adenovirus', label: '아데노바이러스 감염증' },
    { id: 'rsv', label: '호흡기세포융합바이러스 감염증 (RSV)' },
    { id: 'norovirus', label: '노로바이러스 감염증' },
    { id: 'rotavirus', label: '로타바이러스 감염증' },
    { id: 'salmonella', label: '살모넬라균 감염증' },
    { id: 'enterovirus', label: '엔테로바이러스 감염증' },
    { id: 'parainfluenza', label: '파라인플루엔자바이러스 감염증' },
    { id: 'hmpv', label: '사람 메타뉴모바이러스 감염증' },
    { id: 'bocavirus', label: '사람 보카바이러스 감염증' },
    { id: 'rhinovirus', label: '리노바이러스 감염증' },
    { id: 'chlamydia_pneumoniae', label: '클라미디아 폐렴균 감염증' },
    { id: 'human_coronavirus', label: '사람 코로나바이러스 감염증' },

    // 4) 제1급 법정감염병 (17종 - 음압격리 및 즉시신고)
    { id: 'diphtheria', label: '디프테리아' },
    { id: 'mers', label: '중동호흡기증후군 (MERS)' },
    { id: 'sars', label: '중증급성호흡기증후군 (SARS)' },
    { id: 'avian_influenza', label: '동물인플루엔자 인체감염증' },
    { id: 'novel_influenza', label: '신종인플루엔자' },
    { id: 'ebola', label: '에볼라바이러스병' },
    { id: 'marburg', label: '마버그열' },
    { id: 'lassa', label: '라싸열' },
    { id: 'cchf', label: '크리미안콩고출혈열' },
    { id: 'saf', label: '남아메리카출혈열' },
    { id: 'rvf', label: '리프트밸리열' },
    { id: 'smallpox', label: '두창' },
    { id: 'plague', label: '페스트' },
    { id: 'anthrax', label: '탄저' },
    { id: 'botulism', label: '보툴리눔독소증' },
    { id: 'tularemia', label: '야토병' },
    { id: 'emerging_infection', label: '신종감염병증후군' },

    // 5) 제2급 법정감염병 추가 (격리 필요)
    { id: 'rubella', label: '풍진' },
    { id: 'polio', label: '폴리오' },
    { id: 'meningococcal', label: '수막구균 감염증' },
    { id: 'hib', label: 'b형헤모필루스인플루엔자' },
    { id: 'pneumococcal', label: '폐렴구균 감염증' },
    { id: 'leprosy', label: '한센병' },
    { id: 'vrsa', label: '반코마이신내성황색포도알균(VRSA) 감염증' },
    { id: 'cre', label: '카바페넴내성장내세균목(CRE) 감염증' },
    { id: 'hepatitis_e', label: 'E형간염' },
    { id: 'mpox', label: '엠폭스' },

    // 6) 제3급 법정감염병 (26종 - 발생감시)
    { id: 'tetanus', label: '파상풍' },
    { id: 'hepatitis_b', label: 'B형간염' },
    { id: 'japanese_encephalitis', label: '일본뇌염' },
    { id: 'hepatitis_c', label: 'C형간염' },
    { id: 'malaria', label: '말라리아' },
    { id: 'legionella', label: '레지오넬라증' },
    { id: 'vibrio_vulnificus', label: '비브리오패혈증' },
    { id: 'tsutsugamushi', label: '쯔쯔가무시증' },
    { id: 'leptospirosis', label: '렙토스피라증' },
    { id: 'brucellosis', label: '브루셀라증' },
    { id: 'rabies', label: '공수병' },
    { id: 'hfrs', label: '신증후군출혈열' },
    { id: 'cjd', label: '크로이츠펠트-야콥병(CJD)' },
    { id: 'yellow_fever', label: '황열' },
    { id: 'dengue', label: '뎅기열' },
    { id: 'q_fever', label: '큐열' },
    { id: 'west_nile', label: '웨스트나일열' },
    { id: 'lyme', label: '라임병' },
    { id: 'tick_borne_encephalitis', label: '진드기매개뇌염' },
    { id: 'melioidosis', label: '유비저' },
    { id: 'chikungunya', label: '치쿤구니야열' },
    { id: 'sfts', label: '중증열성혈소판감소증후군(SFTS)' },
    { id: 'zika', label: '지카바이러스감염증' },
    { id: 'epidemic_typhus', label: '발진티푸스' },
    { id: 'murine_typhus', label: '발진열' },

    // 7) 제4급 법정감염병 추가 (장관감염증, 기생충, 매독, 항생제 내성균)
    { id: 'campylobacter', label: '캄필로박터균 감염증' },
    { id: 'vibrio_parahaemolyticus', label: '장염비브리오균 감염증' },
    { id: 'clostridium_perfringens', label: '클로스트리듐 퍼프린젠스 감염증' },
    { id: 'staphylococcus_aureus_enteritis', label: '황색포도알균 감염증' },
    { id: 'etec', label: '장독소성대장균(ETEC) 감염증' },
    { id: 'epec', label: '장병원성대장균(EPEC) 감염증' },
    { id: 'eiec', label: '장침습성대장균(EIEC) 감염증' },
    { id: 'astrovirus', label: '아스트로바이러스 감염증' },
    { id: 'sapovirus', label: '사포바이러스 감염증' },
    { id: 'amoebiasis', label: '이질아메바증' },
    { id: 'giardiasis', label: '람블편모충증' },
    { id: 'cryptosporidiosis', label: '크립토스포리디움증' },
    { id: 'syphilis', label: '매독' },
    { id: 'enterobiasis', label: '요충증' },
    { id: 'ascariasis', label: '회충증' },
    { id: 'trichuriasis', label: '편충증' },
    { id: 'clonorchiasis', label: '간흡충증' },
    { id: 'paragonimiasis', label: '폐흡충증' },
    { id: 'fasciolopsiasis', label: '장흡충증' },
    { id: 'vre', label: '반코마이신내성장알균(VRE) 감염증' },
    { id: 'mrsa', label: '메티실린내성황색포도알균(MRSA) 감염증' },
    { id: 'mrpa', label: '다제내성녹농균(MRPA) 감염증' },
    { id: 'mrab', label: '다제내성아시네토바커균(MRAB) 감염증' }
  ];

  // 비법정 감염병 우선순위 목록 (그림 화면 image_efff343b.png 순서 일치)
  const NON_LEGAL_PRIORITY_ORDER = [
    { id: 'ekc', label: '유행성각결막염' },
    { id: 'ahc', label: '급성출혈성결막염' },
    { id: 'meningitis', label: '뇌수막염' },
    { id: 'aseptic_meningitis', label: '무균성수막염' },
    { id: 'scabies', label: '옴' },
    { id: 'custom_non_legal', label: '기타(비법정)' },
    { id: 'impetigo', label: '농가진' },
    { id: 'head_lice', label: '머릿이' },
    { id: 'common_cold', label: '일반 감기 / 급성 비인두염' },
    { id: 'allergic_rhinitis', label: '알레르기 비염 / 결막염 / 아토피' }
  ];

  function updateSelectColor(select) {
    if (!select) return;
    const val = select.value;
    if (RED_DISEASE_IDS.has(val)) {
      select.classList.add('is-red-disease');
      select.style.color = '#dc2626';
      select.style.fontWeight = '700';
    } else {
      select.classList.remove('is-red-disease');
      select.style.color = '';
      select.style.fontWeight = '';
    }
  }

  function initNeisDiseaseOptions() {
    if (!elements.inputDiseaseCategory || !elements.inputDiseaseSelect) return;
    const cat = elements.inputDiseaseCategory.value; // '법정' or '비법정'
    const select = elements.inputDiseaseSelect;
    select.innerHTML = '<option value="">선택</option>';

    if (cat === '법정') {
      const addedIds = new Set();

      LEGAL_PRIORITY_ORDER.forEach(item => {
        const d = DISEASE_DATABASE.find(x => x.id === item.id);
        if (d) {
          addedIds.add(d.id);
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = item.label;
          if (item.isRed || RED_DISEASE_IDS.has(d.id)) {
            opt.classList.add('opt-danger-red');
            opt.style.color = '#dc2626';
            opt.style.fontWeight = '700';
          }
          select.appendChild(opt);
        }
      });

      DISEASE_DATABASE.filter(d => d.legalGrade.includes('법정') && !addedIds.has(d.id)).forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name.split(' (')[0];
        if (RED_DISEASE_IDS.has(d.id)) {
          opt.classList.add('opt-danger-red');
          opt.style.color = '#dc2626';
          opt.style.fontWeight = '700';
        }
        select.appendChild(opt);
      });

      const optEtc = document.createElement('option');
      optEtc.value = 'custom_legal';
      optEtc.textContent = '기타(법정)';
      select.appendChild(optEtc);

    } else {
      const addedIds = new Set();

      NON_LEGAL_PRIORITY_ORDER.forEach(item => {
        if (item.id === 'custom_non_legal') {
          const optEtc = document.createElement('option');
          optEtc.value = 'custom_non_legal';
          optEtc.textContent = '기타(비법정)';
          select.appendChild(optEtc);
          return;
        }
        const d = DISEASE_DATABASE.find(x => x.id === item.id);
        if (d) {
          addedIds.add(d.id);
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = item.label;
          select.appendChild(opt);
        }
      });

      DISEASE_DATABASE.filter(d => !d.legalGrade.includes('법정') && !addedIds.has(d.id)).forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name.split(' (')[0];
        select.appendChild(opt);
      });
    }

    if (STATE.selectedDisease) {
      select.value = STATE.selectedDisease.id;
    }
    updateSelectColor(select);
  }

  function selectDisease(item) {
    STATE.selectedDisease = item;
    elements.diseaseSearchInput.value = item.name;

    elements.decisionBasisEmpty.classList.add('hidden');
    elements.decisionBasisContent.classList.remove('hidden');

    elements.selectedDiseaseBadge.textContent = item.name.split(' ')[0];
    elements.basisLegalGrade.textContent = item.legalGrade;
    elements.basisDiseaseCode.textContent = item.code;
    elements.basisNeisDuty.textContent = item.neisDuty;

    // 공식 출처 문서 안전 기재
    elements.basisPrimaryLaw.textContent = item.primaryLaw || '「학교보건법」 제8조';
    elements.basisManualSource.textContent = item.manualSource || '교육부·질병관리청 「학생 감염병 예방·위기대응 매뉴얼」';
    elements.basisAttendanceRule.textContent = item.attendanceRule || COMMON_ATTENDANCE_RULE;
    elements.basisKdcaGuide.textContent = item.kdcaGuide || '질병관리청 법정감염병 관리지침';

    elements.basisCriteria.textContent = item.periodDesc;
    elements.basisReleaseCondition.textContent = item.releaseCondition;
    elements.basisDocumentReq.textContent = item.documentReq;
    elements.basisTeacherNotice.textContent = item.teacherNotice;

    // 4세대 나이스 병명 선택창 동기화
    if (elements.inputDiseaseCategory && elements.inputDiseaseSelect) {
      const isLegal = item.legalGrade.includes('법정');
      elements.inputDiseaseCategory.value = isLegal ? '법정' : '비법정';
      initNeisDiseaseOptions();
      elements.inputDiseaseSelect.value = item.id;
      updateSelectColor(elements.inputDiseaseSelect);
      if (elements.inputCustomDisease) {
        elements.inputCustomDisease.classList.add('hidden');
      }
    }

    // 4세대 나이스 등교중지여부 자동 선택 (그림 화면 기준: '등교' / '등교중지')
    if (elements.inputSuspensionStatus) {
      if (item.status === 'none') {
        elements.inputSuspensionStatus.value = '등교';
      } else {
        elements.inputSuspensionStatus.value = '등교중지';
      }
    }

    // [사용자 요청] 참고사항 안내 문구: "환자의 치료현황 변경시 입력.\n증빙서류 제출 여부 입력"
    if (elements.inputRemarks) {
      elements.inputRemarks.placeholder = '환자의 치료현황 변경시 입력.\n증빙서류 제출 여부 입력';
    }

    if (item.neisDuty && item.neisDuty.includes('해당없음')) {
      elements.inputNeisReported.value = '해당없음(비보고대상)';
    } else {
      elements.inputNeisReported.value = '미보고';
    }

    calculateDates();
    updateBottomDecisionBanner(item);

    document.querySelectorAll('.chip-btn').forEach(btn => {
      const q = btn.textContent.toLowerCase().replace(/\s+/g, '');
      const n = item.name.toLowerCase().replace(/\s+/g, '');
      if (item.aliases.some(a => a.toLowerCase().replace(/\s+/g, '') === q) || n.includes(q)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    showToast(`'${item.name.split(' ')[0]}' 감염병 출결 지침이 적용되었습니다.`);
  }

  function calculateDates() {
    if (!STATE.selectedDisease) return;

    const onsetDate = elements.inputSymptomDate.value;
    const disease = STATE.selectedDisease;

    if (!onsetDate) {
      if (elements.exampleSuspendPeriod) elements.exampleSuspendPeriod.textContent = '-';
      if (elements.exampleReturnDate) elements.exampleReturnDate.textContent = '-';
      elements.calcPeriodHint.textContent = '증상 발생 일자를 먼저 선택해주세요.';
      return;
    }

    if (disease.status === 'none') {
      if (elements.inputSuspendStartDate && !elements.inputSuspendStartDate.value) {
        elements.inputSuspendStartDate.value = onsetDate;
      }
      elements.inputReturnDate.value = onsetDate;
      if (elements.exampleSuspendPeriod) elements.exampleSuspendPeriod.textContent = '등교중지 불필요 (정상 등교 가능)';
      if (elements.exampleReturnDate) elements.exampleReturnDate.textContent = `${onsetDate} (정상 등교)`;
      elements.calcPeriodHint.textContent = '비전염성 또는 처치 즉시 등교 가능 질환입니다.';
      return;
    }

    const days = disease.defaultDays;
    const returnDate = addDays(onsetDate, days);
    const endDate = addDays(onsetDate, Math.max(0, days - 1));

    // 오른쪽 카드: 교육부 지침 권고 산정 예시 기재
    if (elements.exampleSuspendPeriod) {
      elements.exampleSuspendPeriod.textContent = `${onsetDate} ~ ${endDate} (권고 약 ${days}일간)`;
    }
    if (elements.exampleReturnDate) {
      elements.exampleReturnDate.textContent = `${returnDate} (권고 등교 가능일)`;
    }

    // 왼쪽 폼: 등교중지 시작일 및 실제 등교일 기본 추천값 설정
    if (elements.inputSuspendStartDate && !elements.inputSuspendStartDate.value) {
      elements.inputSuspendStartDate.value = onsetDate;
    }
    if (elements.inputReturnDate && !elements.inputReturnDate.value) {
      elements.inputReturnDate.value = returnDate;
    }

    if (disease.id === 'influenza') {
      elements.calcPeriodHint.textContent = '💡 2026 시설별 인플루엔자 관리 지침 기준: 해열제 없이 정상체온 회복 후 24시간 경과까지 등교중지 (해열제 투약 시에는 마지막 해열제 투약 시점부터 48시간 경과 관찰 후 등교 가능). 위 기간은 5일 권고 기준의 참고 예시이며, 실제 등교일은 학생의 해열 시점에 맞추어 왼쪽 폼에 입력해 주세요.';
    } else {
      elements.calcPeriodHint.textContent = `※ 위 산정은 교육부·질병관리청 지침 기준의 권고 참고용 예시입니다. 실제 학생의 등교중지 시작일과 실제 등교일은 주치의 소견에 맞추어 왼쪽 폼에 입력해 주세요.`;
    }
  }

  function updateBottomDecisionBanner(item) {
    const banner = elements.decisionBanner;
    banner.classList.remove('default-state', 'status-required', 'status-recommended', 'status-none');

    if (item.status === 'required') {
      banner.classList.add('status-required');
      elements.decisionIcon.textContent = '🛑';
      elements.decisionStatusTitle.textContent = '등교중지 대상 감염병입니다';
      elements.decisionStatusPill.textContent = '등교중지 필요';
      elements.decisionSummaryText.textContent = 
        `「${item.name}」은(는) 전염기 동안 등교가 중지되며, 결석 기간은 법정 출석인정 결석 처리됩니다. (${item.periodDesc})`;
    } else if (item.status === 'recommended') {
      banner.classList.add('status-recommended');
      elements.decisionIcon.textContent = '⚠️';
      elements.decisionStatusTitle.textContent = '등교 자제 및 휴식 권고 대상입니다';
      elements.decisionStatusPill.textContent = '등교중지 권고';
      elements.decisionSummaryText.textContent = 
        `「${item.name}」은(는) 학급 내 전파 차단 및 회복을 위해 등교 자제를 권고하며, 결석 시 출석인정 결석 처리됩니다. (${item.periodDesc})`;
    } else {
      banner.classList.add('status-none');
      elements.decisionIcon.textContent = '🟢';
      elements.decisionStatusTitle.textContent = '등교중지가 필요 없는 질환입니다';
      elements.decisionStatusPill.textContent = '등교중지 불필요';
      elements.decisionSummaryText.textContent = 
        `「${item.name}」은(는) 법적 등교중지 대상이 아니며, 적절한 치료 후 정상 등교할 수 있습니다. (${item.periodDesc})`;
    }
  }

  /* ============================================================
     8. 구글 스프레드시트 나이스 연계 스키마 정밀 매핑 및 전송
  ============================================================ */
  function getFormDataRecord() {
    const grade = elements.inputGrade.value.trim();
    const className = elements.inputClass.value.trim();
    const number = elements.inputNumber ? elements.inputNumber.value.trim() : '';
    const name = elements.inputName.value.trim();
    const gender = elements.inputGender.value.trim();
    const symptomDate = elements.inputSymptomDate.value.trim();
    const suspendStartDate = elements.inputSuspendStartDate ? elements.inputSuspendStartDate.value.trim() : symptomDate;
    const returnDate = elements.inputReturnDate.value.trim();
    const symptoms = elements.inputSymptoms.value.trim();
    const neisReported = elements.inputNeisReported.value.trim();
    let diseaseName = STATE.selectedDisease ? STATE.selectedDisease.name : elements.diseaseSearchInput.value.trim();
    if (elements.inputCustomDisease && !elements.inputCustomDisease.classList.contains('hidden') && elements.inputCustomDisease.value.trim()) {
      diseaseName = elements.inputCustomDisease.value.trim();
    }

    const treatmentStatus = elements.inputTreatmentStatus ? elements.inputTreatmentStatus.value : '통원치료';
    const hospitalized = (treatmentStatus === '입원') ? '예' : (elements.inputHospitalized ? elements.inputHospitalized.value : '아니오');
    const discoveryRoute = elements.inputDiscoveryRoute ? elements.inputDiscoveryRoute.value : '개인진료';
    const suspensionStatus = elements.inputSuspensionStatus ? elements.inputSuspensionStatus.value : '등교중지';
    const confirmedStatus = elements.inputConfirmedStatus ? elements.inputConfirmedStatus.value : '확진';
    const remarks = elements.inputRemarks ? elements.inputRemarks.value.trim() : '';

    if (!grade) {
      showToast('⚠️ 학년을 선택해주세요.');
      elements.inputGrade.focus();
      return null;
    }
    if (!className) {
      showToast('⚠️ 반을 입력해주세요.');
      elements.inputClass.focus();
      return null;
    }
    if (!name) {
      showToast('⚠️ 학생 성명을 입력해주세요.');
      elements.inputName.focus();
      return null;
    }
    if (!gender) {
      showToast('⚠️ 성별을 선택해주세요.');
      elements.inputGender.focus();
      return null;
    }
    if (!diseaseName) {
      showToast('⚠️ 질병을 먼저 검색하거나 병명을 선택해주세요.');
      elements.diseaseSearchInput.focus();
      return null;
    }
    if (!symptomDate) {
      showToast('⚠️ 발생인지일(증상 발생일)을 입력해주세요.');
      elements.inputSymptomDate.focus();
      return null;
    }
    if (!suspendStartDate) {
      showToast('⚠️ 등교중지 시작일을 입력해주세요.');
      elements.inputSuspendStartDate.focus();
      return null;
    }

    let suspendPeriod = `${suspendStartDate}부터`;
    if (returnDate) {
      suspendPeriod = `${suspendStartDate} ~ ${returnDate}`;
    }

    return {
      grade: grade,
      class: className,
      gradeClass: `${grade} ${className}`,
      number: number,
      gender: gender,
      name: name,
      disease: diseaseName,
      symptomDate: symptomDate,
      suspendStartDate: suspendStartDate,
      suspendPeriod: suspendPeriod,
      returnDate: returnDate,
      symptoms: symptoms || '특이사항 없음',
      hospitalized: hospitalized,
      treatmentStatus: treatmentStatus,
      discoveryRoute: discoveryRoute,
      suspensionStatus: suspensionStatus,
      confirmedStatus: confirmedStatus,
      remarks: remarks,
      note: remarks || (hospitalized === '예' ? '병원입원' : '통원치료'),
      neisReported: neisReported,
      timestamp: new Date().toISOString()
    };
  }

  async function handleSaveToSheet() {
    const record = getFormDataRecord();
    if (!record) return;

    let targetUrl = STATE.sheetUrl ? STATE.sheetUrl.trim() : '';

    if (!targetUrl) {
      saveToLocalHistory(record, false);
      setFeedback('⚠️ 구글 시트 연동 URL이 아직 등록되지 않았습니다. 우측 상단 [구글 시트 연동 설정]에서 웹 앱 배포 URL을 먼저 등록해주세요.', 'error');
      openSheetModal();
      return;
    }

    // URL 형식 유효성 검사 (흔히 발생하는 시트 주소/편집기 주소 오입력 방지)
    if (targetUrl.includes('docs.google.com/spreadsheets') || targetUrl.endsWith('/edit')) {
      saveToLocalHistory(record, false);
      setFeedback('⚠️ 구글 스프레드시트 주소나 편집기 주소가 입력되어 있습니다! Apps Script [배포] → [새 배포]에서 발급받은 "/exec"로 끝나는 웹 앱 URL을 등록해주세요.', 'error');
      openSheetModal();
      return;
    }

    if (targetUrl.endsWith('/dev')) {
      targetUrl = targetUrl.slice(0, -4) + '/exec';
      STATE.sheetUrl = targetUrl;
      localStorage.setItem('school_sheet_url', targetUrl);
    }

    elements.btnSaveToSheet.disabled = true;
    elements.btnSaveToSheet.textContent = '⏳ 시트 전송 중...';

    // 로컬 백업 먼저 생성 (초기 상태: 미전송)
    saveToLocalHistory(record, false);

    const payload = JSON.stringify({
      action: 'appendRecord',
      record: {
        grade: record.grade,
        class: record.class,
        gradeClass: record.gradeClass,
        number: record.number || '',
        gender: record.gender,
        name: record.name,
        disease: record.disease,
        symptomDate: record.symptomDate,
        suspendStartDate: record.suspendStartDate,
        suspendPeriod: record.suspendPeriod,
        returnDate: record.returnDate,
        symptoms: record.symptoms,
        hospitalized: record.hospitalized,
        treatmentStatus: record.treatmentStatus,
        discoveryRoute: record.discoveryRoute,
        suspensionStatus: record.suspensionStatus,
        confirmedStatus: record.confirmedStatus,
        remarks: record.remarks,
        note: record.remarks || (record.hospitalized === '예' ? '병원입원' : '통원치료'),
        neisReported: record.neisReported,
        reportDate: formatDate(new Date())
      }
    });

    try {
      // mode: 'no-cors'를 적용하여 Google Apps Script 302 리디렉션 CORS 차단 문제를 우회!
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload
      });

      // 정상 전송 완료 시 상태 갱신
      markLastRecordSynced(true);
      const studentLabel = `${record.grade} ${record.class} ${record.number ? record.number + '번 ' : ''}${record.name}`;
      setFeedback(`✅ [${studentLabel}] 학생의 기록이 구글 스프레드시트에 성공적으로 전송되었습니다!`, 'success');
      showToast('구글 시트 감염병 관리대장 전송 완료');
    } catch (err) {
      console.warn('Google Sheet submission warning:', err);
      // 실패 시 전송완료로 위장하지 않고 로컬 보관 상태 유지
      markLastRecordSynced(false);
      setFeedback(`⚠️ 구글 시트 전송 중 오류가 발생하여 [로컬 관리대장]에 안전하게 보관되었습니다. Apps Script 배포 시 "액세스 권한: 모든 사용자" 설정과 URL을 확인해주세요.`, 'error');
      showToast('⚠️ 시트 전송 실패 (로컬 안전보관)');
    } finally {
      elements.btnSaveToSheet.disabled = false;
      elements.btnSaveToSheet.innerHTML = '<span class="btn-icon">📥</span> 구글 감염병 관리대장에 등록';
    }
  }

  function saveToLocalHistory(record, isSynced = false) {
    const item = {
      ...record,
      synced: isSynced,
      id: Date.now()
    };
    STATE.history.unshift(item);
    if (STATE.history.length > 50) {
      STATE.history.pop();
    }
    localStorage.setItem('school_disease_history', JSON.stringify(STATE.history));
    renderHistoryTable();
  }

  function markLastRecordSynced(isSynced = true) {
    if (STATE.history.length > 0) {
      STATE.history[0].synced = isSynced;
      localStorage.setItem('school_disease_history', JSON.stringify(STATE.history));
      renderHistoryTable();
    }
  }

  function renderHistoryTable() {
    const tbody = elements.historyTableBody;
    tbody.innerHTML = '';
    elements.historyCount.textContent = String(STATE.history.length);

    if (STATE.history.length === 0) {
      const row = document.createElement('tr');
      row.className = 'empty-row';
      const td = document.createElement('td');
      td.colSpan = 9;
      td.textContent = '아직 등록된 학생 기록이 없습니다.';
      row.appendChild(td);
      tbody.appendChild(row);
      return;
    }

    STATE.history.forEach((rec, idx) => {
      const row = document.createElement('tr');

      const tdIndex = document.createElement('td');
      tdIndex.textContent = String(STATE.history.length - idx);

      const tdClass = document.createElement('td');
      tdClass.textContent = `${rec.grade} ${rec.class}`;

      const tdName = document.createElement('td');
      tdName.textContent = `${rec.name} (${rec.gender})`;
      tdName.style.fontWeight = '700';

      const tdDisease = document.createElement('td');
      tdDisease.textContent = rec.disease ? rec.disease.split(' ')[0] : '-';

      const tdOnset = document.createElement('td');
      tdOnset.textContent = rec.symptomDate || '-';

      const tdPeriod = document.createElement('td');
      tdPeriod.textContent = rec.suspendStartDate || rec.suspendPeriod || '-';

      const tdReturn = document.createElement('td');
      tdReturn.textContent = rec.returnDate || '-';

      const tdNeis = document.createElement('td');
      tdNeis.textContent = rec.neisReported || '-';

      const tdSync = document.createElement('td');
      if (rec.synced) {
        tdSync.textContent = '전송완료';
        tdSync.className = 'tag-sync-ok';
      } else {
        tdSync.textContent = '로컬보관(미전송)';
        tdSync.className = 'tag-sync-local';
      }

      row.appendChild(tdIndex);
      row.appendChild(tdClass);
      row.appendChild(tdName);
      row.appendChild(tdDisease);
      row.appendChild(tdOnset);
      row.appendChild(tdPeriod);
      row.appendChild(tdReturn);
      row.appendChild(tdNeis);
      row.appendChild(tdSync);

      tbody.appendChild(row);
    });
  }

  /* ============================================================
     9. [요청 반영] 가정안내문 간략 복사 및 팝업창 자동 표시
  ============================================================ */
  function openNoticeModal(text) {
    if (!elements.noticeModal) return;
    if (elements.noticeTextarea) {
      elements.noticeTextarea.value = text;
      if (elements.noticeCharCount) {
        elements.noticeCharCount.textContent = `${text.length}자`;
      }
    }
    elements.noticeModal.classList.remove('hidden');
    if (elements.noticeTextarea) {
      elements.noticeTextarea.focus();
      setTimeout(() => {
        elements.noticeTextarea.select();
      }, 50);
    }
  }

  function closeNoticeModal() {
    if (elements.noticeModal) {
      elements.noticeModal.classList.add('hidden');
    }
  }

  function handleCopyResult() {
    const record = getFormDataRecord();
    if (!record) return;

    const disease = STATE.selectedDisease;
    const diseaseName = disease ? disease.name.split(' (')[0] : record.disease.split(' (')[0];
    const returnCond = disease ? disease.releaseCondition : '증상 호전 및 담당 의사의 등교 가능 소견 시';
    const docReq = disease ? disease.documentReq : '진료확인서 또는 의사소견서';

    // 학부모 및 담임교사 전달용: 출처 문서 없이 깔끔하고 간결한 안내문
    let fluNotice = '';
    if (disease && (disease.id === 'influenza' || disease.name.includes('인플루엔자') || disease.name.includes('독감'))) {
      fluNotice = '\n※ [독감 등교 기준 안내] 해열제 복용 없이 정상체온을 회복한 후 24시간이 경과해야 등교 가능합니다. (단, 해열제를 투약한 경우에는 마지막 해열제 투약 시점부터 48시간 동안 발열이 없는지 경과 관찰 후 등교)';
    }

    const studentInfo = `${record.grade} ${record.class}${record.number ? ' ' + record.number + '번' : ''} ${record.name}`;

    const copyText = `[초등학교 보건실] 등교중지 및 출결 안내

■ 학생: ${studentInfo}
■ 질환명: ${diseaseName}
■ 증상 발생일: ${record.symptomDate}
■ 등교중지 시작일: ${record.suspendStartDate || record.suspendPeriod}
■ 실제 등교일: ${record.returnDate || '완치 및 등교 가능 소견 후'}
■ 등교 재개 기준: ${returnCond}
■ 제출 서류: ${docReq}

※ 감염병 전파 차단을 위해 전염력이 소실될 때까지 가정 내 요양 및 휴식을 부탁드립니다.${fluNotice}
※ 위 기간은 [출석인정 결석]으로 처리되며, 완치 후 등교 시 위 증빙 서류를 담임선생님께 제출해 주시기 바랍니다.`;

    // 1. 자동으로 클립보드 복사
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyText).then(() => {
        showToast('📋 가정안내문이 클립보드에 자동 복사되었습니다.');
        setFeedback('📋 학부모 알림장용 가정안내문이 팝업으로 표시되고 클립보드에 자동 복사되었습니다.', 'success');
      }).catch(() => {
        fallbackCopyText(copyText);
      });
    } else {
      fallbackCopyText(copyText);
    }

    // 2. [사용자 요청] 클릭 시 자동으로 팝업창(모달) 띄우기
    openNoticeModal(copyText);
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('📋 가정안내문이 복사되었습니다.');
    } catch (e) {
      showToast('⚠️ 복사에 실패했습니다.');
    }
    document.body.removeChild(textarea);
  }

  /* ============================================================
     10. 폼 리셋
  ============================================================ */
  function handleResetForm() {
    if (!confirm('입력한 학생 정보와 선택한 질병을 초기화하시겠습니까?')) return;

    elements.studentRecordForm.reset();
    elements.diseaseSearchInput.value = '';
    elements.btnClearSearch.classList.remove('show');
    elements.autocompleteList.classList.add('hidden');

    STATE.selectedDisease = null;

    const todayStr = formatDate(new Date());
    elements.inputSymptomDate.value = todayStr;
    if (elements.inputSuspendStartDate) elements.inputSuspendStartDate.value = todayStr;
    elements.inputReturnDate.value = '';
    if (elements.exampleSuspendPeriod) elements.exampleSuspendPeriod.textContent = '-';
    if (elements.exampleReturnDate) elements.exampleReturnDate.textContent = '-';
    elements.calcPeriodHint.textContent = '질병 선택 시 지침 권고 산정이 안내됩니다.';

    elements.decisionBasisEmpty.classList.remove('hidden');
    elements.decisionBasisContent.classList.add('hidden');
    elements.selectedDiseaseBadge.textContent = '선택 대기';

    const banner = elements.decisionBanner;
    banner.className = 'decision-banner default-state';
    elements.decisionIcon.textContent = 'ℹ️';
    elements.decisionStatusTitle.textContent = '질병을 선택하면 등교중지 여부가 안내됩니다';
    elements.decisionStatusPill.textContent = '대기';
    elements.decisionStatusPill.className = 'decision-pill status-ready';
    elements.decisionSummaryText.textContent = '질병명과 증상 발생 일자를 입력하시면 공식 매뉴얼 기준의 정확한 등교중지 필요 여부와 권고 기간이 산출됩니다.';

    if (elements.inputDiseaseCategory) elements.inputDiseaseCategory.value = '법정';
    initNeisDiseaseOptions();
    if (elements.inputCustomDisease) elements.inputCustomDisease.classList.add('hidden');
    if (elements.inputTreatmentStatus) elements.inputTreatmentStatus.value = '통원치료';
    if (elements.inputHospitalized) elements.inputHospitalized.value = '아니오';
    if (elements.inputDiscoveryRoute) elements.inputDiscoveryRoute.value = '개인진료';
    if (elements.inputSuspensionStatus) elements.inputSuspensionStatus.value = '등교중지';
    if (elements.inputConfirmedStatus) elements.inputConfirmedStatus.value = '확진';
    if (elements.inputRemarks) {
      elements.inputRemarks.value = '';
      elements.inputRemarks.placeholder = '환자의 치료현황 변경시 입력.\n증빙서류 제출 여부 입력';
    }
    if (elements.inputNeisReported) elements.inputNeisReported.value = '미보고';

    document.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('active'));

    showToast('새로운 학생 입력을 위해 초기화되었습니다.');
  }

  /* ============================================================
     10-1. 4세대 나이스 학생 찾기 모달
  ============================================================ */
  const SAMPLE_STUDENTS = [
    { grade: '1학년', class: '2반', number: '5', name: '김민준', gender: '남' },
    { grade: '2학년', class: '3반', number: '14', name: '이서아', gender: '여' },
    { grade: '3학년', class: '1반', number: '22', name: '박도윤', gender: '남' },
    { grade: '4학년', class: '4반', number: '8', name: '최지우', gender: '여' },
    { grade: '5학년', class: '2반', number: '17', name: '정예준', gender: '남' },
    { grade: '6학년', class: '5반', number: '11', name: '한소율', gender: '여' }
  ];

  function openStudentModal() {
    if (!elements.studentSearchModal) return;
    if (elements.searchStudentNameInput) {
      elements.searchStudentNameInput.value = elements.inputName.value || '';
    }
    renderStudentSampleList();
    elements.studentSearchModal.classList.remove('hidden');
    if (elements.searchStudentNameInput) {
      elements.searchStudentNameInput.focus();
    }
  }

  function closeStudentModal() {
    if (elements.studentSearchModal) {
      elements.studentSearchModal.classList.add('hidden');
    }
  }

  function applyStudentData(stu) {
    if (stu.name) elements.inputName.value = stu.name;
    if (stu.grade) elements.inputGrade.value = stu.grade;
    if (stu.class) elements.inputClass.value = stu.class;
    if (stu.number) elements.inputNumber.value = stu.number;
    if (stu.gender) elements.inputGender.value = stu.gender;
    closeStudentModal();
    showToast(`👤 '${stu.name}' (${stu.grade} ${stu.class}) 학생 정보가 입력되었습니다.`);
  }

  function renderStudentSampleList() {
    if (!elements.studentSampleList) return;
    elements.studentSampleList.innerHTML = '';

    const recentList = (STATE.history || []).slice(0, 4).map(h => ({
      grade: h.grade,
      class: h.class,
      number: h.number || '',
      name: h.name,
      gender: h.gender || '남'
    }));

    const listToRender = [...recentList];
    SAMPLE_STUDENTS.forEach(sample => {
      if (!listToRender.some(item => item.name === sample.name)) {
        listToRender.push(sample);
      }
    });

    listToRender.forEach(stu => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'student-chip-btn';
      btn.innerHTML = `<strong>${stu.name}</strong> <span class="meta">${stu.grade} ${stu.class}${stu.number ? ' ' + stu.number + '번' : ''} (${stu.gender})</span>`;
      btn.addEventListener('click', () => applyStudentData(stu));
      elements.studentSampleList.appendChild(btn);
    });
  }

  /* ============================================================
     11. 구글 스프레드시트 설정 모달 & 1초 진단 도구
  ============================================================ */
  function openSheetModal() {
    elements.inputAppsScriptUrl.value = STATE.sheetUrl || '';
    elements.modalTestResult.classList.add('hidden');
    if (elements.codeGsTextarea) {
      elements.codeGsTextarea.value = CODE_GS_FULL_SOURCE;
    }
    elements.sheetModal.classList.remove('hidden');
  }

  function closeSheetModal() {
    elements.sheetModal.classList.add('hidden');
  }

  function saveSheetUrl() {
    let url = elements.inputAppsScriptUrl.value.trim();
    if (!url) {
      STATE.sheetUrl = '';
      localStorage.removeItem('school_sheet_url');
      updateSheetBadge();
      showToast('연동 URL이 비워졌습니다. (로컬 저장 모드)');
      closeSheetModal();
      return;
    }

    if (url.includes('docs.google.com/spreadsheets') || url.endsWith('/edit')) {
      alert('⚠️ 입력하신 주소는 스프레드시트 자체 주소입니다!\n\n스프레드시트 메뉴 [확장 프로그램] → [Apps Script] 창의 우측 상단 파란색 [배포] → [새 배포]를 눌러 생성된 "/exec"로 끝나는 웹 앱 URL을 복사하여 넣어주세요.');
      return;
    }

    if (url.endsWith('/dev')) {
      const execUrl = url.slice(0, -4) + '/exec';
      if (confirm('현재 "/dev" 주소가 입력되어 있습니다. 이는 개발자 테스트 주소이므로 외부 전송 시 오류가 납니다.\n\n정식 주소인 "/exec"로 자동 변환하여 저장하시겠습니까?')) {
        url = execUrl;
        elements.inputAppsScriptUrl.value = url;
      }
    }

    STATE.sheetUrl = url;
    localStorage.setItem('school_sheet_url', url);
    updateSheetBadge();
    showToast('구글 시트 연동 URL이 저장되었습니다.');
    closeSheetModal();
  }

  function handleDiagnoseUrl() {
    let url = elements.inputAppsScriptUrl.value.trim();
    if (!url) {
      alert('⚠️ 먼저 웹 앱 URL을 입력해주세요.');
      elements.inputAppsScriptUrl.focus();
      return;
    }

    if (url.includes('docs.google.com/spreadsheets') || url.endsWith('/edit')) {
      alert('⚠️ 스프레드시트 본문 주소입니다. Apps Script의 [배포] 창에서 "/exec"로 끝나는 웹 앱 주소를 복사해 넣어주세요.');
      return;
    }

    if (url.endsWith('/dev')) {
      const execUrl = url.slice(0, -4) + '/exec';
      if (confirm('입력하신 주소가 테스트용 "/dev"로 끝나고 있습니다.\n\n정식 배포 주소인 "/exec"로 자동 변경하여 진단 창을 띄울까요?')) {
        url = execUrl;
        elements.inputAppsScriptUrl.value = url;
      }
    }

    // 새 탭에서 URL을 직접 열어 GET 응답 점검
    window.open(url, '_blank');
    showToast('🌐 새 탭에서 배포 상태를 점검합니다. {"status":"ok"}가 뜨면 정상입니다.');
  }

  function downloadCodeGs() {
    const blob = new Blob([CODE_GS_FULL_SOURCE], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('💾 Code.gs 파일이 다운로드되었습니다. 메모장으로 열어 전체 복사하실 수 있습니다.');
  }

  function toggleCodeView() {
    if (elements.codeViewContainer) {
      const isHidden = elements.codeViewContainer.classList.contains('hidden');
      if (isHidden) {
        elements.codeViewContainer.classList.remove('hidden');
        if (elements.codeGsTextarea) {
          elements.codeGsTextarea.value = CODE_GS_FULL_SOURCE;
          elements.codeGsTextarea.focus();
          elements.codeGsTextarea.select();
        }
      } else {
        elements.codeViewContainer.classList.add('hidden');
      }
    }
  }

  async function testSheetConnection() {
    let url = elements.inputAppsScriptUrl.value.trim();
    if (!url) {
      elements.modalTestResult.className = 'modal-test-result error';
      elements.modalTestResult.textContent = '⚠️ Google Apps Script 웹 앱 URL을 먼저 입력해주세요.';
      elements.modalTestResult.classList.remove('hidden');
      return;
    }

    if (url.includes('docs.google.com/spreadsheets') || url.endsWith('/edit')) {
      elements.modalTestResult.className = 'modal-test-result error';
      elements.modalTestResult.textContent = '⚠️ 입력하신 주소는 스프레드시트 본문 주소입니다. Apps Script의 [배포] → [새 배포]에서 생성된 "/exec"로 끝나는 웹 앱 URL을 넣어주세요.';
      elements.modalTestResult.classList.remove('hidden');
      return;
    }

    if (url.endsWith('/dev')) {
      url = url.slice(0, -4) + '/exec';
      elements.inputAppsScriptUrl.value = url;
    }

    elements.btnTestConnection.disabled = true;
    elements.btnTestConnection.textContent = '테스트 전송 중...';
    elements.modalTestResult.classList.add('hidden');

    try {
      // mode: 'no-cors'를 적용하여 구글 리디렉션 CORS 차단 방지
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping' })
      });

      elements.modalTestResult.className = 'modal-test-result success';
      elements.modalTestResult.innerHTML = '✅ 연동 테스트 신호가 구글 서버로 정상 전송되었습니다!<br /><small>더 확실한 권한 검증을 위해 옆의 <strong>[🌐 1초 배포 진단]</strong> 버튼을 눌러 새 탭에서 <code>{"status":"ok"}</code>가 뜨는지 확인해보세요.</small>';
      elements.modalTestResult.classList.remove('hidden');
    } catch (err) {
      elements.modalTestResult.className = 'modal-test-result error';
      elements.modalTestResult.textContent = '⚠️ 연결에 실패했습니다. Apps Script 배포 시 [액세스 권한: 모든 사용자]로 설정되었는지 확인해 주세요.';
      elements.modalTestResult.classList.remove('hidden');
    } finally {
      elements.btnTestConnection.disabled = false;
      elements.btnTestConnection.innerHTML = '<span class="btn-icon">⚡</span> 연동 테스트 전송';
    }
  }

  /* ============================================================
     12. 이벤트 바인딩
  ============================================================ */
  function bindEvents() {
    elements.diseaseSearchInput.addEventListener('input', handleSearchInput);

    elements.diseaseSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerSearchSubmit();
      }
    });

    if (elements.btnSearchSubmit) {
      elements.btnSearchSubmit.addEventListener('click', () => {
        triggerSearchSubmit();
      });
    }

    function triggerSearchSubmit() {
      const query = elements.diseaseSearchInput.value.trim();
      if (!query) {
        showToast('검색할 질병명이나 질병코드를 입력해주세요.');
        elements.diseaseSearchInput.focus();
        return;
      }
      const matches = findDiseases(query);
      if (matches.length > 0) {
        selectDisease(matches[0]);
        elements.autocompleteList.classList.add('hidden');
      } else {
        showToast('일치하는 감염병 정보가 없습니다.');
      }
    }

    elements.btnClearSearch.addEventListener('click', () => {
      elements.diseaseSearchInput.value = '';
      elements.btnClearSearch.classList.remove('show');
      elements.autocompleteList.classList.add('hidden');
      elements.diseaseSearchInput.focus();
    });

    document.addEventListener('click', (e) => {
      if (!elements.diseaseSearchInput.contains(e.target) && !elements.autocompleteList.contains(e.target)) {
        elements.autocompleteList.classList.add('hidden');
      }
    });

    elements.inputSymptomDate.addEventListener('change', () => {
      if (elements.inputSuspendStartDate) {
        elements.inputSuspendStartDate.value = elements.inputSymptomDate.value;
      }
      calculateDates();
    });

    if (elements.inputSuspendStartDate) {
      elements.inputSuspendStartDate.addEventListener('change', calculateDates);
    }

    elements.btnSaveToSheet.addEventListener('click', handleSaveToSheet);
    elements.btnCopyResult.addEventListener('click', handleCopyResult);
    elements.btnResetForm.addEventListener('click', handleResetForm);

    elements.btnClearHistory.addEventListener('click', () => {
      if (confirm('당일 로컬 관리대장 기록을 모두 비우시겠습니까? (구글 시트에 이미 기록된 내용은 삭제되지 않습니다)')) {
        STATE.history = [];
        localStorage.removeItem('school_disease_history');
        renderHistoryTable();
        showToast('로컬 내역이 비워졌습니다.');
      }
    });

    // 1. Code.gs 원클릭 복사 버튼
    const btnCopyCodeGs = document.getElementById('btnCopyCodeGs');
    if (btnCopyCodeGs) {
      btnCopyCodeGs.addEventListener('click', () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(CODE_GS_FULL_SOURCE).then(() => {
            btnCopyCodeGs.innerHTML = '<span class="btn-icon">✅</span> Code.gs 전체 복사 완료!';
            btnCopyCodeGs.style.backgroundColor = '#15803d';
            btnCopyCodeGs.style.color = '#ffffff';
            showToast('✅ Code.gs 코드가 클립보드에 복사되었습니다! Apps Script에 붙여넣기(Ctrl+V)하세요.');
            setTimeout(() => {
              btnCopyCodeGs.innerHTML = '<span class="btn-icon">📋</span> Code.gs 전체 코드 원클릭 복사하기';
              btnCopyCodeGs.style.backgroundColor = '';
              btnCopyCodeGs.style.color = '';
            }, 3000);
          }).catch(() => fallbackCopyText(CODE_GS_FULL_SOURCE));
        } else {
          fallbackCopyText(CODE_GS_FULL_SOURCE);
        }
      });
    }

    // 2. Code.gs 다운로드 버튼
    if (elements.btnDownloadCodeGs) {
      elements.btnDownloadCodeGs.addEventListener('click', downloadCodeGs);
    }

    // 3. 코드 직접 보기 토글 버튼
    if (elements.btnToggleCodeView) {
      elements.btnToggleCodeView.addEventListener('click', toggleCodeView);
    }

    // 4. 코드 텍스트 영역 클릭 시 전체 자동 선택
    if (elements.codeGsTextarea) {
      elements.codeGsTextarea.addEventListener('click', function () {
        this.select();
        showToast('전체 선택되었습니다. Ctrl+C를 눌러 복사하세요.');
      });
    }

    // 5. 1초 배포 진단 버튼
    if (elements.btnDiagnoseUrl) {
      elements.btnDiagnoseUrl.addEventListener('click', handleDiagnoseUrl);
    }

    elements.btnOpenSheetSettings.addEventListener('click', openSheetModal);
    elements.btnCloseModal.addEventListener('click', closeSheetModal);
    elements.sheetModal.addEventListener('click', (e) => {
      if (e.target === elements.sheetModal) closeSheetModal();
    });
    elements.btnSaveSheetUrl.addEventListener('click', saveSheetUrl);
    elements.btnTestConnection.addEventListener('click', testSheetConnection);

    // 6. 가정안내문 팝업 모달 이벤트
    if (elements.btnCloseNoticeModal) {
      elements.btnCloseNoticeModal.addEventListener('click', closeNoticeModal);
    }
    if (elements.btnCloseNoticeModalBtn) {
      elements.btnCloseNoticeModalBtn.addEventListener('click', closeNoticeModal);
    }
    if (elements.noticeModal) {
      elements.noticeModal.addEventListener('click', (e) => {
        if (e.target === elements.noticeModal) closeNoticeModal();
      });
    }

    if (elements.noticeTextarea) {
      elements.noticeTextarea.addEventListener('input', () => {
        if (elements.noticeCharCount) {
          elements.noticeCharCount.textContent = `${elements.noticeTextarea.value.length}자`;
        }
      });
    }

    if (elements.btnReCopyNotice) {
      elements.btnReCopyNotice.addEventListener('click', () => {
        const textToCopy = elements.noticeTextarea ? elements.noticeTextarea.value : '';
        if (!textToCopy) return;

        const originalBtnHtml = elements.btnReCopyNotice.innerHTML;
        const doCopyFeedback = () => {
          showToast('✅ 가정안내문 문구가 클립보드에 복사되었습니다!');
          elements.btnReCopyNotice.innerHTML = '<span class="btn-icon">✅</span> 복사 완료!';
          elements.btnReCopyNotice.style.backgroundColor = '#15803d';
          setTimeout(() => {
            elements.btnReCopyNotice.innerHTML = originalBtnHtml;
            elements.btnReCopyNotice.style.backgroundColor = '';
          }, 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textToCopy).then(doCopyFeedback).catch(() => {
            fallbackCopyText(textToCopy);
            doCopyFeedback();
          });
        } else {
          fallbackCopyText(textToCopy);
          doCopyFeedback();
        }
      });
    }

    // 8. 4세대 나이스(NEIS) 폼 이벤트
    if (elements.btnNeisSave) {
      elements.btnNeisSave.addEventListener('click', handleSaveToSheet);
    }
    if (elements.btnNeisReset) {
      elements.btnNeisReset.addEventListener('click', handleResetForm);
    }
    if (elements.btnFindStudent) {
      elements.btnFindStudent.addEventListener('click', openStudentModal);
    }
    if (elements.btnToggleNeisNotice && elements.neisNoticeBanner) {
      elements.btnToggleNeisNotice.addEventListener('click', () => {
        const isCollapsed = elements.neisNoticeBanner.classList.toggle('collapsed');
        elements.btnToggleNeisNotice.textContent = isCollapsed ? '▼' : '▲';
      });
    }

    if (elements.inputDiseaseCategory) {
      elements.inputDiseaseCategory.addEventListener('change', () => {
        initNeisDiseaseOptions();
        if (elements.inputCustomDisease) {
          elements.inputCustomDisease.classList.add('hidden');
        }
      });
    }

    if (elements.inputDiseaseSelect) {
      elements.inputDiseaseSelect.addEventListener('change', () => {
        const val = elements.inputDiseaseSelect.value;
        if (val === 'custom_legal' || val === 'custom_non_legal') {
          if (elements.inputCustomDisease) {
            elements.inputCustomDisease.classList.remove('hidden');
            elements.inputCustomDisease.focus();
          }
          return;
        }
        if (elements.inputCustomDisease) {
          elements.inputCustomDisease.classList.add('hidden');
        }
        if (val) {
          const match = DISEASE_DATABASE.find(d => d.id === val);
          if (match) {
            selectDisease(match);
          }
        }
      });
    }

    if (elements.inputTreatmentStatus) {
      elements.inputTreatmentStatus.addEventListener('change', () => {
        const val = elements.inputTreatmentStatus.value;
        if (elements.inputHospitalized) {
          elements.inputHospitalized.value = val.includes('입원') ? '예' : '아니오';
        }
      });
    }

    // 9. 학생 찾기 모달 이벤트
    if (elements.btnCloseStudentModal) {
      elements.btnCloseStudentModal.addEventListener('click', closeStudentModal);
    }
    if (elements.btnCloseStudentModalBtn) {
      elements.btnCloseStudentModalBtn.addEventListener('click', closeStudentModal);
    }
    if (elements.studentSearchModal) {
      elements.studentSearchModal.addEventListener('click', (e) => {
        if (e.target === elements.studentSearchModal) closeStudentModal();
      });
    }
    if (elements.btnApplyStudentName) {
      elements.btnApplyStudentName.addEventListener('click', () => {
        const query = elements.searchStudentNameInput ? elements.searchStudentNameInput.value.trim() : '';
        if (query) {
          elements.inputName.value = query;
          showToast(`👤 성명 '${query}'이(가) 입력되었습니다.`);
        }
        closeStudentModal();
      });
    }
    if (elements.searchStudentNameInput) {
      elements.searchStudentNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (elements.btnApplyStudentName) elements.btnApplyStudentName.click();
        }
      });
    }

    // 10. ESC 키로 모든 팝업 모달 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeNoticeModal();
        closeSheetModal();
        closeStudentModal();
      }
    });
  }

  // Google Apps Script Code.gs 전체 최신 소스코드 (나이스 열 순서 자동 인식 & 새 시트 자동 서식)
  const CODE_GS_FULL_SOURCE = `/**
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
    const gradeClassStr = rec.gradeClass || (rec.class ? (rec.grade + " " + rec.class) : rec.grade);

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

/**
 * 1~5행을 검사하여 실제 헤더 행을 감지하고, 열 순서 매핑 사전을 생성
 */
function detectHeaderRow(sheet) {
  const maxSearchRows = Math.min(Math.max(sheet.getLastRow(), 1), 6);
  const maxCols = Math.max(sheet.getLastColumn(), 25);

  for (let r = 1; r <= maxSearchRows; r++) {
    const rowValues = sheet.getRange(r, 1, 1, maxCols).getValues()[0];
    const rowText = rowValues.map(v => String(v || "").replace(/\\s+/g, "").toLowerCase()).join(" ");

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
    const raw = String(headers[i] || "").replace(/\\s+/g, "").toLowerCase();
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
}`;

  document.addEventListener('DOMContentLoaded', initApp);
})();
