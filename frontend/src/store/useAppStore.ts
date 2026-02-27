import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Sync token with axios headers
const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

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

interface User {
  id: string;
  name: string;
  email?: string;
  xp: number;
  level: number;
  timetable?: Record<string, any>;
  isDark?: boolean;
  role?: string;
  isGuest?: boolean;
}

interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: string | null;

  xp: number;
  level: number;
  streak: number;
  totalStudyMinutes: number;
  focusHours: number;
  tasksCompleted: number;
  totalTasks: number;
  isDark: boolean;
  tasks: Task[];
  timetable: Record<string, any>;

  initialized: boolean;
  init: () => Promise<void>;

  // Auth
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  loginGuest: () => Promise<void>;
  loginAdmin: (username: string, pass: string) => Promise<void>;
  logout: () => void;

  // Actions
  toggleDark: () => void;
  addXP: (amount: number) => void;
  addTask: (task: Omit<Task, '_id' | 'id' | 'completed'>) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  addStudyTime: (minutes: number) => void;
  logStudySession: (subject: string, durationMinutes: number, focusScore?: number) => Promise<void>;
  updateTimetable: (grid: Record<string, any>) => Promise<void>;

  // Test History
  saveTestResult: (testData: any) => Promise<void>;
  fetchTestHistory: () => Promise<any[]>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  role: localStorage.getItem('role') || null,

  xp: 0,
  level: 1,
  streak: 0,
  totalStudyMinutes: 0,
  focusHours: 0,
  tasksCompleted: 0,
  totalTasks: 0,
  isDark: false,
  tasks: [],
  timetable: {},
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    const { token } = get();

    if (token) {
      setAuthToken(token);
      try {
        const [userRes, tasksRes] = await Promise.all([
          axios.get(`${API_URL}/users/me`),
          axios.get(`${API_URL}/tasks`)
        ]);
        const user = userRes.data;
        const tasks = tasksRes.data.map((t: any) => ({ ...t, id: t._id }));

        set({
          user: { id: user._id, name: user.name, email: user.email, isGuest: user.isGuest, xp: user.xp, level: user.level },
          isAuthenticated: true,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          totalStudyMinutes: user.totalStudyMinutes,
          focusHours: user.focusHours,
          tasksCompleted: user.tasksCompleted,
          totalTasks: user.totalTasks,
          isDark: user.isDark,
          timetable: user.timetable || {},
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
        setAuthToken(null);
        set({ isAuthenticated: false, token: null, user: null, initialized: true });
      }
    } else {
      set({ initialized: true });
    }
  },

  login: async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    setAuthToken(res.data.token);
    localStorage.setItem('role', res.data.role);
    set({ token: res.data.token, user: res.data.user, isAuthenticated: true, role: res.data.role, initialized: false });
    await get().init();
  },

  register: async (name, email, password) => {
    const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
    setAuthToken(res.data.token);
    localStorage.setItem('role', res.data.role);
    set({ token: res.data.token, user: res.data.user, isAuthenticated: true, role: res.data.role, initialized: false });
    await get().init();
  },

  loginGuest: async () => {
    const res = await axios.post(`${API_URL}/auth/guest`);
    setAuthToken(res.data.token);
    localStorage.setItem('role', res.data.role);
    set({ token: res.data.token, user: res.data.user, isAuthenticated: true, role: res.data.role, initialized: false });
    await get().init();
  },

  loginAdmin: async (username, password) => {
    const res = await axios.post(`${API_URL}/admin/login`, { username, password });
    setAuthToken(res.data.token);
    localStorage.setItem('role', res.data.role);
    set({
      token: res.data.token,
      user: { id: 'admin', name: 'Admin', xp: 0, level: 0 } as any,
      isAuthenticated: true,
      role: res.data.role,
      initialized: true
    });
  },

  logout: () => {
    setAuthToken(null);
    localStorage.removeItem('role');
    set({
      user: null, token: null, isAuthenticated: false, role: null,
      tasks: [], timetable: {}, xp: 0, level: 1, streak: 0,
      totalStudyMinutes: 0, focusHours: 0, tasksCompleted: 0, totalTasks: 0
    });
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
    if (state.isAuthenticated) {
      try { await axios.put(`${API_URL}/users/me`, { isDark: newDark }); } catch (err) { console.error(err); }
    }
  },

  addXP: async (amount) => {
    const state = get();
    const newXP = state.xp + amount;
    const newLevel = Math.floor(newXP / 500) + 1;
    set({ xp: newXP, level: newLevel });
    if (state.isAuthenticated) {
      try { await axios.put(`${API_URL}/users/me`, { xp: newXP, level: newLevel }); } catch (err) { console.error(err); }
    }
  },

  addStudyTime: async (minutes) => {
    const state = get();
    const newStudyMinutes = state.totalStudyMinutes + minutes;
    const newFocusHours = state.focusHours + (minutes / 60);
    set({ totalStudyMinutes: newStudyMinutes, focusHours: newFocusHours });
    if (state.isAuthenticated && state.role !== 'admin') {
      try { await axios.put(`${API_URL}/users/me`, { totalStudyMinutes: newStudyMinutes, focusHours: newFocusHours }); } catch (err) { console.error(err); }
    }
  },

  logStudySession: async (subject, durationMinutes, focusScore) => {
    const state = get();
    if (state.isAuthenticated && state.role !== 'admin') {
      try {
        await axios.post(`${API_URL}/users/study-session`, {
          subject, duration: durationMinutes, focusScore
        });
      } catch (err) {
        console.error('Failed to log study session for admin analytics', err);
      }
    }
  },

  updateTimetable: async (grid) => {
    set({ timetable: grid });
    const state = get();
    if (state.isAuthenticated) {
      try {
        await axios.put(`${API_URL}/users/me`, { timetable: grid });
      } catch (err) {
        console.error('Failed to save timetable', err);
      }
    }
  },

  addTask: async (task) => {
    const state = get();
    if (!state.isAuthenticated) return;

    try {
      const res = await axios.post(`${API_URL}/tasks`, task);
      const newTask = { ...res.data, id: res.data._id };

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

    if (state.isAuthenticated) {
      try {
        await axios.put(`${API_URL}/tasks/${id}`, { completed: newCompleted });
        await axios.put(`${API_URL}/users/me`, { tasksCompleted: newTasksCompleted, xp: newXP, level: newLevel });
      } catch (err) {
        console.error(err);
      }
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

    if (state.isAuthenticated) {
      try {
        await axios.delete(`${API_URL}/tasks/${id}`);
        await axios.put(`${API_URL}/users/me`, { totalTasks: newTotal, tasksCompleted: newCompleted });
      } catch (err) {
        console.error(err);
      }
    }
  },

  saveTestResult: async (testData: any) => {
    const state = get();
    if (!state.isAuthenticated || state.role === 'admin') return;
    try {
      await axios.post(`${API_URL}/tests`, testData);
    } catch (err) {
      console.error('Failed to save test result', err);
    }
  },

  fetchTestHistory: async () => {
    const state = get();
    if (!state.isAuthenticated) return [];
    try {
      const res = await axios.get(`${API_URL}/tests`);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch test history', err);
      return [];
    }
  }
}));
