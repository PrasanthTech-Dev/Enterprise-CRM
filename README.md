# Enterprise CRM – User Panel

Employee / Sales Rep / Manager panel for the Enterprise CRM Platform.
Stack: React 18 · TypeScript · Vite · Tailwind CSS · Redux Toolkit · Recharts · React Router.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Sales Representative | sales@enterprisecrm.com | Sales@123 |
| Sales Manager | manager@enterprisecrm.com | Manager@123 |
| Employee | employee@enterprisecrm.com | Employee@123 |

Forgot-password OTP in the demo environment: `123456`.

## Modules
Auth (login, forgot/OTP/reset) · Dashboard · Leads (CRUD, status, follow-ups, convert to customer) ·
Kanban pipeline (drag & drop) · Customers (profile, history, deals) · Tasks · Activities ·
Reports & analytics · Notifications · Profile & settings.

## Role-based access
| | Employee | Sales Rep | Manager |
|---|---|---|---|
| Data scope | own | own | whole team |
| Leads | view / edit / status | + create | + delete, reassign |
| Pipeline | read-only | manage deals | manage + delete |
| Customers | view | create / edit | create / edit |
| Tasks & activities | manage own | manage own | manage team |
| Reports | personal | personal | team + leaderboard |

## Structure
```
src/
  app/          store, typed hooks, bootstrap thunk
  features/     Redux slices (auth, leads, deals, customers, tasks, activities, notifications, ui)
  components/   ui/ (Button, Field, Modal, Card, Feedback…), layout/, charts/
  pages/        one folder per module
  hooks/        useForm (validation), useScopedData (role scoping)
  utils/        constants, formatting, metrics
  data/         seed data
```

## Backend note
Data is served from a mock layer (seed data + localStorage persistence, simulated latency) so every
loading/error/empty state is exercised. Replace the thunks in `src/features/*` and `src/app/bootstrap.ts`
with real API calls when the Admin-side API is available.
