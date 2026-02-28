import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Clock, Sunrise, Moon as MoonIcon, Plus, RefreshCw, Calendar, Trash2, Smile } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import EmojiPicker, { Theme } from 'emoji-picker-react';

const API_URL = 'http://localhost:5000/api';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const timeSlots = [
  '4:00', '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00', '23:00', '0:00', '1:00', '2:00', '3:00'
];

type Grid = Record<string, Record<string, string>>;

interface SmartSubject {
  _id: string;
  subject: string;
  deadline: string;
  difficulty: number;
  remainingHours: number;
  preferredTime: string;
  maxDailyHours: number;
}

interface SmartSlot {
  _id: string;
  date: string;
  timeSlot: string;
  subject: { _id: string, subject: string };
  duration: number;
  status: string;
}

const TimetablePage = () => {
  const { timetable, updateTimetable, token, isDark } = useAppStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'manual' | 'smart'>('smart');

  // Manual State
  const [activeEmojiCell, setActiveEmojiCell] = useState<{ day: string, time: string } | null>(null);
  const [step, setStep] = useState(0);
  const [wake, setWake] = useState(7);
  const [bed, setBed] = useState(23);
  const [isSaving, setIsSaving] = useState(false);
  const [grid, setGrid] = useState<Grid>(() => {
    const g: Grid = {};
    days.forEach(d => {
      g[d] = {};
      timeSlots.forEach(t => {
        // Safely map over existing timetable to prevent legacy crashes
        g[d][t] = (timetable && timetable[d] && timetable[d][t]) ? timetable[d][t] : '';
      });
    });
    return g;
  });

  // Smart State
  const [subjects, setSubjects] = useState<SmartSubject[]>([]);
  const [smartTimetable, setSmartTimetable] = useState<SmartSlot[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [form, setForm] = useState({
    subject: '', deadline: '', difficulty: 3, preferredTime: 'Morning', maxDailyHours: 3
  });

  // Fetch smart data
  useEffect(() => {
    if (activeTab === 'smart' && token) {
      fetchSmartData();
    }
  }, [activeTab, token]);

  const fetchSmartData = async () => {
    try {
      const [subsRes, timeRes] = await Promise.all([
        axios.get(`${API_URL}/timetable/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/timetable`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSubjects(subsRes.data);
      setSmartTimetable(timeRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.deadline) return;
    try {
      await axios.post(`${API_URL}/timetable/subjects`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'Success', description: 'Subject added.' });
      setForm({ ...form, subject: '' });
      fetchSmartData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/timetable/subjects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'Success', description: 'Subject removed.' });
      fetchSmartData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await axios.post(`${API_URL}/timetable/generate-timetable`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'Success', description: 'Timetable generated successfully!' });
      fetchSmartData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReschedule = async () => {
    setIsGenerating(true);
    try {
      await axios.post(`${API_URL}/timetable/reschedule`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'Success', description: 'Timetable recalculated and rescheduled!' });
      fetchSmartData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Process smart timetable for robust table rendering
  // Table View: Date | Morning | Evening | Night
  const groupedTimetable: Record<string, any> = {};
  smartTimetable.forEach(slot => {
    const dObj = new Date(slot.date);
    const dateStr = dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    if (!groupedTimetable[dateStr]) {
      groupedTimetable[dateStr] = { date: dateStr, Morning: [], Evening: [], Night: [] };
    }
    groupedTimetable[dateStr][slot.timeSlot].push(slot);
  });
  const tableRows = Object.values(groupedTimetable);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Plan Your Success</h1>
          <p className="text-muted-foreground">Manage your weekly schedule intelligently.</p>
        </div>
        <div className="bg-muted p-1 rounded-xl flex items-center gap-1">
          <button onClick={() => setActiveTab('smart')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'smart' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Smart Generator</button>
          <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'manual' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Manual Planner</button>
        </div>
      </motion.div>

      {activeTab === 'smart' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 glass-card p-6">
              <h2 className="font-display font-semibold text-xl mb-4 text-primary">Add Subject</h2>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject Name</label>
                  <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. Mathematics" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Deadline</label>
                  <input required type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Difficulty (1-5)</label>
                    <input required type="number" min={1} max={5} value={form.difficulty} onChange={e => setForm({ ...form, difficulty: +e.target.value })} className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Daily Max Hrs</label>
                    <input required type="number" min={1} max={8} value={form.maxDailyHours} onChange={e => setForm({ ...form, maxDailyHours: +e.target.value })} className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Preferred Time</label>
                    <select value={form.preferredTime} onChange={e => setForm({ ...form, preferredTime: e.target.value })} className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none">
                      <option>Morning</option>
                      <option>Evening</option>
                      <option>Night</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-xl text-sm font-semibold">
                  <Plus className="w-4 h-4" /> Add Subject
                </button>
              </form>
            </div>

            <div className="md:col-span-2 glass-card p-6 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-display font-semibold text-xl text-foreground">Pending Subjects</h2>
                <div className="flex gap-2">
                  <button onClick={handleGenerate} disabled={isGenerating || subjects.length === 0} className="flex items-center gap-2 px-4 py-2 gradient-bg text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:shadow-lg transition-all">
                    <Calendar className="w-4 h-4" /> Generate
                  </button>
                  <button onClick={handleReschedule} disabled={isGenerating || tableRows.length === 0} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-80 transition-all">
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} /> Reschedule
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {subjects.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm opacity-50">
                    <Calendar className="w-10 h-10 mb-2" />
                    <p>No subjects added yet.</p>
                  </div>
                ) : (
                  subjects.map(sub => (
                    <div key={sub._id} className="flex items-center justify-between p-3 rounded-xl bg-background border group transition-colors hover:border-border/80">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{sub.subject}</h4>
                        <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                          <span>🎯 {sub.remainingHours} hrs left</span>
                          <span>⏰ Due: {new Date(sub.deadline).toLocaleDateString()}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${sub.difficulty >= 4 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>Lvl {sub.difficulty}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSubject(sub._id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 overflow-hidden">
            <h2 className="font-display font-semibold text-xl text-foreground mb-4">Your Smart Timetable</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 pt-2 px-4 font-semibold text-sm text-foreground">Date</th>
                    <th className="pb-3 pt-2 px-4 font-semibold text-sm text-primary">Morning (6-9 AM)</th>
                    <th className="pb-3 pt-2 px-4 font-semibold text-sm text-secondary">Evening (4-7 PM)</th>
                    <th className="pb-3 pt-2 px-4 font-semibold text-sm text-accent">Night (8-10 PM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {tableRows.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Generate a timetable to see it here.</td></tr>
                  ) : (
                    tableRows.map((row: any, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4 font-medium text-foreground whitespace-nowrap">{row.date}</td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {row.Morning.length === 0 ? <span className="text-muted-foreground opacity-50">—</span> :
                              row.Morning.map((s: any, idx: number) => <span key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold">{s.subject?.subject} (1h)</span>)
                            }
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {row.Evening.length === 0 ? <span className="text-muted-foreground opacity-50">—</span> :
                              row.Evening.map((s: any, idx: number) => <span key={idx} className="bg-secondary/10 text-secondary px-2 py-1 rounded-md text-xs font-semibold">{s.subject?.subject} (1h)</span>)
                            }
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {row.Night.length === 0 ? <span className="text-muted-foreground opacity-50">—</span> :
                              row.Night.map((s: any, idx: number) => <span key={idx} className="bg-accent/10 text-accent px-2 py-1 rounded-md text-xs font-semibold">{s.subject?.subject} (1h)</span>)
                            }
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Manual Tab */}
      {activeTab === 'manual' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">Type directly into the blocks to schedule your day.</p>
            <button onClick={async () => {
              try {
                await updateTimetable(grid);
                toast({ title: 'Success', description: 'Manual timetable saved.' });
              } catch (e) { toast({ title: 'Error', variant: 'destructive', description: 'Failed to save.' }); }
            }} className="gradient-bg text-primary-foreground px-5 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-shadow">
              Save Manual Timetable
            </button>
          </div>

          <div className="glass-card overflow-x-auto excel-table-wrap">
            <table className="w-full min-w-[700px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-1 px-2 text-muted-foreground font-medium border-b border-border/50 text-right sticky left-0 bg-card z-10 w-16">Time</th>
                  {days.map(d => <th key={d} className="p-1.5 font-semibold text-foreground border-b border-l border-border/50 bg-muted/20">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(t => (
                  <tr key={t} className="hover:bg-muted/10 transition-colors">
                    <td className="p-1 px-2 text-muted-foreground font-mono text-right border-b border-border/30 sticky left-0 bg-card z-10 w-16">{t}</td>
                    {days.map(d => {
                      const val = grid[d]?.[t] || '';
                      const isEmojiActive = activeEmojiCell?.day === d && activeEmojiCell?.time === t;

                      return (
                        <td key={d} className="p-0 border-b border-l border-border/30 h-8 relative group">
                          <div className="flex items-center w-full h-full relative">
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => setGrid(prev => ({ ...prev, [d]: { ...prev[d], [t]: e.target.value } }))}
                              className="w-full h-full bg-transparent pl-2 pr-6 py-1 outline-none focus:bg-primary/5 focus:ring-1 focus:ring-primary/50 text-foreground transition-all placeholder:text-muted-foreground/30"
                              placeholder="..."
                              onFocus={() => setActiveEmojiCell(null)}
                            />
                            <button
                              onClick={() => setActiveEmojiCell(isEmojiActive ? null : { day: d, time: t })}
                              className={`absolute right-1 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all ${isEmojiActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Floating Emoji Picker for this specific cell */}
                          {isEmojiActive && (
                            <div className="absolute top-10 left-0 z-50 shadow-2xl">
                              <div className="fixed inset-0 z-40" onClick={() => setActiveEmojiCell(null)} />
                              <div className="relative z-50">
                                <EmojiPicker
                                  theme={isDark ? Theme.DARK : Theme.LIGHT}
                                  onEmojiClick={(emojiData) => {
                                    setGrid(prev => ({ ...prev, [d]: { ...prev[d], [t]: val + emojiData.emoji } }));
                                  }}
                                  width={280}
                                  height={350}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TimetablePage;
