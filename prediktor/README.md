# ⚽ The Prediktor
### World Cup 2026 Prediction Game — PWA

A lean, mobile-first prediction game for you and your mates. No app store, no accounts — just a link, a nickname, and the football.

---

## What it does

- **Match score predictions** — enter scorelines for every game before the deadline
- **Tournament predictions** — winner, named scorers/assisters/goalies, card totals
- **Live leaderboard** — real-time standings as results come in
- **Auto-scoring** — results fetched from API-Football, points calculated automatically
- **PWA** — friends install it from their browser, works on any phone

---

## Scoring system

| Prediction | Points |
|---|---|
| Correct 90min result | 3 |
| Correct 90min score | 6 (includes result) |
| Correct ET result | +2 bonus |
| Correct ET score | +4 bonus |
| Correct after-ET score | 6 |
| Correct shootout result | +3 bonus |
| Correct shootout score | +6 bonus |
| Correct knockout fixture | 3 |
| Named scorer — goal | 2 per goal |
| Named assister — assist | 1 per assist |
| Named GK — clean sheet | 3 per game |
| Tournament winner | 15 |
| Golden Boot (outright) | 15 |
| Golden Boot (joint) | 10 per player |
| Most assists (outright) | 10 |
| Most assists (joint) | 5 per player |
| Most clean sheets (outright) | 15 |
| Most clean sheets (joint) | 10 per player |
| Total red cards (within 1) | 15 |
| Most red card team | 20 |
| Total yellows (within 10) | 25 |
| Most yellow card team | 20 |
| Fewest yellow card team | 30 |

---

## Setup — Step by step

### 1. Prerequisites

- [Node.js](https://nodejs.org) v18+
- A free [Firebase account](https://firebase.google.com)
- A free [API-Football account](https://www.api-football.com)

---

### 2. Firebase setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `prediktor` → create
3. In your project, go to **Firestore Database** → **Create database** → choose a region → **Start in test mode** (you'll lock it down later)
4. Go to **Project Settings** (gear icon) → **Your apps** → click the `</>` web icon → register an app named `prediktor`
5. Copy the `firebaseConfig` values — you'll need them in step 4

---

### 3. API-Football setup

1. Sign up at [api-football.com](https://www.api-football.com) (free tier: 100 req/day)
2. Go to your dashboard and copy your **API Key**

---

### 4. Configure environment

```bash
# In the project folder:
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

VITE_FOOTBALL_API_KEY=...

VITE_ADMIN_PASS=choose_a_secret_passphrase
```

---

### 5. Install and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you should see the join screen.

---

### 6. Deploy to Firebase Hosting (free)

```bash
# Install Firebase CLI (once)
npm install -g firebase-tools

# Login
firebase login

# Initialise (only needed once)
firebase init hosting
# → Choose your existing project
# → Public directory: dist
# → Single-page app: Yes
# → Don't overwrite index.html

# Build and deploy
npm run build
firebase deploy
```

Your app is now live at `https://your-project.web.app` 🎉

---

### 7. Invite your mates

Share the URL. On mobile they'll see **"Add to Home Screen"** — this installs it as a PWA, looking just like a native app.

---

## Running the game

### Before the tournament starts

1. Open the app, tap the logo **5 times** to access the admin panel
2. Enter your admin passphrase
3. Set the **prediction deadline** (recommended: kick-off of the first match)
4. Click **Sync from API** to load all fixtures
5. Share the URL with everyone and tell them to fill in their predictions!

### During the tournament

- After each match day, go to admin → **Run Scoring** to update the leaderboard
- You can sync fixtures as often as you like (stays within the free tier easily)
- As the tournament progresses, fill in **Tournament Outcomes** (top scorer etc.) in admin

### After the tournament

- Fill in all final Tournament Outcomes
- Run Scoring one last time
- Crown the winner 🏆

---

## Project structure

```
prediktor/
├── src/
│   ├── lib/
│   │   ├── firebase.js      # Firebase init
│   │   ├── db.js            # All Firestore reads/writes
│   │   ├── footballApi.js   # API-Football integration
│   │   └── scoring.js       # Complete scoring engine
│   ├── pages/
│   │   ├── Join.jsx         # Nickname entry / onboarding
│   │   ├── Fixtures.jsx     # Match predictions
│   │   ├── Tournament.jsx   # Tournament-wide predictions
│   │   ├── Leaderboard.jsx  # Live standings
│   │   └── Admin.jsx        # Admin panel (secret tap)
│   ├── App.jsx              # Root + navigation
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── firestore.rules          # Firestore security rules
├── firebase.json            # Firebase hosting config
├── vite.config.js           # Vite + PWA config
└── .env.example             # Environment variable template
```

---

## Notes

- **Player IDs** are stored in `localStorage` — if a player clears their browser data they'll need to re-join (they'll get a new entry on the leaderboard)
- **Admin access** is via tapping the logo 5 times — the passphrase is set in your `.env.local`
- **Firestore security rules** are currently open for development. Before going live, deploy `firestore.rules` with `firebase deploy --only firestore:rules`
- The free API-Football tier gives 100 requests/day — more than enough if you sync once or twice a day during the tournament

---

Good luck, and may the best predictor win! ⚽
