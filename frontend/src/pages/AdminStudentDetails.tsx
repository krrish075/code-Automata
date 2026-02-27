import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Activity, CheckCircle, XCircle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';
import axios from 'axios';
import { useAppStore } from '@/store/useAppStore';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminStudentDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAppStore();
    const [data, setData] = useState<any>(null);
    const [expandedTest, setExpandedTest] = useState<string | null>(null);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const res = await axios.get(`${API_URL}/admin/student/${id}`, {
                    headers: { Authorization: token }
                });
                setData(res.data);
            } catch (error) {
                console.error('Failed to fetch student details', error);
            }
        };
        if (token && id) fetchStudentData();
    }, [id, token]);

    if (!data) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const { student } = data;

    return (
        <div className="container mx-auto px-4 py-8">
            <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" /> Back to Dashboard
            </button>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground">{student.name}'s Profile</h1>
                <p className="text-muted-foreground mt-1">{student.email} • Joined {new Date(student.joinedDate).toLocaleDateString()}</p>
            </motion.div>

            {/* Stats Overview - Study Metrics */}
            <h2 className="text-xl font-display font-bold text-foreground mb-4">Study Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                    <Clock className="w-6 h-6 text-primary mb-2" />
                    <p className="text-2xl font-bold font-display text-foreground">{Math.floor(data.totalStudyHours)}h</p>
                    <p className="text-xs text-muted-foreground">Total Study</p>
                </div>
                <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                    <Activity className="w-6 h-6 text-accent mb-2" />
                    <p className="text-2xl font-bold font-display text-foreground">{data.focusScoreAverage}%</p>
                    <p className="text-xs text-muted-foreground">Avg Focus Score</p>
                </div>
                <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mb-2" />
                    <p className="text-2xl font-bold font-display text-foreground">{data.completedSessionsCount}</p>
                    <p className="text-xs text-muted-foreground">Completed Sessions</p>
                </div>
                <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                    <XCircle className="w-6 h-6 text-destructive mb-2" />
                    <p className="text-2xl font-bold font-display text-foreground">{data.missedSessionsCount}</p>
                    <p className="text-xs text-muted-foreground">Missed Sessions</p>
                </div>
            </div>

            {/* Stats Overview - Engagement Metrics */}
            <h2 className="text-xl font-display font-bold text-foreground mb-4">Engagement & Tasks</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary mb-2">
                        Lvl
                    </div>
                    <p className="text-2xl font-bold font-display text-foreground">{student.level}</p>
                    <p className="text-xs text-muted-foreground">{student.xp} XP</p>
                </div>
                <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center font-bold text-orange-500 mb-2">
                        🔥
                    </div>
                    <p className="text-2xl font-bold font-display text-foreground">{student.streak}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-500 mb-2">
                        ✓
                    </div>
                    <p className="text-2xl font-bold font-display text-foreground">{student.tasksCompleted} / {student.totalTasks}</p>
                    <p className="text-xs text-muted-foreground">Tasks Completed</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Study Hours Per Subject Bar Chart */}
                <div className="glass-card p-6 min-h-[400px]">
                    <h2 className="text-lg font-bold font-display text-foreground mb-6">Study Hours per Subject</h2>
                    {data.subjectsStudied.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.subjectsStudied}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="subject" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1a1b26', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">No subject data available</div>
                    )}
                </div>

                {/* Weekly Trend Line Chart */}
                <div className="glass-card p-6 min-h-[400px]">
                    <h2 className="text-lg font-bold font-display text-foreground mb-6">Study Trend Over Time</h2>
                    {data.weeklyTrendArr.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.weeklyTrendArr}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                                <Tooltip contentStyle={{ backgroundColor: '#1a1b26', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                                <Line type="monotone" dataKey="hours" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--accent))", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">No timeline data available</div>
                    )}
                </div>
            </div>

            {/* Test History Section */}
            <h2 className="text-xl font-display font-bold text-foreground mb-4">Past Work & Tests</h2>
            <div className="mb-8">
                {(!data.testResults || data.testResults.length === 0) ? (
                    <div className="glass-card p-8 text-center text-muted-foreground">
                        No tests taken yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.testResults.map((test: any, index: number) => {
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
                                                <p className="text-xs text-muted-foreground">Score</p>
                                            </div>
                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
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
            </div>
        </div>
    );
};

export default AdminStudentDetails;
