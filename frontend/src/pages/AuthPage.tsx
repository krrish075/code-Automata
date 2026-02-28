import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Zap, ArrowRight, UserCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAdminLogin, setIsAdminLogin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login, register, loginGuest, loginAdmin, role, isAuthenticated } = useAppStore();
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        if (isAuthenticated) {
            navigate(role === 'admin' ? '/admin' : '/', { replace: true });
        }
    }, [isAuthenticated, role, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isAdminLogin) {
                await loginAdmin(email, password);
                navigate('/admin');
            } else if (isLogin) {
                await login(email, password);
                navigate('/');
            } else {
                await register(name, email, password);
                navigate('/');
            }
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.response?.data?.message || "Authentication failed",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuest = async () => {
        setIsLoading(true);
        try {
            await loginGuest();
            navigate('/');
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to create guest session",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen hero-bg flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-card p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 gradient-bg" />

                <div className="flex justify-center mb-8">
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/25 pulse-glow">
                        <Zap className="w-6 h-6 text-primary-foreground" />
                    </div>
                </div>

                <div className="flex justify-center gap-4 mb-6">
                    <button
                        onClick={() => { setIsAdminLogin(false); setIsLogin(true); }}
                        className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${!isAdminLogin ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                    >
                        Student
                    </button>
                    <button
                        onClick={() => setIsAdminLogin(true)}
                        className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${isAdminLogin ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                    >
                        Admin
                    </button>
                </div>

                <h2 className="text-2xl font-display font-bold text-center text-foreground mb-2">
                    {isAdminLogin ? 'Admin Portal' : (isLogin ? 'Welcome Back' : 'Create Account')}
                </h2>
                <p className="text-center text-muted-foreground mb-8 text-sm">
                    {isAdminLogin ? 'Login to manage the platform' : (isLogin ? 'Enter your details to access your planner' : 'Join to start managing your studies smarter')}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                    <AnimatePresence mode="popLayout">
                        {!isLogin && !isAdminLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 relative"
                            >
                                <label className="text-sm font-medium text-foreground ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={!isLogin}
                                        className="w-full bg-muted/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground ml-1">{isAdminLogin ? 'Username' : 'Email'}</label>
                        <div className="relative">
                            {isAdminLogin ? <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /> : <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />}
                            <input
                                type={isAdminLogin ? "text" : "email"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-muted/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder={isAdminLogin ? "admin" : "you@example.com"}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-muted/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl gradient-bg text-primary-foreground font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
                    >
                        {isLoading ? 'Processing...' : (isAdminLogin ? 'Enter Admin Panel' : (isLogin ? 'Sign In' : 'Sign Up'))}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                {!isAdminLogin && (
                    <>
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-card px-2 text-muted-foreground">Or</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGuest}
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-secondary/20 disabled:opacity-70"
                        >
                            <UserCircle2 className="w-4 h-4" />
                            Continue as Guest
                        </button>

                        <p className="text-center text-sm text-muted-foreground mt-8">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-primary font-semibold hover:underline"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default AuthPage;
