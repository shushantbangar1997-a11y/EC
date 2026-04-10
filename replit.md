# Everywhere Cars Frontend

## Overview
A React + Vite frontend for "Everywhere Cars" — a NYC luxury car service. The app serves multiple user roles (guest, customer, operator, admin) with role-based routing and authentication via JWT.

## Tech Stack
- **React 18** + **Vite 5**
- **Tailwind CSS 3** for styling
- **React Router DOM 6** for routing
- **Axios** for API communication (`src/utils/api.js`)
- **React Hot Toast** for notifications
- **React Icons** (Feather Icons set)
- **date-fns** for date formatting

## Architecture

### Entry Points
- `src/main.jsx` — React root mount
- `src/App.jsx` — Central router + layout (Navbar, Footer, WhatsAppWidget)
- `src/context/AuthContext.jsx` — JWT auth context

### Page Structure
- `src/pages/` — All pages organized by role:
  - `Home.jsx`, `Fleet.jsx`, `HowItWorks.jsx`, etc. — Public pages
  - `Quote.jsx` — **Public quote form** (no auth required)
  - `transfers/` — 8 SEO landing pages for route keywords
  - `auth/` — Login & Signup
  - `customer/` — BookRide, MyRides, RideDetails
  - `operator/` — Dashboard (with Quote Requests tab), Requests, Drivers, Revenue, Users
  - `admin/` — Dashboard, Users, Revenue

### Components
- `Navbar.jsx` — Sticky nav, role-aware, "Get a Quote" CTA for guests
- `Footer.jsx` — Footer links
- `WhatsAppWidget.jsx` — Fixed bottom-right WhatsApp floating button (wa.me/17182196683) with pulse animation
- `PlaceAutocomplete.jsx` — Address autocomplete (Google Maps or Photon fallback)
- `QuoteRequestsTab.jsx` — Operator view for public quote leads
- `ProtectedRoute.jsx` — Role-based route guard
- `SplashScreen.jsx` — 5-second video splash on app load

## Key Features

### Lead Generation (Task 10)
- `/quote` — Public quote form (no login required). Submits to `POST /api/quote-requests`.
- WhatsApp floating widget on all pages with pulse animation.
- 8 SEO route landing pages under `/transfers/:route` with H1, price range, FAQ, embedded quote form.
- Operator dashboard has a "Quote Requests" tab powered by `QuoteRequestsTab` component.

### SEO Transfer Routes
- `/transfers/jfk-to-manhattan`
- `/transfers/lga-to-manhattan`
- `/transfers/ewr-to-manhattan`
- `/transfers/jfk-to-brooklyn`
- `/transfers/manhattan-to-hamptons`
- `/transfers/nyc-to-philadelphia`
- `/transfers/nyc-to-connecticut`
- `/transfers/nyc-to-boston`

## API
- Base URL: `VITE_API_URL` env var, defaults to `http://localhost:5000/api`
- Auth: JWT stored in `localStorage`, attached via Axios interceptor
- Quote Requests: `POST /api/quote-requests` (no auth), `GET /api/quote-requests` (operator), `PATCH /api/quote-requests/:id/status` (operator)

## Running
```
npm run dev   # Development (port 5000 or next available)
npm run build # Production build
```

## Backend Notes
This is a frontend-only repository. The backend must implement:
- `POST /api/quote-requests` — Store lead (no auth middleware)
- `GET /api/quote-requests` — List all leads (operator auth)
- `PATCH /api/quote-requests/:id/status` — Update lead status
- Table: `quote_requests` with fields: id, name, email, phone, pickup, dropoff, ride_date, passengers, vehicle_type, notes, status (new/contacted/booked), created_at
