
import { calculateQuestXP } from '../services/progressionEngine.js';

async function verifyGlueLogic() {
  console.log('🧪 Verifying Controller Glue Logic...');

  const mockUser = { id: 'user1', level: 20 };
  const mockQuests = [
    { id: 'q1', difficulty: 'E', xp_reward: 50 },
    { id: 'q2', difficulty: 'S', xp_reward: 1600 }
  ];

  const enhancedQuests = mockQuests.map(quest => ({
    ...quest,
    calculated_xp: calculateQuestXP(quest, mockUser.level, { completedOnTime: false, recentEasyQuests: 0 })
  }));

  console.log('Enhanced Quests Output:');
  enhancedQuests.forEach(q => {
    console.log(`- ${q.difficulty}: Base ${q.xp_reward} -> Calculated ${q.calculated_xp}`);
  });

  const allPassed = enhancedQuests[0].calculated_xp === 60 && enhancedQuests[1].calculated_xp === 1920;
  if (allPassed) {
    console.log('✅ Controller logic for XP boosting is verified!');
  } else {
    console.log('❌ Logic verification failed.');
  }
}

verifyGlueLogic();
