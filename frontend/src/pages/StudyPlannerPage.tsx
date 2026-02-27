import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Plus, Trash2, CheckCircle2, Circle, Clock, Play, Pause, RotateCcw, Timer, Eye } from 'lucide-react';
import FocusMode from '@/components/FocusMode';

const priorityStyles: Record<string, string> = {
  high: 'priority-high',
  mid: 'priority-mid',
  low: 'priority-low',
};

const presets = [
  { label: 'Pomodoro 25/5', work: 25, rest: 5 },
  { label: 'Deep Focus 50/10', work: 50, rest: 10 },
  { label: 'Custom', work: 0, rest: 0 },
];

const StudyPlannerPage = () => {
  const { tasks, toggleTask, removeTask, addTask, addStudyTime } = useAppStore();

  // Planner State
  const [activeTab, setActiveTab] = useState<'planner' | 'session'>('planner');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ subject: '', topic: '', eta: 30, timeSlot: '9:00 AM', priority: 'mid' as 'high' | 'mid' | 'low' });

  // Session State
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isWork, setIsWork] = useState(true);
  const [totalFocus, setTotalFocus] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Timer Logic
  const preset = presets[selectedPreset];
  const maxSeconds = (isWork ? (preset.work || minutes) : (preset.rest || 5)) * 60;
  const totalSeconds = minutes * 60 + seconds;
  const progress = maxSeconds > 0 ? ((maxSeconds - totalSeconds) / maxSeconds) * 100 : 0;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s === 0) {
            setMinutes(m => {
              if (m === 0) {
                setIsRunning(false);
                setIsWork(w => !w);
                if (isWork && preset.work) {
                  addStudyTime(preset.work);
                }
                return isWork ? (preset.rest || 5) : (preset.work || 25);
              }
              return m - 1;
            });
            return s === 0 && minutes === 0 ? 0 : 59;
          }
          if (isWork) setTotalFocus(f => f + 1);
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isWork, preset, minutes, addStudyTime]);

  const selectPreset = (i: number) => {
    setSelectedPreset(i);
    if (i < 2) {
      setMinutes(presets[i].work);
      setSeconds(0);
      setIsRunning(false);
      setIsWork(true);
    }
  };

  const resetTimer = () => {
    setMinutes(preset.work || 25);
    setSeconds(0);
    setIsRunning(false);
    setIsWork(true);
  };

  const formatTime = (m: number, s: number) =>
    `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const handleAdd = () => {
    if (!form.subject || !form.topic) return;
    addTask(form);
    setForm({ subject: '', topic: '', eta: 30, timeSlot: '9:00 AM', priority: 'mid' });
    setShowAdd(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Study Planner</h1>
          <p className="text-muted-foreground mt-1">Manage tasks and track focus time.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'planner' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Planner
            </button>
            <button
              onClick={() => setActiveTab('session')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'session' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Session
            </button>
          </div>
          {activeTab === 'planner' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-bg text-primary-foreground text-sm font-semibold whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </motion.button>
          )}
        </div>
      </motion.div>

      {activeTab === 'planner' ? (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
          {/* Add form */}
          <AnimatePresence>
            {showAdd && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="glass-card p-6 mb-6 overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input placeholder="Subject Name" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input placeholder="Topic Name" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                    className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input type="number" placeholder="ETA (min)" value={form.eta} onChange={e => setForm(f => ({ ...f, eta: +e.target.value }))}
                    className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input placeholder="Time Slot" value={form.timeSlot} onChange={e => setForm(f => ({ ...f, timeSlot: e.target.value }))}
                    className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as 'high' | 'mid' | 'low' }))}
                    className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="high">High Priority</option>
                    <option value="mid">Mid Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                  <button onClick={handleAdd} className="px-4 py-2.5 rounded-xl gradient-bg text-primary-foreground text-sm font-semibold">
                    Add Task
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tasks */}
          <div className="space-y-3">
            <AnimatePresence>
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card-hover p-5 flex items-center gap-4 ${task.completed ? 'opacity-60' : ''}`}
                >
                  <button onClick={() => toggleTask(task.id)} className="flex-shrink-0">
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-foreground ${task.completed ? 'line-through' : ''}`}>{task.subject}</h3>
                    <p className="text-sm text-muted-foreground truncate">{task.topic}</p>
                  </div>

                  <div className="hidden sm:flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" /> {task.eta}m
                    </span>
                    <span className="text-xs text-muted-foreground">{task.timeSlot}</span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${priorityStyles[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>

                  <button onClick={() => removeTask(task.id)} className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {tasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No study tasks planned. Add one to get started!</p>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md mx-auto py-4">
          {/* Preset Selector */}
          <div className="flex gap-2 mb-8 justify-center">
            {presets.map((p, i) => (
              <button
                key={p.label}
                onClick={() => selectPreset(i)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedPreset === i ? 'gradient-bg text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Timer Circle */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-10 flex flex-col items-center mb-8"
          >
            <div className="relative w-52 h-52 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <circle cx="100" cy="100" r="90" fill="none" stroke="url(#timerGrad)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(239, 84%, 67%)" />
                    <stop offset="100%" stopColor="hsl(263, 70%, 66%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-bold text-foreground">{formatTime(minutes, seconds)}</span>
                <span className="text-xs text-muted-foreground mt-1">{isWork ? 'Focus Time' : 'Break Time'}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={resetTimer}
                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsRunning(!isRunning)}
                className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25"
              >
                {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
              </motion.button>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Eye className="w-5 h-5" />
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="glass-card p-4 text-center">
              <Timer className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="font-display text-xl font-bold text-foreground">{Math.floor(totalFocus / 60)}m</p>
              <p className="text-xs text-muted-foreground">Focus Time</p>
            </div>
            <div className="glass-card p-4 text-center">
              <Eye className="w-5 h-5 text-accent mx-auto mb-2" />
              <p className="font-display text-xl font-bold text-foreground">98%</p>
              <p className="text-xs text-muted-foreground">Attention Score</p>
            </div>
          </div>

          {/* AI Focus Tracker */}
          <FocusMode isActive={isRunning && isWork} />
        </motion.div>
      )}
    </div>
  );
};

export default StudyPlannerPage;

