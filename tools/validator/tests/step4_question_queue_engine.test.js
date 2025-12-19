const path = require("path");

const {
  initStep4Context,
  applyAnswer,
  getNextQuestion,
  isDone
} = require(path.resolve(__dirname, "../../../lcm-server/step4/question_queue_engine.js"));

function sampleQuestions() {
  return [
    { id: "Q1", text: "결제(또는 갱신) 날짜가 언제인가요?", required: true },
    { id: "Q2", text: "결제 경로(웹/앱/스토어)를 알고 계신가요?", required: true },
    { id: "Q3", text: "이용(사용) 여부가 있나요?", required: false }
  ];
}

test("returns first question when no answers", () => {
  const questions = sampleQuestions();
  const ctx = initStep4Context();

  const r = getNextQuestion({ questions, ctx });
  expect(r.done).toBe(false);
  expect(r.question.id).toBe("Q1");
});

test("returns next question after answering Q1", () => {
  const questions = sampleQuestions();
  let ctx = initStep4Context();

  ctx = applyAnswer(ctx, { id: "Q1", value: "today" });
  const r = getNextQuestion({ questions, ctx });

  expect(r.done).toBe(false);
  expect(r.question.id).toBe("Q2");
});

test("done becomes true after all answered", () => {
  const questions = sampleQuestions();
  let ctx = initStep4Context();

  ctx = applyAnswer(ctx, { id: "Q1", value: "today" });
  ctx = applyAnswer(ctx, { id: "Q2", value: "app store" });
  ctx = applyAnswer(ctx, { id: "Q3", value: "no" });

  expect(isDone({ questions, ctx })).toBe(true);

  const r = getNextQuestion({ questions, ctx });
  expect(r.done).toBe(true);
  expect(r.question).toBe(null);
});

test("deterministic: same ctx returns same next question", () => {
  const questions = sampleQuestions();
  const ctx = applyAnswer(initStep4Context(), { id: "Q1", value: "x" });

  const r1 = getNextQuestion({ questions, ctx });
  const r2 = getNextQuestion({ questions, ctx });

  expect(r1).toEqual(r2);
});

test("throws on duplicate question ids", () => {
  const questions = [
    { id: "Q1", text: "a", required: true },
    { id: "Q1", text: "b", required: true }
  ];
  expect(() => getNextQuestion({ questions, ctx: initStep4Context() })).toThrow();
});