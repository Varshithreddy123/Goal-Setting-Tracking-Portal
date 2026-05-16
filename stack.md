# Preferred Stack

## Frontend
- `Next.js` with `TypeScript`
- React-based pages and API routes
- `Tailwind CSS`


## Backend / Data
- `MongoDB` for structured goal tracking, approval, and check-in data
  - Ideal for flexible goal schemas and tracking shared goals
- `Firebase` for authentication, notifications, and optional realtime features
  - `Firebase Authentication` for user login and role-based access
  - `Firebase Cloud Messaging` / email notifications for updates and reminders
  - `Firebase Firestore` can be used for audit logs, check-in reminders, or lightweight realtime data if desired

## Hosting
- `Vercel` for Next.js frontend and backend routes
- `MongoDB Atlas` for managed MongoDB hosting
- `Firebase` console for auth and messaging integration

## Why this stack
- Next.js gives fast page rendering, route-based structure, and built-in API routes
- MongoDB matches the flexible goal/check-in model and supports cross-user shared goal links
- Firebase provides easy auth, role management, and push/notification capabilities
- Vercel + Atlas keeps deployment simple and low-cost

## Recommended architecture
- Next.js handles UI and backend API endpoints
- MongoDB stores users, goals, submissions, approvals, check-in entries, and reports
- Firebase handles authentication and optional notifications
- Use API routes for secure data access and manager/admin actions
