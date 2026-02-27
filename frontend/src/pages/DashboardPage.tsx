import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import {
  Clock, Flame, Zap, Target, TrendingUp, BookOpen, Trophy, Quote
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const weeklyData = [
  { day: 'Mon', hours: 3.5 }, { day: 'Tue', hours: 4.2 }, { day: 'Wed', hours: 2.8 },
  { day: 'Thu', hours: 5.1 }, { day: 'Fri', hours: 3.9 }, { day: 'Sat', hours: 6.0 },
  { day: 'Sun', hours: 4.5 },
];

const quotes = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Education is the passport to the future. — Malcolm X",
  "Success is the sum of small efforts repeated day in and day out.",
];

const DashboardPage = () => {
  const { xp, level, streak, totalStudyMinutes, focusHours, tasksCompleted, totalTasks } = useAppStore();
  const xpInLevel = xp % 500;
  const xpNeeded = 500;
  const productivityScore = Math.round((tasksCompleted / totalTasks) * 100);
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  const stats = [
    { icon: Clock, label: "Today's Study", value: '3h 20m', color: 'text-primary' },
    { icon: Target, label: 'Focus Hours', value: `${focusHours}h`, color: 'text-accent' },
    { icon: Flame, label: 'Streak', value: `${streak} days`, color: 'text-destructive' },
    { icon: TrendingUp, label: 'Productivity', value: `${productivityScore}%`, color: 'text-success' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your study overview.</p>
      </motion.div>

      {/* XP Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-foreground">Level {level}</span>
              <p className="text-xs text-muted-foreground">{xpInLevel} / {xpNeeded} XP</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-primary">
            <Zap className="w-4 h-4" />
            {xp} XP Total
          </div>
        </div>
        <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(xpInLevel / xpNeeded) * 100}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-full rounded-full gradient-bg"
          />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="glass-card-hover p-5"
          >
            <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
            <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-4">Weekly Study Hours</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}
              />
              <Area type="monotone" dataKey="hours" stroke="hsl(239, 84%, 67%)" fill="url(#colorHours)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Tasks Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">Tasks</h3>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-bold text-foreground">{tasksCompleted}</span>
              <span className="text-muted-foreground mb-1">/ {totalTasks} completed</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted mt-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(tasksCompleted / totalTasks) * 100}%` }}
                transition={{ duration: 1, delay: 0.8 }}
                className="h-full rounded-full gradient-accent-bg"
              />
            </div>
          </motion.div>

          {/* Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="glass-card p-6"
          >
            <Quote className="w-5 h-5 text-secondary mb-3" />
            <p className="text-sm text-muted-foreground italic leading-relaxed">{quote}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
