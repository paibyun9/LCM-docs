// lcm-server/guards/non_negotiable_guard.cjs
// Day-5+: Non-Negotiable Rule Guard (Exit Gate compatible)
// Rule: Guidance-only. Never execute/approve on behalf of user. Block bypass/unofficial routes.
// Deterministic, domain-agnostic, no gate words.
// Return shape: { blocked, reason_code, message, output }

function assertNoGateWords(text) {
  const banned = [/gate\s*\d*/i, /게이트/];
  for (const rx of banned) {
    if (rx.test(String(text))) throw new Error("Gate word leak detected");
  }
}

function pickLang(lang = "ko") {
  return String(lang || "ko").toLowerCase().startsWith("en") ? "en" : "ko";
}

function safeMsg(messageKo, messageEn, lang = "ko") {
  const L = pickLang(lang);
  const msg = L === "en" ? messageEn : messageKo;
  assertNoGateWords(msg);
  return msg;
}

const REASON = Object.freeze({
  ACT_ON_USER_BEHALF: "ACT_ON_USER_BEHALF",
  GUARANTEE_DEMAND: "GUARANTEE_DEMAND",
  BYPASS_OR_UNOFFICIAL: "BYPASS_OR_UNOFFICIAL",
  ACCOUNT_ACCESS: "ACCOUNT_ACCESS",
});

function extractText(draft) {
  if (draft == null) return "";
  if (typeof draft === "string") return draft;
  if (typeof draft === "object") {
    return String(
      draft.text ??
        draft.content ??
        draft.message ??
        draft.output ??
        draft.result ??
        ""
    );
  }
  return String(draft);
}

// --- Core decision (NO throw) ---
function checkNonNegotiableDecision(user_message, lang = "ko") {
  const msg = String(user_message || "").trim();
  if (!msg) return { blocked: false, reason_code: null };

  // 1) 사용자 대신 행동(실행/클릭/신청/연락 등) + 우회 표현
  const actOnBehalfPatterns = [
    /내\s*대신/i,
    /대신\s*(해줘|해주세요|해\s*줘|해라|해줄래|해\s*줄래)/i,

    /대신.*(환불|반품|취소|결제|구매|예약|신청|접수|등록|변경|해지).*(신청|처리|접수|진행|완료).*(해줘|해주세요|해\s*줘)/i,
    /(환불|반품|취소|결제|구매|예약|신청|접수|등록|변경|해지).*(대신).*(신청|처리|접수|진행|완료).*(해줘|해주세요|해\s*줘)/i,

    /(대신|네가|너가).*(눌러|클릭|결제|주문|구매|신청|예약|등록|승인|확인).*(줘|해줘|해\s*줘)/i,
    /(판매자|고객센터|상담원|업체).*(네가|너가|대신).*(말|연락|문의|요청|전화)/i,
    /(네가|너가|대신).*(판매자|고객센터|상담원|업체).*(말|연락|문의|요청|전화)/i,

    /you\s*(submit|file|process|approve|cancel|refund|return|contact|call)\s*(it|this|them)?\s*(for\s*me|on\s*my\s*behalf)/i,
    /(do|handle)\s*(it|this)\s*(for\s*me|on\s*my\s*behalf)/i,
    /just\s*(click|press|submit)\s*(it|this)\s*for\s*me/i,
  ];

  // 2) 확정/보장/단정 요구
  const guaranteePatterns = [
    /(확정|보장|단정).*(환불|반품|취소|승인|가능)/i,
    /(환불|반품|취소|승인|가능).*(확정|보장|단정)/i,
    /100%\s*(가능|확정|보장|승인)/i,
    /(무조건|무조건적으로).*(환불|반품|취소|승인|가능)/i,
    /(절대|반드시).*(된다|가능하다|승인된다|환불된다)/i,
    /(guarantee|promise|confirm)\s*(a|the)?\s*(refund|return|approval|outcome)/i,
    /100%\s*(guarantee|sure|certain|confirmed)/i,
  ];

  // 3) 우회/비공식
  const bypassPatterns = [
    /우회|비공식/i,
    /hack|bypass|unofficial/i,
    /(몰래|비밀로).*(처리|진행|방법)/i,
  ];

  // 4) 계정 접근
  const accountAccessPatterns = [
    /(계정|아이디|비번|비밀번호|password)\s*(알려|공유|입력|제공|넘겨|줄게)/i,
    /로그인\s*해서.*(대신\s*)?(처리|진행|신청).*(해줘|해주세요|해\s*줘)/i,
    /로그인\s*해서\s*(해|해줘|진행|처리)/i,
    /(네가|너가|대신).*(로그인|접속|인증)/i,
    /(otp|인증번호|verification\s*code).*(알려|공유|입력|제공)/i,
  ];

  if (accountAccessPatterns.some((rx) => rx.test(msg))) {
    return { blocked: true, reason_code: REASON.ACCOUNT_ACCESS };
  }
  if (bypassPatterns.some((rx) => rx.test(msg))) {
    return { blocked: true, reason_code: REASON.BYPASS_OR_UNOFFICIAL };
  }
  if (actOnBehalfPatterns.some((rx) => rx.test(msg))) {
    return { blocked: true, reason_code: REASON.ACT_ON_USER_BEHALF };
  }
  if (guaranteePatterns.some((rx) => rx.test(msg))) {
    return { blocked: true, reason_code: REASON.GUARANTEE_DEMAND };
  }

  return { blocked: false, reason_code: null };
}

function messageForReason(reason_code, lang = "ko") {
  switch (reason_code) {
    case REASON.ACT_ON_USER_BEHALF:
      return safeMsg(
        "저는 대신 신청/처리/연락처럼 사용자를 대신해 행동할 수 없습니다. 대신 공식 절차 안내나 메시지 초안 작성은 도와드릴게요.",
        "I can’t take actions on your behalf (submit/process/contact). I can guide the official steps or draft a message for you.",
        lang
      );
    case REASON.GUARANTEE_DEMAND:
      return safeMsg(
        "저는 결과를 보장하거나 확정할 수 없습니다. 다만 기준에 따라 가능성을 판단하고 다음 행동을 안내해 드릴게요.",
        "I can’t guarantee or confirm outcomes. I can assess based on the criteria and guide the next step.",
        lang
      );
    case REASON.BYPASS_OR_UNOFFICIAL:
      return safeMsg(
        "비공식/우회 경로를 통한 요청은 도와드릴 수 없습니다. 대신 공식 절차로 진행할 수 있게 안내해 드릴게요.",
        "I can’t help with bypass/unofficial routes. I can guide you through the official process instead.",
        lang
      );
    case REASON.ACCOUNT_ACCESS:
      return safeMsg(
        "계정 접근(로그인/비밀번호/인증 등)이 필요한 요청은 도와드릴 수 없습니다. 대신 안전한 공식 절차로 안내해 드릴게요.",
        "I can’t help with anything requiring account access (login/password/verification). I can guide a safe official process instead.",
        lang
      );
    default:
      return safeMsg(
        "요청을 도와드릴 수 없습니다. 대신 안전한 공식 절차로 안내해 드릴게요.",
        "I can’t help with that request. I can guide a safe official process instead.",
        lang
      );
  }
}

/**
 * Exit Gate compatible:
 * IMPORTANT: checks ctx.user_message FIRST (true user intent),
 * then checks draft as a secondary safety check.
 */
function nonNegotiableGuard({ draft, ctx, lang = "ko" }) {
  // 1) User intent check (PRIMARY)
  const userMsg = String(ctx?.user_message || "").trim();
  if (userMsg) {
    const d1 = checkNonNegotiableDecision(userMsg, lang);
    if (d1.blocked) {
      return {
        blocked: true,
        reason_code: d1.reason_code,
        message: messageForReason(d1.reason_code, lang),
        output: null,
      };
    }
  }

  // 2) Draft/output check (SECONDARY)
  const text = extractText(draft);
  const d2 = checkNonNegotiableDecision(text, lang);
  if (d2.blocked) {
    return {
      blocked: true,
      reason_code: d2.reason_code,
      message: messageForReason(d2.reason_code, lang),
      output: null,
    };
  }

  return { blocked: false, reason_code: null, output: draft };
}

// Optional legacy wrapper (if anything still calls old API)
function checkNonNegotiable(user_message, lang = "ko") {
  const d = checkNonNegotiableDecision(user_message, lang);
  if (d.blocked) {
    const err = new Error(messageForReason(d.reason_code, lang));
    err.code = "NON_NEGOTIABLE_BLOCK";
    err.reason_code = d.reason_code;
    throw err;
  }
  return { ok: true };
}

module.exports = {
  nonNegotiableGuard,
  checkNonNegotiableDecision,
  checkNonNegotiable,
  REASON,
  _internal: { assertNoGateWords, extractText, messageForReason },
};