import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Activity, CheckCircle, XCircle } from 'lucide-react';
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
        </div>
    );
};

export default AdminStudentDetails;
