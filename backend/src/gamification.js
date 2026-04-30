import db from './db.js';

const XP_RULES = {
  new_customer: { xp: 5, reason: '新增客户' },
  record_timeline: { xp: 10, reason: '记录沟通' },
  advance_stage: { xp: 20, reason: '推进阶段' },
  close_deal: { xp: 100, reason: '成交客户' },
};

const LEVEL_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000,
];

function calcLevel(totalXp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function xpForNextLevel(currentLevel) {
  if (currentLevel >= LEVEL_THRESHOLDS.length) return 999999;
  return LEVEL_THRESHOLDS[currentLevel] - LEVEL_THRESHOLDS[currentLevel - 1];
}

function xpInCurrentLevel(totalXp, currentLevel) {
  const base = currentLevel > 1 ? LEVEL_THRESHOLDS[currentLevel - 2] : 0;
  return totalXp - base;
}

export async function ensureXpRow(userId) {
  await db.query(
    `INSERT INTO xp (user_id, total_xp, level) VALUES ($1, 0, 1) ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

export async function addXp(userId, actionType) {
  const rule = XP_RULES[actionType];
  if (!rule) return null;

  await ensureXpRow(userId);

  const { rows } = await db.query(
    `UPDATE xp SET total_xp = total_xp + $2, updated_at = NOW() WHERE user_id = $1
     RETURNING total_xp, level`,
    [userId, rule.xp]
  );

  const { total_xp, level } = rows[0];
  const newLevel = calcLevel(total_xp);

  let leveledUp = false;
  if (newLevel > level) {
    await db.query(`UPDATE xp SET level = $2 WHERE user_id = $1`, [userId, newLevel]);
    leveledUp = true;
  }

  await db.query(
    `INSERT INTO xp_log (user_id, amount, reason) VALUES ($1, $2, $3)`,
    [userId, rule.xp, rule.reason]
  );

  return {
    xpGained: rule.xp,
    reason: rule.reason,
    totalXp: total_xp,
    level: leveledUp ? newLevel : level,
    leveledUp,
    nextLevelXp: xpForNextLevel(newLevel),
    currentXp: xpInCurrentLevel(total_xp, newLevel),
  };
}

export async function getXpInfo(userId) {
  await ensureXpRow(userId);

  const { rows } = await db.query(`SELECT * FROM xp WHERE user_id = $1`, [userId]);
  if (!rows.length) return { total_xp: 0, level: 1 };

  const { total_xp, level } = rows[0];
  return {
    total_xp: Number(total_xp),
    level,
    nextLevelXp: xpForNextLevel(level),
    currentXp: xpInCurrentLevel(Number(total_xp), level),
  };
}

export async function ensureDailyTasks(userId) {
  const today = new Date().toISOString().split('T')[0];

  const { rows: existing } = await db.query(
    `SELECT COUNT(*) as cnt FROM daily_tasks WHERE user_id = $1 AND date = $2`,
    [userId, today]
  );

  if (parseInt(existing[0].cnt) > 0) return;

  const tasks = [
    { type: 'follow_up', label: '跟进客户', target: 3, xp: 15 },
    { type: 'new_customer', label: '新增客户', target: 2, xp: 10 },
    { type: 'advance_stage', label: '推进阶段', target: 1, xp: 20 },
  ];

  for (const task of tasks) {
    await db.query(
      `INSERT INTO daily_tasks (user_id, date, task_type, label, target, xp_reward)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, date, task_type) DO NOTHING`,
      [userId, today, task.type, task.label, task.target, task.xp]
    );
  }
}

export async function getTasks(userId) {
  await ensureDailyTasks(userId);

  const { rows } = await db.query(
    `SELECT * FROM daily_tasks WHERE user_id = $1 AND date = CURRENT_DATE ORDER BY id`,
    [userId]
  );

  return rows.map(r => ({
    ...r,
    progress: Number(r.progress),
    target: Number(r.target),
    xp_reward: Number(r.xp_reward),
  }));
}

export async function updateTaskProgress(userId, taskType) {
  const { rows } = await db.query(
    `UPDATE daily_tasks
     SET progress = LEAST(progress + 1, target),
         completed = (progress + 1 >= target)
     WHERE user_id = $1 AND date = CURRENT_DATE AND task_type = $2
     RETURNING *`,
    [userId, taskType]
  );

  if (rows.length && rows[0].completed) {
    await addXp(userId, 'daily_task_bonus');
  }

  return rows[0] || null;
}

export async function updateStreak(userId) {
  const today = new Date().toISOString().split('T')[0];

  const { rows } = await db.query(
    `SELECT * FROM streaks WHERE user_id = $1`,
    [userId]
  );

  if (!rows.length) {
    await db.query(
      `INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
       VALUES ($1, 1, 1, $2)`,
      [userId, today]
    );
    return { current_streak: 1, isNew: true };
  }

  const streak = rows[0];
  const lastDate = streak.last_activity_date;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (lastDate === today) {
    return { current_streak: streak.current_streak, isNew: false };
  }

  let current = streak.current_streak;
  if (lastDate === yesterday) {
    current += 1;
  } else {
    current = 1;
  }

  const longest = Math.max(current, streak.longest_streak);

  await db.query(
    `UPDATE streaks SET current_streak = $2, longest_streak = $3, last_activity_date = $4 WHERE user_id = $1`,
    [userId, current, longest, today]
  );

  return { current_streak: current, isNew: lastDate !== today };
}

export async function checkAchievements(userId) {
  const achievements = [];

  const { rows: dealCount } = await db.query(
    `SELECT COUNT(*) as cnt FROM customers WHERE user_id = $1 AND status = '成交'`,
    [userId]
  );

  if (parseInt(dealCount[0].cnt) >= 1) {
    achievements.push({ code: 'first_deal', title: '首单成交 🎉' });
  }
  if (parseInt(dealCount[0].cnt) >= 10) {
    achievements.push({ code: 'ten_deals', title: '成交10单 💪' });
  }

  const { rows: streak } = await db.query(
    `SELECT * FROM streaks WHERE user_id = $1`,
    [userId]
  );

  if (streak.length && streak[0].current_streak >= 7) {
    achievements.push({ code: 'seven_day_streak', title: '连续跟进7天 🔥' });
  }

  const { rows: recent } = await db.query(
    `SELECT COUNT(*) as cnt FROM xp_log WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '1 day'`,
    [userId]
  );

  if (parseInt(recent[0].cnt) >= 10) {
    achievements.push({ code: 'xp_hunter', title: '经验猎人 ⚡' });
  }

  for (const ach of achievements) {
    await db.query(
      `INSERT INTO achievements (user_id, code, title)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, code) DO NOTHING`,
      [userId, ach.code, ach.title]
    );
  }

  const { rows: unlocked } = await db.query(
    `SELECT * FROM achievements WHERE user_id = $1`,
    [userId]
  );

  return unlocked;
}

export { XP_RULES };
