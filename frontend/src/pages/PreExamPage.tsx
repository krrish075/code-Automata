import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, TrendingUp, CheckCircle2, Brain } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useMemo } from 'react';

const urgencyColors = { high: 'border-destructive/30 bg-destructive/5', mid: 'border-warning/30 bg-warning/5', low: 'border-success/30 bg-success/5' };

const PreExamPage = () => {
  const tasks = useAppStore(state => state.tasks);

  const { weakSubjects, predictions, revisionItems } = useMemo(() => {
    // 1. Group tasks by subject
    const subjectStats: Record<string, { total: number, completed: number, etaSum: number }> = {};

    tasks.forEach(t => {
      // Treat subjects case insensitively
      const subject = t.subject.trim();
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, completed: 0, etaSum: 0 };
      }
      subjectStats[subject].total++;
      if (t.completed) subjectStats[subject].completed++;
      subjectStats[subject].etaSum += t.eta;
    });

    const preds = [];
    const weaks = [];

    for (const [subject, stats] of Object.entries(subjectStats)) {
      const completion = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      const studyHours = Math.round(stats.etaSum / 60);

      // Calculate a predicted score based on completion and study hours
      // Base score 40, max 100.
      let predicted = 40 + (completion * 0.4) + (studyHours * 0.5);
      predicted = Math.min(100, Math.round(predicted));

      preds.push({ subject, studyHours, completion, predicted });

      // Check if it's a weak subject
      if (predicted < 75 || completion < 50) {
        const isHighUrgency = predicted < 60 || completion < 30;
        weaks.push({
          subject,
          reason: completion < 50 ? `${stats.total - stats.completed} incomplete tasks` : `Low study time (${studyHours}h)`,
          suggestion: `Focus on completing remaining ${subject} tasks`,
          urgency: isHighUrgency ? 'high' as const : 'mid' as const
        });
      }
    }

    // Sort predictions by predicted score (descending)
    preds.sort((a, b) => b.predicted - a.predicted);
    weaks.sort((a, b) => a.urgency === 'high' ? -1 : 1);

    // Revision items: tasks that are not completed
    const revItems = tasks
      .filter(t => !t.completed)
      .sort((a, b) => {
        // High priority first
        const pMap = { high: 3, mid: 2, low: 1 };
        return pMap[b.priority] - pMap[a.priority];
      })
      .map(t => ({
        subject: `${t.subject} - ${t.topic}`,
        priority: t.priority,
        done: t.completed
      }))
      .slice(0, 5); // top 5

    // Include some completed ones if we have < 5 to keep the UI looking full
    if (revItems.length < 5) {
      const completedItems = tasks
        .filter(t => t.completed)
        .slice(0, 5 - revItems.length)
        .map(t => ({
          subject: `${t.subject} - ${t.topic}`,
          priority: t.priority,
          done: t.completed
        }));
      revItems.push(...completedItems);
    }

    return { weakSubjects: weaks, predictions: preds, revisionItems: revItems };
  }, [tasks]);

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
                    <th className="text-center p-4 text-xs font-medium text-muted-foreground">Study Hours</th>
                    <th className="text-center p-4 text-xs font-medium text-muted-foreground">Completion %</th>
                    <th className="text-center p-4 text-xs font-medium text-muted-foreground">Predicted Score</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p, i) => (
                    <motion.tr key={p.subject} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.05 }}
                      className="border-b border-border/50 last:border-0">
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
