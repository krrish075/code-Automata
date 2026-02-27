import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import {
  Home, LayoutDashboard, Calendar, BookOpen, PlayCircle,
  BarChart3, FileQuestion, Sun, Moon, User, ChevronDown,
  Menu, X, Zap
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/timetable', label: 'Timetable', icon: Calendar },
  { path: '/study-planner', label: 'Study Planner', icon: BookOpen },
  { path: '/study-session', label: 'Study Session', icon: PlayCircle },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/pre-exam', label: 'Pre Exam', icon: FileQuestion },
];

const Header = () => {
  const { isDark, toggleDark } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50 rounded-none">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">
            Smart<span className="gradient-text">Planner</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`relative px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
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

          {/* User Profile / Login */}
          {useAppStore((state) => state.isAuthenticated) ? (
            <div className="relative group">
              <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                {useAppStore((state) => state.user?.name) || 'Student'}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-popover rounded-xl shadow-lg border border-border/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="px-4 py-2 border-b border-border/50 mb-1">
                  <p className="text-sm font-medium text-foreground">{useAppStore((state) => state.user?.name)}</p>
                  <p className="text-xs text-muted-foreground truncate">{useAppStore((state) => state.user?.email || 'Guest Account')}</p>
                </div>
                <button
                  onClick={() => useAppStore.getState().logout()}
                  className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/auth"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-sm font-semibold text-primary-foreground shadow-sm hover:shadow-md transition-all"
            >
              Sign In
            </Link>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t border-border/50"
          >
            <div className="p-4 flex flex-col gap-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const active = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
