import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Sun, Moon, LogOut, Zap } from 'lucide-react';

const AdminHeader = () => {
    const { isDark, toggleDark, logout, user } = useAppStore();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50 rounded-none">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/admin" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-display font-bold text-lg text-foreground">
                        Smart-<span className="gradient-text">Study</span> <span className="text-muted-foreground text-sm font-normal ml-1">Admin</span>
                    </span>
                </Link>

                {/* Right Controls */}
                <div className="flex items-center gap-4">
                    {user && (
                        <div className="hidden sm:flex items-center gap-2 px-2 border-r border-border/50 mr-1 pr-4">
                            <span className="text-sm font-semibold text-foreground">{user.name}</span>
                        </div>
                    )}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleDark}
                        className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <AnimatePresence mode="wait">
                            {isDark ? (
                                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                    <Sun className="w-4 h-4" />
                                </motion.div>
                            ) : (
                                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                    <Moon className="w-4 h-4" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
