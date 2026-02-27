import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, TrendingUp, CheckCircle2, Brain } from 'lucide-react';

const weakSubjects = [
  { subject: 'Mathematics', reason: 'Low study time (2h/week)', suggestion: 'Schedule 30 min daily sessions on Calculus', urgency: 'high' as const },
  { subject: 'Chemistry', reason: '3 incomplete tasks', suggestion: 'Complete Organic Chemistry module before Friday', urgency: 'mid' as const },
];

const predictions = [
  { subject: 'Mathematics', studyHours: 12, completion: 65, predicted: 72 },
  { subject: 'Physics', studyHours: 18, completion: 82, predicted: 85 },
  { subject: 'Computer Science', studyHours: 24, completion: 90, predicted: 92 },
  { subject: 'English', studyHours: 8, completion: 70, predicted: 74 },
  { subject: 'Chemistry', studyHours: 14, completion: 75, predicted: 78 },
];

const revisionItems = [
  { subject: 'Calculus - Integration', priority: 'high', done: false },
  { subject: 'Quantum Mechanics', priority: 'high', done: false },
  { subject: 'Organic Chemistry', priority: 'mid', done: true },
  { subject: 'Essay Writing', priority: 'low', done: false },
  { subject: 'Data Structures', priority: 'mid', done: true },
];

const urgencyColors = { high: 'border-destructive/30 bg-destructive/5', mid: 'border-warning/30 bg-warning/5', low: 'border-success/30 bg-success/5' };

const PreExamPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Pre-Exam Preparation</h1>
        <p className="text-muted-foreground mt-1">AI-powered weakness detection and exam readiness analysis.</p>
      </motion.div>

      {/* Weakness Detection */}
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-accent" /> Revision Checklist
        </h2>
        <div className="glass-card p-5 space-y-3">
          {revisionItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${item.done ? 'text-success' : 'text-muted-foreground'}`} />
              <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.subject}</span>
              <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium border ${
                item.priority === 'high' ? 'priority-high' : item.priority === 'mid' ? 'priority-mid' : 'priority-low'
              }`}>{item.priority}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PreExamPage;
