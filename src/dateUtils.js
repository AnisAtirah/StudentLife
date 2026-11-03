import { useEffect, useState } from "react";

/* All dates are stored as local "YYYY-MM-DD" strings and times as "HH:MM". */

export function toKey(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = () => toKey(new Date());

/* Whole days from today until a date key (negative = in the past). */
export function daysUntil(key) {
  if (!key) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((fromKey(key) - today) / 86400000);
}

/* Exact moment an event starts; exams without a time count from 9:00. */
export function eventStart(ev) {
  const d = fromKey(ev.date);
  const [h, m] = (ev.time || "09:00").split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

/* Does this event happen on the given day? Handles weekly repeats. */
export function occursOn(ev, key) {
  if (ev.date === key) return true;
  if (!ev.repeatWeekly || key < ev.date) return false;
  if (ev.until && key > ev.until) return false;
  return fromKey(key).getDay() === fromKey(ev.date).getDay();
}

/* Splits a duration into days/hours/minutes for countdowns. */
export function splitDuration(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  return {
    days: Math.floor(totalMin / 1440),
    hours: Math.floor((totalMin % 1440) / 60),
    minutes: totalMin % 60,
  };
}

export function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}${suffix}`;
}

/* Current time that re-renders the component every `ms` milliseconds. */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/* Upcoming exams, soonest first. */
export function upcomingExams(events, now = new Date()) {
  return events
    .filter(ev => ev.kind === "exam" && eventStart(ev) > now)
    .sort((a, b) => eventStart(a) - eventStart(b));
}
