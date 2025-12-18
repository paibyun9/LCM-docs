const path = require("path");

const modPath = path.resolve(
  __dirname,
  "../../../lcm-server/step2/step2_options_generator.js"
);

const { generateStep2Options } = require(modPath);

test("Step2 options contract: always returns exactly 3 options", () => {
  const cases = [
    { ctx: {}, lang: "ko" },
    { ctx: { user_message: "환불 가능해?" }, lang: "ko" },
    { ctx: { user_message: "I want a refund" }, lang: "en" },
    { ctx: null, lang: "en" },
  ];

  for (const c of cases) {
    const res = generateStep2Options({ ctx: c.ctx, lang: c.lang });
    expect(res).toBeTruthy();
    expect(Array.isArray(res.options)).toBe(true);
    expect(res.options).toHaveLength(3);

    // ids must be stable (deterministic)
    expect(res.options[0].id).toBe("opt_official_flow");
    expect(res.options[1].id).toBe("opt_draft_message");
    expect(res.options[2].id).toBe("opt_followup");
  }
});