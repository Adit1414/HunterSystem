
import { getAllQuests, getDailyQuests } from '../controllers/questController.js';
import User from '../models/User.js';
import Quest from '../models/Quest.js';
import db from '../config/database.js';

async function testController() {
  console.log('🧪 Testing Quest Controller with XP Calculation...');

  try {
    // 1. Setup a test user at level 20
    const testUserId = 2020;
    await db.run('DELETE FROM users WHERE id = ?', [testUserId]);
    await db.run(`
      INSERT INTO users (id, username, email, password_hash, level, xp, total_xp_earned)
      VALUES (?, 'level20test', 'test@test.com', 'hash', 20, 0, 5000)
    `, [testUserId]);

    // 2. Setup a few quests for this user
    await db.run('DELETE FROM quests WHERE user_id = ?', [testUserId]);
    await db.run(`
      INSERT INTO quests (id, user_id, title, difficulty, xp_reward, type, status)
      VALUES 
      ('q1', ?, 'Normal Quest E', 'E', 50, 'normal', 'active'),
      ('q2', ?, 'Daily Quest E', 'E', 50, 'daily', 'active'),
      ('q3', ?, 'Rank S Quest', 'S', 1600, 'normal', 'active')
    `, [testUserId, testUserId, testUserId]);

    // 3. Mock Request and Response for getAllQuests
    const mockReq = { 
      dbUserId: testUserId,
      query: {}
    };
    
    let resultQuests = [];
    const mockRes = {
      json: (data) => {
        resultQuests = data.quests;
      },
      status: (code) => ({ json: (data) => console.log(`Error ${code}:`, data) })
    };

    // 4. Run Controller Function
    await getAllQuests(mockReq, mockRes);

    console.log('\n📊 Results for getAllQuests:');
    resultQuests.forEach(q => {
      console.log(`- ${q.title} (${q.difficulty}): Base XP: ${q.xp_reward}, Calculated XP: ${q.calculated_xp}`);
    });

    // 5. Verify expectations
    const q1 = resultQuests.find(q => q.id === 'q1');
    const q3 = resultQuests.find(q => q.id === 'q3');

    if (q1.calculated_xp === 60 && q3.calculated_xp === 1920) {
      console.log('\n✅ SUCCESS: Calculated XP is correctly boosted by 1.2x for Level 20!');
    } else {
      console.log('\n❌ FAILURE: XP calculation mismatch.');
      console.log(`E-Rank (expected 60): ${q1.calculated_xp}`);
      console.log(`S-Rank (expected 1920): ${q3.calculated_xp}`);
    }

    // Cleanup
    await db.run('DELETE FROM users WHERE id = ?', [testUserId]);
    await db.run('DELETE FROM quests WHERE user_id = ?', [testUserId]);

  } catch (error) {
    console.error('❌ Integration Test Error:', error);
  }
}

testController();
