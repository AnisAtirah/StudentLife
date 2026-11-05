import { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  useUserCollection,
  addTask as dbAddTask,
  updateTask,
  deleteTask as dbDeleteTask,
  addCourse as dbAddCourse,
  deleteCourse as dbDeleteCourse,
  updateCourse as dbUpdateCourse,
} from "./db";
import CoursesPage, { normalizeUrl } from "./CoursesPage";
import CalendarPage, { ExamCountdowns } from "./CalendarPage";
import { daysUntil, todayKey } from "./dateUtils";
import {
  addEvent as dbAddEvent,
  deleteEvent as dbDeleteEvent,
  addGoal as dbAddGoal,
  updateGoal as dbUpdateGoal,
  deleteGoal as dbDeleteGoal,
} from "./db";
import FocusPage from "./FocusPage";
import Pet from "./Pet";
import { usePomodoro, formatClock, MODE_LABELS } from "./usePomodoro";
import { FloatingTimer, PopOutTimer, usePopOut } from "./FloatingTimer";
import { useSpotify } from "./spotify";
import Wardrobe, { LevelUpModal, ProgressBadge } from "./Wardrobe";
import { REWARDS, currentStreak, levelInfo, nextStreak } from "./rewards";
import { playSound } from "./sounds";
import { usePetTalk } from "./petTalk";
import PetBubble from "./PetBubble";
import ProfileEditor from "./ProfileEditor";
import Avatar from "./Avatar";


// Colors from the Canva design: label color and row background per priority
const PRIORITY_COLORS = {
  Important: "#b3261e",
  "Due Soon": "#ee8a3c",
  Medium: "#6b6b6b",
  Low: "#6b6b6b",
};

const PRIORITY_BG = {
  Important: "#a6d696",
  "Due Soon": "#fff7c7",
  Medium: "#e1f4fb",
  Low: "#ecc9f4",
};

/* Short, friendly label for a task link, e.g. "Google Docs link". */
function linkLabel(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "docs.google.com") return "Google Docs link";
    if (host === "drive.google.com") return "Google Drive link";
    return host;
  } catch {
    return url.slice(0, 30);
  }
}

const FILTERS = ["All", "Important", "Due Soon", "Medium", "Low", "Completed"];

function fmtDate(d) {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} ${dd} ${y}`;
}

function dueLabel(days) {
  if (days === null) return "";
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

// Due Soon logic: anything due within 3 days
function getDisplayPriority(task) {
  if (task.done) return task.priority;
  const days = daysUntil(task.date);
  if (days !== null && days >= 0 && days <= 3) return "Due Soon";
  return task.priority;
}


/* ── Home Page ── */
function HomePage({
  tasks,
  courses,
  onToggle,
  onDelete,
  filter,
  onFilterChange,
  courseFilter,
  onCourseFilterChange,
  loading,
  events
}) {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const inprog = total - done;
  const [openTaskId, setOpenTaskId] = useState(null);

  const filtered = tasks.filter(t => {
    const displayPriority = getDisplayPriority(t);

    const priorityMatch =
      filter === "All"
        ? true
        : filter === "Completed"
          ? t.done
          : displayPriority === filter;

    const courseMatch =
      courseFilter === "All Courses"
        ? true
        : t.code === courseFilter;

    return priorityMatch && courseMatch;
  });

  //completed data down
  const sortedTasks = [...filtered].sort((a, b) => {
    if (a.done && !b.done) return 1;   // completed goes down
    if (!a.done && b.done) return -1;  // incomplete stays up
    return 0;
  });

  // Nearest unfinished task that isn't overdue, for the countdown card
  const nextTask = tasks
    .filter(t => !t.done && daysUntil(t.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextDays = nextTask ? daysUntil(nextTask.date) : null;

  return (
    <>
      {/* Stats */}
      <div className="stats-row">
        {[
          { icon: "/image/book.png", label: "Total Task", value: total, tone: "blue" },
          { icon: "/image/check.png", label: "Completed", value: done, tone: "green" },
          { icon: "/image/hourglass.png", label: "In Progress", value: inprog, tone: "yellow" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon-tile stat-icon-tile--${s.tone}`}>
              <img src={s.icon} alt="" className="stat-icon" />
            </div>
            <div className="stat-text">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="home-grid">
      {/* Task Panel */}
      <div className="task-panel">
        <div className="panel-head">
          <div className="task-panel__title">Upcoming Task</div>
          <select
            className="form-select course-select"
            value={courseFilter}
            onChange={(e) => onCourseFilterChange(e.target.value)}
            aria-label="Filter by course"
          >
            <option value="All Courses">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.code}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter bar */}
        <div className="filter-row">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "filter-btn--active" : ""}`}
              onClick={() => onFilterChange(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="task-list">
          {loading && <div className="empty-msg">Loading tasks...</div>}

          {!loading && filtered.length === 0 && (
            <div className="empty-msg">No tasks here! 🎉</div>
          )}

          {sortedTasks.map(t => {
            const displayPriority = getDisplayPriority(t);

            return (
              <div
                key={t.id}
                className={`task-row ${t.done ? "task-row--done" : ""}`}
                onClick={() =>
                  setOpenTaskId(openTaskId === t.id ? null : t.id)
                }
                style={{ background: PRIORITY_BG[displayPriority] }}
              >
                <input
                  type="checkbox"
                  className="task-check"
                  checked={t.done}
                  onClick={e => e.stopPropagation()}
                  onChange={() => onToggle(t.id)}
                  aria-label={`Mark ${t.name} as done`}
                />

                <div className="task-info">
                  <div className={`task-name ${t.done ? "task-name--done" : ""}`}>
                    {t.code} - {t.name}
                  </div>

                  {t.link?.trim() && (
                    <a
                      href={t.link}
                      target="_blank"
                      rel="noreferrer"
                      className="task-link"
                      title={t.link}
                      onClick={e => e.stopPropagation()}
                    >
                      {linkLabel(t.link)}
                    </a>
                  )}

                  {openTaskId === t.id && (
                    <div className="task-desc">
                      {t.description}
                    </div>
                  )}
                </div>

                <div className="task-meta">
                  <span className="task-date">
                    {fmtDate(t.date)}
                    {!t.done && <span className="task-due"> · {dueLabel(daysUntil(t.date))}</span>}
                  </span>

                  <span
                    className="task-priority"
                    style={{ color: PRIORITY_COLORS[displayPriority] }}
                  >
                    ● {displayPriority}
                  </span>
                </div>

                <button
                  className="task-del-btn"
                  title="Delete task"
                  onClick={e => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${t.name}"?`)) onDelete(t.id);
                  }}
                >
                  🗑
                </button>
              </div>
            );
          })}

        </div>
      </div>

      {/* Side column: countdown + course progress */}
      <aside className="side-col">
        <ExamCountdowns events={events} limit={1} compact />

        <div className="side-card side-card--countdown">
          <div className="side-card__title">Next deadline</div>
          {nextTask ? (
            <>
              <div className="countdown-number">{nextDays === 0 ? "!" : nextDays}</div>
              <div className="countdown-unit">
                {nextDays === 0 ? "Due today" : nextDays === 1 ? "day left" : "days left"}
              </div>
              <div className="countdown-task">{nextTask.code} · {nextTask.name}</div>
            </>
          ) : (
            <div className="side-empty">Nothing due. Enjoy your break! 🌿</div>
          )}
        </div>

        <div className="side-card">
          <div className="side-card__title">My courses</div>
          {courses.length === 0 && <div className="side-empty">No courses yet.</div>}
          {courses.map(c => {
            const ct = tasks.filter(t => t.code === c.code);
            const cd = ct.filter(t => t.done).length;
            const pct = ct.length ? Math.round((cd / ct.length) * 100) : 0;
            return (
              <div key={c.id} className="mini-course">
                <div className="mini-course__row">
                  <span className="mini-course__code">{c.code}</span>
                  <span className="mini-course__count">{cd}/{ct.length}</span>
                </div>
                <div className="pixel-bar"><div className="pixel-bar__fill" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </aside>
      </div>
    </>
  );
}

/* ── Add Task Page ── */
function AddTaskPage({ courses, onAdd }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    link: "",
    date: "",
    priority: "Important",
  });
  const [error, setError] = useState("");

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.date) {
      setError("Please fill in all required fields!");
      return;
    }
    // Link is optional; if given, accept it with or without https://
    const link = form.link.trim() ? normalizeUrl(form.link) : "";
    if (form.link.trim() && !link) {
      setError("That link doesn't look right. Paste a full link, or leave it empty.");
      return;
    }
    onAdd({
      ...form,
      link,
      description: form.description || "No description"
    });
    setForm({ code: "", name: "", description: "", link: "", date: "", priority: "Important" });
    setError("");
  };

  return (
    <div className="task-panel task-panel--padded">
      <div className="task-panel__title">Add New Task</div>

      {error && <div className="form-error">{error}</div>}

      {courses.length === 0 && (
        <div className="form-error">Add a course in My Course first, then you can add tasks to it.</div>
      )}

      <form onSubmit={handleSubmit} className="add-form">
        <div className="form-row2">
          <div className="form-group">
            <label className="form-label">Course Code *</label>
            <select
              className="form-select"
              value={form.code}
              onChange={e => set("code", e.target.value)}
            >
              <option value="">-- Select Course --</option>
              {courses.map(c => (
                <option key={c.id} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Task Name *</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Lab Report"
              maxLength={30}
              value={form.name}
              onChange={e => set("name", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Write task details..."
              value={form.description}
              onChange={e => set("description", e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Link (optional)</label>
          <input
            className="form-input"
            type="text"
            inputMode="url"
            placeholder="Google Docs, Drive or any link (optional)"
            value={form.link}
            onChange={e => set("link", e.target.value)}
          />
        </div>

        <div className="form-row2">
          <div className="form-group">
            <label className="form-label">Due Date *</label>
            <input
              className="form-input"
              type="date"
              min={today}
              value={form.date}
              onChange={e => set("date", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              className="form-select"
              value={form.priority}
              onChange={e => set("priority", e.target.value)}
            >
              <option value="Important">🔴 Important</option>
              <option value="Medium">🟢 Medium</option>
              <option value="Low">🟣 Low</option>
            </select>
          </div>
        </div>

        <button type="submit" className="submit-btn"> SAVE TASK</button>
      </form>
    </div>
  );
}

/* ── Root App ── */
export default function MainApp({ uid, profile, onSignOut, onUpdateProfile }) {
  const [page, setPage] = useState("home");
  const [filter, setFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All Courses");
  const [flash, setFlash] = useState("");
  const [saveError, setSaveError] = useState("");

  // Live data from Firestore. Changes made below show up here automatically.
  const tasksState = useUserCollection(uid, "tasks", "date");
  const coursesState = useUserCollection(uid, "courses", "code");
  const eventsState = useUserCollection(uid, "events", "date");
  const events = eventsState.items;
  const tasks = tasksState.items;
  const courses = coursesState.items;
  const goalsState = useUserCollection(uid, "goals", "createdAt");
  const goals = goalsState.items;
  const loadError = tasksState.error || coursesState.error || eventsState.error || goalsState.error;

  // Latest profile for callbacks that run later (timer finishing, petting)
  const profileRef = useRef(profile);
  profileRef.current = profile;

  // Firestore updates the screen right away and saves in the background,
  // so we don't wait for these; we only report a failed save.
  const save = (promise) =>
    promise.catch(err => {
      console.error("Save failed", err);
      setSaveError("Couldn't save your change. Check your connection.");
    });

  /* Task actions */
  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    // Rewards only the first time a task is finished, so un-ticking/re-ticking can't farm coins
    if (!task.done && !task.rewarded) {
      save(updateTask(uid, id, { done: true, rewarded: true }));
      grant(REWARDS.task.xp, REWARDS.task.coins, `${task.name} done!`);
    } else {
      save(updateTask(uid, id, { done: !task.done }));
    }
  };

  const deleteTask = (id) => save(dbDeleteTask(uid, id));

  const addTask = (data) => {
    save(dbAddTask(uid, data));
    setFlash("Task added! ✔");
    setTimeout(() => setFlash(""), 2500);
    setPage("home");
  };

  /* Course actions */
  const deleteCourse = (id) => save(dbDeleteCourse(uid, id));

  const addCourse = (data) => save(dbAddCourse(uid, data));

  const updateCourse = (id, changes) => save(dbUpdateCourse(uid, id, changes));

  /* Calendar actions */
  const addEvent = (data) => {
    save(dbAddEvent(uid, data));
    setFlash(`${data.title} added to your calendar! ✔`);
    setTimeout(() => setFlash(""), 2500);
  };

  const deleteEvent = (id) => save(dbDeleteEvent(uid, id));

  /* Goals */
  const addGoal = (data) => save(dbAddGoal(uid, data));
  const updateGoal = (id, changes) => {
    const goal = goals.find(g => g.id === id);
    if (changes.done && goal && !goal.rewarded) {
      save(dbUpdateGoal(uid, id, { ...changes, rewarded: true }));
      grant(REWARDS.goal.xp, REWARDS.goal.coins, "Goal achieved! 🎯");
    } else {
      save(dbUpdateGoal(uid, id, changes));
    }
  };
  const deleteGoal = (id) => save(dbDeleteGoal(uid, id));

  /* Pet + focus timer */
  const showFlash = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), 3000);
  };

  /* Levels + rewards */
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [levelUp, setLevelUp] = useState(null);

  // Adds XP and coins (plus any other profile changes) and celebrates level-ups
  function grant(xpGain, coinGain, label, moreChanges = {}) {
    const p = profileRef.current;
    const before = levelInfo(p.xp).level;
    const xp = (p.xp || 0) + xpGain;
    const coins = (p.coins || 0) + coinGain;
    const changes = { ...moreChanges, xp, coins };
    profileRef.current = { ...p, ...changes }; // so a second reward right after adds up correctly
    save(onUpdateProfile(changes));
    playSound("coin");
    showFlash(`${label}  +${xpGain} XP  +${coinGain} 🪙`);
    const after = levelInfo(xp).level;
    if (after > before) {
      setLevelUp(after);
      setTimeout(() => playSound("levelUp"), 350);
    }
  }

  const buyItem = (item) => {
    const p = profileRef.current;
    const owned = p.owned || [];
    if (owned.includes(item.id) || (p.coins || 0) < item.price || levelInfo(p.xp).level < item.level) return;
    const changes = {
      coins: (p.coins || 0) - item.price,
      owned: [...owned, item.id],
      equipped: { ...(p.equipped || {}), [item.slot]: item.id },
    };
    profileRef.current = { ...p, ...changes };
    save(onUpdateProfile(changes));
    playSound("buy");
    showFlash(`Bought ${item.name}! ✨`);
  };

  const equipItem = (slot, id) => {
    const p = profileRef.current;
    const changes = { equipped: { ...(p.equipped || {}), [slot]: id } };
    profileRef.current = { ...p, ...changes };
    save(onUpdateProfile(changes));
    playSound("click");
  };

  const streakDays = currentStreak(profile.streak);

  const [profileOpen, setProfileOpen] = useState(false);
  const saveProfileEdits = (changes, petReset) => {
    profileRef.current = { ...profileRef.current, ...changes };
    save(onUpdateProfile(changes));
    setProfileOpen(false);
    showFlash(petReset ? `Say hi to ${changes.pet.name}! Fresh start 🌱` : "Profile updated! ✔");
  };

  const adoptPet = (pet) => {
    save(onUpdateProfile({ pet, petLove: 0 }));
    showFlash(`Welcome home, ${pet.name}! 🏡`);
  };

  // Petting saves at most every few seconds so rapid clicks don't spam Firestore
  const pendingLove = useRef(0);
  const loveTimer = useRef(null);
  const petThePet = () => {
    talkRef.current?.next(); // petting makes it say something new
    pendingLove.current += 1;
    if (loveTimer.current) return;
    loveTimer.current = setTimeout(() => {
      const add = pendingLove.current;
      pendingLove.current = 0;
      loveTimer.current = null;
      save(onUpdateProfile({ petLove: (profileRef.current.petLove || 0) + add }));
    }, 1500);
  };

  const talkRef = useRef(null);
  const timer = usePomodoro((mode) => {
    talkRef.current?.cheer(mode); // pet celebrates the end of the session
    if (mode !== "focus") {
      showFlash("Break's over! Ready for another round? 💪");
      return;
    }
    const p = profileRef.current;
    const today = todayKey();
    const count = p.focusToday?.date === today ? p.focusToday.count + 1 : 1;
    const { streak, bonus } = nextStreak(p.streak);
    grant(
      REWARDS.focus.xp,
      REWARDS.focus.coins + bonus,
      bonus ? `Focus session! 🔥 ${streak.count}-day streak bonus` : `Focus session! 🍅 ${count} today`,
      { focusSessions: (p.focusSessions || 0) + 1, focusToday: { date: today, count }, streak }
    );
  });

  // Show the countdown in the browser tab while the timer runs
  useEffect(() => {
    document.title = timer.running
      ? `${formatClock(timer.left)} · ${MODE_LABELS[timer.mode]}`
      : "StudentLife";
  }, [timer.running, timer.left, timer.mode]);

  const spotify = useSpotify();
  const popOut = usePopOut(setSaveError);
  // Always offer the button; if floating isn't possible here, clicking it explains why
  const popOutAvailable = true;

  // Focus → writing, short break → coffee, long break → nap
  const petState = !timer.running ? "idle"
    : timer.mode === "focus" ? "work"
      : timer.mode === "short" ? "break"
        : "sleep";

  const firstName = (profile.displayName || (profile.isGuest ? "Guest" : "Student")).split(" ")[0];
  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dueThisWeek = tasks.filter(t => {
    const days = daysUntil(t.date);
    return !t.done && days !== null && days >= 0 && days <= 7;
  }).length;
  // Task-aware lines mixed into what the pet says when the timer isn't running
  const taskMessage =
    !profile.pet ? "Adopt a study buddy in Focus! 🐾"
      : tasks.length === 0 ? "Let's add your first task!"
      : dueThisWeek === 0 ? "No deadlines this week. Nice!"
        : dueThisWeek === 1 ? "1 task due this week. You got this!"
          : `${dueThisWeek} tasks due this week. You got this!`;

  // Motivation, fun facts and break tips in the pet's speech bubble
  const talk = usePetTalk({
    mode: timer.mode,
    running: timer.running,
    petName: profile.pet?.name,
    userName: firstName,
    extraIdle: [taskMessage],
  });
  talkRef.current = talk;

  const navItems = [
    { key: "home", label: "Home" },
    { key: "add", label: "Add Task" },
    { key: "calendar", label: "Calendar" },
    { key: "focus", label: timer.running ? `Focus ${formatClock(timer.left)}` : "Focus" },
    { key: "courses", label: "My Course" },
  ];

  return (
    <div className="app">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo-row">
            <img
              src="/image/logo.png"
              alt=""
              className="logo-iconL"
            />
            <span className="logo-text">StudentLife</span>
          </div>
          <div className="avatar-border">
            {profile.character ? (
              <Avatar character={profile.character} accessory={profile.avatarAccessory} className="avatar-img" alt="Your avatar" />
            ) : (
              <div className="avatar-fallback">🙂</div>
            )}
          </div>
          <div className="user-name" title={profile.displayName}>
            {profile.displayName || "Guest"}
          </div>
          <button className="edit-profile-btn" onClick={() => setProfileOpen(true)}>
            ✎ Edit profile
          </button>
          <nav className="sidebar-nav">
            {navItems.map(({ key, label }) => (
              <button
                key={key}
                className={`nav-btn ${page === key ? "nav-btn--active" : ""}`}
                onClick={() => setPage(key)}
              >
                {label}
              </button>
            ))}
            <button className="nav-btn nav-btn--signout" onClick={onSignOut}>
              Log out
            </button>
          </nav>
        </aside>

        {/* Main */}
        <main className="content">
          <header className="top-banner">
            <div>
              <div className="banner-greeting">Hi, {firstName}!</div>
              <div className="banner-date">{todayLabel}</div>
              <ProgressBadge profile={profile} streak={streakDays} compact />
            </div>
            <div className="banner-buddy">
              <PetBubble talk={talk} className="speech-bubble" />
              {profile.pet ? (
                <Pet type={profile.pet.type} name={profile.pet.name} state={petState} size={56} onPet={petThePet} gear={profile.equipped} />
              ) : profile.character && (
                <Avatar character={profile.character} accessory={profile.avatarAccessory} className="banner-sprite" />
              )}
            </div>
          </header>
          {flash && <div className="flash-msg">{flash}</div>}
          {loadError && (
            <div className="form-error">Couldn't load your data. Check your connection and refresh.</div>
          )}
          {saveError && (
            <div className="form-error" onClick={() => setSaveError("")} title="Click to dismiss">
              {saveError}
            </div>
          )}

          {page === "home" && (
            <HomePage
              tasks={tasks}
              courses={courses}
              onToggle={toggleTask}
              onDelete={deleteTask}
              filter={filter}
              onFilterChange={setFilter}
              courseFilter={courseFilter}
              onCourseFilterChange={setCourseFilter}
              loading={tasksState.loading}
              events={events}
            />
          )}
          {page === "add" && (
            <AddTaskPage courses={courses} onAdd={addTask} />
          )}
          {page === "focus" && (
            <FocusPage
              talk={talk}
              timer={timer}
              profile={profile}
              petState={petState}
              onPet={petThePet}
              onAdopt={adoptPet}
              goals={goals}
              onAddGoal={addGoal}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
              onPopOut={popOutAvailable ? popOut.open : null}
              popOutOpen={!!popOut.pipWindow}
              spotify={spotify}
              streak={streakDays}
              onOpenWardrobe={() => setWardrobeOpen(true)}
            />
          )}
          {page === "calendar" && (
            <CalendarPage
              events={events}
              tasks={tasks}
              courses={courses}
              onAddEvent={addEvent}
              onDeleteEvent={deleteEvent}
            />
          )}
          {page === "courses" && (
            <CoursesPage
              courses={courses}
              tasks={tasks}
              onDeleteCourse={deleteCourse}
              onAddCourse={addCourse}
              onUpdateCourse={updateCourse}
            />
          )}
        </main>

        {/* Floating timer on other pages, and the always-on-top pop-out window */}
        <FloatingTimer
          talk={talk}
          timer={timer}
          pet={profile.pet}
          petState={petState}
          character={profile.character}
          accessory={profile.avatarAccessory}
          hidden={page === "focus" || !!popOut.pipWindow}
          onOpenFocus={() => setPage("focus")}
          onPopOut={popOutAvailable ? popOut.open : null}
          spotify={spotify}
          gear={profile.equipped}
        />
        <PopOutTimer
          talk={talk}
          pipWindow={popOut.pipWindow}
          timer={timer}
          pet={profile.pet}
          petState={petState}
          character={profile.character}
          accessory={profile.avatarAccessory}
          spotify={spotify}
          gear={profile.equipped}
        />

        {wardrobeOpen && (
          <Wardrobe
            profile={profile}
            onBuy={buyItem}
            onEquip={equipItem}
            onClose={() => setWardrobeOpen(false)}
          />
        )}
        {profileOpen && (
          <ProfileEditor
            profile={profile}
            onSave={saveProfileEdits}
            onClose={() => setProfileOpen(false)}
          />
        )}
        {levelUp && (
          <LevelUpModal level={levelUp} profile={profile} onClose={() => setLevelUp(null)} />
        )}
    </div>
  );
}
