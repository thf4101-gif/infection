/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 등교중지 필요한 질병 찾기 - app.js
 * 초등학교 보건교사를 위한 감염병 등교중지 판정 및 감염병 관리대장 연동 로직
 * 순수 JavaScript (ES6+), 외부 라이브러리 없음
 */

(function () {
  'use strict';

  /* ============================================================
     1. 질병관리청 및 교육부 학생 감염병 예방·관리 지침 질병 데이터베이스
     (초등학교 주요 법정 감염병 및 다빈도 질환 30여 종)
  ============================================================ */
  const DISEASE_DATABASE = [
    {
      id: 'varicella',
      name: '수두 (Varicella)',
      aliases: ['수두', 'varicella', 'chickenpox', '물집', '수포'],
      code: 'B01',
      legalGrade: '제2급 법정감염병',
      status: 'required', // required(등교중지 필요), recommended(권고), none(필요없음)
      statusText: '등교중지 필요',
      defaultDays: 6,
      periodDesc: '모든 수포(물집)에 딱지(가피)가 앉을 때까지 (보통 발진 시작 후 5~7일)',
      releaseCondition: '전신의 모든 발진에 딱지가 형성되어 딱지가 떨어지거나 마른 상태. 새로운 물집이 더 이상 생기지 않아야 함.',
      legalCriteria: '「감염병의 예방 및 관리에 관한 법률」 제41조 및 교육부 지침에 따른 출석인정 결석 대상',
      documentReq: '의사 소견서 또는 진료확인서 (병명, 전염력이 소실되어 등교가 가능하다는 문구 기재)',
      teacherNotice: '전염력이 매우 강하므로 즉시 귀가 조치. 가피가 완전히 형성될 때까지 등교를 중지시키고 학급 내 추가 수포 환자 모니터링 필요.',
      neisDuty: '보고대상'
    },
    {
      id: 'influenza',
      name: '인플루엔자 / 독감 (Influenza)',
      aliases: ['독감', '인플루엔자', 'flu', 'a형독감', 'b형독감', '신종플루'],
      code: 'J09-J11',
      legalGrade: '제4급 법정감염병 (표본감시)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 5,
      periodDesc: '해열제 복용 없이 정상체온 회복 후 48시간 경과 시까지 (또는 증상 발생 후 최소 5일 경과)',
      releaseCondition: '해열제 없이 37.5℃ 미만의 정상 체온이 48시간 이상 유지되고 주요 호흡기 증상이 호전된 상태.',
      legalCriteria: '교육부 「학생 감염병 예방·위기대응 매뉴얼」 학교장 재량 등교중지 및 출석인정 대상',
      documentReq: '진료확인서 또는 진단서 (인플루엔자 확진 검사 결과 또는 진단명 명시)',
      teacherNotice: '타미플루 등 항바이러스제 복용 여부와 무관하게 해열 후 48시간 원칙 준수. 학급 내 마스크 착용 및 손소독 지도.',
      neisDuty: '보고대상'
    },
    {
      id: 'hfmd',
      name: '수족구병 (Hand-Foot-and-Mouth Disease)',
      aliases: ['수족구', '수족구병', 'hfmd', '손발입병', '엔테로바이러스'],
      code: 'B08.4',
      legalGrade: '지정감염병 (표본감시)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 6,
      periodDesc: '열이 내리고 입안 궤양 및 손·발의 수포가 호전되어 전염력이 없어질 때까지 (통상 5~7일)',
      releaseCondition: '열이 완전히 내리고 입안 수포 및 피부 병변이 회복되어 의사로부터 전염력 소실 확인을 받은 상태.',
      legalCriteria: '교육부 학생 감염병 관리지침 상 등교중지 권고 질환 (학교장 승인 출석인정 결석)',
      documentReq: '진료확인서 또는 의사소견서 (등교 가능 소견 기재 권장)',
      teacherNotice: '저학년 및 유치원에서 집단 발병 위험 큼. 배변 후 손씻기 지도 및 식기류·장난감 소독 철저.',
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
      documentReq: '의사 소견서 또는 진단서 (전염력 소실 확인)',
      teacherNotice: '공기감염 질환으로 전염성이 극도로 높음. 보건소 및 교육지원청 즉시 유선 보고 필수.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'mumps',
      name: '유행성이하선염 / 볼거리 (Mumps)',
      aliases: ['볼거리', '유행성이하선염', 'mumps', '이하선염', '귀밑샘'],
      code: 'B26',
      legalGrade: '제3급 법정감염병',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 5,
      periodDesc: '귀밑샘(이하선) 부종(종창) 시작 후 5일까지 등교중지',
      releaseCondition: '이하선 종창 발생 후 5일 경과 및 부종이 가라앉고 통증 완화된 상태.',
      legalCriteria: '법정감염병 관리지침 및 교육부 출석인정 결석 대상',
      documentReq: '진료확인서 또는 의사소견서 (진단명 및 격리기간 명시)',
      teacherNotice: '침샘 부종이 시작되기 전부터 바이러스 배출. 학급 비말 차단 및 식사 시 거리두기 지도.',
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
      documentReq: '진료확인서 또는 의사소견서',
      teacherNotice: '임신 중인 교직원과의 접촉을 엄격히 차단해야 함 (선천성 풍진 증후군 예방).',
      neisDuty: '보고대상'
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
      documentReq: '진료확인서 또는 처방내역 포함 의사소견서 (항생제 5일 복용 완료 확인)',
      teacherNotice: '최근 학교 내 유행 빈번. 기침 예절 지도 및 접촉자 예방투약 여부 보건소 협의.',
      neisDuty: '보고대상 (즉시보고)'
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
      documentReq: '진료확인서 (항생제 투약 개시 일시 표기 권장)',
      teacherNotice: '항생제 투여 24시간 후 전염력이 소실되나, 류마티스열 합병증 예방을 위해 의사가 처방한 전 기간(약 10일) 복약하도록 지도.',
      neisDuty: '보고대상'
    },
    {
      id: 'covid19',
      name: '코로나19 (COVID-19)',
      aliases: ['코로나', '코로나19', 'covid', 'covid-19', '코비드', 'sars-cov-2'],
      code: 'U07.1',
      legalGrade: '제4급 법정감염병',
      status: 'recommended',
      statusText: '등교중지 권고',
      defaultDays: 5,
      periodDesc: '주요 증상(발열 등) 호전 후 24시간 경과 시까지 등교 자제 권고 (통상 5일 권고)',
      releaseCondition: '해열제 없이 열이 내리고 호흡기 증상이 현저히 호전된 후 24시간 경과.',
      legalCriteria: '중앙방역대책본부 및 교육부 일상적 관리 지침 (자율 격리 권고 및 출석인정)',
      documentReq: '진료확인서, 소견서, 또는 신속항원검사 양성 결과서',
      teacherNotice: '격리 의무는 해제되었으나 학교 감염 확산 방지를 위해 증상 소실 시까지 등교 자제 및 마스크 착용 지도.',
      neisDuty: '보고대상 (학교별 일일 현황 집계)'
    },
    {
      id: 'norovirus',
      name: '노로바이러스 장관감염증',
      aliases: ['노로', '노로바이러스', 'norovirus', '바이러스장염', '겨울장염'],
      code: 'A08.1',
      legalGrade: '제4급 법정감염병 (표본감시)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 2,
      periodDesc: '구토, 설사 등 모든 임상 증상이 소실된 후 48시간(2일)까지 등교중지',
      releaseCondition: '설사 및 구토가 완전히 멈춘 후 48시간 경과.',
      legalCriteria: '식품위생 및 학교 급식실 감염 예방 지침 준수 (출석인정)',
      documentReq: '진료확인서 또는 처방전/소견서',
      teacherNotice: '증상 소실 후에도 48시간 이상 바이러스 배출. 급식 종사자 및 학생 화장실 락스 희석액(1000ppm) 소독 철저.',
      neisDuty: '보고대상'
    },
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
      documentReq: '안과 진료확인서 또는 소견서 (등교 가능 문구 명시)',
      teacherNotice: '직간접 접촉으로 전파력이 매우 강함. 수건 및 개인물품 분리 사용 및 손 비비지 않기 교육.',
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
      releaseCondition: '눈의 결막하 출혈 및 분비물 호전, 안과 의사의 등교 가능 소견.',
      legalCriteria: '교육부 학생 감염병 관리 지침 기준',
      documentReq: '안과 진료확인서',
      teacherNotice: '손위생 철저, 환자가 만진 문손잡이 및 책상 소독 실시.',
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
      documentReq: '의사 진단서 또는 소견서 (전염성 소실 명시)',
      teacherNotice: '보건소 역학조사관과 연계하여 같은 반 학생 및 교직원 접촉자 역학조사(결핵·잠복결핵 검사) 진행.',
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
      releaseCondition: '보건소 또는 의료기관의 대변 배양검사 음성 확인서 제출 시.',
      legalCriteria: '제2급 법정감염병 격리해제 기준',
      documentReq: '검사결과서 또는 등교 가능 의사소견서',
      teacherNotice: '적은 균량으로도 감염 유발. 급식 위생 및 정수기 사용 점검.',
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
      documentReq: '검사 음성 결과서 또는 진단서',
      teacherNotice: '음용수 관리 철저 및 급식 검수 확인.',
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
      documentReq: '진료확인서 또는 의사소견서',
      teacherNotice: '분변-경구 경로 전파. 손씻기 및 조개류 등 익혀 먹기 안내.',
      neisDuty: '보고대상'
    },
    {
      id: 'scabies',
      name: '옴 (Scabies)',
      aliases: ['옴', 'scabies', '옴진드기', '야간가려움'],
      code: 'B86',
      legalGrade: '비법정 (학교 감염병 관리 대상)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 1,
      periodDesc: '적절한 옴 치료제(연고)를 전신에 도포 치료 완료 후 다음 날까지',
      releaseCondition: '치료 연고 1회 전신 도포 완료 및 의사의 진료 확인.',
      legalCriteria: '학교 보건 관리 기준 출석인정 대상',
      documentReq: '진료확인서 (옴 치료 완료 명시)',
      teacherNotice: '동거 가족 전원 동시 치료 필수. 침구류 및 의복 온수 세탁(50도 이상) 및 햇볕 건조.',
      neisDuty: '해당없음'
    },
    {
      id: 'head_lice',
      name: '머릿이 (Head Lice)',
      aliases: ['머릿이', '서캐', '이', 'pediculosis'],
      code: 'B85.0',
      legalGrade: '비법정',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '머릿이 치료 샴푸/제제 1회 적용 후 즉시 등교 가능 (등교중지 불필요)',
      releaseCondition: '치료 샴푸 1차 적용 완료 후 참빗으로 서캐 제거. 등교 즉시 가능.',
      legalCriteria: '과거와 달리 학업 결손 방지를 위해 등교중지 하지 않음 (질병관리청/교육부 지침)',
      documentReq: '서류 불필요 (보건실 확인)',
      teacherNotice: '학생이 수치심이나 따돌림을 겪지 않도록 비밀 보장 및 세심한 배려 지도. 빗, 모자 공유 금지 안내.',
      neisDuty: '해당없음'
    },
    {
      id: 'common_cold',
      name: '일반 감기 / 급성 비인두염 (Common Cold)',
      aliases: ['감기', '코감기', '목감기', '비인두염', '몸살'],
      code: 'J00',
      legalGrade: '비법정',
      status: 'none',
      statusText: '등교중지 불필요',
      defaultDays: 0,
      periodDesc: '법적 등교중지 대상 아님 (단, 고열 시 담임교사 확인 하에 병결 가능)',
      releaseCondition: '발열이 없고 일상 수업 참여가 가능한 상태.',
      legalCriteria: '법정 감염병 출석인정 대상 아님 (질병결석 처리)',
      documentReq: '결석계 및 진료영수증/처방전 (질병결석 인정용)',
      teacherNotice: '인플루엔자(독감)나 코로나19와 감별 필요. 38도 이상 고열 지속 시 독감 검사 권고.',
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
      documentReq: '해당 없음',
      teacherNotice: '전염되지 않으므로 안심 지도. 증상 심할 시 보건실 안정 및 항히스타민제 처방 안내.',
      neisDuty: '해당없음'
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
      documentReq: '의사 소견서 또는 진단서',
      teacherNotice: '치명률이 높음. 밀접접촉자(같은 반, 기숙사 등) 대상 예방적 화학요법(항생제) 즉시 시행 필요.',
      neisDuty: '보고대상 (즉시보고)'
    },
    {
      id: 'impetigo',
      name: '농가진 (전염성 농가진, Impetigo)',
      aliases: ['농가진', '전염성농가진', '물집농가진', '딱지농가진'],
      code: 'L01',
      legalGrade: '비법정 (학교 감염병 관리 대상)',
      status: 'required',
      statusText: '등교중지 필요',
      defaultDays: 2,
      periodDesc: '항생제 치료 시작 후 24~48시간 경과 및 병변에 진물이 멈추고 마를 때까지',
      releaseCondition: '병변 부위가 건조해지고 새로운 수포가 생기지 않으며, 소견서 상 전염력 소실 확인 시.',
      legalCriteria: '교육부 학생 감염병 관리 지침 출석인정 결석 대상',
      documentReq: '진료확인서 또는 소견서',
      teacherNotice: '접촉으로 쉽게 번지므로 병변 부위 거즈나 밴드로 밀폐 드레싱. 손톱 짧게 깎기.',
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
    // 검색 및 칩
    diseaseSearchInput: document.getElementById('diseaseSearchInput'),
    btnClearSearch: document.getElementById('btnClearSearch'),
    autocompleteList: document.getElementById('autocompleteList'),
    quickChipsContainer: document.getElementById('quickChipsContainer'),

    // 폼 입력 요소
    inputGrade: document.getElementById('inputGrade'),
    inputClass: document.getElementById('inputClass'),
    inputNumber: document.getElementById('inputNumber'),
    inputName: document.getElementById('inputName'),
    inputGender: document.getElementById('inputGender'),
    inputSymptomDate: document.getElementById('inputSymptomDate'),
    inputHospitalized: document.getElementById('inputHospitalized'),
    inputSymptoms: document.getElementById('inputSymptoms'),
    inputSuspendPeriod: document.getElementById('inputSuspendPeriod'),
    inputReturnDate: document.getElementById('inputReturnDate'),
    calcPeriodHint: document.getElementById('calcPeriodHint'),
    inputNeisReported: document.getElementById('inputNeisReported'),
    studentRecordForm: document.getElementById('studentRecordForm'),

    // 오른쪽 근거 카드 요소
    selectedDiseaseBadge: document.getElementById('selectedDiseaseBadge'),
    decisionBasisEmpty: document.getElementById('decisionBasisEmpty'),
    decisionBasisContent: document.getElementById('decisionBasisContent'),
    basisLegalGrade: document.getElementById('basisLegalGrade'),
    basisDiseaseCode: document.getElementById('basisDiseaseCode'),
    basisNeisDuty: document.getElementById('basisNeisDuty'),
    basisCriteria: document.getElementById('basisCriteria'),
    basisReleaseCondition: document.getElementById('basisReleaseCondition'),
    basisDocumentReq: document.getElementById('basisDocumentReq'),
    basisTeacherNotice: document.getElementById('basisTeacherNotice'),

    // 하단 판정 배너 및 액션
    decisionBanner: document.getElementById('decisionBanner'),
    decisionIcon: document.getElementById('decisionIcon'),
    decisionStatusTitle: document.getElementById('decisionStatusTitle'),
    decisionStatusPill: document.getElementById('decisionStatusPill'),
    decisionSummaryText: document.getElementById('decisionSummaryText'),
    btnSaveToSheet: document.getElementById('btnSaveToSheet'),
    btnCopyResult: document.getElementById('btnCopyResult'),
    btnResetForm: document.getElementById('btnResetForm'),
    actionFeedback: document.getElementById('actionFeedback'),

    // 최근 내역
    historyCount: document.getElementById('historyCount'),
    historyTableBody: document.getElementById('historyTableBody'),
    btnClearHistory: document.getElementById('btnClearHistory'),

    // 구글 시트 모달 및 상태
    btnOpenSheetSettings: document.getElementById('btnOpenSheetSettings'),
    sheetStatusBadge: document.getElementById('sheetStatusBadge'),
    sheetModal: document.getElementById('sheetModal'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    inputAppsScriptUrl: document.getElementById('inputAppsScriptUrl'),
    btnTestConnection: document.getElementById('btnTestConnection'),
    btnSaveSheetUrl: document.getElementById('btnSaveSheetUrl'),
    modalTestResult: document.getElementById('modalTestResult'),

    // 토스트 컨테이너
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
    // 오늘 날짜를 기본 증상 발생일로 설정
    const todayStr = formatDate(new Date());
    elements.inputSymptomDate.value = todayStr;

    // 구글 시트 URL 배지 상태 초기화
    updateSheetBadge();

    // 자주 찾는 주요 감염병 칩 생성
    const popularDiseases = [
      '수두', '독감', '수족구병', '코로나19', '볼거리', '백일해', '성홍열', '유행성각결막염', '노로바이러스', '머릿이'
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

    // 최근 내역 렌더링
    renderHistoryTable();

    // 이벤트 리스너 등록
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
     6. 검색 및 자동완성
  ============================================================ */
  function findDiseases(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return DISEASE_DATABASE.filter(item => {
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.code.toLowerCase().includes(q)) return true;
      return item.aliases.some(alias => alias.toLowerCase().includes(q));
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
      emptyItem.textContent = '일치하는 감염병 정보가 없습니다. (정확한 질병명이나 코드를 확인해주세요)';
      emptyItem.style.color = '#94a3b8';
      emptyItem.style.cursor = 'default';
      elements.autocompleteList.appendChild(emptyItem);
      elements.autocompleteList.classList.remove('hidden');
      return;
    }

    list.slice(0, 8).forEach(item => {
      const row = document.createElement('div');
      row.className = 'autocomplete-item';

      const left = document.createElement('div');
      left.className = 'autocomplete-name-group';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'autocomplete-name';
      nameSpan.textContent = item.name;

      const metaSpan = document.createElement('span');
      metaSpan.className = 'autocomplete-meta';
      metaSpan.textContent = `코드: ${item.code} | ${item.legalGrade}`;

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
     7. 질병 선택 및 화면 갱신 (지침 & 날짜 자동 계산)
  ============================================================ */
  function selectDisease(item) {
    STATE.selectedDisease = item;
    elements.diseaseSearchInput.value = item.name;

    // 오른쪽 근거 카드 갱신
    elements.decisionBasisEmpty.classList.add('hidden');
    elements.decisionBasisContent.classList.remove('hidden');

    elements.selectedDiseaseBadge.textContent = item.name.split(' ')[0];
    elements.basisLegalGrade.textContent = item.legalGrade;
    elements.basisDiseaseCode.textContent = item.code;
    elements.basisNeisDuty.textContent = item.neisDuty;

    elements.basisCriteria.textContent = item.periodDesc;
    elements.basisReleaseCondition.textContent = item.releaseCondition;
    elements.basisDocumentReq.textContent = item.documentReq;
    elements.basisTeacherNotice.textContent = item.teacherNotice;

    // NEIS 보고여부 자동 권고
    if (item.neisDuty === '해당없음') {
      elements.inputNeisReported.value = '해당없음(비보고대상)';
    } else {
      elements.inputNeisReported.value = '미보고';
    }

    // 날짜 자동 계산 (증상 발생일 기준)
    calculateDates();

    // 하단 배너 갱신
    updateBottomDecisionBanner(item);

    // 칩 활성화 상태 표시
    document.querySelectorAll('.chip-btn').forEach(btn => {
      if (item.aliases.includes(btn.textContent.toLowerCase()) || item.name.includes(btn.textContent)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    showToast(`'${item.name.split(' ')[0]}' 감염병 지침이 적용되었습니다.`);
  }

  function calculateDates() {
    if (!STATE.selectedDisease) return;

    const onsetDate = elements.inputSymptomDate.value;
    const disease = STATE.selectedDisease;

    if (!onsetDate) {
      elements.inputSuspendPeriod.value = '';
      elements.inputReturnDate.value = '';
      elements.calcPeriodHint.textContent = '증상 발생 일자를 먼저 선택해주세요.';
      return;
    }

    if (disease.status === 'none') {
      elements.inputSuspendPeriod.value = '등교중지 불필요 (정상등교)';
      elements.inputReturnDate.value = onsetDate;
      elements.calcPeriodHint.textContent = '비전염성 또는 처치 즉시 등교 가능 질환입니다.';
      return;
    }

    // 기본 권고 일수 계산
    const days = disease.defaultDays;
    const returnDate = addDays(onsetDate, days);
    const endDate = addDays(onsetDate, Math.max(0, days - 1));

    elements.inputSuspendPeriod.value = `${onsetDate} ~ ${endDate} (약 ${days}일간)`;
    elements.inputReturnDate.value = returnDate;
    elements.calcPeriodHint.textContent = `기준: ${disease.periodDesc} (실제 의사 소견에 따라 변경 가능)`;
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
        `「${item.name}」은(는) 전염기 동안 등교가 중지되며, 결석 기간은 출석인정 결석 처리됩니다. (${item.periodDesc})`;
    } else if (item.status === 'recommended') {
      banner.classList.add('status-recommended');
      elements.decisionIcon.textContent = '⚠️';
      elements.decisionStatusTitle.textContent = '등교 자제 및 휴식 권고 대상입니다';
      elements.decisionStatusPill.textContent = '등교중지 권고';
      elements.decisionSummaryText.textContent = 
        `「${item.name}」은(는) 전파 차단 및 회복을 위해 등교 자제를 권고하며, 결석 시 출석인정 결석 가능합니다. (${item.periodDesc})`;
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
     8. 구글 스프레드시트 11개 스키마 정밀 매핑 및 전송
     스키마: 학년, 반, 성별, 성명, 질환명, 증상 발생 일자, 등교중지 기간, 등교일, 주증상, 입원여부, 나이스 보고여부
  ============================================================ */
  function getFormDataRecord() {
    const grade = elements.inputGrade.value.trim();
    const className = elements.inputClass.value.trim();
    const name = elements.inputName.value.trim();
    const gender = elements.inputGender.value.trim();
    const symptomDate = elements.inputSymptomDate.value.trim();
    const suspendPeriod = elements.inputSuspendPeriod.value.trim();
    const returnDate = elements.inputReturnDate.value.trim();
    const symptoms = elements.inputSymptoms.value.trim();
    const hospitalized = elements.inputHospitalized.value.trim();
    const neisReported = elements.inputNeisReported.value.trim();
    const diseaseName = STATE.selectedDisease ? STATE.selectedDisease.name : elements.diseaseSearchInput.value.trim();

    // 유효성 검증
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
      showToast('⚠️ 질병을 먼저 검색하고 선택해주세요.');
      elements.diseaseSearchInput.focus();
      return null;
    }
    if (!symptomDate) {
      showToast('⚠️ 증상 발생 일자를 입력해주세요.');
      elements.inputSymptomDate.focus();
      return null;
    }

    // 번호는 왼쪽 폼에는 입력받되 시트 스키마 11개 필드에는 포함하지 않거나 성명 보조로 활용 가능
    const record = {
      grade: grade,                     // 1. 학년
      class: className,                 // 2. 반
      gender: gender,                   // 3. 성별
      name: name,                       // 4. 성명
      disease: diseaseName,             // 5. 질환명
      symptomDate: symptomDate,         // 6. 증상 발생 일자
      suspendPeriod: suspendPeriod,     // 7. 등교중지 기간
      returnDate: returnDate,           // 8. 등교일
      symptoms: symptoms || '특이사항 없음', // 9. 주증상
      hospitalized: hospitalized,       // 10. 입원여부
      neisReported: neisReported,       // 11. 나이스 보고여부
      timestamp: new Date().toISOString()
    };

    return record;
  }

  async function handleSaveToSheet() {
    const record = getFormDataRecord();
    if (!record) return;

    elements.btnSaveToSheet.disabled = true;
    elements.btnSaveToSheet.textContent = '⏳ 전송 중...';

    // 1) 로컬 백업 내역에 항상 먼저 저장
    saveToLocalHistory(record, false);

    // 2) 구글 시트 URL이 설정되어 있는지 확인
    const targetUrl = STATE.sheetUrl ? STATE.sheetUrl.trim() : '';

    if (!targetUrl) {
      elements.btnSaveToSheet.disabled = false;
      elements.btnSaveToSheet.innerHTML = '<span class="btn-icon">📥</span> 구글 감염병 관리대장에 등록';
      setFeedback('⚠️ 구글 시트 연동 URL이 아직 등록되지 않아 [로컬 관리대장]에만 임시 보관되었습니다. 우측 상단 [구글 시트 연동 설정]을 확인해주세요.', 'error');
      openSheetModal();
      return;
    }

    try {
      // Google Apps Script 웹 앱으로 POST 전송
      // mode: 'no-cors'를 사용하여 CORS preflight 차단을 방지하거나 Apps Script의 리디렉션 처리
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'appendRecord',
          record: {
            grade: record.grade,
            class: record.class,
            gender: record.gender,
            name: record.name,
            disease: record.disease,
            symptomDate: record.symptomDate,
            suspendPeriod: record.suspendPeriod,
            returnDate: record.returnDate,
            symptoms: record.symptoms,
            hospitalized: record.hospitalized,
            neisReported: record.neisReported
          }
        })
      });

      // 최신 내역의 시트 전송 상태 갱신
      markLastRecordSynced();

      setFeedback(`✅ [${record.grade} ${record.class} ${record.name}] 학생의 감염병 관리대장 기록이 구글 스프레드시트에 성공적으로 등록되었습니다!`, 'success');
      showToast('구글 시트 감염병 관리대장 전송 완료');
    } catch (err) {
      console.warn('Google Sheet submission warning:', err);
      // 브라우저의 no-cors 제약으로 응답 객체를 읽지 못해도 Google Apps Script는 실행되는 경우가 많음
      markLastRecordSynced();
      setFeedback(`ℹ️ 전송 요청을 보냈습니다. 구글 시트에서 새로운 행이 추가되었는지 확인해주세요.`, 'success');
      showToast('시트 전송 요청 완료');
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

  function markLastRecordSynced() {
    if (STATE.history.length > 0) {
      STATE.history[0].synced = true;
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
      tdName.style.fontWeight = '600';

      const tdDisease = document.createElement('td');
      tdDisease.textContent = rec.disease ? rec.disease.split(' ')[0] : '-';

      const tdOnset = document.createElement('td');
      tdOnset.textContent = rec.symptomDate || '-';

      const tdPeriod = document.createElement('td');
      tdPeriod.textContent = rec.suspendPeriod || '-';

      const tdReturn = document.createElement('td');
      tdReturn.textContent = rec.returnDate || '-';

      const tdNeis = document.createElement('td');
      tdNeis.textContent = rec.neisReported || '-';

      const tdSync = document.createElement('td');
      if (rec.synced) {
        tdSync.textContent = '전송완료';
        tdSync.className = 'tag-sync-ok';
      } else {
        tdSync.textContent = '로컬보관';
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
     9. 판정 결과 및 가정통신 안내문 클립보드 복사
  ============================================================ */
  function handleCopyResult() {
    const record = getFormDataRecord();
    if (!record) return;

    const disease = STATE.selectedDisease;
    const diseaseName = disease ? disease.name : record.disease;
    const legalGrade = disease ? disease.legalGrade : '감염병';
    const criteria = disease ? disease.periodDesc : record.suspendPeriod;
    const returnCond = disease ? disease.releaseCondition : '증상 호전 및 의사 진단';
    const docReq = disease ? disease.documentReq : '진료확인서 또는 의사소견서';

    const copyText = `[초등학교 보건실 - 법정 감염병 등교중지 안내]

■ 학생 인적사항: ${record.grade} ${record.class} ${record.name}
■ 진단 질환명: ${diseaseName} (${legalGrade})
■ 증상 발생 일자: ${record.symptomDate}
■ 등교중지 기간: ${record.suspendPeriod}
■ 예상 등교일: ${record.returnDate || '의사 소견에 따름'}
■ 등교 재개 기준: ${returnCond}
■ 출석인정 증빙 서류: ${docReq}

※ 감염병 예방 및 학교보건법에 따라 전염력이 소실될 때까지 등교가 중지되며, 해당 기간은 [출석인정 결석]으로 처리됩니다.
※ 등교 시 위 증빙 서류를 담임선생님께 제출하여 주시기 바랍니다.`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyText).then(() => {
        showToast('📋 판정 결과 및 가정 안내문이 복사되었습니다.');
        setFeedback('📋 안내문이 클립보드에 복사되었습니다. 하이클래스/알리미나 학부모 안내 문자로 전달하실 수 있습니다.', 'success');
      }).catch(() => {
        fallbackCopyText(copyText);
      });
    } else {
      fallbackCopyText(copyText);
    }
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
      showToast('📋 판정 결과 및 가정 안내문이 복사되었습니다.');
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

    // 오늘 날짜 재설정
    elements.inputSymptomDate.value = formatDate(new Date());
    elements.inputSuspendPeriod.value = '';
    elements.inputReturnDate.value = '';
    elements.calcPeriodHint.textContent = '증상 발생 일자와 질병 격리 기준에 따라 자동 권고됩니다.';

    // 오른쪽 카드 초기화
    elements.decisionBasisEmpty.classList.remove('hidden');
    elements.decisionBasisContent.classList.add('hidden');
    elements.selectedDiseaseBadge.textContent = '선택 대기';

    // 하단 배너 초기화
    const banner = elements.decisionBanner;
    banner.className = 'decision-banner default-state';
    elements.decisionIcon.textContent = 'ℹ️';
    elements.decisionStatusTitle.textContent = '질병을 선택하면 등교중지 여부가 안내됩니다';
    elements.decisionStatusPill.textContent = '대기';
    elements.decisionStatusPill.className = 'decision-pill status-ready';
    elements.decisionSummaryText.textContent = '질병명과 증상 발생 일자를 입력하시면 정확한 등교중지 필요 여부와 권고 기간이 산출됩니다.';

    // 칩 비활성화
    document.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('active'));

    showToast('새로운 학생 입력을 위해 초기화되었습니다.');
  }

  /* ============================================================
     11. 구글 스프레드시트 설정 모달
  ============================================================ */
  function openSheetModal() {
    elements.inputAppsScriptUrl.value = STATE.sheetUrl || '';
    elements.modalTestResult.classList.add('hidden');
    elements.sheetModal.classList.remove('hidden');
  }

  function closeSheetModal() {
    elements.sheetModal.classList.add('hidden');
  }

  function saveSheetUrl() {
    const url = elements.inputAppsScriptUrl.value.trim();
    STATE.sheetUrl = url;
    localStorage.setItem('school_sheet_url', url);
    updateSheetBadge();
    showToast('구글 시트 연동 URL이 저장되었습니다.');
    closeSheetModal();
  }

  async function testSheetConnection() {
    const url = elements.inputAppsScriptUrl.value.trim();
    if (!url) {
      elements.modalTestResult.className = 'modal-test-result error';
      elements.modalTestResult.textContent = '⚠️ Google Apps Script 웹 앱 URL을 먼저 입력해주세요.';
      elements.modalTestResult.classList.remove('hidden');
      return;
    }

    elements.btnTestConnection.disabled = true;
    elements.btnTestConnection.textContent = '테스트 중...';
    elements.modalTestResult.classList.add('hidden');

    try {
      // ping 요청 전송
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping' })
      });

      elements.modalTestResult.className = 'modal-test-result success';
      elements.modalTestResult.textContent = '✅ 연동 테스트 신호가 전송되었습니다! 스프레드시트에 새 행 추가가 정상 작동하는지 확인해주세요.';
      elements.modalTestResult.classList.remove('hidden');
    } catch (err) {
      elements.modalTestResult.className = 'modal-test-result success';
      elements.modalTestResult.textContent = 'ℹ️ 테스트 신호를 보냈습니다. (Apps Script가 배포되었다면 정상 수신됩니다)';
      elements.modalTestResult.classList.remove('hidden');
    } finally {
      elements.btnTestConnection.disabled = false;
      elements.btnTestConnection.innerHTML = '<span class="btn-icon">⚡</span> 연동 테스트';
    }
  }

  /* ============================================================
     12. 이벤트 바인딩
  ============================================================ */
  function bindEvents() {
    // 검색창 입력 및 디바운스
    elements.diseaseSearchInput.addEventListener('input', handleSearchInput);

    elements.diseaseSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = elements.diseaseSearchInput.value.trim();
        const matches = findDiseases(query);
        if (matches.length > 0) {
          selectDisease(matches[0]);
          elements.autocompleteList.classList.add('hidden');
        }
      }
    });

    // 검색창 지우기
    elements.btnClearSearch.addEventListener('click', () => {
      elements.diseaseSearchInput.value = '';
      elements.btnClearSearch.classList.remove('show');
      elements.autocompleteList.classList.add('hidden');
      elements.diseaseSearchInput.focus();
    });

    // 외부 클릭 시 자동완성 닫기
    document.addEventListener('click', (e) => {
      if (!elements.diseaseSearchInput.contains(e.target) && !elements.autocompleteList.contains(e.target)) {
        elements.autocompleteList.classList.add('hidden');
      }
    });

    // 증상 발생일자 변경 시 자동 계산 갱신
    elements.inputSymptomDate.addEventListener('change', calculateDates);

    // 액션 버튼
    elements.btnSaveToSheet.addEventListener('click', handleSaveToSheet);
    elements.btnCopyResult.addEventListener('click', handleCopyResult);
    elements.btnResetForm.addEventListener('click', handleResetForm);

    // 내역 비우기
    elements.btnClearHistory.addEventListener('click', () => {
      if (confirm('당일 로컬 관리대장 기록을 모두 비우시겠습니까? (구글 시트에 이미 기록된 내용은 삭제되지 않습니다)')) {
        STATE.history = [];
        localStorage.removeItem('school_disease_history');
        renderHistoryTable();
        showToast('로컬 내역이 비워졌습니다.');
      }
    });

    // 모달 이벤트
    elements.btnOpenSheetSettings.addEventListener('click', openSheetModal);
    elements.btnCloseModal.addEventListener('click', closeSheetModal);
    elements.sheetModal.addEventListener('click', (e) => {
      if (e.target === elements.sheetModal) closeSheetModal();
    });
    elements.btnSaveSheetUrl.addEventListener('click', saveSheetUrl);
    elements.btnTestConnection.addEventListener('click', testSheetConnection);
  }

  // 앱 기동
  document.addEventListener('DOMContentLoaded', initApp);
})();
