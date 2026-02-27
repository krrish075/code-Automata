import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const presets = [
  { label: 'Pomodoro 25/5', work: 25, rest: 5 },
  { label: 'Deep Focus 50/10', work: 50, rest: 10 },
  { label: 'Custom', work: 0, rest: 0 },
];

const StudySessionPage = () => {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isWork, setIsWork] = useState(true);
  const [totalFocus, setTotalFocus] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const totalSeconds = minutes * 60 + seconds;
  const preset = presets[selectedPreset];
  const maxSeconds = (isWork ? (preset.work || minutes) : (preset.rest || 5)) * 60;
  const progress = maxSeconds > 0 ? ((maxSeconds - totalSeconds) / maxSeconds) * 100 : 0;

  const addStudyTime = useAppStore(state => state.addStudyTime);

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

  const reset = () => {
    setMinutes(preset.work || 25);
    setSeconds(0);
    setIsRunning(false);
    setIsWork(true);
  };

  const formatTime = (m: number, s: number) =>
    `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Study Session</h1>
        <p className="text-muted-foreground mb-8">Focus mode with timer and session tracking.</p>
      </motion.div>

      <div className="max-w-md mx-auto">
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
              onClick={reset}
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
        <div className="grid grid-cols-2 gap-4">
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
      </div>
    </div>
  );
};

export default StudySessionPage;
