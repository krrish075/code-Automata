import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Clock, Sunrise, Moon as MoonIcon } from 'lucide-react';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const timeSlots = ['6:00','7:00','8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];
const slotTypes = ['free', 'study', 'work', 'sleep'] as const;
const slotColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  study: 'bg-primary/15 text-primary border-primary/30',
  work: 'bg-secondary/15 text-secondary border-secondary/30',
  sleep: 'bg-accent/15 text-accent border-accent/30',
};
const slotLabels: Record<string, string> = { free: '—', study: '📚', work: '💼', sleep: '😴' };

type Grid = Record<string, Record<string, typeof slotTypes[number]>>;

const TimetablePage = () => {
  const [step, setStep] = useState(0);
  const [wake, setWake] = useState(7);
  const [bed, setBed] = useState(23);
  const [grid, setGrid] = useState<Grid>(() => {
    const g: Grid = {};
    days.forEach(d => {
      g[d] = {};
      timeSlots.forEach(t => {
        const hour = parseInt(t);
        g[d][t] = hour >= 23 || hour < 7 ? 'sleep' : 'free';
      });
    });
    return g;
  });

  const sleepHours = wake <= bed ? 24 - bed + wake : wake - bed;

  const updateGrid = () => {
    const g: Grid = {};
    days.forEach(d => {
      g[d] = {};
      timeSlots.forEach(t => {
        const hour = parseInt(t);
        const isSleep = bed > wake
          ? hour >= bed || hour < wake
          : hour >= bed && hour < wake;
        g[d][t] = isSleep ? 'sleep' : (grid[d]?.[t] === 'sleep' ? 'free' : (grid[d]?.[t] || 'free'));
      });
    });
    setGrid(g);
  };

  const cycleSlot = (day: string, time: string) => {
    if (grid[day][time] === 'sleep') return;
    const current = grid[day][time];
    const idx = slotTypes.indexOf(current);
    const next = slotTypes[(idx + 1) % slotTypes.length];
    setGrid(prev => ({ ...prev, [day]: { ...prev[day], [time]: next === 'sleep' ? 'free' : next } }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Timetable Generator</h1>
        <p className="text-muted-foreground mb-8">Create your personalized weekly timetable in 3 easy steps.</p>
      </motion.div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[0, 1, 2].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= s ? 'gradient-bg' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(1)}
              className="w-40 h-40 rounded-full gradient-bg flex items-center justify-center cursor-pointer shadow-lg shadow-primary/25 pulse-glow"
            >
              <span className="text-primary-foreground font-display font-bold text-xl">Start</span>
            </motion.div>
            <p className="text-muted-foreground mt-6">Click to begin creating your timetable</p>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="max-w-lg mx-auto glass-card p-8"
          >
            <h2 className="font-display text-xl font-semibold text-foreground mb-6">Daily Routine</h2>

            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Sunrise className="w-4 h-4 text-warning" /> Wake-up Time
                  </label>
                  <span className="text-sm font-mono font-semibold text-primary">{wake}:00</span>
                </div>
                <input type="range" min={4} max={12} value={wake} onChange={e => setWake(+e.target.value)}
                  className="w-full accent-primary" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MoonIcon className="w-4 h-4 text-secondary" /> Bed Time
                  </label>
                  <span className="text-sm font-mono font-semibold text-primary">{bed}:00</span>
                </div>
                <input type="range" min={20} max={26} value={bed} onChange={e => setBed(+e.target.value > 24 ? +e.target.value - 24 : +e.target.value)}
                  className="w-full accent-secondary" />
              </div>

              <div className="flex items-center gap-2 p-4 rounded-xl bg-accent/10">
                <Clock className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-foreground">Sleep: <strong>{sleepHours} hours</strong></span>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(0)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => { updateGrid(); setStep(2); }} className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-bg text-primary-foreground text-sm font-semibold">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {slotTypes.map(s => (
                <span key={s} className={`px-3 py-1 rounded-lg text-xs font-medium border ${slotColors[s]}`}>
                  {slotLabels[s]} {s}
                </span>
              ))}
            </div>

            <div className="glass-card p-4 overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr>
                    <th className="p-2 text-xs text-muted-foreground font-medium">Time</th>
                    {days.map(d => <th key={d} className="p-2 text-xs font-semibold text-foreground">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(t => (
                    <tr key={t}>
                      <td className="p-1 text-xs text-muted-foreground font-mono text-center">{t}</td>
                      {days.map(d => {
                        const type = grid[d]?.[t] || 'free';
                        return (
                          <td key={d} className="p-1">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => cycleSlot(d, t)}
                              className={`w-full h-9 rounded-lg text-xs font-medium border transition-colors ${slotColors[type]} ${type === 'sleep' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80'}`}
                            >
                              {slotLabels[type]}
                            </motion.button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-bg text-primary-foreground text-sm font-semibold">
                Save Timetable ✓
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimetablePage;
