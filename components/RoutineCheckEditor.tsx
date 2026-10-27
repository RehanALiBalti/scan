"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  createRoutineCheck,
  getRoutineCheck,
  updateRoutineCheck,
} from "@/lib/adminStore";
import {
  DEFAULT_STATUS_IMAGES,
  ROUTINE_TASK_TYPES,
  dateToRoutineDocId,
  defaultTasksForDay,
  docIdToHtmlDate,
  emptyTask,
  formatRoutineDocLabel,
  htmlDateToDocId,
  makeTaskId,
  type RoutineTask,
  type RoutineTaskType,
} from "@/lib/routineChecks";

const TYPE_META: Record<
  RoutineTaskType,
  { label: string; hint: string; accent: string }
> = {
  status: {
    label: "Mood / Status",
    hint: "User picks one of the mood images",
    accent: "type-status",
  },
  scan_face: {
    label: "Face Scan",
    hint: "Opens the face diagnostic camera",
    accent: "type-face",
  },
  scan_product: {
    label: "Product Scan",
    hint: "Opens product barcode / camera scan",
    accent: "type-product",
  },
  video: {
    label: "Video",
    hint: "Plays a short HTTPS mp4 clip",
    accent: "type-video",
  },
};

function todayHtmlDate() {
  return docIdToHtmlDate(dateToRoutineDocId(new Date()));
}

function stepsToText(steps?: string[]) {
  return (steps || []).join("\n");
}

function textToSteps(value: string) {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function ensureImageSlots(images: string[] | undefined, count = 5) {
  const next = [...(images || [])];
  while (next.length < count) next.push(DEFAULT_STATUS_IMAGES[next.length] || "");
  return next.slice(0, Math.max(count, images?.length || 0));
}

export function RoutineCheckEditor() {
  const params = useParams<{ id?: string }>();
  const idParam = params?.id;
  const isNew = !idParam || idParam === "new";
  const router = useRouter();

  const [htmlDate, setHtmlDate] = useState(todayHtmlDate);
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState("");

  const docId = useMemo(
    () => (isNew ? htmlDateToDocId(htmlDate) : idParam) || "",
    [isNew, htmlDate, idParam],
  );

  useEffect(() => {
    if (isNew) {
      const id = htmlDateToDocId(htmlDate) || dateToRoutineDocId(new Date());
      setTasks(defaultTasksForDay(id));
      setActiveIndex(0);
      return;
    }
    void getRoutineCheck(idParam!)
      .then((item) => {
        if (!item) {
          setError("Routine check not found");
          return;
        }
        setHtmlDate(docIdToHtmlDate(item.id));
        setTasks(
          [...item.tasks].sort((a, b) => a.order - b.order).map((t, i) => ({
            ...t,
            order: t.order || i + 1,
            taskId: t.taskId || makeTaskId(item.id, t.order || i + 1),
          })),
        );
        setActiveIndex(0);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once per route
  }, [isNew, idParam]);

  useEffect(() => {
    if (!isNew || !docId) return;
    setTasks((prev) => {
      if (!prev.length) return defaultTasksForDay(docId);
      return prev.map((t, i) => ({
        ...t,
        order: i + 1,
        taskId: makeTaskId(docId, i + 1),
      }));
    });
  }, [docId, isNew]);

  const activeTask = tasks[activeIndex] ?? null;

  const updateTask = (index: number, patch: Partial<RoutineTask>) => {
    setTasks((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        const next = { ...t, ...patch };
        if (patch.type && patch.type !== t.type) {
          if (patch.type === "status") {
            next.statusImages = ensureImageSlots(next.statusImages, 5);
            delete next.videoUrl;
            delete next.durationSec;
          } else if (patch.type === "video") {
            next.videoUrl = next.videoUrl || "";
            next.durationSec = next.durationSec || 15;
            delete next.statusImages;
          } else {
            delete next.statusImages;
            delete next.videoUrl;
            delete next.durationSec;
          }
        }
        return next;
      }),
    );
  };

  const setStatusImageAt = (taskIndex: number, slot: number, url: string) => {
    setTasks((prev) =>
      prev.map((t, i) => {
        if (i !== taskIndex) return t;
        const imgs = ensureImageSlots(t.statusImages, Math.max(5, slot + 1));
        imgs[slot] = url;
        return { ...t, statusImages: imgs };
      }),
    );
  };

  const moveTask = (index: number, dir: -1 | 1) => {
    setTasks((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j]!, next[index]!];
      const remapped = next.map((t, i) => ({
        ...t,
        order: i + 1,
        taskId: docId ? makeTaskId(docId, i + 1) : t.taskId,
      }));
      setActiveIndex(j);
      return remapped;
    });
  };

  const removeTask = (index: number) => {
    setTasks((prev) => {
      const remapped = prev
        .filter((_, i) => i !== index)
        .map((t, i) => ({
          ...t,
          order: i + 1,
          taskId: docId ? makeTaskId(docId, i + 1) : t.taskId,
        }));
      setActiveIndex((a) =>
        Math.min(a >= index ? Math.max(0, a - 1) : a, Math.max(0, remapped.length - 1)),
      );
      return remapped;
    });
  };

  const addTask = () => {
    if (!docId) return;
    setTasks((prev) => {
      const next = [...prev, emptyTask(docId, prev.length + 1)];
      setActiveIndex(next.length - 1);
      return next;
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!docId) {
      setError("Pick a valid date (doc ID = ddMMyyyy)");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const ordered = tasks.map((t, i) => ({
        ...t,
        order: i + 1,
        taskId: t.taskId || makeTaskId(docId, i + 1),
        statusImages:
          t.type === "status"
            ? (t.statusImages || []).map((u) => u.trim()).filter(Boolean)
            : undefined,
        steps: t.steps?.length ? t.steps : undefined,
      }));
      if (isNew) {
        await createRoutineCheck({ id: docId, tasks: ordered });
      } else {
        await updateRoutineCheck(docId, ordered);
      }
      router.push("/routines");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="toolbar-copy">Loading…</p>;

  return (
    <form className="routine-shell" onSubmit={onSubmit}>
      <header className="routine-hero">
        <div>
          <p className="routine-kicker">Firestore · RoutineChecks</p>
          <h2>{isNew ? "New Daily Plan" : "Edit Daily Plan"}</h2>
          <p className="toolbar-copy">
            Doc ID must be <strong>ddMMyyyy</strong>. Tasks unlock in order. Leave{" "}
            <code>completedUsers</code> empty — the app writes that.
          </p>
        </div>
        <div className="routine-hero-meta">
          <label className="form-label">
            <span className="label-caps">Plan Date</span>
            <input
              className="form-input"
              type="date"
              value={htmlDate}
              disabled={!isNew}
              onChange={(e) => setHtmlDate(e.target.value)}
              required
            />
          </label>
          <div className="routine-doc-pill">
            <span>Document ID</span>
            <strong>{docId || "—"}</strong>
            <small>{docId ? formatRoutineDocLabel(docId) : "Pick a date"}</small>
          </div>
        </div>
      </header>

      <div className="routine-workspace">
        <aside className="routine-rail">
          <div className="routine-rail-head">
            <h3>Task sequence</h3>
            <span>{tasks.length} steps</span>
          </div>
          <ol className="routine-rail-list">
            {tasks.map((task, index) => {
              const meta = TYPE_META[task.type];
              return (
                <li key={task.taskId + index}>
                  <button
                    type="button"
                    className={`routine-rail-item${activeIndex === index ? " active" : ""} ${meta.accent}`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <span className="rail-order">{index + 1}</span>
                    <span className="rail-body">
                      <strong>{task.title || "Untitled task"}</strong>
                      <small>
                        {meta.label} · {task.taskId}
                      </small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <button type="button" className="btn btn-outline rail-add" onClick={addTask}>
            + Add task
          </button>
        </aside>

        <div className="routine-main">
          {activeTask ? (
            <section className="editor-card routine-task-panel">
              <div className="routine-task-head">
                <div>
                  <p className="label-caps">Editing task {activeIndex + 1}</p>
                  <h3>{TYPE_META[activeTask.type].label}</h3>
                  <p className="toolbar-copy">{TYPE_META[activeTask.type].hint}</p>
                </div>
                <div className="product-actions">
                  <button
                    type="button"
                    className="btn btn-soft"
                    disabled={activeIndex === 0}
                    onClick={() => moveTask(activeIndex, -1)}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    className="btn btn-soft"
                    disabled={activeIndex === tasks.length - 1}
                    onClick={() => moveTask(activeIndex, 1)}
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    className="btn btn-soft"
                    onClick={() => removeTask(activeIndex)}
                    disabled={tasks.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="routine-fields">
                <label className="form-label">
                  <span className="label-caps">Task type</span>
                  <select
                    className="form-input"
                    value={activeTask.type}
                    onChange={(e) =>
                      updateTask(activeIndex, {
                        type: e.target.value as RoutineTaskType,
                      })
                    }
                  >
                    {ROUTINE_TASK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_META[t].label} ({t})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-label">
                  <span className="label-caps">Title</span>
                  <input
                    className="form-input form-input-lg"
                    value={activeTask.title}
                    onChange={(e) =>
                      updateTask(activeIndex, { title: e.target.value })
                    }
                    placeholder="Shown on the card in the app"
                    required
                  />
                </label>

                <label className="form-label">
                  <span className="label-caps">Instruction</span>
                  <input
                    className="form-input"
                    value={activeTask.instruction || ""}
                    onChange={(e) =>
                      updateTask(activeIndex, { instruction: e.target.value })
                    }
                    placeholder="Short helper under the title"
                  />
                </label>

                <label className="form-label">
                  <span className="label-caps">Guidance</span>
                  <input
                    className="form-input"
                    value={activeTask.guidance || ""}
                    onChange={(e) =>
                      updateTask(activeIndex, { guidance: e.target.value })
                    }
                    placeholder="Extra guidance (esp. for mood / status)"
                  />
                </label>

                <label className="form-label">
                  <span className="label-caps">Steps</span>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={stepsToText(activeTask.steps)}
                    onChange={(e) =>
                      updateTask(activeIndex, {
                        steps: textToSteps(e.target.value),
                      })
                    }
                    placeholder={"One step per line\nCleanse gently\nPat dry"}
                  />
                  <span className="field-hint">
                    Optional checklist shown in the app. One line = one step.
                  </span>
                </label>

                <label className="check-inline">
                  <input
                    type="checkbox"
                    checked={Boolean(activeTask.requiresNote)}
                    onChange={(e) =>
                      updateTask(activeIndex, {
                        requiresNote: e.target.checked,
                      })
                    }
                  />
                  Requires note from user
                </label>

                {activeTask.type === "status" ? (
                  <div className="status-images-block">
                    <div className="status-images-head">
                      <span className="label-caps">Status images</span>
                      <span className="field-hint">
                        Usually 5 mood faces — preview updates live
                      </span>
                    </div>
                    <div className="status-image-grid">
                      {ensureImageSlots(activeTask.statusImages, 5).map(
                        (url, slot) => (
                          <div key={slot} className="status-image-slot">
                            <div className="status-image-preview">
                              {url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={url} alt={`Mood ${slot + 1}`} />
                              ) : (
                                <span>{slot + 1}</span>
                              )}
                            </div>
                            <label className="form-label">
                              <span className="label-caps">Image {slot + 1}</span>
                              <input
                                className="form-input"
                                type="url"
                                value={url}
                                onChange={(e) =>
                                  setStatusImageAt(
                                    activeIndex,
                                    slot,
                                    e.target.value,
                                  )
                                }
                                placeholder="https://…"
                              />
                            </label>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ) : null}

                {activeTask.type === "video" ? (
                  <div className="form-row-2">
                    <label className="form-label">
                      <span className="label-caps">Video URL</span>
                      <input
                        className="form-input"
                        type="url"
                        value={activeTask.videoUrl || ""}
                        onChange={(e) =>
                          updateTask(activeIndex, { videoUrl: e.target.value })
                        }
                        placeholder="https://…/clip.mp4"
                        required
                      />
                    </label>
                    <label className="form-label">
                      <span className="label-caps">Duration (sec)</span>
                      <input
                        className="form-input"
                        type="number"
                        min={1}
                        value={activeTask.durationSec ?? 15}
                        onChange={(e) =>
                          updateTask(activeIndex, {
                            durationSec: Number(e.target.value) || 15,
                          })
                        }
                      />
                    </label>
                  </div>
                ) : null}

                {(activeTask.type === "scan_face" ||
                  activeTask.type === "scan_product") && (
                  <div className="routine-type-note">
                    No extra media fields for{" "}
                    <strong>{TYPE_META[activeTask.type].label}</strong> — the app
                    opens the camera flow directly.
                  </div>
                )}
              </div>
            </section>
          ) : (
            <p className="toolbar-copy">Add a task to start building the day plan.</p>
          )}
        </div>

        <aside className="routine-preview-col">
          <div className="routine-preview-card">
            <div className="preview-label">App preview</div>
            {activeTask ? (
              <div className="phone-preview">
                <div className="phone-preview-inner">
                  <span className={`preview-type-chip ${TYPE_META[activeTask.type].accent}`}>
                    {TYPE_META[activeTask.type].label}
                  </span>
                  <h4>{activeTask.title || "Task title"}</h4>
                  {activeTask.instruction ? (
                    <p className="preview-instruction">{activeTask.instruction}</p>
                  ) : null}
                  {activeTask.guidance ? (
                    <p className="preview-guidance">{activeTask.guidance}</p>
                  ) : null}

                  {activeTask.type === "status" ? (
                    <div className="preview-moods">
                      {(activeTask.statusImages || [])
                        .filter(Boolean)
                        .map((url) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={url} src={url} alt="" />
                        ))}
                    </div>
                  ) : null}

                  {activeTask.type === "video" ? (
                    <div className="preview-video">
                      <span>▶</span>
                      <div>
                        <strong>Video clip</strong>
                        <small>{activeTask.durationSec ?? 15}s</small>
                      </div>
                    </div>
                  ) : null}

                  {(activeTask.type === "scan_face" ||
                    activeTask.type === "scan_product") && (
                    <div className="preview-scan">
                      <span>◎</span>
                      Ready to open camera
                    </div>
                  )}

                  {activeTask.steps && activeTask.steps.length > 0 ? (
                    <ol className="preview-steps">
                      {activeTask.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  ) : null}

                  {activeTask.requiresNote ? (
                    <div className="preview-note">Note required</div>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="toolbar-copy">Select a task to preview.</p>
            )}
          </div>
        </aside>
      </div>

      <footer className="routine-footer">
        {error ? <p className="error">{error}</p> : null}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-soft"
            onClick={() => router.push("/routines")}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy || !tasks.length}>
            {busy ? "Saving…" : isNew ? "Create Day Plan" : "Save Changes"}
          </button>
        </div>
      </footer>
    </form>
  );
}
