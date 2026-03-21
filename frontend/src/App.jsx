import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import QuestBoard from './components/Quests/QuestBoard';
import DailyQuests from './components/Quests/DailyQuests';
import Inventory from './components/Inventory/Inventory';
import LevelUpModal from './components/Modals/LevelUpModal';
import RewardModal from './components/Modals/RewardModal';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { useAuth } from './context/AuthContext.jsx';
import { getUser, getQuests, getItems } from './services/api';
import './styles/global.css';
import './App.css';

/**
 * Main Application Component
 * ⚠️ WARNING: CORE SYSTEM LOGIC - DO NOT MODIFY ROUTING OR STATE HANDLING UNLESS YOU KNOW WHAT YOU'RE DOING
 */

/** Inner app content (protected) */
function AppContent() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [quests, setQuests] = useState([]);
  const [items, setItems] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [levelUpData, setLevelUpData] = useState(null);
  const [rewardData, setRewardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [userData, questsData, itemsData] = await Promise.all([
        getUser(),
        getQuests({ status: 'active' }),
        getItems()
      ]);

      setUser(userData.user);
      setStats(userData.stats);
      setQuests(questsData.quests);
      setItems(itemsData.items);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await getUser();
      setUser(userData.user);
      setStats(userData.stats);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const refreshQuests = async () => {
    try {
      const questsData = await getQuests({ status: 'active' });
      setQuests(questsData.quests);
    } catch (error) {
      console.error('Failed to refresh quests:', error);
    }
  };

  const refreshItems = async () => {
    try {
      const itemsData = await getItems();
      setItems(itemsData.items);
    } catch (error) {
      console.error('Failed to refresh items:', error);
    }
  };

  const handleQuestComplete = (result) => {
    // Show level up modal if leveled up
    if (result.levelUp) {
      setLevelUpData({
        ...result.levelUp,
        user: result.user,
        rewards: result.rewards
      });
    } else if (result.rewards.items.length > 0 || result.rewards.special.length > 0) {
      // Show reward modal
      setRewardData(result.rewards);
    }

    // Refresh all data
    refreshUser();
    refreshQuests();
    refreshItems();
  };

  const handleLevelUpClose = () => {
    setLevelUpData(null);

    // If there are still unclaimed rewards, show reward modal
    if (levelUpData?.rewards) {
      setRewardData(levelUpData.rewards);
    }
  };

  const handleRewardClose = () => {
    setRewardData(null);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Initializing Hunter System...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        onRefresh={loadAllData}
        onSignOut={handleSignOut}
      />

      <main className="app-main">
        <div className="app-container">
          {activeView === 'dashboard' && (
            <Dashboard user={user} stats={stats} onRefresh={loadAllData} />
          )}

          {activeView === 'quests' && (
            <QuestBoard
              quests={quests}
              onQuestComplete={handleQuestComplete}
              onQuestsChange={refreshQuests}
            />
          )}

          {activeView === 'daily' && (
            <DailyQuests
              onQuestComplete={handleQuestComplete}
            />
          )}

          {activeView === 'inventory' && (
            <Inventory
              items={items}
              onItemsChange={refreshItems}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {levelUpData && (
        <LevelUpModal
          data={levelUpData}
          onClose={handleLevelUpClose}
        />
      )}

      {rewardData && (
        <RewardModal
          data={rewardData}
          onClose={handleRewardClose}
          onItemClaim={refreshItems}
        />
      )}
    </div>
  );
}

/** Root App with routing */
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Initializing Hunter System...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <SignupPage />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;