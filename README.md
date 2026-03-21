<div align="center">
  <h1>⚔️ Hunter System</h1>
  <p>
    <strong>A Gamified Productivity Application Inspired by Solo Leveling</strong>
  </p>
</div>

<hr />

## 📖 Overview

The **Hunter System** is a highly polished, gamified to-do list application engineered to turn your mundane daily tasks into epic RPG quests. Drawing deep inspiration from the popular anime "Solo Leveling", it combines effective task management with sophisticated progression and reward mechanics to keep you motivated and highly productive. 

Built on a robust full-stack architecture utilizing **React, Node.js, Express, and SQLite**.

---

## ✨ Key Features

### 🎯 Gamified Task Management
- **Quest Ranks:** Organize tasks with flexible difficulty rankings ranging from E-Rank (Daily) to S-Rank (Boss Tier).
- **Daily Quests:** 5 specific daily quests appear automatically at midnight (one for each key attribute). Complete at least 3 to avoid stat penalties!
- **Archive System:** A comprehensive tracking system for reviewing successfully completed and tragically failed quests.

### 📈 Dynamic Progression Engine
- **Attribute Balancing:** Your core stats (Strength, Creation, Network, Vitality, and Intelligence) dynamically level up via quest completions.
- **Level Curve:** Earn XP to level up. Progress scales exponentially to provide long-term engagement (`100 * N^1.1`).
- **Penalty System:** Falling short on daily quests (-1 point deduction) or failing standard quests results in attribute deductions. 

### 💎 Advanced Loot Mechanics
- **Item Drops:** Random equipment drops based on quest difficulty and your personal rank.
- **Rarity Tiers:** Obtain Common, Rare, Epic, Legendary, and elusive Mythic items.
- **Milestone Rewards:** Guaranteed Rare item drops every 5 levels, and Legendary choices every 10 levels.
- **Anti-Grind Rules:** Built-in diminishing returns to prevent spamming E-Rank quests for infinite XP.

---

## 🏗️ Technical Architecture

- **Frontend:** React 18, Vite, Contextual Hooks, CSS3 (Modular Dark Fantasy Theme)
- **Backend:** Node.js 18+, Express API Routing, Progression & Reward Services
- **Database:** SQLite (Relational structure for lightweight, file-based persistence)

---

## 🚀 Quick Start

Ensure you have **Node.js 18+** installed before proceeding.

### 1. Install Dependencies
```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

### 2. Configure Environment
In the `backend` directory, optionally configure your `.env` file for AI features:
```env
PORT=3001
DATABASE_PATH=./database/hunter.db

# Optional AI features
OLLAMA_ENABLED=false
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

### 3. Launch the System
Open two terminals to run the frontend and backend servers concurrently:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:3000` inside your browser to view the application!

---

## 🎯 Usage & Mechanics Guide

### Creating and Completing Quests
- Navigate to the **Quests** tab and click `+ New Quest`. Define the title, rank, and deadline. 
- Completing a quest yields baseline XP, bonuses for timely completion, and potential item drops.
- **Quest Difficulty Guideline:**
  - **E-Rank:** Easy daily tasks (50 XP)
  - **D-Rank:** Normal tasks (100 XP)
  - **C-Rank:** Challenging tasks (200 XP)
  - **B-Rank:** Hard projects (400 XP)
  - **A-Rank:** Major milestones (800 XP)
  - **S-Rank:** "Boss" tier quests (1600 XP)

### Leveling Up and Attributes
- **XP Formula:** `baseXP[difficulty] * completionBonus * qualityBonus`
- Leveling up triggers stat distributions across your 5 core attributes, balanced by the nature of the completed quests and an automated +1 minimum baseline system.

### Item Drops & Inventory
- Collect and discard items directly from your **Inventory** tab, sorted intuitively by rarity.
- **Drop Rates By Difficulty:** Higher-tier quests guarantee higher rarity drop floors. 
  - (e.g., S-Rank gives 40% Epic, 30% Legendary, and 10% Mythic drop chances).

---

## 🔮 Future Roadmap
- Achievement and Badges Library
- Add effects to items
- Party/Guild System for multiplayer accountability
- Granular Item Stats and equipment slots configuration

---

## 📄 License

MIT License - Feel free to use and modify for your personal leveling journey.

---

<p align="center">
  <b>Made with ⚔️ by a fellow hunter.</b><br />
  <i>"Arise."</i>
</p>