import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, BookOpen, BarChart3, Brain, ArrowRight } from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Smart Scheduling', desc: 'AI-powered timetable generation tailored to your routine' },
  { icon: Brain, title: 'Focus Mode', desc: 'AI face detection keeps you accountable during study sessions' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Track study patterns, focus time, and predict exam scores' },
  { icon: Zap, title: 'Gamification', desc: 'Earn XP, maintain streaks, and unlock achievements' },
];

const HomePage = () => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Floating shapes */}
      <div className="floating-shape w-96 h-96 bg-primary/30 top-20 -left-48" style={{ animationDelay: '0s' }} />
      <div className="floating-shape w-72 h-72 bg-secondary/30 top-40 right-10" style={{ animationDelay: '2s' }} />
      <div className="floating-shape w-64 h-64 bg-accent/20 bottom-20 left-1/3" style={{ animationDelay: '4s' }} />

      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8"
          >
            <Zap className="w-4 h-4" />
            AI-Powered Study Companion
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6"
          >
            Smart Timetable &{' '}
            <span className="gradient-text">Study Planner</span>{' '}
            Generator
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Plan smarter, study harder, and achieve more with AI-powered focus monitoring,
            intelligent scheduling, and gamified progress tracking.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/timetable"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl gradient-bg text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 pulse-glow"
            >
              🚀 Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glass-card text-foreground font-semibold text-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              View Dashboard
            </Link>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 max-w-5xl mx-auto"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="glass-card-hover p-6 text-center"
            >
              <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
