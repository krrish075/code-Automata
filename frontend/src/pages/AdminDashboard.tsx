import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, BookOpen, Trophy, ArrowRight, Activity } from 'lucide-react';
import axios from 'axios';
import { useAppStore } from '@/store/useAppStore';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const { token } = useAppStore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const config = { headers: { Authorization: token } };
                const [statsRes, studentsRes] = await Promise.all([
                    axios.get(`${API_URL}/admin/analytics`, config),
                    axios.get(`${API_URL}/admin/students`, config)
                ]);
                setAnalytics(statsRes.data);
                setStudents(studentsRes.data);
            } catch (error) {
                console.error('Failed to load admin dashboard data', error);
            }
        };
        if (token) fetchAdminData();
    }, [token]);

    if (!analytics) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="font-display text-4xl font-bold text-foreground">Admin Portal</h1>
                <p className="text-muted-foreground mt-2">Platform analytics and student management</p>
            </motion.div>

            {/* Top Section: Stats & Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 relative z-10">
                {/* Total Students Card */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-6 flex flex-col justify-center h-full hover:shadow-lg transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                        <Users className="w-12 h-12 text-primary mb-6" />
                        <h3 className="text-muted-foreground text-lg font-medium">Total Registered Students</h3>
                        <p className="font-display text-5xl font-bold text-foreground mt-2">{analytics.totalStudents}</p>
                    </div>
                </div>

                {/* Top Performers Card */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-6 relative h-full">
                        <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2 mb-6">
                            <Trophy className="w-5 h-5 text-accent" />
                            Top Performers
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {analytics.topPerformers.slice(0, 4).map((student: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-lg">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{student.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Study Hours</p>
                                        </div>
                                    </div>
                                    <span className="text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-lg border border-border">
                                        {Math.floor(student.hours)}h
                                    </span>
                                </div>
                            ))}
                            {analytics.topPerformers.length === 0 && (
                                <p className="text-sm text-muted-foreground italic col-span-2">No study data yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">

                {/* Students Table */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-display font-bold text-foreground mb-6">Student Roster</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="pb-3 px-4 font-semibold text-muted-foreground text-sm">Name</th>
                                        <th className="pb-3 px-4 font-semibold text-muted-foreground text-sm">Email</th>
                                        <th className="pb-3 px-4 font-semibold text-muted-foreground text-sm">Total Hours</th>
                                        <th className="pb-3 px-4 font-semibold text-muted-foreground text-sm">Joined</th>
                                        <th className="pb-3 px-4 font-semibold text-muted-foreground text-sm text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                            <td className="py-4 px-4 font-medium text-foreground">{student.name}</td>
                                            <td className="py-4 px-4 text-sm text-muted-foreground truncate">{student.email}</td>
                                            <td className="py-4 px-4 text-sm text-foreground">{student.totalStudyHours}h</td>
                                            <td className="py-4 px-4 text-sm text-muted-foreground">
                                                {new Date(student.joinedDate).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/admin/student/${student.id}`)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
                                                >
                                                    View <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-muted-foreground">No students found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
