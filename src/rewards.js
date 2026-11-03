import { toKey } from "./dateUtils";

/* What each action is worth. */
export const REWARDS = {
  focus: { xp: 25, coins: 10, label: "Focus session" },
  task: { xp: 10, coins: 5, label: "Task done" },
  goal: { xp: 30, coins: 15, label: "Goal achieved" },
};

/* Level L needs 100 × L XP to reach level L + 1 (100, 200, 300, ...). */
export function levelInfo(xp = 0) {
  let level = 1;
  let rest = Math.max(0, xp);
  while (rest >= 100 * level) {
    rest -= 100 * level;
    level += 1;
  }
  return { level, into: rest, needed: 100 * level, progress: rest / (100 * level) };
}

/*
 * Study streak: days in a row with at least one finished focus session.
 * Returns the new streak and the bonus coins for continuing it (only once a day).
 */
export function nextStreak(streak, now = new Date()) {
  const today = toKey(now);
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const yesterday = toKey(y);

  if (streak?.lastDate === today) return { streak, bonus: 0 };
  const count = streak?.lastDate === yesterday ? (streak.count || 0) + 1 : 1;
  return { streak: { count, lastDate: today }, bonus: Math.min(count, 7) * 2 };
}

/* Streak to show today: it's broken if you missed yesterday entirely. */
export function currentStreak(streak, now = new Date()) {
  if (!streak?.lastDate) return 0;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return streak.lastDate === toKey(now) || streak.lastDate === toKey(y) ? streak.count : 0;
}
