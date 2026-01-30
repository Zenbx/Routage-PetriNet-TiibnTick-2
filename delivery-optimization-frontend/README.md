# Delivery Optimization Frontend

Next.js 14+ dashboard for the Pick and Drop delivery system.

## Features
- **Interactive Maps**: Road network and tracking using Leaflet.
- **Performance Charts**: Cost breakdowns and Kalman confidence intervals.
- **Real-time Tracking**: Live updates via WebSockets.
- **Tour Planning**: Interactive tool to assign and optimize deliveries.

## Setup
1. Install dependencies:
```bash
npm install
```
2. Set `NEXT_PUBLIC_API_URL` in `.env.local`.
3. Run development server:
```bash
npm run dev
```

## Tech Stack
- Next.js 14 (App Router)
- Lucide React (Icons)
- Recharts (Visualizations)
- TailwindCSS (Styling)
- Zustand (State Management)
