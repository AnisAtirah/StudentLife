import { useState } from "react";

/* Kinds of links a course folder can hold, in display order. */
export const LINK_TYPES = [
  { id: "papers", label: "Past Year Papers", icon: "📄" },
  { id: "notes", label: "Notes", icon: "📝" },
  { id: "drive", label: "Lecture Drive", icon: "📁" },
  { id: "other", label: "Other", icon: "🔗" },
];

const FOLDER_COLORS = ["#a6d696", "#fff3b0", "#bfe6f5", "#ecc9f4", "#ffd2b8", "#d7e8a8"];

/* Adds https:// when missing; returns "" if it still isn't a valid web link. */
export function normalizeUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") ? url.href : "";
  } catch {
    return "";
  }
}

/* Best guess at a link's type from its address, so the form pre-fills sensibly. */
function guessType(url) {
  if (/drive\.google\.com/i.test(url)) return "drive";
  if (/docs\.google\.com|notion\.so|onenote|samsung/i.test(url)) return "notes";
  if (/past|exam|paper/i.test(url)) return "papers";
  return null;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* ── Folder grid ── */
export default function CoursesPage({ courses, tasks, onAddCourse, onDeleteCourse, onUpdateCourse }) {
  const [openId, setOpenId] = useState(null);
  const open = courses.find(c => c.id === openId);

  if (open) {
    return (
      <CourseDetail
        course={open}
        tasks={tasks.filter(t => t.code === open.code)}
        onBack={() => setOpenId(null)}
        onDelete={() => {
          onDeleteCourse(open.id);
          setOpenId(null);
        }}
        onUpdate={changes => onUpdateCourse(open.id, changes)}
      />
    );
  }

  return (
    <div className="task-panel task-panel--padded">
      <div className="task-panel__title">📚 My Courses</div>
      <p className="page-hint">Each course is a folder for its past year papers, notes and Drive links.</p>

      <div className="folder-grid">
        {courses.map((c, i) => {
          const ct = tasks.filter(t => t.code === c.code);
          const cd = ct.filter(t => t.done).length;
          const linkCount = (c.links || []).length;
          return (
            <button
              key={c.id}
              className="folder-card"
              style={{ "--folder": FOLDER_COLORS[i % FOLDER_COLORS.length] }}
              onClick={() => setOpenId(c.id)}
            >
              <span className="folder-card__tab" aria-hidden="true" />
              <span className="folder-card__code">{c.code}</span>
              <span className="folder-card__name">{c.name}</span>
              <span className="folder-card__meta">
                {linkCount} {linkCount === 1 ? "link" : "links"} · {cd}/{ct.length} tasks done
              </span>
              <span className="pixel-bar">
                <span
                  className="pixel-bar__fill"
                  style={{ width: `${ct.length ? (cd / ct.length) * 100 : 0}%` }}
                />
              </span>
            </button>
          );
        })}

        <AddCourseCard courses={courses} onAddCourse={onAddCourse} />
      </div>
    </div>
  );
}

function AddCourseCard({ courses, onAddCourse }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleAdd = e => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Fill in both fields.");
      return;
    }
    if (courses.some(c => c.code.toLowerCase() === code.trim().toLowerCase())) {
      setError("That course code already exists.");
      return;
    }
    onAddCourse({ code: code.trim().toUpperCase(), name: name.trim(), links: [] });
    setCode("");
    setName("");
    setError("");
  };

  return (
    <form className="folder-card folder-card--add" onSubmit={handleAdd}>
      <span className="folder-card__code">➕ New course</span>
      {error && <span className="form-error">{error}</span>}
      <input
        className="form-input"
        placeholder="Code, e.g. WIA2006"
        value={code}
        onChange={e => setCode(e.target.value)}
      />
      <input
        className="form-input"
        placeholder="Course name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <button type="submit" className="submit-btn">Add course</button>
    </form>
  );
}

/* ── One course folder: its links grouped by type ── */
function CourseDetail({ course, tasks, onBack, onDelete, onUpdate }) {
  const links = course.links || [];
  const done = tasks.filter(t => t.done).length;
  const upcoming = tasks
    .filter(t => !t.done)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const removeLink = id => onUpdate({ links: links.filter(l => l.id !== id) });
  const addLink = link => onUpdate({ links: [...links, link] });

  return (
    <div className="task-panel task-panel--padded">
      <div className="detail-head">
        <button className="back-btn" onClick={onBack}>← All courses</button>
        <button
          className="text-danger-btn"
          onClick={() => {
            if (window.confirm(`Delete ${course.code} and its links? Its tasks will stay in your list.`)) onDelete();
          }}
        >
          Delete course
        </button>
      </div>

      <div className="detail-title">
        <span className="folder-card__code">{course.code}</span>
        <h2 className="detail-name">{course.name}</h2>
        <span className="folder-card__meta">{done}/{tasks.length} tasks done</span>
        {upcoming.length > 0 && (
          <div className="detail-upcoming">
            Next up: {upcoming.map(t => t.name).join(", ")}
          </div>
        )}
      </div>

      {links.length === 0 && (
        <div className="empty-msg">
          No links yet. Add your past year papers, notes and lecture Drive below.
        </div>
      )}

      {LINK_TYPES.map(type => {
        const group = links.filter(l => l.type === type.id);
        if (group.length === 0) return null;
        return (
          <section key={type.id} className="link-group">
            <h3 className="link-group__title">
              <span aria-hidden="true">{type.icon}</span> {type.label}
              <span className="link-group__count">{group.length}</span>
            </h3>
            {group.map(l => (
              <div key={l.id} className="link-row">
                <a className="link-row__main" href={l.url} target="_blank" rel="noreferrer">
                  <span className="link-row__label">{l.label}</span>
                  <span className="link-row__host">{hostOf(l.url)} ↗</span>
                </a>
                <button
                  className="link-row__del"
                  title="Remove link"
                  onClick={() => {
                    if (window.confirm(`Remove "${l.label}"?`)) removeLink(l.id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </section>
        );
      })}

      <AddLinkForm onAdd={addLink} />
    </div>
  );
}

function AddLinkForm({ onAdd }) {
  const [form, setForm] = useState({ type: "papers", label: "", url: "" });
  const [typeTouched, setTypeTouched] = useState(false);
  const [error, setError] = useState("");

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const onUrlChange = value => {
    set("url", value);
    // Suggest a type from the address until the student picks one themselves
    const guess = !typeTouched && guessType(value);
    if (guess) set("type", guess);
  };

  const handleSubmit = e => {
    e.preventDefault();
    const url = normalizeUrl(form.url);
    if (!url) {
      setError("Paste a full link, e.g. https://drive.google.com/...");
      return;
    }
    const label = form.label.trim() || hostOf(url);
    onAdd({ id: newId(), type: form.type, label, url });
    setForm({ type: form.type, label: "", url: "" });
    setTypeTouched(false);
    setError("");
  };

  return (
    <form className="add-link" onSubmit={handleSubmit}>
      <div className="add-link__title">➕ Add a link</div>
      {error && <div className="form-error">{error}</div>}
      <div className="add-link__fields">
        <input
          className="form-input"
          type="text"
          inputMode="url"
          placeholder="Paste link (Drive, Docs, Samsung Notes...)"
          value={form.url}
          onChange={e => onUrlChange(e.target.value)}
        />
        <input
          className="form-input"
          placeholder="Name, e.g. Final Exam 2024"
          maxLength={60}
          value={form.label}
          onChange={e => set("label", e.target.value)}
        />
        <select
          className="form-select"
          value={form.type}
          onChange={e => {
            set("type", e.target.value);
            setTypeTouched(true);
          }}
          aria-label="Link type"
        >
          {LINK_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
          ))}
        </select>
        <button type="submit" className="submit-btn">Add</button>
      </div>
    </form>
  );
}
