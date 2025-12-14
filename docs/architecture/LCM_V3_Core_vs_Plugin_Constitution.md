# LCM V3 Core vs Plug-in Constitution
## (Day-2 Baseline – Frozen)

## 1. Core Definition (Immutable)

LCM V3 Core holds absolute authority over system integrity.

1. Core enforces all Non-Negotiable Rules at all times.
   - Vendor Rule
   - License Rule
   - Technology Rule
   - No exception, no override, no bypass.

2. Every request and action MUST pass Gate 1–5.
   - No execution, simulation, or proposal exists outside Gate validation.

3. Core MUST expose system decision states transparently to users.
   - Pending / Evaluating / Blocked / Executed / Rejected
   - UI/UX is the primary explanation channel.

4. Core exclusively owns execution authority.
   - Plug-ins may request actions.
   - Only Core decides and executes.

5. Core MUST remain domain-agnostic.
   - No dependency on Refund, Cancellation, or any future domain.

---

## 2. Plug-in Definition (Extension)

LCM V3 Plug-ins are strictly constrained extension modules.

1. Plug-ins contain domain calculation logic only.
   - No policy interpretation.
   - No license judgment.
   - No vendor rule handling.

2. Plug-ins MUST use Core-defined input/output interfaces only.
   - No interface extension or mutation.

3. Plug-ins CANNOT bypass Core Gates directly or indirectly.
   - No direct execution.
   - No implicit execution.
   - No side-channel execution.

4. Plug-ins are not standalone services.
   - They exist only through Core invocation.

5. Plug-ins MUST be replaceable without Core modification.

---

## 3. Boundary Violation Policy

- Core MUST NOT absorb Plug-in responsibility.
- Plug-ins MUST NOT redefine Core authority.
- Any design blurring this boundary is NOT considered LCM V3 compliant.

Boundary violations result in:
- CI failure
- PR rejection
- Architectural rejection regardless of functionality

---

## 4. Day-2 Completion Criteria

Day-2 is considered complete when:

> Refund or Cancellation Plug-ins can be replaced or removed  
> WITHOUT modifying a single line of Core code.

This document is frozen upon merge.
