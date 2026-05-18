# TODO - User Roles & Personas (Employee / Manager / Admin)

## Plan (approved)
1. Tighten API-level RBAC to match personas.
2. Enforce “locked goals” behavior as read-only mechanism for employees after submission.
3. Restrict unlocking (`locked=false`) strictly to Admin/HR.
4. Add role-aware filtering for check-ins.
5. Ensure manager can update approval-related fields/comments only.
6. Run lint/build and validate flows.

## Steps
- [ ] Inspect current API RBAC implementation for goals/check-ins and identify gaps.
- [ ] Update `src/app/api/goals/route.ts` (POST/GET) role rules.
- [ ] Update `src/app/api/goals/[id]/route.ts` (PATCH/GET/DELETE) role rules and locked/unlock rules.
- [ ] Update `src/app/api/checkins/route.ts` (POST/GET) role rules and filtering.
- [ ] Update `src/app/api/checkins/[id]/route.ts` (PATCH) role rules.
- [ ] Add any required validations (goal ownership/team ownership, allowed field updates).
- [ ] Run `npm run lint` and `npm run build`.
- [ ] Manual smoke-test: employee vs manager vs admin flows.

