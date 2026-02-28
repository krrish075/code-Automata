import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { Clock, CheckCircle2, Flame, Trophy, TrendingUp, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import dayjs from 'dayjs';

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const focusColors = ['hsl(239, 84%, 67%)', 'hsl(var(--muted))'];

const AnalyticsPage = () => {
  const { tasksCompleted, totalTasks, streak, focusHours, totalStudyMinutes, fetchTestHistory, token } = useAppStore();
  const navigate = useNavigate();
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const loadTests = async () => {
      const history = await fetchTestHistory();
      setTestHistory(history);
    };
    if (token) {
      loadTests();
      axios.get(`${API_URL}/users/study-session`)
        .then(res => setSessions(res.data))
        .catch(err => console.error("Failed to fetch study sessions", err));
    }
  }, [fetchTestHistory, token]);

  // Transform actual data into chart props
  const { trendData, subjectData, focusData, focusPercent } = useMemo(() => {
    // 1. Trend Data (last 6 weeks)
    const weeksMap = new Map<number, number>();
    sessions.forEach(s => {
      const d = new Date(s.date);
      // Rough calc for relative week number based on today
      const msDiff = Date.now() - d.getTime();
      const weeksAgo = Math.floor(msDiff / (1000 * 60 * 60 * 24 * 7));
      if (weeksAgo <= 5) {
        weeksMap.set(weeksAgo, (weeksMap.get(weeksAgo) || 0) + s.duration);
      }
    });

    const trend = [];
    for (let i = 5; i >= 0; i--) {
      trend.push({
        week: i === 0 ? 'This Wk' : `Wk -${i}`,
        hours: Math.round(((weeksMap.get(i) || 0) / 60) * 10) / 10
      });
    }

    // 2. Subject Distribution
    const subjs: Record<string, number> = {};
    sessions.forEach(s => {
      const name = s.subject || 'General Focus';
      subjs[name] = (subjs[name] || 0) + s.duration;
    });

    const palette = ['hsl(239, 84%, 67%)', 'hsl(263, 90%, 66%)', 'hsl(187, 85%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(43, 96%, 56%)'];
    const subjects = Object.entries(subjs)
      .sort((a, b) => b[1] - a[1]) // Sort highest hours first
      .map(([name, mins], idx) => ({
        name,
        hours: Math.round((mins / 60) * 10) / 10,
        color: palette[idx % palette.length]
      }));

    // 3. Focus / Distracted slice averaging
    let totalFocusScore = 0;
    let validSessions = 0;
    sessions.forEach(s => {
      if (s.focusScore !== undefined) {
        totalFocusScore += s.focusScore;
        validSessions++;
      }
    });

    // Default 100% focus if no logged focus metrics
    const avgFocused = validSessions > 0 ? Math.round(totalFocusScore / validSessions) : 100;
    const distracted = 100 - avgFocused;

    const focusArr = [
      { name: 'Focused', value: avgFocused },
      { name: 'Distracted', value: distracted },
    ];

    return { trendData: trend, subjectData: subjects, focusData: focusArr, focusPercent: avgFocused };
  }, [sessions]);

  const stats = [
    { icon: Clock, label: 'Total Study', value: `${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m`, color: 'text-primary' },
    { icon: CheckCircle2, label: 'Tasks Done', value: `${tasksCompleted}/${totalTasks}`, color: 'text-success' },
    { icon: Flame, label: 'Streak', value: `${streak} days`, color: 'text-destructive' },
    { icon: Trophy, label: 'Top %', value: '1%', color: 'text-warning' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your study patterns and progress.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card-hover p-5">
            <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
            <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Study Hour Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="hours" stroke="hsl(239, 84%, 67%)" fill="url(#trendGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Focus Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Focus vs Distracted</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={focusData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {focusData.map((_, i) => <Cell key={i} fill={focusColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-full bg-primary" /> Focused {focusPercent}%</span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-full bg-muted" /> Distracted {100 - focusPercent}%</span>
          </div>
        </motion.div>

        {/* Subject Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card p-6 lg:col-span-2">
          <h3 className="font-display font-semibold text-foreground mb-4">Subject Focus Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectData}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
              <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                {subjectData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Test History Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8">
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">Past Work & Tests</h2>

        {testHistory.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            No tests taken yet. Head over to <b>Work & Test</b> to generate your first AI assessment!
          </div>
        ) : (
          <div className="space-y-4">
            {testHistory.map((test, index) => {
              const isExpanded = expandedTest === test._id;
              const formattedDate = dayjs(test.createdAt).format('MMMM D, YYYY • h:mm A');

              return (
                <div key={test._id || index} className="glass-card overflow-hidden transition-all">
                  <button
                    onClick={() => setExpandedTest(isExpanded ? null : test._id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                          {test.subjectName || 'General'}
                        </span>
                        <h3 className="font-semibold text-lg text-foreground">{test.testName}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{formattedDate}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-bold text-lg text-foreground">{test.score} / {test.totalQuestions}</p>
                        <p className="text-xs text-muted-foreground mr-2 border-r border-border pr-3">Score</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/work-test', { state: { restartTest: test } });
                        }}
                        className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
                      >
                        Try Again (10m)
                      </button>

                      {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground ml-2" /> : <ChevronDown className="w-5 h-5 text-muted-foreground ml-2" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border bg-background/30"
                      >
                        <div className="p-6 space-y-6">
                          {test.questions.map((q: any, qIdx: number) => {
                            const isOmitted = q.userSelectedIndex === -1;
                            const isCorrect = q.userSelectedIndex === q.correctIndex;

                            return (
                              <div key={qIdx} className="p-4 rounded-xl border border-border bg-background/50">
                                <div className="flex justify-between items-start mb-3 gap-4">
                                  <h4 className="font-medium text-foreground">{qIdx + 1}. {q.questionText}</h4>
                                  <span className={`text-xs px-2 py-1 rounded-md border flex-shrink-0 ${q.difficulty === 'Hard' ? 'bg-destructive/10 text-destructive border-destructive' :
                                    q.difficulty === 'Easy' ? 'bg-success/10 text-success border-success' :
                                      'bg-primary/10 text-primary border-primary'
                                    }`}>
                                    {q.difficulty}
                                  </span>
                                </div>

                                <div className="space-y-2 mb-3">
                                  {q.options.map((opt: string, optIdx: number) => {
                                    const isUserChoice = q.userSelectedIndex === optIdx;
                                    const isActualCorrect = q.correctIndex === optIdx;

                                    let btnClass = "w-full text-left px-4 py-2 rounded-lg text-sm border ";
                                    if (isActualCorrect) {
                                      btnClass += "bg-success/10 border-success text-success-foreground font-medium";
                                    } else if (isUserChoice && !isActualCorrect) {
                                      btnClass += "bg-destructive/10 border-destructive text-destructive font-medium";
                                    } else {
                                      btnClass += "bg-muted/20 border-transparent text-muted-foreground opacity-60";
                                    }

                                    return (
                                      <div key={optIdx} className={btnClass}>
                                        <div className="flex items-center justify-between">
                                          <span>{opt}</span>
                                          {isActualCorrect && <CheckCircle2 className="w-4 h-4 text-success" />}
                                          {isUserChoice && !isActualCorrect && <XCircle className="w-4 h-4 text-destructive" />}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-foreground/80 italic flex items-start gap-2">
                                  <span>💡</span>
                                  <span>{q.explanation}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;
