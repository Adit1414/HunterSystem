# 🚀 QUICKSTART GUIDE - Hunter System

Get up and running in 5 minutes!

## ✅ Prerequisites Check

```bash
# Check Node.js (need 18+)
node --version

# Check npm
npm --version
```

Don't have Node.js? Download from: https://nodejs.org/

## 📦 Installation

### Step 1: Navigate to Project

```bash
cd hunter-system
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

**Wait for installation to complete** (~30 seconds)

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Wait for installation to complete** (~1 minute)

## 🏃 Running the App

### Terminal 1 - Start Backend

```bash
cd backend
npm run dev
```

**Expected output:**
```
Initializing database...
✓ Database initialized successfully
ℹ AI flavor text disabled (using templates)

═══════════════════════════════════════
   HUNTER SYSTEM - Backend Server     
═══════════════════════════════════════
   Status: Running
   Port: 3001
   URL: http://localhost:3001
   API: http://localhost:3001/api
═══════════════════════════════════════
```

✅ **Backend is ready!** Leave this terminal running.

### Terminal 2 - Start Frontend

**Open a NEW terminal window**, then:

```bash
cd frontend
npm run dev
```

**Expected output:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

✅ **Frontend is ready!**

### Step 4: Open the App

Navigate to: **http://localhost:3000**

You should see the Hunter System dashboard!

## 🎮 First Steps

1. **View your dashboard** - See your Level 1 Hunter status
2. **Create your first quest**:
   - Click "📋 Quests"
   - Click "+ New Quest"
   - Enter: "Complete the tutorial"
   - Select: D-Rank
   - Click "Create Quest"

3. **Complete the quest**:
   - Click "✓ Complete"
   - Watch the XP animation
   - Receive your first item!

4. **Check your inventory**:
   - Click "🎒 Inventory"
   - View your loot

## 🔧 Troubleshooting

### Backend won't start

**Error: Port 3001 already in use**
```bash
# Kill the process
# On Mac/Linux:
lsof -ti:3001 | xargs kill -9

# On Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Error: Cannot find module**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend won't start

**Error: Port 3000 already in use**
- Stop other apps using port 3000
- Or edit `frontend/vite.config.js` to use a different port

**Error: Failed to fetch**
- Ensure backend is running first
- Check backend logs for errors

### Database issues

**Error: Database locked**
```bash
cd backend/database
rm hunter.db-wal hunter.db-shm
# Restart backend
```

**Reset everything:**
```bash
cd backend/database
rm hunter.db
# Restart backend - will recreate database
```

## 🎯 Testing the System

### Create Quests of Different Difficulties

Try creating one of each rank:

- **E-Rank**: "Morning coffee" (50 XP)
- **D-Rank**: "Answer emails" (100 XP)
- **C-Rank**: "Finish report" (200 XP)
- **B-Rank**: "Complete project phase" (400 XP)
- **A-Rank**: "Ship major feature" (800 XP)
- **S-Rank**: "Launch product" (1600 XP)

### Complete Quests

- Complete E-rank quest → Get ~50 XP
- Complete D-rank → Get ~100 XP
- Keep completing until you level up!

### Level Up Rewards

- Level 5: Guaranteed rare+ item
- Level 10: Choose 1 of 3 legendary items
- Level 20: Rank up to B-Rank Hunter!

## 🤖 Optional: Enable AI Features

### 1. Install Ollama

Download from: https://ollama.com/

### 2. Download Model

```bash
ollama pull llama3.1:8b
```

**Wait for download** (~4.7 GB, takes 5-15 minutes)

### 3. Enable in Backend

Edit `backend/.env`:

```env
OLLAMA_ENABLED=true
ENABLE_AI_FLAVOR_TEXT=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

### 4. Restart Backend

Stop backend (Ctrl+C) and restart:

```bash
npm run dev
```

Expected output:
```
✓ AI flavor text enabled (Ollama connected)
```

### 5. Test AI

Create a quest without a description:
- Title: "Build new feature"
- Description: *leave blank*
- AI will generate flavor text!

## 🎨 Customization

### Change XP Rewards

Edit `backend/src/services/progressionEngine.js`:

```javascript
const BASE_XP = {
  'E': 100,  // Change from 50 to 100
  'D': 200,  // etc.
  // ...
};
```

### Change Theme Colors

Edit `frontend/src/styles/global.css`:

```css
:root {
  --accent-primary: #00d9ff;  /* Change to your color */
  --accent-gold: #ffd700;
  /* ... */
}
```

## 📊 Development Mode

Both terminals show live logs:

**Backend logs:**
- API requests
- Database operations
- Errors

**Frontend logs:**
- Component renders
- API calls
- Browser console (F12)

## 🛑 Stopping the App

1. Frontend terminal: `Ctrl+C`
2. Backend terminal: `Ctrl+C`

## 📱 Next Steps

- Read [README.md](README.md) for full features
- Check [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for code details
- Start building your productivity system!

---

**Need help?** Check the Troubleshooting section in README.md

**Happy Hunting! ⚔️**