# GoalTrack Portal API (MongoDB + Mongoose)

All endpoints accept/return JSON only.

## Auth (mock verification)
The backend does **not** perform Firebase Admin token verification.

Include one of the following:
- JSON body fields: `uid`, `email`, `role`
- Or headers: `x-uid`, `x-email`, `x-role`

`role` must be one of: `employee | manager | admin`.

## Examples

### Register
**POST** `/api/auth/register`
```json
{
  "uid": "firebase_uid_1",
  "name": "Asha",
  "email": "asha@test.com",
  "role": "employee",
  "department": "Engineering",
  "password": "ignored_in_mock"
}
```

### List Users
**GET** `/api/users`
```text
Authorization: (mock)
- x-uid: admin_uid
- x-email: admin@test.com
- x-role: admin
```

### Create Goal
**POST** `/api/goals`
```json
{
  "uid": "employee_uid_1",
  "employeeId": "employee_uid_1",
  "title": "Increase conversion",
  "description": "Improve funnel conversion",
  "thrustArea": "Marketing",
  "uomType": "%",
  "target": 12.5,
  "weightage": 20,
  "deadline": "2026-12-31T00:00:00.000Z",
  "status": "Active",
  "approvalStatus": "Pending",
  "locked": false
}
```

### Update Goal
**PATCH** `/api/goals/[id]`
```json
{
  "weightage": 25,
  "locked": false
}
```

### Check-in
**POST** `/api/checkins`
```json
{
  "uid": "manager_uid_1",
  "goalId": "60f...",
  "quarter": "Q2",
  "plannedTarget": 100,
  "actualAchievement": 85,
  "progressStatus": "On Track",
  "managerComment": "Good progress"
}
```

### Update Check-in
**PATCH** `/api/checkins/[id]`
```json
{
  "progressStatus": "Completed",
  "actualAchievement": 100,
  "managerComment": "All set"
}
```


