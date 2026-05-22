import db from './db.js';

const XP_RULES = {
  new_customer: { xp: 5, reason: '新增客户' },
  record_timeline: { xp: 10, reason: '记录沟通' },
  advance_stage: { xp: 20, reason: '推进阶段' },
  close_deal: { xp: 100, reason: '成交客户' },
};

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000];

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

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function ensureXpRow(userId) {
  db.prepare(
    `INSERT OR IGNORE INTO xp (user_id, total_xp, level) VALUES (?, 0, 1)`
  ).run(userId);
}

export function addXp(userId, actionType) {
  const rule = XP_RULES[actionType];
  if (!rule) return null;

  ensureXpRow(userId);

  const row = db.prepare(
    `UPDATE xp SET total_xp = total_xp + ?, updated_at = datetime('now') WHERE user_id = ?
     RETURNING total_xp, level`
  ).get(rule.xp, userId);

  if (!row) return null;

  const newLevel = calcLevel(row.total_xp);
  let leveledUp = false;

  if (newLevel > row.level) {
    db.prepare(`UPDATE xp SET level = ? WHERE user_id = ?`).run(newLevel, userId);
    leveledUp = true;
  }

  db.prepare(
    `INSERT INTO xp_log (user_id, amount, reason) VALUES (?, ?, ?)`
  ).run(userId, rule.xp, rule.reason);

  const finalLevel = leveledUp ? newLevel : row.level;

  return {
    xpGained: rule.xp,
    reason: rule.reason,
    totalXp: row.total_xp,
    level: finalLevel,
    leveledUp,
    nextLevelXp: xpForNextLevel(finalLevel),
    currentXp: xpInCurrentLevel(row.total_xp, finalLevel),
  };
}

export function getXpInfo(userId) {
  ensureXpRow(userId);

  const row = db.prepare(`SELECT * FROM xp WHERE user_id = ?`).get(userId);
  if (!row) return { total_xp: 0, level: 1, nextLevelXp: 100, currentXp: 0 };

  return {
    total_xp: row.total_xp,
    level: row.level,
    nextLevelXp: xpForNextLevel(row.level),
    currentXp: xpInCurrentLevel(row.total_xp, row.level),
  };
}

export function ensureDailyTasks(userId) {
  const today = todayStr();
  const existing = db.prepare(
    `SELECT COUNT(*) as cnt FROM daily_tasks WHERE user_id = ? AND date = ?`
  ).get(userId, today);

  if (existing.cnt > 0) return;

  const tasks = [
    { type: 'follow_up', label: '跟进客户', target: 3, xp: 15 },
    { type: 'new_customer', label: '新增客户', target: 2, xp: 10 },
    { type: 'advance_stage', label: '推进阶段', target: 1, xp: 20 },
  ];

  const insert = db.prepare(
    `INSERT OR IGNORE INTO daily_tasks (user_id, date, task_type, label, target, xp_reward)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  for (const task of tasks) {
    insert.run(userId, today, task.type, task.label, task.target, task.xp);
  }
}

export function getTasks(userId) {
  ensureDailyTasks(userId);

  const rows = db.prepare(
    `SELECT * FROM daily_tasks WHERE user_id = ? AND date = ? ORDER BY id`
  ).all(userId, todayStr());

  return rows.map(r => ({
    ...r,
    completed: !!r.completed,
  }));
}

export function updateTaskProgress(userId, taskType) {
  const row = db.prepare(
    `UPDATE daily_tasks
     SET progress = MIN(progress + 1, target),
         completed = CASE WHEN progress + 1 >= target THEN 1 ELSE 0 END
     WHERE user_id = ? AND date = ? AND task_type = ?
     RETURNING *`
  ).get(userId, todayStr(), taskType);

  if (row && row.completed) {
    addXp(userId, 'daily_task_bonus');
  }

  return row || null;
}

export function updateStreak(userId) {
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const row = db.prepare(`SELECT * FROM streaks WHERE user_id = ?`).get(userId);

  if (!row) {
    db.prepare(
      `INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
       VALUES (?, 1, 1, ?)`
    ).run(userId, today);
    return { current_streak: 1, isNew: true };
  }

  if (row.last_activity_date === today) {
    return { current_streak: row.current_streak, isNew: false };
  }

  let current = row.current_streak;
  current = row.last_activity_date === yesterday ? current + 1 : 1;
  const longest = Math.max(current, row.longest_streak);

  db.prepare(
    `UPDATE streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ? WHERE user_id = ?`
  ).run(current, longest, today, userId);

  return { current_streak: current, isNew: true };
}

export function checkAchievements(userId) {
  const achievements = [];

  const dealCount = db.prepare(
    `SELECT COUNT(*) as cnt FROM customers WHERE user_id = ? AND status = '成交'`
  ).get(userId);

  if (dealCount.cnt >= 1) {
    achievements.push({ code: 'first_deal', title: '首单成交' });
  }
  if (dealCount.cnt >= 10) {
    achievements.push({ code: 'ten_deals', title: '成交10单' });
  }

  const streak = db.prepare(`SELECT * FROM streaks WHERE user_id = ?`).get(userId);
  if (streak && streak.current_streak >= 7) {
    achievements.push({ code: 'seven_day_streak', title: '连续跟进7天' });
  }

  const recent = db.prepare(
    `SELECT COUNT(*) as cnt FROM xp_log WHERE user_id = ? AND created_at >= datetime('now', '-1 day')`
  ).get(userId);

  if (recent.cnt >= 10) {
    achievements.push({ code: 'xp_hunter', title: '经验猎人' });
  }

  const insert = db.prepare(
    `INSERT OR IGNORE INTO achievements (user_id, code, title) VALUES (?, ?, ?)`
  );

  for (const ach of achievements) {
    insert.run(userId, ach.code, ach.title);
  }

  const unlocked = db.prepare(
    `SELECT * FROM achievements WHERE user_id = ?`
  ).all(userId);

  return unlocked;
}

export { XP_RULES };
