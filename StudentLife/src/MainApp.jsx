import { useState } from "react";
import "./App.css";


const PRIORITY_COLORS = {
  Important: "#e53935",
  "Due Soon": "#f9a825",
  Medium: "#43a047",
  Low: "#8e24aa",
};

const PRIORITY_BG = {
  Important: "#f28b8255",
  "Due Soon": "#fdd66355",
  Medium: "#ccff9055",
  Low: "#d0bcff55",
};

const PRIORITY_BORDER = {
  Important: "#f28b82",
  "Due Soon": "#fdd663",
  Medium: "#ccff90",
  Low: "#d0bcff",
};

const INITIAL_TASKS = [
  {
    id: 1,
    code: "WIA2001",
    name: "Lab Report",
    description: "Write full report on data structures lab work.",
    link: "https://docs.google.com",
    date: "2026-06-03",
    priority: "Important",
    done: false
  },
  {
    id: 2,
    code: "WIA2003",
    name: "Assignment 2",
    description: "OS scheduling algorithms exercise.",
    link: "https://docs.google.com",
    date: "2026-06-05",
    priority: "Due Soon",
    done: false
  },
];

const INITIAL_COURSES = [
  { id: 1, code: "WIA2001", name: "Data Structures" },
  { id: 2, code: "WIA2003", name: "Operating Systems" },
  { id: 3, code: "WIA2004", name: "Computer Networks" },
  { id: 4, code: "WIA2005", name: "Software Engineering" },
];

const FILTERS = ["All", "Important", "Due Soon", "Medium", "Low", "Completed"];

function fmtDate(d) {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} ${dd} ${y}`;
}

//Due Soon Logic (Due in 3 days)
function getDisplayPriority(task) {
  if (task.done) return task.priority;

  const today = new Date();
  const dueDate = new Date(task.date);

  const diffDays = Math.ceil(
    (dueDate - today) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 3 && diffDays >= 0) {
    return "Due Soon";
  }

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
  onCourseFilterChange
}) {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const inprog = total - done;
  const [openTaskId, setOpenTaskId] = useState(null);
  const toggleExpand = (id) => {
  setOpenTaskId(prev => (prev === id ? null : id));
};

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

  return (
    <>
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <img
            src="image/book.png"
            alt="Logo"
            className="logo-iconB"
          />
          <div>
            <div className="stat-label">Total Task</div>
            <div className="stat-value">{total}</div>
          </div>
        </div>
        <div className="stat-card stat-card--green">
          <img
            src="image/check.png"
            alt="Logo"
            className="logo-iconT"
          />
          <div>
            <div className="stat-label">Completed</div>
            <div className="stat-value">{done}</div>
          </div>
        </div>
        <div className="stat-card">
          <img
            src="image/hourglass.png"
            alt="Logo"
            className="logo-iconT"
          />
          <div>
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{inprog}</div>
          </div>
        </div>
      </div>

      {/* Task Panel */}
      <div className="task-panel">
        <div className="task-panel__title">Upcoming Tasks</div>

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

        <div style={{ marginBottom: "10px" }}>
          <select
            className="form-select"
            value={courseFilter}
            onChange={(e) => onCourseFilterChange(e.target.value)}
          >
            <option value="All Courses">All Courses</option>

            {courses.map(course => (
              <option key={course.id} value={course.code}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="task-list">
          {filtered.length === 0 && (
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
                style={{
                  cursor: "pointer",
                  background: PRIORITY_BG[displayPriority],
                  borderLeft: `5px solid ${PRIORITY_BORDER[displayPriority]}`
                }}
              >
                <div className="task-info">
                  <div className={`task-name ${t.done ? "task-name--done" : ""}`}>
                    <strong>{t.code}</strong> - {t.name}
                  </div>

                  {openTaskId === t.id && (
                    <div className="task-desc">
                      {t.description}
                    </div>
                  )}

                  {t.link?.trim() && (
                    <a
                      href={t.link}
                      target="_blank"
                      rel="noreferrer"
                      className="task-link"
                    >
                      {t.link.replace(/^https?:\/\//, "").slice(0, 30)}
                      {t.link.length > 30 ? "..." : ""}
                    </a>
                  )}
                </div>

                <div className="task-meta">
                  <span className="task-date">{fmtDate(t.date)}</span>

                  <span
                    className="task-priority"
                    style={{ color: PRIORITY_COLORS[displayPriority] }}
                  >
                    ● {displayPriority}
                  </span>
                </div>

                <input
                  type="checkbox"
                  className="task-check"
                  checked={t.done}
                  onChange={() => onToggle(t.id)}
                  style={{ accentColor: PRIORITY_BORDER[displayPriority] }}
                />
              </div>
            );
          })}

        </div>
      </div >
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
    onAdd({
      ...form,
      link: form.link || "#",
      description: form.description || "No description"
    });
    setForm({ code: "", name: "", link: "", date: "", priority: "Important" });
    setError("");
  };

  return (
    <div className="task-panel" style={{ flex: 1 }}>
      <div className="task-panel__title">Add New Task</div>

      {error && <div className="form-error">{error}</div>}

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
          <label className="form-label">Link (Google Docs / URL)</label>
          <input
            className="form-input"
            type="url"
            placeholder="https://docs.google.com/..."
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

/* ── My Courses Page ── */
function CoursesPage({ courses, tasks, onDeleteCourse, onAddCourse }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!code.trim() || !name.trim()) {
      setError("Both fields are required!");
      return;
    }
    if (courses.some(c => c.code.toLowerCase() === code.trim().toLowerCase())) {
      setError("Course code already exists!");
      return;
    }
    onAddCourse({ code: code.trim().toUpperCase(), name: name.trim() });
    setCode("");
    setName("");
    setError("");
  };

  return (
    <div className="task-panel" style={{ flex: 1, overflowY: "auto" }}>
      <div className="task-panel__title">📚 My Courses</div>

      {courses.length === 0 && <div className="empty-msg">No courses yet!</div>}

      {courses.map(c => {
        const courseTasks = tasks.filter(t => t.code === c.code);
        const doneTasks = courseTasks.filter(t => t.done).length;
        return (
          <div key={c.id} className="course-card">
            <button className="course-del-btn" onClick={() => onDeleteCourse(c.id)} title="Remove course">🗑</button>
            <div className="course-code-label">{c.code}</div>
            <div className="course-name-label">{c.name}</div>
            <div className="course-progress">
              Tasks: {doneTasks}/{courseTasks.length} done
              {courseTasks.length > 0 && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(doneTasks / courseTasks.length) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add course form */}
      <div className="task-panel__title" style={{ marginTop: 12 }}>➕ Add Course</div>
      {error && <div className="form-error">{error}</div>}
      <div className="add-course-row">
        <input
          className="form-input"
          placeholder="Code e.g. WIA2006"
          value={code}
          onChange={e => setCode(e.target.value)}
          style={{ width: 130 }}
        />
        <input
          className="form-input"
          placeholder="Course Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="submit-btn" style={{ width: "auto", padding: "6px 14px" }} onClick={handleAdd}>
          Add
        </button>
      </div>
    </div>
  );
}

/* ── Root App ── */
export default function MainApp({ avatar }) {


  const [page, setPage] = useState("home");
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [nextId, setNextId] = useState(5);
  const [nextCId, setNextCId] = useState(5);
  const [filter, setFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All Courses");
  const [flash, setFlash] = useState("");

  /* Task actions */
  const toggleTask = (id) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const deleteTask = (id) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  const addTask = (data) => {
    setTasks(prev => [...prev, { ...data, id: nextId, done: false }]);
    setNextId(n => n + 1);
    setFlash("Task added! ✔");
    setTimeout(() => setFlash(""), 2500);
    setPage("home");
  };

  /* Course actions */
  const deleteCourse = (id) =>
    setCourses(prev => prev.filter(c => c.id !== id));

  const addCourse = (data) => {
    setCourses(prev => [...prev, { ...data, id: nextCId }]);
    setNextCId(n => n + 1);
  };

  const navItems = [
    { key: "home", label: "Home" },
    { key: "add", label: "Add Task" },
    { key: "courses", label: "My Course" },
  ];

  return (
    <div className="screen">
      <div className="app">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo-row">
            <img
              src="image/logo.png"
              alt="Logo"
              className="logo-iconL"
            />
            <span className="logo-text">StudentLife</span>
          </div>
          <div className="avatar-wrap">
            <div className="avatar-border">
              {avatar ? (
                <img src={avatar} className="avatar-img" />
              ) : (
                <div className="avatar-fallback">🙂</div>
              )}
            </div>
          </div>
          {navItems.map(({ key, label }) => (
            <button
              key={key}
              className={`nav-btn ${page === key ? "nav-btn--active" : ""}`}
              onClick={() => setPage(key)}
            >
              {label}
            </button>
          ))}
          <div className="sidebar-deco">
            <img
              src="image/tree.png"
              alt="Logo"
              className="logo-iconT"
            />
            <img
              src="image/tree.png"
              alt="Logo"
              className="logo-iconT"
            />
          </div>
        </aside>

        {/* Main */}
        <main className="content">
          {flash && <div className="flash-msg">{flash}</div>}

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
            />
          )}
          {page === "add" && (
            <AddTaskPage courses={courses} onAdd={addTask} />
          )}
          {page === "courses" && (
            <CoursesPage
              courses={courses}
              tasks={tasks}
              onDeleteCourse={deleteCourse}
              onAddCourse={addCourse}
            />
          )}
        </main>
      </div>
    </div>
  );
}