# DailyOps

Planifica, ejecuta y mide tu trabajo diario.

## Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TypeScript, Tailwind CSS v4
- **State:** Zustand + persist middleware
- **Icons:** Lucide React
- **Animation:** Motion (motion/react)
- **Utilities:** clsx, tailwind-merge, date-fns

## Routes

| Route       | Description                     |
| ----------- | ------------------------------- |
| `/today`    | Daily plan with timer & subtasks|
| `/backlog`  | Task inventory                  |
| `/add-task` | Create new tasks                |
| `/recurring`| Manage recurring tasks          |
| `/history`  | Past daily plans & summaries    |
| `/settings` | Projects, Jira connections, theme|

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## API

The frontend expects an API at `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000/api/v1`).
