import { useMemo, useState } from "react";
import {
  eventStart,
  formatTime,
  fromKey,
  occursOn,
  splitDuration,
  toKey,
  todayKey,
  upcomingExams,
  useNow,
} from "./dateUtils";

export const EVENT_KINDS = {
  exam: { label: "Exam", icon: "📝", color: "#d9483b" },
  class: { label: "Class", icon: "🏫", color: "#3b82c4" },
  meeting: { label: "Meeting", icon: "👥", color: "#8e5bc9" },
  other: { label: "Other", icon: "⭐", color: "#d79a00" },
};
const TASK_KIND = { label: "Task due", icon: "✅", color: "#2f6e27" };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

/* 6 rows x 7 days covering the month, weeks starting on Monday. */
function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/* Everything happening on one day, as display items sorted by time. */
function itemsOn(key, events, tasks) {
  const evs = events
    .filter(ev => occursOn(ev, key))
    .map(ev => ({ ...EVENT_KINDS[ev.kind || "other"], id: ev.id, title: ev.title, time: ev.time, venue: ev.venue, course: ev.courseCode, repeat: ev.repeatWeekly, event: ev }));
  const due = tasks
    .filter(t => t.date === key)
    .map(t => ({ ...TASK_KIND, id: `task-${t.id}`, title: t.name, course: t.code, done: t.done }));
  return [...evs.sort((a, b) => (a.time || "").localeCompare(b.time || "")), ...due];
}

export default function CalendarPage({ events, tasks, courses, onAddEvent, onDeleteEvent }) {
  const today = todayKey();
  const [view, setView] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [selected, setSelected] = useState(today);

  const days = useMemo(() => monthGrid(view.year, view.month), [view]);
  const selectedItems = itemsOn(selected, events, tasks);

  const shiftMonth = delta =>
    setView(v => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const goToday = () => {
    const n = new Date();
    setView({ year: n.getFullYear(), month: n.getMonth() });
    setSelected(today);
  };

  const selectedLabel = fromKey(selected).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="calendar-layout">
      {/* Month grid */}
      <div className="task-panel task-panel--padded calendar-panel">
        <div className="cal-head">
          <button className="cal-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">◀</button>
          <div className="cal-month">{MONTHS[view.month]} {view.year}</div>
          <button className="cal-nav" onClick={() => shiftMonth(1)} aria-label="Next month">▶</button>
          <button className="cal-today" onClick={goToday}>Today</button>
        </div>

        <div className="cal-grid" role="grid">
          {WEEKDAYS.map(w => <div key={w} className="cal-weekday">{w}</div>)}

          {days.map(d => {
            const key = toKey(d);
            const items = itemsOn(key, events, tasks);
            const outside = d.getMonth() !== view.month;
            return (
              <button
                key={key}
                className={[
                  "cal-day",
                  outside && "cal-day--outside",
                  key === today && "cal-day--today",
                  key === selected && "cal-day--selected",
                ].filter(Boolean).join(" ")}
                onClick={() => setSelected(key)}
                aria-label={`${d.toDateString()}, ${items.length} items`}
              >
                <span className="cal-day__num">{d.getDate()}</span>
                <span className="cal-day__chips">
                  {items.slice(0, 2).map(it => (
                    <span
                      key={it.id}
                      className={`cal-chip ${it.done ? "cal-chip--done" : ""}`}
                      style={{ "--chip": it.color }}
                    >
                      {it.icon} {it.title}
                    </span>
                  ))}
                  {items.length > 2 && <span className="cal-more">+{items.length - 2} more</span>}
                </span>
                <span className="cal-day__dots" aria-hidden="true">
                  {items.slice(0, 4).map(it => (
                    <span key={it.id} className="cal-dot" style={{ background: it.color }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="cal-legend">
          {[...Object.values(EVENT_KINDS), TASK_KIND].map(k => (
            <span key={k.label}><span className="cal-dot" style={{ background: k.color }} /> {k.label}</span>
          ))}
        </div>
      </div>

      {/* Side: exam countdowns, the selected day, add form */}
      <aside className="side-col">
        <ExamCountdowns events={events} />

        <div className="side-card">
          <div className="side-card__title">{selected === today ? "Today" : selectedLabel}</div>
          {selected === today && <div className="agenda-date">{selectedLabel}</div>}
          {selectedItems.length === 0 && <div className="side-empty">Nothing planned. Free day! 🌿</div>}
          {selectedItems.map(it => (
            <div key={it.id} className="agenda-item" style={{ "--chip": it.color }}>
              <div className="agenda-item__main">
                <div className={`agenda-item__title ${it.done ? "task-name--done" : ""}`}>
                  {it.icon} {it.title}
                </div>
                <div className="agenda-item__meta">
                  {[it.time && formatTime(it.time), it.course, it.venue, it.repeat && "weekly"]
                    .filter(Boolean).join(" · ") || it.label}
                </div>
              </div>
              {it.event && (
                <button
                  className="link-row__del"
                  title="Delete"
                  onClick={() => {
                    const msg = it.repeat
                      ? `Delete "${it.title}"? This removes every week of it.`
                      : `Delete "${it.title}"?`;
                    if (window.confirm(msg)) onDeleteEvent(it.event.id);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <AddEventForm date={selected} courses={courses} onAdd={onAddEvent} />
      </aside>
    </div>
  );
}

/* Live countdown cards for the next few exams. */
export function ExamCountdowns({ events, limit = 3, compact = false }) {
  const now = useNow(30000);
  const exams = upcomingExams(events, now).slice(0, limit);

  return (
    <div className="side-card side-card--exam">
      <div className="side-card__title">{compact ? "Next exam" : "Exam countdown"}</div>
      {exams.length === 0 && <div className="side-empty">No exams coming up. 🎉</div>}
      {exams.map((ex, i) => {
        const { days, hours, minutes } = splitDuration(eventStart(ex) - now);
        const big = i === 0;
        return (
          <div key={ex.id} className={`exam-cd ${big ? "exam-cd--big" : ""}`}>
            <div className="exam-cd__name">
              {ex.courseCode && <span className="exam-cd__code">{ex.courseCode}</span>} {ex.title}
            </div>
            <div className="exam-cd__digits" aria-label={`${days} days ${hours} hours ${minutes} minutes left`}>
              <span><b>{days}</b>d</span>
              <span><b>{hours}</b>h</span>
              <span><b>{minutes}</b>m</span>
            </div>
            <div className="exam-cd__when">
              {fromKey(ex.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              {ex.time && ` · ${formatTime(ex.time)}`}
              {ex.venue && ` · ${ex.venue}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AddEventForm({ date, courses, onAdd }) {
  const empty = { kind: "exam", title: "", courseCode: "", time: "", venue: "", repeatWeekly: false, until: "" };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Give it a name, e.g. Final Exam.");
      return;
    }
    if (form.repeatWeekly && form.until && form.until < date) {
      setError("The repeat end date is before the start date.");
      return;
    }
    onAdd({
      kind: form.kind,
      title: form.title.trim(),
      courseCode: form.courseCode,
      date,
      time: form.time,
      venue: form.venue.trim(),
      repeatWeekly: form.kind === "class" && form.repeatWeekly,
      until: form.kind === "class" && form.repeatWeekly ? form.until : "",
    });
    setForm({ ...empty, kind: form.kind });
    setError("");
  };

  return (
    <form className="side-card add-event" onSubmit={handleSubmit}>
      <div className="side-card__title">
        Add to {fromKey(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </div>
      {error && <div className="form-error">{error}</div>}

      <div className="kind-picker" role="radiogroup" aria-label="Type">
        {Object.entries(EVENT_KINDS).map(([id, k]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={form.kind === id}
            className={`kind-btn ${form.kind === id ? "kind-btn--active" : ""}`}
            style={{ "--chip": k.color }}
            onClick={() => set("kind", id)}
          >
            {k.icon} {k.label}
          </button>
        ))}
      </div>

      <input
        className="form-input"
        placeholder={form.kind === "exam" ? "e.g. Final Exam" : form.kind === "class" ? "e.g. Lecture" : "Title"}
        maxLength={50}
        value={form.title}
        onChange={e => set("title", e.target.value)}
      />
      <div className="add-event__row">
        <select className="form-select" value={form.courseCode} onChange={e => set("courseCode", e.target.value)} aria-label="Course">
          <option value="">No course</option>
          {courses.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
        </select>
        <input className="form-input" type="time" value={form.time} onChange={e => set("time", e.target.value)} aria-label="Time" />
      </div>
      <input
        className="form-input"
        placeholder="Venue (optional)"
        maxLength={40}
        value={form.venue}
        onChange={e => set("venue", e.target.value)}
      />

      {form.kind === "class" && (
        <div className="repeat-row">
          <label className="check-label">
            <input type="checkbox" checked={form.repeatWeekly} onChange={e => set("repeatWeekly", e.target.checked)} />
            Repeat every week
          </label>
          {form.repeatWeekly && (
            <label className="check-label">
              until
              <input className="form-input" type="date" min={date} value={form.until} onChange={e => set("until", e.target.value)} />
            </label>
          )}
        </div>
      )}

      <button type="submit" className="submit-btn">Add {EVENT_KINDS[form.kind].label.toLowerCase()}</button>
    </form>
  );
}
