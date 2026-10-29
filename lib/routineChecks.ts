export const ROUTINE_CHECKS_COLLECTION = "RoutineChecks";

export const ROUTINE_TASK_TYPES = [
  "status",
  "scan_face",
  "scan_product",
  "video",
] as const;

export type RoutineTaskType = (typeof ROUTINE_TASK_TYPES)[number];

export type RoutineTask = {
  taskId: string;
  type: RoutineTaskType;
  order: number;
  title: string;
  instruction?: string;
  guidance?: string;
  steps?: string[];
  requiresNote?: boolean;
  statusImages?: string[];
  videoUrl?: string;
  durationSec?: number;
};

export type RoutineCheckDoc = {
  id: string;
  taskCount: number;
  tasks: RoutineTask[];
  createdAt: number;
  updatedAt: number;
  /** App-owned; admin never seeds this */
  completedUsers?: unknown[];
};

/** Date → Firestore doc ID `ddMMyyyy` */
export function dateToRoutineDocId(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}${mm}${yyyy}`;
}

/** `ddMMyyyy` → Date (local) or null */
export function routineDocIdToDate(id: string): Date | null {
  if (!/^\d{8}$/.test(id)) return null;
  const dd = Number(id.slice(0, 2));
  const mm = Number(id.slice(2, 4));
  const yyyy = Number(id.slice(4, 8));
  const d = new Date(yyyy, mm - 1, dd);
  if (
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return null;
  }
  return d;
}

export function formatRoutineDocLabel(id: string): string {
  const d = routineDocIdToDate(id);
  if (!d) return id;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** HTML date input `yyyy-mm-dd` ↔ doc id */
export function htmlDateToDocId(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  return dateToRoutineDocId(new Date(y!, m! - 1, d!));
}

export function docIdToHtmlDate(id: string): string {
  const d = routineDocIdToDate(id);
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function padTaskIndex(n: number): string {
  return String(n).padStart(2, "0");
}

export function makeTaskId(docId: string, order: number): string {
  return `${docId}_${padTaskIndex(order)}`;
}

/** New day starts with a single blank task — admin adds more as needed. */
export function defaultTasksForDay(docId: string): RoutineTask[] {
  return [emptyTask(docId, 1)];
}

export function emptyTask(docId: string, order: number): RoutineTask {
  return {
    taskId: makeTaskId(docId, order),
    type: "status",
    order,
    title: "",
    guidance: "",
    statusImages: [],
  };
}

/** Normalize + validate payload for Firestore write (never writes completedUsers). */
export function toRoutineFirestore(
  docId: string,
  input: { tasks: RoutineTask[]; createdAt?: number },
  opts?: { isCreate?: boolean },
): Record<string, unknown> {
  if (!/^\d{8}$/.test(docId) || !routineDocIdToDate(docId)) {
    throw new Error("Document ID must be ddMMyyyy (e.g. 26102026)");
  }

  const now = Date.now();
  const tasks = [...(input.tasks || [])]
    .map((t, i) => normalizeTask(docId, t, i + 1))
    .sort((a, b) => a.order - b.order);

  if (!tasks.length) {
    throw new Error("At least one task is required");
  }

  const payload: Record<string, unknown> = {
    taskCount: tasks.length,
    tasks,
    updatedAt: now,
  };

  if (opts?.isCreate) {
    payload.createdAt = input.createdAt || now;
    payload.completedUsers = [];
  }

  return payload;
}

function normalizeTask(
  docId: string,
  raw: RoutineTask,
  fallbackOrder: number,
): RoutineTask {
  const order = Number(raw.order) || fallbackOrder;
  const type = String(raw.type || "") as RoutineTaskType;
  if (!ROUTINE_TASK_TYPES.includes(type)) {
    throw new Error(
      `Invalid task type "${raw.type}". Use: ${ROUTINE_TASK_TYPES.join(", ")}`,
    );
  }

  const title = String(raw.title || "").trim();
  if (!title) throw new Error(`Task order ${order} needs a title`);

  const task: RoutineTask = {
    taskId: String(raw.taskId || makeTaskId(docId, order)),
    type,
    order,
    title,
  };

  if (raw.instruction) task.instruction = String(raw.instruction);
  if (raw.guidance) task.guidance = String(raw.guidance);
  if (Array.isArray(raw.steps) && raw.steps.length) {
    task.steps = raw.steps.map(String).filter(Boolean);
  }
  if (typeof raw.requiresNote === "boolean") {
    task.requiresNote = raw.requiresNote;
  }

  if (type === "status") {
    const imgs = (raw.statusImages || [])
      .map(String)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));
    if (!imgs.length) {
      throw new Error(
        `Status task (order ${order}) needs at least one uploaded image`,
      );
    }
    task.statusImages = imgs;
  }

  if (type === "video") {
    const url = String(raw.videoUrl || "").trim();
    if (!url.startsWith("http")) {
      throw new Error(
        `Video task (order ${order}) needs a video uploaded to Storage`,
      );
    }
    task.videoUrl = url;
    if (raw.durationSec != null) {
      task.durationSec = Number(raw.durationSec) || 15;
    }
  }

  return task;
}

export function mapRoutineDoc(
  id: string,
  data: Record<string, unknown>,
): RoutineCheckDoc {
  const tasks = Array.isArray(data.tasks)
    ? (data.tasks as RoutineTask[])
    : [];
  return {
    id,
    taskCount: Number(data.taskCount) || tasks.length,
    tasks,
    createdAt: Number(data.createdAt) || 0,
    updatedAt: Number(data.updatedAt) || 0,
    completedUsers: Array.isArray(data.completedUsers)
      ? data.completedUsers
      : [],
  };
}
