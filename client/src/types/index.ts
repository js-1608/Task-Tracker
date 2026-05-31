// client/src/types/index.ts
export type Role = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: Role;
  orgId: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  orgId: string;
  createdById: { _id: string; name: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  assigneeId?: { _id: string; name: string; email: string } | null;
  projectId: { _id: string; name: string } | string;
  orgId: string;
  dueDate?: string | null;
  createdById: { _id: string; name: string } | string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  orgId: string;
}

export interface OverdueStats {
  overdueByUser: Array<{ userId: string; userName: string; email: string; overdueCount: number }>;
  avgCompletionHours: number | null;
}
