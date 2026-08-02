import { clone } from "../core/utils.js";

const activeStatuses = new Set(["scheduled", "running", "paused"]);

export class TaskService {
  constructor({ repository, clock, ids, optimizer }) {
    this.repository = repository;
    this.clock = clock;
    this.ids = ids;
    this.optimizer = optimizer;
  }

  current(scopeId) {
    const task = this.repository.getTask(scopeId);
    return task && activeStatuses.has(task.status) ? clone(task) : null;
  }

  latest(scopeId) {
    const task = this.repository.getTask(scopeId);
    return task ? clone(task) : null;
  }

  create(scopeId, specification) {
    if (this.current(scopeId)) return { conflict: true, task: this.current(scopeId) };
    const now = this.clock.iso();
    const task = {
      taskId: this.ids.next("task"),
      scopeId,
      taskVersion: 1,
      type: specification.type,
      status: specification.scheduledFor ? "scheduled" : "running",
      isSimulation: specification.type === "optimization",
      executionSource: specification.executionSource ?? "mock",
      createdAt: now,
      updatedAt: now,
    };
    if (specification.mode) task.mode = specification.mode;
    if (specification.scheduledFor) task.scheduledFor = specification.scheduledFor;
    this.repository.setTask(scopeId, task);
    return { conflict: false, task: clone(task) };
  }

  transition(scopeId, requested) {
    const activeTask = this.current(scopeId);
    const latestTask = requested === "stop" ? this.latest(scopeId) : null;
    const task = activeTask ?? (latestTask?.status === "stopped" ? latestTask : null);
    if (!task) return { found: false, changed: false, task: null };
    const targets = { pause: "paused", resume: "running", stop: "stopped" };
    const target = targets[requested];
    if (task.status === target || (requested === "resume" && task.status === "running")) return { found: true, changed: false, task };
    const allowed = (requested === "pause" && task.status === "running")
      || (requested === "resume" && task.status === "paused")
      || (requested === "stop" && activeStatuses.has(task.status));
    if (!allowed) return { found: true, changed: false, invalid: true, task };
    const stored = this.repository.getTask(scopeId);
    const fromStatus = stored.status;
    stored.status = target;
    stored.taskVersion += 1;
    stored.updatedAt = this.clock.iso();
    this.repository.setTask(scopeId, stored);
    return { found: true, changed: true, fromStatus, task: clone(stored) };
  }

  stopForReplacement(scopeId) {
    return this.transition(scopeId, "stop");
  }

  activateDue(scopeId) {
    const task = this.current(scopeId);
    if (!task || task.status !== "scheduled" || new Date(task.scheduledFor) > this.clock.now()) return { changed: false, task };
    const stored = this.repository.getTask(scopeId);
    stored.status = "running";
    stored.taskVersion += 1;
    stored.updatedAt = this.clock.iso();
    this.repository.setTask(scopeId, stored);
    return { changed: true, fromStatus: "scheduled", task: clone(stored) };
  }
}

export { activeStatuses };
