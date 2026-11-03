import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

/*
 * Data layout (every user only sees their own branch, see firestore.rules):
 *   users/{uid}                 profile: displayName, isGuest, character,
 *                               pet { type, name }, petLove, focusSessions,
 *                               focusToday { date, count }, xp, coins,
 *                               streak { count, lastDate }, owned [itemId],
 *                               equipped { hat, face, desk, mug }
 *   (tasks and goals also get rewarded: true once they've paid out XP)
 *   users/{uid}/goals/{id}      text, color, done
 *   users/{uid}/courses/{id}    code, name, links: [{ id, type, label, url }]
 *   users/{uid}/tasks/{id}      code, name, description, link, date, priority, done
 *   users/{uid}/events/{id}     kind (exam|class|meeting|other), title, courseCode,
 *                               date, time, venue, repeatWeekly, until
 */

const userDoc = (uid) => doc(db, "users", uid);
const userCol = (uid, name) => collection(db, "users", uid, name);
const userItem = (uid, name, id) => doc(db, "users", uid, name, id);

/* Local date as YYYY-MM-DD, n days from today. */
function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const SAMPLE_COURSES = [
  {
    code: "WIA2001",
    name: "Data Structures",
    links: [
      { id: "s1", type: "papers", label: "Final Exam 2024", url: "https://drive.google.com/" },
      { id: "s2", type: "notes", label: "My revision notes", url: "https://docs.google.com/" },
      { id: "s3", type: "drive", label: "Lecture slides folder", url: "https://drive.google.com/" },
    ],
  },
  {
    code: "WIA2003",
    name: "Operating Systems",
    links: [{ id: "s4", type: "drive", label: "Lecture slides folder", url: "https://drive.google.com/" }],
  },
  { code: "WIA2004", name: "Computer Networks", links: [] },
  { code: "WIA2005", name: "Software Engineering", links: [] },
];

const sampleTasks = () => [
  {
    code: "WIA2001",
    name: "Lab Report",
    description: "Write the full report on the data structures lab.",
    link: "https://docs.google.com",
    date: daysFromToday(2),
    priority: "Important",
  },
  {
    code: "WIA2003",
    name: "Assignment 2",
    description: "OS scheduling algorithms exercise.",
    link: "",
    date: daysFromToday(6),
    priority: "Medium",
  },
  {
    code: "WIA2005",
    name: "Group Project Draft",
    description: "Requirements section for the software engineering project.",
    link: "",
    date: daysFromToday(10),
    priority: "Low",
  },
];

/* Sample calendar: two exams and a weekly class that started last week. */
const sampleEvents = () => [
  { kind: "exam", title: "Midterm Exam", courseCode: "WIA2003", date: daysFromToday(9), time: "09:00", venue: "DK1", repeatWeekly: false },
  { kind: "exam", title: "Final Exam", courseCode: "WIA2001", date: daysFromToday(30), time: "14:30", venue: "Exam Hall A", repeatWeekly: false },
  { kind: "class", title: "Data Structures Lecture", courseCode: "WIA2001", date: daysFromToday(-6), time: "10:00", venue: "BK2", repeatWeekly: true },
  { kind: "meeting", title: "Group project meeting", courseCode: "WIA2005", date: daysFromToday(3), time: "20:00", venue: "Google Meet", repeatWeekly: false },
];

/*
 * Loads the user's profile, creating it on first sign-in.
 * Guests also get sample courses and tasks so the app isn't empty.
 * Seed documents use fixed IDs, so running this twice can't duplicate them.
 */
export async function ensureProfile(user) {
  const ref = userDoc(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();

  const profile = {
    displayName: user.displayName || "Guest",
    isGuest: user.isAnonymous,
    character: null,
    xp: 0,
    coins: 0,
    owned: [],
    equipped: {},
  };
  // Guests start at level 2 with some coins so they can try the Wardrobe right away
  if (user.isAnonymous) {
    profile.xp = 150;
    profile.coins = 120;
  }

  const batch = writeBatch(db);
  batch.set(ref, { ...profile, createdAt: serverTimestamp() });

  if (user.isAnonymous) {
    sampleEvents().forEach((ev, i) => {
      batch.set(userItem(user.uid, "events", `sample-ev-${i + 1}`), ev);
    });
    [
      { text: "Get Dean's List this semester ✨", color: "#fff3a0", done: false },
      { text: "Finish every lab report 2 days early", color: "#c6e8ff", done: false },
      { text: "Study 2 pomodoros every day", color: "#ffc9de", done: true },
    ].forEach((g, i) => {
      batch.set(userItem(user.uid, "goals", `sample-goal-${i + 1}`), { ...g, createdAt: serverTimestamp() });
    });
    SAMPLE_COURSES.forEach((c) => {
      batch.set(userItem(user.uid, "courses", c.code), c);
    });
    sampleTasks().forEach((t, i) => {
      batch.set(userItem(user.uid, "tasks", `sample-${i + 1}`), {
        ...t,
        done: false,
        createdAt: serverTimestamp(),
      });
    });
  }

  await batch.commit();
  return profile;
}

/* Removes a user's profile and all their data (used when a guest signs out). */
export async function deleteUserData(uid) {
  const snaps = await Promise.all(
    ["tasks", "courses", "events", "goals"].map((name) => getDocs(userCol(uid, name)))
  );
  const batch = writeBatch(db);
  snaps.forEach((snap) => snap.docs.forEach((d) => batch.delete(d.ref)));
  batch.delete(userDoc(uid));
  await batch.commit();
}

export const saveCharacter = (uid, character) =>
  updateDoc(userDoc(uid), { character });

/* Any profile fields: pet, petLove, focusSessions, focusToday... */
export const saveProfile = (uid, changes) => updateDoc(userDoc(uid), changes);

/* Live list of a user's subcollection, kept in sync with Firestore. */
export function useUserCollection(uid, name, orderField) {
  const [state, setState] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    const q = query(userCol(uid, name), orderBy(orderField));
    return onSnapshot(
      q,
      (snap) =>
        setState({
          items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
          loading: false,
          error: null,
        }),
      (error) => setState((s) => ({ ...s, loading: false, error }))
    );
  }, [uid, name, orderField]);

  return state;
}

/* Tasks */
export const addTask = (uid, data) =>
  addDoc(userCol(uid, "tasks"), { ...data, done: false, createdAt: serverTimestamp() });

export const updateTask = (uid, id, changes) =>
  updateDoc(userItem(uid, "tasks", id), changes);

export const deleteTask = (uid, id) => deleteDoc(userItem(uid, "tasks", id));

/* Courses */
export const addCourse = (uid, data) => addDoc(userCol(uid, "courses"), data);

export const updateCourse = (uid, id, changes) =>
  updateDoc(userItem(uid, "courses", id), changes);

export const deleteCourse = (uid, id) => deleteDoc(userItem(uid, "courses", id));

/* Calendar events: exams, classes, meetings */
export const addEvent = (uid, data) =>
  addDoc(userCol(uid, "events"), { ...data, createdAt: serverTimestamp() });

export const deleteEvent = (uid, id) => deleteDoc(userItem(uid, "events", id));

/* Goal sticky notes */
export const addGoal = (uid, data) =>
  addDoc(userCol(uid, "goals"), { ...data, createdAt: serverTimestamp() });

export const updateGoal = (uid, id, changes) =>
  updateDoc(userItem(uid, "goals", id), changes);

export const deleteGoal = (uid, id) => deleteDoc(userItem(uid, "goals", id));
