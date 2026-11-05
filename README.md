# 🌿 StudentLife

A pixel-art study companion for university students: tasks, course link folders, a calendar with exam countdowns, a Pomodoro timer with a study pet that levels up, and Spotify controls.

Built with **React + Vite**, **Firebase** (Google sign-in + Firestore), and hosted on **Vercel**.

## Features
- **Sign in** with Google, or try it as a guest (guests get sample data)
- **Dashboard**: tasks with priorities, "Due Soon" warnings, next deadline, next exam, course progress
- **My Course**: a folder per course for past year papers, notes and lecture Drive links
- **Calendar**: exams, classes (weekly repeats), meetings, task due dates, live exam countdowns
- **Focus**: Pomodoro timer (25/5 or 50/10) with an animated pet (cat, dog or turtle) that studies, sips coffee and naps with you
  - Floating mini timer, plus a pop-out window that stays on top of other apps (Chrome/Edge)
  - The pet cheers you on with motivation, fun facts and break tips
  - XP, coins, daily streaks and a Wardrobe of hats, glasses and desk items

## Run it on your computer (localhost)

### 1. Install Node.js
Install **Node.js LTS** from https://nodejs.org. Check it worked:
```
node -v
npm -v
```

### 2. Get the code and install packages
```
git clone https://github.com/AnisAtirah/StudentLife.git
cd StudentLife
npm install
```

### 3. (Optional) Turn on Spotify
Skip this if you don't need music controls; the rest of the app works without it. Playback control needs **Spotify Premium**.

1. Create an app at https://developer.spotify.com/dashboard (choose **Web API**).
2. Add this **Redirect URI** exactly:
   ```
   http://127.0.0.1:5173/spotify-callback.html
   ```
3. Copy `.env.example` to a new file named **`.env.local`** and paste in your Client ID:
   ```
   VITE_SPOTIFY_CLIENT_ID=your-client-id
   ```
   `.env.local` is private and is never committed.

### 4. Start the app
```
npm run dev
```
Open **http://localhost:5173** in **Chrome or Edge**.

- The terminal may show `http://127.0.0.1:5173`. That's fine: the app moves you to `localhost` automatically, because Firebase sign-in only allows `localhost`.
- Stop the server with `Ctrl + C`.

## Firebase setup
The app uses the Firebase project in `src/firebase.js`. That config is safe to commit; access to data is controlled by `firestore.rules`. In the [Firebase console](https://console.firebase.google.com):

1. **Authentication → Sign-in method**: enable **Google** and **Anonymous** (Anonymous is used for guest mode).
2. **Authentication → Settings → Authorized domains**: `localhost` is there by default. Add your Vercel domain for the live site.
3. **Firestore Database**: create a database (e.g. `asia-southeast1`).
4. **Firestore → Rules**: paste in the contents of `firestore.rules` and **Publish**.

To use your own Firebase project instead, replace the config in `src/firebase.js` with your project's web app config.

## Troubleshooting
| Problem | Fix |
|---|---|
| `Port 5173 is in use` | Another `npm run dev` is still running. Close that terminal and try again. The port is fixed to 5173 because Spotify needs the exact address. |
| Google sign-in: `auth/unauthorized-domain` | Use `http://localhost:5173`. For the live site, add its domain in Firebase → Authorized domains. |
| "This sign-in method is not turned on" | Enable Google / Anonymous in Firebase Authentication. |
| "Couldn't load your data" | Create the Firestore database and publish `firestore.rules`. |
| Pop-out timer does nothing | Open the app in a normal Chrome/Edge tab, not inside VS Code's built-in browser. |
| Spotify: "Invalid redirect URI" | The redirect URI in the Spotify dashboard must match step 3 exactly. |
| Spotify: "Open Spotify on your laptop or phone…" | Open the Spotify app and play any song once, then try again. |
| No sound | Check the 🔊 button on the Focus page. Browsers only allow sound after you click something on the page. |

## Other commands
```
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Deploying (Vercel)
Vercel builds automatically when `main` is pushed (`vercel.json` uses the Vite preset). For Spotify on the live site:
- Add `VITE_SPOTIFY_CLIENT_ID` in **Vercel → Project → Settings → Environment Variables**, then redeploy.
- Add `https://<your-vercel-domain>/spotify-callback.html` as a Redirect URI in the Spotify dashboard.

## Project structure
```
src/
  App.jsx            sign-in flow: login → character select → app
  MainApp.jsx        sidebar, banner, Home + Add Task, wires all pages together
  db.js              Firestore reads/writes and guest sample data
  CoursesPage.jsx    course folders and links
  CalendarPage.jsx   calendar, agenda, exam countdowns
  FocusPage.jsx      Pomodoro, pet, goals board
  petSprites.js      pixel-art pets (drawn on a 28×28 canvas)
  petGear.js         Wardrobe items
  petTalk.js         the pet's motivation lines, fun facts and tips
  rewards.js         XP, levels and streaks
  spotify.js         Spotify login (PKCE) and playback controls
  sounds.jsx         8-bit sound effects
firestore.rules      Firestore security rules
public/              images and the Spotify login return page
```
