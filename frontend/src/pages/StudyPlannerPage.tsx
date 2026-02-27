import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Plus, Trash2, CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';

const priorityStyles: Record<string, string> = {
  high: 'priority-high',
  mid: 'priority-mid',
  low: 'priority-low',
};

const StudyPlannerPage = () => {
  const { tasks, toggleTask, removeTask, addTask } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ subject: '', topic: '', eta: 30, timeSlot: '9:00 AM', priority: 'mid' as 'high' | 'mid' | 'low' });

  const handleAdd = () => {
    if (!form.subject || !form.topic) return;
    addTask(form);
    setForm({ subject: '', topic: '', eta: 30, timeSlot: '9:00 AM', priority: 'mid' });
    setShowAdd(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Study Planner</h1>
          <p className="text-muted-foreground mt-1">Manage your study tasks with priorities and focus mode.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-bg text-primary-foreground text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </motion.button>
      </motion.div>

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
      </div>
    </div>
  );
};

export default StudyPlannerPage;
