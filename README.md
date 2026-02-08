# Hunter System - Solo Leveling Inspired Productivity App

A gamified to-do list application inspired by the anime "Solo Leveling", where completing tasks grants XP, levels, and items. Built with React, Node.js, Express, and SQLite.

## 🎮 Features

- **Quest System**: Create tasks with difficulty rankings (E-S rank)
- **Progression**: Earn XP and level up by completing quests
- **Loot System**: Random item drops based on quest difficulty
- **Rarity Tiers**: Common, Rare, Epic, Legendary, Mythic items
- **Anti-Grind Mechanics**: Diminishing returns on easy quest spam
- **Dark Fantasy UI**: Solo Leveling-inspired aesthetic
- **AI Integration** *(Optional)*: LLM-generated flavor text via Ollama

## 🏗️ Architecture

```
Frontend: React + Vite
Backend: Node.js + Express
Database: SQLite
AI (Optional): Ollama + LangChain
```

## 📋 Prerequisites

- Node.js 18+ (https://nodejs.org/)
- npm or yarn
- **Optional**: Ollama with LLaMA 3.1 8B (https://ollama.com/)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Backend

Edit `backend/.env`:

```env
PORT=3001
DATABASE_PATH=./database/hunter.db

# Optional AI features
OLLAMA_ENABLED=false
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

### 3. Initialize Database

```bash
cd backend
npm run init-db
```

Or the database will auto-initialize on first server start.

### 4. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The app will open at `http://localhost:3000`

## 🎯 Usage Guide

### Creating Quests

1. Click "📋 Quests" in navigation
2. Click "+ New Quest"
3. Enter title, description (optional), difficulty (E-S), and due date (optional)
4. AI will generate flavor text if enabled, otherwise uses templates

### Quest Difficulty Guide

- **E-Rank**: Easy daily tasks (50 XP)
- **D-Rank**: Normal tasks (100 XP)
- **C-Rank**: Challenging tasks (200 XP)
- **B-Rank**: Hard projects (400 XP)
- **A-Rank**: Major milestones (800 XP)
- **S-Rank**: "Boss" tier quests (1600 XP)

### Completing Quests

- Click "Complete" on any active quest
- Receive XP (with bonuses for on-time completion)
- Random item drops based on difficulty
- Level up triggers special rewards

### Level-Up Rewards

- **Every 5 levels**: Guaranteed Rare+ item
- **Every 10 levels**: Choose 1 of 3 Legendary items
- **Milestone levels**: Rank promotions (E → D → C → B → A → S)

### Inventory

- View all collected items
- Sorted by rarity (Mythic first)
- Filter by type: Weapon, Armor, Accessory, Consumable
- Discard unwanted items

## 🤖 AI Integration (Optional)

### Setup Ollama

1. Install Ollama: https://ollama.com/
2. Download LLaMA 3.1 8B:
   ```bash
   ollama pull llama3.1:8b
   ```
3. Start Ollama (usually auto-starts)
4. Enable in `backend/.env`:
   ```env
   OLLAMA_ENABLED=true
   ENABLE_AI_FLAVOR_TEXT=true
   ```

### AI Features

- Generates quest descriptions
- Creates item flavor text
- Produces motivational level-up messages
- Falls back to templates if unavailable

## 📊 Game Mechanics

### XP Formula

```javascript
baseXP[difficulty] * completionBonus * qualityBonus

Bonuses:
- On-time completion: +20%
- Anti-grind penalty: -50% max (after 10 E-ranks in 24h)
```

### Level Curve

```javascript
XP for level N = 100 * N^1.5

Examples:
Level 1→2:   100 XP
Level 5→6:   1,118 XP
Level 10→11: 3,162 XP
Level 50→51: 17,677 XP
```

### Drop Rates

| Difficulty | Common | Rare | Epic | Legendary | Mythic |
|------------|--------|------|------|-----------|--------|
| E-Rank     | 80%    | 15%  | 4%   | 1%        | 0%     |
| D-Rank     | 60%    | 30%  | 8%   | 2%        | 0%     |
| C-Rank     | 40%    | 40%  | 15%  | 4%        | 1%     |
| B-Rank     | 20%    | 40%  | 25%  | 12%       | 3%     |
| A-Rank     | 10%    | 30%  | 35%  | 20%       | 5%     |
| S-Rank     | 0%     | 20%  | 40%  | 30%       | 10%    |

## 🛠️ Development

### Project Structure

```
hunter-system/
├── backend/
│   ├── src/
│   │   ├── config/        # Database setup
│   │   ├── services/      # Game logic
│   │   ├── routes/        # API endpoints
│   │   └── server.js      # Entry point
│   └── database/          # SQLite file
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API client
│   │   ├── utils/         # Helpers
│   │   └── App.jsx        # Main app
│   └── index.html
└── README.md
```

### API Endpoints

**User**
- `GET /api/user` - Get user progress
- `POST /api/user/reset` - Reset all progress

**Quests**
- `GET /api/quests` - List quests
- `POST /api/quests` - Create quest
- `PUT /api/quests/:id` - Update quest
- `DELETE /api/quests/:id` - Delete quest
- `POST /api/quests/:id/complete` - Complete quest
- `POST /api/quests/:id/fail` - Fail quest

**Items**
- `GET /api/items` - List items
- `DELETE /api/items/:id` - Discard item
- `POST /api/items/choose` - Claim reward choice

### Database Schema

```sql
-- Users table
users (
  id, level, xp, total_xp_earned, created_at, updated_at
)

-- Quests table
quests (
  id, title, description, difficulty, xp_reward, gold_reward,
  status, due_date, completed_at, created_at
)

-- Items table
items (
  id, name, description, rarity, type, obtained_at
)
```

## 🎨 Customization

### Adjust XP Rewards

Edit `backend/src/services/progressionEngine.js`:

```javascript
const BASE_XP = {
  'E': 50,   // Change these values
  'D': 100,
  'C': 200,
  // ... etc
};
```

### Modify Level Curve

Edit the `getXPForNextLevel` function:

```javascript
return Math.floor(100 * Math.pow(level, 1.5));  // Adjust formula
```

### Add Custom Items

Edit `backend/src/services/rewardGenerator.js` → `ITEM_NAMES`

### Change Theme Colors

Edit `frontend/src/styles/global.css` → `:root` variables

## 📝 Future Enhancements

Potential additions (currently not implemented):

- [ ] Daily quests with streak system
- [ ] Achievements and badges
- [ ] Quest templates library
- [ ] Data export/import
- [ ] Mobile-responsive improvements
- [ ] Boss quests with special mechanics
- [ ] Guild/party system (multi-user)
- [ ] Item stats and equipment system
- [ ] Dark/light theme toggle
- [ ] Quest scheduling and reminders

## 🐛 Troubleshooting

**Database locked error:**
- Close all connections, restart backend
- Delete `hunter.db-wal` and `hunter.db-shm` if present

**Port already in use:**
- Change PORT in `backend/.env`
- Update proxy in `frontend/vite.config.js`

**AI not working:**
- Verify Ollama is running: `ollama list`
- Check `OLLAMA_BASE_URL` in `.env`
- Review backend logs for connection errors
- App works fine without AI (uses templates)

**CORS errors:**
- Ensure backend is running
- Check frontend proxy in vite.config.js
- Verify API_BASE_URL in frontend

## 📄 License

MIT License - Feel free to use and modify

## 🙏 Acknowledgments

- Inspired by "Solo Leveling" by Chugong
- Built as a learning project for gamification
- No affiliation with Solo Leveling IP holders

---

**Made with ⚔️ by a fellow hunter**