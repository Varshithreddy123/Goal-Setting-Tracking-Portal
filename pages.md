# ATOMQUEST HACKATHON 1.0 - Portal Pages

## 1. Authentication
- `Login`
  - Sign in for Employee, Manager, Admin
  - Option to switch roles or use role-specific credentials
- `Logout`
  - End session and redirect to login page

## 2. Employee Pages
- `Employee Dashboard`
  - Overview of current goal sheets, status, and upcoming check-ins
  - Quick links to create goals, view locked goals, and update progress
- `Create Goal Sheet`
  - Form to add goals with Thrust Area, Title, Description, UoM, Target, Weightage
  - Validation for total weightage, minimum weightage, and max goals
- `Submitted Goals`
  - View goals pending manager approval
  - Status messages for rework requests and approval state
- `Locked Goal Sheet`
  - Read-only view of approved goals
  - Display shared goals and linked primary owner updates
- `Quarterly Achievement Update`
  - Interface to log Actual Achievement and select status (Not Started / On Track / Completed)
  - Show planned target, current achievement, and computed progress score

## 3. Manager Pages
- `Manager Dashboard`
  - Team summary with pending approvals and check-in status
  - Metrics for completion and overdue actions
- `Goal Approval Review`
  - List of team members with submitted goal sheets
  - Inline editing of targets and weightages during review
  - Approve, reject, or return goal sheets for rework
- `Team Check-in`
  - View planned vs actual data for each direct report
  - Add structured check-in comments and feedback
- `Shared Goals Management`
  - Push departmental KPIs to multiple employees
  - Route for managing linked goals and sync status

## 4. Admin / HR Pages
- `Admin Dashboard`
  - Organization-wide completion rates and cycle status
  - Overview of approvals, check-ins, and audit activity
- `Cycle Management`
  - Configure goal setting and quarterly windows
  - Set active periods for May, July, October, January, March/April
- `Hierarchy Management`
  - Manage employee-manager relationships and role assignments
- `Audit Trail`
  - View historical changes to locked goals with who changed what and when
- `Reporting`
  - Achievement report export (CSV / Excel)
  - Completion dashboard for employees and managers

## 5. Supporting Pages
- `Error / Validation`
  - Display user-friendly validation errors for goal creation and submission
- `Notifications`
  - Events for goal submission, approval, rejection, and check-in reminders
- `Help / About`
  - Instructions for using the portal and role guidance
