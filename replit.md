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

### Live Chat (Task 24)
- **Customer**: `src/components/ChatWidget.jsx` — floating bubble bottom-right (above WhatsApp), expand panel with optional name/email gate for guests, image attach (paperclip), heartbeat every 10s with current page url. Hidden on `/admin/*` and `/auth/*`. Persists `ec_chat_session_id`, `ec_chat_token`, `ec_chat_name`, `ec_chat_email`, `ec_chat_open` in localStorage.
- **Admin**: `src/pages/admin/LiveChat.jsx` — two-pane console (left: visitor list w/ online/recent split, right: thread + composer). Composer supports text, drag-drop, and paste-from-clipboard image upload. Sidebar nav group "Chat" with badge = active visitors.
- **Server**: `server/index.js` wraps Express in an `http.Server` + Socket.IO. Chat helpers (`ensureChatStores`, `upsertChatSession`, `appendChatMessage`, etc.) live in `server/db.js`. Events: `visitor:hello/heartbeat/typing/message`, `admin:hello (JWT)/join-session/leave-session/typing/message/end-session`. Server emits `chat:identity` (mints `session_id` + signed JWT chat_token), `chat:hello`, `chat:message`, `chat:transcript`, `chat:typing`, `chat:ended`, `chat:snapshot`, `chat:session-update`, `chat:auth-error`.
- **REST**: `POST /api/chat/upload` (multer, 5 MB images only — JPG/PNG/WEBP/GIF, **memory storage** so unauthenticated requests never write to disk; requires admin Bearer token OR matching `chat_token` + `session_id`; per-session rate limit 10/min); `GET /api/chat/sessions` (admin/operator); `GET /api/chat/sessions/:id/messages?chat_token=…` (visitor must present token, admin can fetch any).
- **Security**: `session_id` is server-minted (never trusted from client); `chat_token` is a signed JWT (`kind:'chat'`) verified on transcript fetch and uploads; `clean()` helper trims control chars and clamps lengths on every inbound field; presence map capped at 5000 entries with LRU eviction and 5 sockets/session; cleanup timers deduped via `cleanupTimers` map; image_url validated to start with `/uploads/chat/`; ChatWidget uses `openRef` to avoid stale closures on unread counts.
- **Wiring**: `src/App.jsx` mounts `<ChatWidget />` and lazy-loads `/admin/live-chat`. `vite.config.js` proxies `/socket.io` (with `ws:true`) and `/uploads`.

### Admin Leads Capture (Task 23)
- `/admin/leads` (All Leads) and `/admin/leads/hot` (Hot only) — sales pipeline view of every quote request, normalized to status keys `new | quoted | confirmed | lost`. A lead is "hot" if created in the last 24h, has zero bids, and is not confirmed/lost. Default view hides Lost leads.
- `src/pages/admin/Leads.jsx` — dense sortable table (customer / contact / route / date / vehicle / status / created / one-tap actions), search box, status filter chips with counts, hot-row indicator. Side drawer with full profile, bid history, autosave admin notes (700ms debounce, race-safe across lead switches), Mark as Lost (with optional reason) and Reopen.
- `src/pages/admin/AdminPortalLayout.jsx` — new "Leads" nav group between Live and Orders with badges for total + hot. Polls `/admin/leads` alongside the existing 5s admin tick.
- Backend: `GET /api/admin/leads` (with `status` / `hot` / `search` query params; returns enriched leads + counts block), `PATCH /api/admin/leads/:id/notes` (admin notes, 4000-char cap), `POST /api/admin/leads/:id/lose` (with reason), `POST /api/admin/leads/:id/reopen` (restores to `quoted` if bids exist, else `pending`). All scoped to admin/operator role. Helpers: `leadsHotFlag`, `leadStatusKey`, `enrichLead` join the registered customer profile and override guest fields.
- Field additions on `quote_requests` (`admin_notes`, `lost_reason`, `lost_at`) ride on the existing spread-based `db.updateQuoteRequest` — no schema migration required.

### Intelligent Dispatch Homepage (Task 12)
- `Home.jsx` — Rebuilt as split-screen dispatch interface. Left 58%: `DispatchPanel`. Right 42%: `NYCActivityCanvas`. Shared pickup/dropoff state flows up and down to trigger route visualization on canvas. Below-fold trust strip (Licensed & Insured, 250+ Vehicles, 24/7 Support, phone). Dark `#050a0f` page background.
- `DispatchPanel.jsx` — 5-state booking glass card (idle → route → details → contact → bids). Features: simulated live stats bar (vehicles/response/rides), voice input with waveform, smart badges (airport/hotel/peak-hour), vehicle selector with live price estimate, gold "DISPATCH MY RIDE" CTA with pulse, full bid board with countdown/skeleton/BidCards, typewriter text in bid state.
- `NYCActivityCanvas.jsx` — Canvas-based NYC visualization: street grid, 28 animated electric-blue ride dots with trails, gold pickup marker and white dropoff marker with animated dashed route line between them (position mapped from city area keywords).
- `src/utils/priceEstimator.js` — Client-side price lookup. `getPriceEstimate(vehicleType, routeType) → { low, high }`. Smart detection: airport keywords (JFK/LGA/EWR/FBO), hotel chains, peak hours, route type (local/airport/long). `approximatePosition(text, W, H)` maps city areas to canvas coordinates.
- `Navbar.jsx` — Now transparent with `backdrop-filter: blur(4px)` on homepage only. On scroll past 60px: transitions to solid dark navy with shadow. Scroll listener + `useLocation` detection.
- **Deleted:** `ConversationalBooker.jsx`, `LiveBidBoard.jsx` (replaced by DispatchPanel states 3/4).

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

## API & Backend

### Backend (server/)
- Express.js API server running on **port 3001** (`server/index.js`)
- JSON file persistence at `server/data/db.json` (`server/db.js`)
- Vite dev proxy: all `/api/*` requests from the frontend → backend via `vite.config.js`
- `src/utils/api.js` uses relative `/api` base URL (proxied by Vite)

### Auth Accounts (seeded)
- **Operator:** `operator@everywherecars.com` / `operator123`
- **Admin:** `admin@everywherecars.com` / `admin123`

### Key Endpoints
- `POST /api/auth/login` / `POST /api/auth/register` / `GET /api/auth/me`
- `POST /api/quote-requests` — Customer dispatches a ride (no auth required)
- `GET /api/quote-requests` — Operator lists all incoming requests
- `GET /api/quote-requests/:id` — Customer polls for bids (returns `bids` array)
- `PATCH /api/quote-requests/:id` — Operator submits bid (`bid_price`, `eta_minutes`, `notes`) + also creates bid entry for polling
- `PATCH /api/quote-requests/:id/status` — Update request status
- `POST /api/quote-requests/:id/bids` — Explicit bid creation endpoint
- `GET /api/operator/dashboard` — Operator stats
- `GET /api/operator/requests` — Recent requests for operator dashboard
- `GET /api/drivers` / `POST /api/drivers` — Driver management
- `GET /api/revenue` — Revenue stats

### Dispatch Flow
1. Customer fills dispatch form → `POST /api/quote-requests` → saved with `status: pending`
2. Operator sees ride on their dashboard → "Quote Requests" tab
3. Operator clicks "Send Bid" → `PATCH /api/quote-requests/:id` with `bid_price`/`notes` → creates bid entry + sets status `quoted`
4. Customer's bid board polls `GET /api/quote-requests/:id` every 5s → bid appears with operator name, price, and ETA
5. Customer clicks "SELECT THIS RIDE" → navigated to `/signup` (if guest) or `/book` (if logged in)

## Running
```
node server/index.js   # API server on port 3001 (workflow: "Start API server")
npm run dev            # Vite frontend on port 5000 (workflow: "Start application")
```
