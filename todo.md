# TODO - Enterprise PMS Backend Governance (RBAC/Locks/Shared KPI)

- [ ] Step 1: Tighten shared-recipient check-in governance
  - [x] POST `/src/app/api/checkins/route.ts`: block recipients (`goal.isShared=true && parentGoalId`) from creating check-ins
  - [x] PATCH `/src/app/api/checkins/[id]/route.ts`: block recipients from updating check-ins
  - [x] Keep primary-owner sync propagation intact


- [ ] Step 2: Add hierarchical scoping for manager reads
  - [ ] GET `/src/app/api/goals/route.ts` for manager: return only team goals (via `User.managerId`)
  - [ ] GET `/src/app/api/checkins/route.ts` for manager: return check-ins only for team goals

- [ ] Step 3: Consolidate locked/unlock governance + audit
  - [ ] Ensure admin unlock/override actions are audit logged consistently
  - [ ] Ensure manager cannot set forbidden fields that affect locking

- [ ] Step 4: Validate with lint/build + quick smoke tests
  - [ ] `npm run lint`
  - [ ] `npm run build`
  - [ ] Manual smoke tests for employee/manager/admin flows

