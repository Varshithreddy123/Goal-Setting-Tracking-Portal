# ATOMQUEST HACKATHON 1.0 - Goal Setting & Tracking Portal

## Overview
Create a web-based portal for employee goal creation, manager approval, quarterly achievement tracking, and audit-ready reporting.

## Phase 1 - Goal Creation & Approval
- [ ] Employee interface to create and submit a Goal Sheet
  - [ ] Select Thrust Area
  - [ ] Enter Goal Title and Description
  - [ ] Select Unit of Measurement (Numeric, %, Timeline, Zero-based)
  - [ ] Set Target and Weightage for each goal
- [ ] Validation rules
  - [ ] Total weightage across goals must equal 100%
  - [ ] Minimum weightage per goal is 10%
  - [ ] Maximum 8 goals per employee
- [ ] Manager approval workflow
  - [ ] Review submitted goals
  - [ ] Inline edit targets / weightages during review
  - [ ] Approve or return for rework
  - [ ] Lock approved goals until Admin unlocks
- [ ] Shared Goals support
  - [ ] Admin / Manager push departmental KPI to multiple employees
  - [ ] Recipients can only adjust weightage for shared goals
  - [ ] Goal Title and Target are read-only for recipients
  - [ ] Achievement updates by primary owner sync across linked goals

## Phase 2 - Achievement Tracking & Quarterly Check-ins
- [ ] Quarterly achievement update interface for employees
  - [ ] Log Actual Achievement against Planned Target
  - [ ] Select status: Not Started / On Track / Completed
- [ ] Manager check-in module
  - [ ] View Planned vs Achievement for each team member
  - [ ] Add structured check-in comments
- [ ] Progress score computation per UoM type
  - [ ] Min (Numeric / %) — Achievement ÷ Target
  - [ ] Max (Numeric / %) — Target ÷ Achievement
  - [ ] Timeline — Completion date vs Deadline
  - [ ] Zero — 100% if 0, else 0%

## Quarterly Check-in Schedule
- [ ] Phase 1 goal setting window opens 1st May
- [ ] Q1 check-in window in July
- [ ] Q2 check-in window in October
- [ ] Q3 check-in window in January
- [ ] Q4 / Annual final capture in March / April

## User Roles & Capabilities
- [ ] Employee
  - [ ] Create and edit goals before submission
  - [ ] View locked goals
  - [ ] Enter quarterly actuals and status updates
- [ ] Manager (L1)
  - [ ] Approve / reject goals
  - [ ] Conduct quarterly check-ins
  - [ ] Log feedback/comments
  - [ ] View team dashboard and progress
- [ ] Admin / HR
  - [ ] Configure cycles and windows
  - [ ] Manage org hierarchy and roles
  - [ ] Unlock approved goals if required
  - [ ] View audit trail and completion status

## Reporting & Governance
- [ ] Achievement report export (CSV / Excel)
- [ ] Completion dashboard for quarterly check-ins
- [ ] Audit trail for goal changes after lock date
  - [ ] Log who changed what and when

## Bonus / Good-to-Have Features
- [ ] Microsoft Entra ID / Azure AD SSO integration
  - [ ] Single Sign-On
  - [ ] Org hierarchy sync from Azure AD
  - [ ] Role assignment from Azure AD group membership
- [ ] Email / Microsoft Teams notifications
  - [ ] Notifications for submission, approval, rework, and reminders
  - [ ] Teams deep links to goal sheets
- [ ] Escalation rules and logs
  - [ ] Auto-notify employee / manager / HR for overdue actions
  - [ ] Escalation log in Admin view
- [ ] Analytics and insights
  - [ ] QoQ achievement trends
  - [ ] Completion heatmaps / charts
  - [ ] Goal distribution by Thrust Area, UoM, status
  - [ ] Manager effectiveness comparison

## Deliverables
- [ ] Working web demo URL
- [ ] Source code repository link
- [ ] Architecture diagram (PDF or image)
- [ ] Login/switch credentials for Employee, Manager, Admin
