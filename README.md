# 🧨 Crackers of Fortune 3D (The Rigged Cracker Lottery)

An interactive, responsive 3D web experience built with **Three.js** and **Web Audio API** featuring a draggable candle, festive 3D crackers, particle explosion effects, a hilarious "rigged" prize reveal, and automatic redirection to a Google Form!

---

## 🌟 Features

1. **Interactive 3D Candle**:
   - Realistic 3D candle with a brass holder, wax stick with drips, and animated flickering flame.
   - Smooth drag & drop physics across desktop and mobile.
   - Real-time physics tilt in the direction of drag velocity and wind resistance on the flame.
   - Dynamic point light casting warm amber illumination and soft shadows.

2. **Festive 3D Crackers**:
   - **Mega Dynamite Stick**: Triple cylinder bundle with gold bands and braided fuse.
   - **Golden Anar (Flowerpot)**: Conical festive fountain with gold/red foil.
   - **Galaxy Cosmic Rocket**: Sleek rocket mounted on a wooden stick.
   - **Spinning Chakri**: Concentric spiral ground spinner with dynamic textures.
   - **Thunder Lakshmi Box**: Traditional green explosive box with criss-crossed jute twine.

3. **Ignition & Explosion Mechanics**:
   - Bring the candle flame within range of any cracker fuse to ignite it.
   - **1-Cracker Limit**: Once a cracker's fuse is ignited, all other crackers are locked out.
   - Sizzling fuse animation with sound and golden spark particles.
   - **Explosive Burst**:
     - Screen shake & camera recoil.
     - Dynamic 3D explosion with blast debris, shockwave rings, and colored fireworks sparks.
     - Full-screen confetti celebration.

4. **Rigged Lottery Prize**:
   - The prize algorithm is **rigged** — it *always* awards the player **"🎟️ YOU WON A TICKET!"**
   - Displays a celebratory golden ticket with a unique serial number and barcode.
   - **"What You COULD Have Won" Reveal**: Hilariously shows all the luxury prizes that "slipped away" (e.g. *iPhone 16 Pro Max*, *$10,000 Cash Chest*, *Tesla Model 3*, *Maldives Luxury Vacation*, *PS5 Pro*, *MacBook Pro M3 Max*) marked as **MISSED! ❌**.

5. **Google Forms Redirection**:
   - Automatically counts down (8 seconds) to redirect the user to a Google Form to claim their ticket.
   - Pause / Resume redirect controls.
   - **Customizable**: Change the Google Form URL directly from the in-app **⚙️ Settings** modal or in `src/main.js`. It persists automatically in `localStorage`.

6. **Web Audio Synthesizer**:
   - 100% standalone sound design synthesized directly using the Web Audio API — zero external `.mp3`/`.wav` assets to fail or lag!
   - Whoosh sound when moving candle, crackling fuse sizzle, heavy sub-bass explosion, and victory fanfare chimes.

---

## 🚀 How to Run

### Option 1: Vite Dev Server (Recommended)
```bash
cd "C:\Users\adars\.gemini\antigravity\scratch\cracker-lottery-3d"
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Production Build & Preview
```bash
npm run build
npm run preview
```
Open [http://localhost:4173](http://localhost:4173).

### Option 3: Standalone Single File (Zero Setup)
Double-click and open [`standalone.html`](./standalone.html) directly in any modern browser!

---

## ⚙️ Customizing the Google Forms Link
1. Click the **"⚙️ Form Link"** button in the top right corner of the website.
2. Enter your Google Form URL and click **Save Link**.
3. Alternatively, update `DEFAULT_FORM_URL` in `src/main.js`.
