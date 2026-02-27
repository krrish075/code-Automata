import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface Task {
  _id?: string;
  id?: string;
  subject: string;
  topic: string;
  eta: number;
  timeSlot: string;
  priority: 'high' | 'mid' | 'low';
  completed: boolean;
}

interface AppState {
  xp: number;
  level: number;
  streak: number;
  totalStudyMinutes: number;
  focusHours: number;
  tasksCompleted: number;
  totalTasks: number;
  isDark: boolean;
  tasks: Task[];
  initialized: boolean;
  init: () => Promise<void>;
  toggleDark: () => void;
  addXP: (amount: number) => void;
  addTask: (task: Omit<Task, '_id' | 'id' | 'completed'>) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  addStudyTime: (minutes: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  xp: 0,
  level: 1,
  streak: 0,
  totalStudyMinutes: 0,
  focusHours: 0,
  tasksCompleted: 0,
  totalTasks: 0,
  isDark: false,
  tasks: [],
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    try {
      const [userRes, tasksRes] = await Promise.all([
        axios.get(`${API_URL}/users/me`),
        axios.get(`${API_URL}/tasks`)
      ]);
      const user = userRes.data;
      const tasks = tasksRes.data.map((t: any) => ({ ...t, id: t._id }));

      set({
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        totalStudyMinutes: user.totalStudyMinutes,
        focusHours: user.focusHours,
        tasksCompleted: user.tasksCompleted,
        totalTasks: user.totalTasks,
        isDark: user.isDark,
        tasks,
        initialized: true
      });

      if (user.isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      console.error('Failed to init store', err);
    }
  },

  toggleDark: async () => {
    const state = get();
    const newDark = !state.isDark;
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDark: newDark });
    try {
      await axios.put(`${API_URL}/users/me`, { isDark: newDark });
    } catch (err) {
      console.error(err);
    }
  },

  addXP: async (amount) => {
    const state = get();
    const newXP = state.xp + amount;
    const newLevel = Math.floor(newXP / 500) + 1;
    set({ xp: newXP, level: newLevel });
    try {
      await axios.put(`${API_URL}/users/me`, { xp: newXP, level: newLevel });
    } catch (err) {
      console.error(err);
    }
  },

  addStudyTime: async (minutes) => {
    const state = get();
    const newStudyMinutes = state.totalStudyMinutes + minutes;
    const newFocusHours = state.focusHours + (minutes / 60);
    set({ totalStudyMinutes: newStudyMinutes, focusHours: newFocusHours });
    try {
      await axios.put(`${API_URL}/users/me`, { totalStudyMinutes: newStudyMinutes, focusHours: newFocusHours });
    } catch (err) {
      console.error(err);
    }
  },

  addTask: async (task) => {
    try {
      const res = await axios.post(`${API_URL}/tasks`, task);
      const newTask = { ...res.data, id: res.data._id };

      const state = get();
      const newTotal = state.totalTasks + 1;

      set({
        tasks: [...state.tasks, newTask],
        totalTasks: newTotal,
      });

      await axios.put(`${API_URL}/users/me`, { totalTasks: newTotal });
    } catch (err) {
      console.error(err);
    }
  },

  toggleTask: async (id) => {
    const state = get();
    const task = state.tasks.find(t => t.id === id || t._id === id);
    if (!task) return;

    const wasCompleted = task.completed;
    const newCompleted = !wasCompleted;

    // Optimistic UI update
    const tasksCompletedDelta = wasCompleted ? -1 : 1;
    const xpDelta = wasCompleted ? -50 : 50;

    const newTasksCompleted = state.tasksCompleted + tasksCompletedDelta;
    const newXP = state.xp + xpDelta;
    const newLevel = Math.floor(newXP / 500) + 1;

    set({
      tasks: state.tasks.map(t => (t.id === id || t._id === id) ? { ...t, completed: newCompleted } : t),
      tasksCompleted: newTasksCompleted,
      xp: newXP,
      level: newLevel
    });

    try {
      await axios.put(`${API_URL}/tasks/${id}`, { completed: newCompleted });
      await axios.put(`${API_URL}/users/me`, { tasksCompleted: newTasksCompleted, xp: newXP, level: newLevel });
    } catch (err) {
      console.error(err);
    }
  },

  removeTask: async (id) => {
    const state = get();
    const task = state.tasks.find(t => t.id === id || t._id === id);
    if (!task) return;

    const newTotal = state.totalTasks - 1;
    const newCompleted = task.completed ? state.tasksCompleted - 1 : state.tasksCompleted;

    set({
      tasks: state.tasks.filter(t => t.id !== id && t._id !== id),
      totalTasks: newTotal,
      tasksCompleted: newCompleted
    });

    try {
      await axios.delete(`${API_URL}/tasks/${id}`);
      await axios.put(`${API_URL}/users/me`, { totalTasks: newTotal, tasksCompleted: newCompleted });
    } catch (err) {
      console.error(err);
    }
  },
}));
