import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, TrendingUp, CheckCircle2, Brain } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useMemo, useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const urgencyColors = { high: 'border-destructive/30 bg-destructive/5', mid: 'border-warning/30 bg-warning/5', low: 'border-success/30 bg-success/5' };

const PreExamPage = () => {
  const { tasks, fetchTestHistory, token } = useAppStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [testHistory, setTestHistory] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/users/study-session`)
        .then(res => setSessions(res.data))
        .catch(console.error);

      fetchTestHistory().then(setTestHistory).catch(console.error);
    }
  }, [token, fetchTestHistory]);

  const { weakSubjects, predictions, revisionItems } = useMemo(() => {
    const subjectStats: Record<string, { total: number; completed: number; etaSum: number }> = {};

    // 1️⃣ Group tasks
    tasks.forEach(t => {
      const subject = t.subject.trim();
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, completed: 0, etaSum: 0 };
      }
      subjectStats[subject].total++;
      if (t.completed) subjectStats[subject].completed++;
      subjectStats[subject].etaSum += t.eta;
    });

    // 2️⃣ Study Sessions (minutes → hours)
    const actualStudyStats: Record<string, number> = {};
    sessions.forEach(s => {
      const subj = (s.subject || 'General').trim();
      actualStudyStats[subj] = (actualStudyStats[subj] || 0) + s.duration;
    });

    // 3️⃣ Test History (marks out of 10 → percentage)
    const actualTestStats: Record<string, { totalScore: number; count: number }> = {};
    testHistory.forEach(t => {
      const subj = (t.subjectName || 'General').trim();
      if (!actualTestStats[subj]) {
        actualTestStats[subj] = { totalScore: 0, count: 0 };
      }

      const percent = (t.score / 10) * 100; // marks out of 10
      actualTestStats[subj].totalScore += percent;
      actualTestStats[subj].count++;
    });

    const preds: any[] = [];
    const weaks: any[] = [];

    const allSubjects = new Set([
      ...Object.keys(subjectStats),
      ...Object.keys(actualStudyStats),
      ...Object.keys(actualTestStats),
    ]);

    // 🔥 Find max study hours (for normalization)
    const maxStudyHours = Math.max(
      ...Array.from(allSubjects).map(sub => {
        const mins = actualStudyStats[sub] || 0;
        const eta = subjectStats[sub]?.etaSum || 0;
        return Math.round((mins > 0 ? mins : eta) / 60);
      }),
      1
    );

    for (const subject of Array.from(allSubjects)) {
      const stats = subjectStats[subject] || { total: 0, completed: 0, etaSum: 0 };
      const completion =
        stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      const actualMinutes = actualStudyStats[subject] || 0;
      const studyHours = Math.round((actualMinutes > 0 ? actualMinutes : stats.etaSum) / 60);

      const normalizedStudy = Math.round((studyHours / maxStudyHours) * 100);

      const tStat = actualTestStats[subject];
      const avgTestScore = tStat
        ? Math.round(tStat.totalScore / tStat.count)
        : null;

      let predicted;

      if (avgTestScore !== null) {
        // 🔥 Strong weighted formula
        predicted =
          normalizedStudy * 0.3 +
          completion * 0.2 +
          avgTestScore * 0.5;

        // 🔥 Extra penalty / bonus
        if (avgTestScore < 40) {
          predicted -= 10; // heavy penalty
        } else if (avgTestScore > 85) {
          predicted += 5; // excellence boost
        }
      } else {
        // No tests taken
        predicted = normalizedStudy * 0.6 + completion * 0.4;
      }

      predicted = Math.max(30, Math.min(100, Math.round(predicted)));

      let level = "Weak";
      if (predicted >= 85) level = "Excellent";
      else if (predicted >= 70) level = "Good";
      else if (predicted >= 55) level = "Average";

      preds.push({
        subject,
        studyHours,
        completion,
        avgTestScore,
        predicted,
        level,
      });

      // Weak detection
      if (predicted < 70) {
        weaks.push({
          subject,
          reason:
            avgTestScore !== null && avgTestScore < 50
              ? `Low test performance (${avgTestScore}%)`
              : `Low study time (${studyHours}h)`,
          suggestion: `Increase practice and revision for ${subject}`,
          urgency: predicted < 50 ? "high" : "mid",
        });
      }
    }

    preds.sort((a, b) => b.predicted - a.predicted);
    weaks.sort((a, b) => (a.urgency === "high" ? -1 : 1));

    // Revision items
    const revItems = tasks
      .filter(t => !t.completed)
      .sort((a, b) => {
        const pMap: Record<string, number> = { high: 3, mid: 2, low: 1 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      })
      .slice(0, 5)
      .map(t => ({
        subject: `${t.subject} - ${t.topic}`,
        priority: t.priority,
        done: t.completed,
      }));

    return { weakSubjects: weaks, predictions: preds, revisionItems: revItems };
  }, [tasks, sessions, testHistory]);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Pre-Exam Preparation</h1>
        <p className="text-muted-foreground mt-1">AI-powered weakness detection and exam readiness analysis.</p>
      </motion.div>

      {tasks.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
          <Brain className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Not Enough Data</h2>
          <p className="text-muted-foreground max-w-md">Add some study tasks to your planner so the AI can analyze your progress and predict your exam readiness.</p>
        </div>
      ) : (
        <>
          {/* Weakness Detection */}
          {weakSubjects.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
              <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-secondary" /> Smart Weakness Detection
              </h2>
              <div className="space-y-3">
                {weakSubjects.map((w, i) => (
                  <motion.div key={w.subject} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                    className={`glass-card p-5 border-l-4 ${urgencyColors[w.urgency]}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-foreground">{w.subject}</h3>
                        <p className="text-sm text-muted-foreground">{w.reason}</p>
                        <p className="text-sm text-primary mt-2 font-medium">💡 {w.suggestion}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Score Prediction */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" /> Exam Score Prediction
            </h2>
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">Subject</th>
                    <th className="text-center p-4 text-xs font-medium text-muted-foreground">Actual Study Time</th>
                    <th className="text-center p-4 text-xs font-medium text-muted-foreground">Task Completion</th>
                    <th className="text-center p-4 text-xs font-medium text-muted-foreground text-primary">Avg Test Score</th>
                    <th className="text-center p-4 text-xs font-medium justify-center text-muted-foreground flex items-center gap-1"><Brain className="w-4 h-4" /> Predicted Score</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p, i) => (
                    <motion.tr key={p.subject} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.05 }}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="p-4 text-sm font-medium text-foreground">{p.subject}</td>
                      <td className="p-4 text-sm text-center text-muted-foreground">{p.studyHours}h</td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full gradient-bg" style={{ width: `${p.completion}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{p.completion}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold text-foreground">
                        {p.avgTestScore !== null ? `${p.avgTestScore}%` : <span className="text-xs text-muted-foreground font-normal">No Tests Taken</span>}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-display font-bold text-lg ${p.predicted >= 80 ? 'text-success' : p.predicted >= 70 ? 'text-warning' : 'text-destructive'}`}>
                          {p.predicted}%
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Revision Checklist */}
          {revisionItems.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-accent" /> Revision Checklist
              </h2>
              <div className="glass-card p-5 space-y-3">
                {revisionItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${item.done ? 'text-success' : 'text-muted-foreground'}`} />
                    <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.subject}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium border ${item.priority === 'high' ? 'priority-high' : item.priority === 'mid' ? 'priority-mid' : 'priority-low'
                      }`}>{item.priority}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default PreExamPage;
