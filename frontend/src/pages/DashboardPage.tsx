import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import {
  Clock, Flame, Zap, Target, TrendingUp, BookOpen, Trophy, Quote
} from 'lucide-react';
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const quotes = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Education is the passport to the future. — Malcolm X",
  "Success is the sum of small efforts repeated day in and day out.",
];

const DashboardPage = () => {
  const { xp, level, streak, totalStudyMinutes, focusHours, tasksCompleted, totalTasks, timetable, token } = useAppStore();
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/users/study-session`)
      .then(res => setSessions(res.data))
      .catch(err => console.error("Failed to fetch study sessions", err));
  }, [token]);

  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(d => ({ day: d, expected: 0, actual: 0 }));

    if (timetable && typeof timetable === 'object') {
      days.forEach((day, index) => {
        const daySchedule = timetable[day];
        if (Array.isArray(daySchedule)) {
          let totalMinutes = 0;
          daySchedule.forEach((block: any) => {
            if (block.time) {
              // Parse "HH:MM - HH:MM"
              const times = block.time.split('-');
              if (times.length === 2) {
                const start = times[0].trim();
                const end = times[1].trim();

                const parseTime = (timeStr: string) => {
                  const parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                  if (!parts) return 0;
                  let hours = parseInt(parts[1], 10);
                  const minutes = parseInt(parts[2], 10);
                  const ampm = parts[3] ? parts[3].toUpperCase() : '';

                  if (ampm === 'PM' && hours < 12) hours += 12;
                  if (ampm === 'AM' && hours === 12) hours = 0;

                  return hours * 60 + minutes;
                };

                const startMins = parseTime(start);
                const endMins = parseTime(end);

                if (endMins > startMins) {
                  totalMinutes += (endMins - startMins);
                } else if (endMins < startMins) {
                  // cross midnight case
                  totalMinutes += ((24 * 60) - startMins + endMins);
                }
              }
            }
          });
          data[index].expected = Math.round((totalMinutes / 60) * 10) / 10;
        }
      });
    }

    // 2) Calculate ACTUAL hours from completed completed sessions
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // make Sunday 7 instead of 0
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1); // Go back to Monday

    sessions.forEach(session => {
      const sessionDate = new Date(session.date);
      if (sessionDate >= startOfWeek) {
        let dayIdx = sessionDate.getDay() - 1;
        if (dayIdx === -1) dayIdx = 6; // Sunday
        data[dayIdx].actual += session.duration;
      }
    });

    // Rounding
    data.forEach(d => { d.actual = Math.round(d.actual * 10) / 10; });

    return data;
  }, [timetable, sessions]);

  const xpInLevel = xp % 500;
  const xpNeeded = 500;
  const productivityScore = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  const stats = [
    { icon: Clock, label: "Today's Study", value: `${Math.floor(totalStudyMinutes / 60)}h ${Math.floor(totalStudyMinutes % 60)}m`, color: 'text-primary' },
    { icon: Target, label: 'Focus Hours', value: `${Math.round(focusHours * 10) / 10}h`, color: 'text-accent' },
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
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
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
                <Area type="monotone" dataKey="expected" name="Planned" stroke="hsl(239, 84%, 67%)" fill="url(#colorExpected)" strokeWidth={2} />
                <Area type="monotone" dataKey="actual" name="Completed" stroke="hsl(142, 71%, 45%)" fill="url(#colorActual)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
