
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: TaskPriority;
  dueDate?: string;
}