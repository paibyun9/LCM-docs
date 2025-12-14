# Refund Plug-in v0 Contract
## (LCM V3 – CTO Approved)

## 0. Constitutional Precedence

This contract strictly follows:
- LCM V3 Core vs Plug-in Constitution

Violation of this contract invalidates the implementation.

---

## 1. What the Plug-in CAN Do

Refund Plug-in is allowed to:

1. Perform refund-related domain calculations.
2. Produce refund eligibility candidates.
3. Provide domain reason codes and explanatory notes.

Refund Plug-in provides inputs for decision-making,
NOT decisions.

---

## 2. What the Plug-in MUST NOT Do

Refund Plug-in MUST NOT:

- Interpret vendor policy
- Evaluate licenses
- Execute Non-Negotiable Rules
- Access or evaluate Gate logic
- Perform direct or automatic execution
- Override or reinterpret Core decisions

Refund Plug-in is a calculator, not a judge.

---

## 3. Input Contract (Conceptual)

Required inputs:
- order_id
- request_date
- refund_reason
- usage_status
- policy_snapshot_id (reference only)

Policy data may be passed for context,
but MUST NOT be interpreted.

---

## 4. Output Contract (Conceptual)

```json
{
  "refund_candidate": true | false,
  "domain_reason_code": "TIME_EXCEEDED | USED | ELIGIBLE",
  "confidence": "HIGH | MEDIUM | LOW",
  "notes": "Domain explanation text"
}


## 5. Core Interaction Rules

1. Plug-in is invoked only by Core.
2. Core decisions are final and irreversible.
3. Rejected decisions produce no further Plug-in action.

---

## 6. Replaceability Requirement

Refund Plug-in MUST be replaceable with:
- Cancellation Plug-in
- Exchange Plug-in
- Future domain Plug-ins

WITHOUT Core changes.

---

## 7. v0 Success Criteria

Refund Plug-in v0 is successful if:

> It can be removed or replaced  
> without modifying Core code.