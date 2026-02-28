import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle, Zap, RefreshCw, Image as ImageIcon, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Tesseract from 'tesseract.js';
import { NLPEngine, MCQQuestion } from '../utils/nlpEngine';
import { useAppStore } from '@/store/useAppStore';
import AIVisionDetector from '../components/AIVisionDetector';

const EXAM_DURATION_SECONDS = 10 * 60; // 10 minutes
const MARKS_CORRECT = 1;
const MARKS_WRONG = 0;

const WorkTestPage = () => {
    // Safety cleanup for any residual HMR lockdown styles
    useEffect(() => {
        document.body.style.overflow = '';
        document.body.style.userSelect = '';
        return () => {
            document.body.style.overflow = '';
            document.body.style.userSelect = '';
        };
    }, []);

    const [workText, setWorkText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [testGenerated, setTestGenerated] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [questions, setQuestions] = useState<MCQQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [attempts, setAttempts] = useState(1);
    const [cheatWarnings, setCheatWarnings] = useState(0);
    const [subjectName, setSubjectName] = useState('');
    const [testName, setTestName] = useState('');
    const [isQuickRestart, setIsQuickRestart] = useState(false);
    const [testRemarks, setTestRemarks] = useState('');

    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { saveTestResult } = useAppStore();
    const location = useLocation();
    const navigate = useNavigate();

    // Check for incoming Historical Test Restarts from Analytics
    useEffect(() => {
        const restartTest = location.state?.restartTest;
        if (restartTest) {
            setSubjectName(restartTest.subjectName || '');
            setTestName(restartTest.testName || '');

            // Map MongoDB questions back to MCQQuestion format
            const mappedQuestions: MCQQuestion[] = restartTest.questions.map((q: any, i: number) => ({
                id: i,
                question: q.questionText,
                options: q.options,
                correctIndex: q.correctIndex,
                explanation: q.explanation,
                difficulty: q.difficulty || 'Medium'
            }));

            setQuestions(mappedQuestions);
            setIsQuickRestart(true);
            setAttempts(1);
            setAnswers({});
            setTimeLeft(null);
            setSubmitted(false);
            setCheatWarnings(0);
            setTestRemarks('');
            setTestGenerated(true);

            // Clean router state so refresh doesn't trigger again
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, navigate, location.pathname]);

    const handleGenerate = () => {
        if (!workText.trim()) {
            toast({
                title: "Input Required",
                description: "Please paste your work or study material first.",
                variant: "destructive"
            });
            return;
        }

        setIsGenerating(true);
        setTestGenerated(false);
        setSubmitted(false);
        setAttempts(1);
        setAnswers({});
        setTimeLeft(null);
        setCheatWarnings(0);
        setTestRemarks('');

        setTimeout(() => {
            const engine = new NLPEngine(workText);
            const generated = engine.generateMCQs(10);

            if (generated.length === 0) {
                toast({
                    title: "Not Enough Content",
                    description: "We couldn't generate questions from the provided text. Please ensure it's detailed enough.",
                    variant: "destructive"
                });
                setIsGenerating(false);
                return;
            }

            setQuestions(generated);
            setIsGenerating(false);
            setTestGenerated(true);
            // Timer starts when AI Vision Detector is ready (onReady callback)
            toast({
                title: "Test Generated",
                description: "Your AI-powered test is ready. Starting video feed...",
            });
        }, 1500);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid File",
                description: "Please upload an image file (PNG, JPG) for text extraction.",
                variant: "destructive"
            });
            return;
        }

        setIsScanning(true);
        toast({
            title: "Scanning Image...",
            description: "Extracting text using OCR. This might take a moment.",
        });

        try {
            const result = await Tesseract.recognize(file, 'eng');
            const text = result.data.text;

            if (text.trim()) {
                setWorkText(prev => prev ? prev + '\n\n' + text : text);
                toast({
                    title: "Scan Complete",
                    description: "Text extracted successfully!",
                });
            } else {
                toast({
                    title: "No Text Found",
                    description: "We couldn't detect any readable text in that image.",
                    variant: "destructive"
                });
            }
        } catch (err) {
            console.error("OCR Error:", err);
            toast({
                title: "Scan Failed",
                description: "An error occurred while trying to read the image.",
                variant: "destructive"
            });
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleOptionSelect = (qId: number, optionIdx: number) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    };

    const handleRestartTest = () => {
        if (attempts >= 3) return;
        setAttempts(prev => prev + 1);
        setSubmitted(false);
        setAnswers({});
        setTimeLeft(null);
        setCheatWarnings(0);
        setTestRemarks('');
        toast({
            title: "Test Restarted",
            description: `Attempt ${attempts + 1} of 3. Starting video feed...`,
        });
    };

    const calculateResult = () => {
        let correct = 0;
        let wrong = 0;
        let skipped = 0;

        questions.forEach(q => {
            if (answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === -1) {
                skipped++;
            } else if (answers[q.id] === q.correctIndex) {
                correct++;
            } else {
                wrong++;
            }
        });

        let score = correct * MARKS_CORRECT + wrong * MARKS_WRONG;
        if (cheatWarnings >= 3 && score > 0) {
            score = Number((score * 0.7).toFixed(1));
        }
        return { correct, wrong, skipped, score };
    };

    useEffect(() => {
        if (!testGenerated || submitted || timeLeft === null) return;

        if (timeLeft <= 0) {
            toast({
                title: "Time's up!",
                description: "Your test has been automatically submitted.",
            });
            handleSubmit(true);
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timerId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testGenerated, submitted, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleCheatWarning = (count: number) => {
        setCheatWarnings(count);
        toast({
            title: "Anti-Cheat Warning",
            description: `Suspicious activity detected. Warning ${count} of 3.`,
            variant: "destructive"
        });
    };

    const handleMaxWarningsReached = () => {
        setCheatWarnings(3);
        toast({
            title: "Anti-Cheat Penalty",
            description: "Multiple cheating attempts detected. A 30% score penalty will be applied to your final result.",
            variant: "destructive"
        });
    };

    const handleSubmit = async (autoSubmit = false, remarks = "Completed normally") => {
        if (!autoSubmit && Object.keys(answers).length < questions.length) {
            toast({
                title: "Incomplete Test",
                description: "Please answer all questions before submitting.",
                variant: "destructive"
            });
            return;
        }
        setSubmitted(true);

        const isCheating = cheatWarnings >= 3;
        const actualRemarks = isCheating
            ? "Anti-cheating system detects cheating (30% Penalty Applied)"
            : (autoSubmit ? "Auto-submitted (Time's up)" : remarks);

        setTestRemarks(actualRemarks);

        const testData = {
            subjectName: subjectName.trim() || 'General',
            testName: `${testName.trim() || 'Practice Test'} (Attempt ${attempts})`,
            score: calculateResult().score,
            totalQuestions: questions.length,
            remarks: actualRemarks,
            questions: questions.map((q) => ({
                questionText: q.question,
                options: q.options,
                correctIndex: q.correctIndex,
                userSelectedIndex: answers[q.id] ?? -1,
                explanation: q.explanation,
                difficulty: q.difficulty
            }))
        };

        await saveTestResult(testData);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground">Work & Test</h1>
                <p className="text-muted-foreground mt-1">
                    Upload or paste your course work, notes, or essays to instantly generate an AI assessment.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Input Area */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-4"
                >
                    <div className="glass-card p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <h2 className="font-display font-semibold text-lg text-foreground">Your Material</h2>
                        </div>

                        <div className="flex flex-col gap-4 mb-4">
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    className="w-1/2 p-4 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
                                    placeholder="Subject (e.g., Biology)"
                                    value={subjectName}
                                    onChange={(e) => setSubjectName(e.target.value)}
                                    disabled={isGenerating}
                                />
                                <input
                                    type="text"
                                    className="w-1/2 p-4 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
                                    placeholder="Topic (e.g., Cell Division)"
                                    value={testName}
                                    onChange={(e) => setTestName(e.target.value)}
                                    disabled={isGenerating}
                                />
                            </div>
                            <textarea
                                className="w-full flex-grow min-h-[250px] p-4 rounded-xl bg-muted/50 border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                placeholder="Paste your text here... (e.g., lecture notes, chapter summaries, code explanations)"
                                value={workText}
                                onChange={(e) => setWorkText(e.target.value)}
                                disabled={isGenerating}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />

                            <button
                                disabled={isScanning || isGenerating}
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-muted-foreground hover:bg-muted transition-colors w-full sm:w-auto justify-center disabled:opacity-50"
                            >
                                {isScanning ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning...</>
                                ) : (
                                    <><ImageIcon className="w-4 h-4" /> Upload Notes Image</>
                                )}
                            </button>

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !workText.trim()}
                                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl gradient-bg text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl transition-all disabled:opacity-70 w-full sm:w-auto"
                            >
                                {isGenerating ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                                ) : (
                                    <><Zap className="w-4 h-4" /> Generate Test</>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Generated Test Area */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="h-full"
                >
                    {!testGenerated && !isGenerating ? (
                        <div className="glass-card p-12 h-full flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                            <h3 className="font-display font-semibold text-xl text-foreground mb-2">No Test Generated Yet</h3>
                            <p className="text-muted-foreground text-sm max-w-sm">
                                Paste your content on the left and click "Generate Test" to see your AI-tailored questions appear here.
                            </p>
                        </div>
                    ) : isGenerating ? (
                        <div className="glass-card p-12 h-full flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mb-6 shadow-lg shadow-primary/20 pulse-glow">
                                <Zap className="w-8 h-8 text-primary-foreground" />
                            </div>
                            <h3 className="font-display font-semibold text-xl text-foreground mb-2">Analyzing Subject Matter</h3>
                            <p className="text-muted-foreground text-sm">Crafting thoughtful questions...</p>

                            <div className="w-64 h-2 bg-muted rounded-full mt-8 overflow-hidden">
                                <motion.div
                                    className="h-full gradient-bg rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 2.5, ease: "easeInOut" }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display font-semibold text-xl text-foreground flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-success" /> Practice Test
                                </h2>
                                <div className="flex items-center gap-4">
                                    {timeLeft !== null && !submitted && (
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${timeLeft < 60 ? 'bg-destructive/10 text-destructive border-destructive animate-pulse' : 'bg-muted border-border text-muted-foreground'}`}>
                                            <Clock className="w-4 h-4" />
                                            {formatTime(timeLeft)}
                                        </div>
                                    )}
                                    {submitted && (() => {
                                        const res = calculateResult();
                                        return (
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 rounded-md bg-success/10 text-success text-xs font-semibold hidden sm:inline-block">Correct: {res.correct}</span>
                                                <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-semibold hidden sm:inline-block">Wrong: {res.wrong}</span>
                                                <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-semibold hidden sm:inline-block">Skipped: {res.skipped}</span>
                                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold sm:ml-2">
                                                    Score: {res.score} / {questions.length}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {submitted && testRemarks && testRemarks !== "Completed normally" && (
                                <div className="mb-6 flex justify-end">
                                    <span className="px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold animate-pulse flex items-center gap-2">
                                        ⚠️ {testRemarks}
                                    </span>
                                </div>
                            )}

                            <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                <AnimatePresence>
                                    {questions.map((q, i) => (
                                        <motion.div
                                            key={q.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-4 rounded-xl border border-border bg-background/50"
                                        >
                                            <div className="flex items-start justify-between mb-3 gap-2">
                                                <h3 className="font-medium text-foreground break-words flex-grow">{i + 1}. {q.question}</h3>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {!submitted && answers[q.id] !== undefined && (
                                                        <button
                                                            onClick={() => setAnswers(prev => { const n = { ...prev }; delete n[q.id]; return n; })}
                                                            className="text-xs px-2 py-1 rounded-md border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                                                        >
                                                            Clear
                                                        </button>
                                                    )}
                                                    <span className={`text-xs px-2 py-1 rounded-md border ${q.difficulty === 'Hard' ? 'bg-destructive/10 text-destructive border-destructive' :
                                                        q.difficulty === 'Easy' ? 'bg-success/10 text-success border-success' :
                                                            'bg-primary/10 text-primary border-primary'
                                                        }`}>
                                                        {q.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {q.options.map((opt, optIdx) => {
                                                    const isSelected = answers[q.id] === optIdx;
                                                    const isCorrect = q.correctIndex === optIdx;
                                                    const showCorrect = submitted && isCorrect;
                                                    const showWrong = submitted && isSelected && !isCorrect;

                                                    let btnClass = "w-full text-left px-4 py-2 rounded-lg text-sm border transition-all ";
                                                    if (showCorrect) {
                                                        btnClass += "bg-success/10 border-success text-success-foreground font-medium";
                                                    } else if (showWrong) {
                                                        btnClass += "bg-destructive/10 border-destructive text-destructive font-medium";
                                                    } else if (isSelected) {
                                                        btnClass += "bg-primary/10 border-primary text-primary font-medium";
                                                    } else {
                                                        btnClass += "bg-muted/50 border-transparent text-foreground hover:bg-muted";
                                                    }

                                                    return (
                                                        <button
                                                            key={optIdx}
                                                            onClick={() => handleOptionSelect(q.id, optIdx)}
                                                            disabled={submitted}
                                                            className={btnClass}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span>{opt}</span>
                                                                {showCorrect && <CheckCircle className="w-4 h-4 text-success" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {submitted && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-foreground/80 italic flex items-start gap-2"
                                                >
                                                    <span>💡</span>
                                                    <span>{q.explanation}</span>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {!submitted && (
                                <div className="pt-6 mt-4 border-t border-border">
                                    <button
                                        onClick={() => handleSubmit(false)}
                                        className="w-full py-3 rounded-xl gradient-bg text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all"
                                    >
                                        Submit Test
                                    </button>
                                </div>
                            )}

                            {submitted && attempts < 3 && (
                                <div className="pt-6 mt-4 border-t border-border flex flex-col items-center">
                                    <button
                                        onClick={handleRestartTest}
                                        className="w-full py-3 rounded-xl bg-primary/10 text-primary font-semibold shadow-sm hover:bg-primary/20 transition-all border border-primary/20"
                                    >
                                        Restart Test (Attempt {attempts + 1}/3)
                                    </button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        You can take this test up to 3 times. All attempts are saved in your Analytics.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Anti-Cheating Camera widget */}
            {testGenerated && !submitted && (
                <AIVisionDetector
                    onReady={() => {
                        // Start test timer once AIVisionDetector is fully active
                        if (timeLeft === null) {
                            setTimeLeft(isQuickRestart ? 600 : EXAM_DURATION_SECONDS);
                            toast({
                                title: isQuickRestart ? "10-Min Speed Test Started" : "Timer Started",
                                description: "AI Vision is active. Good luck on your test!",
                            });
                        }
                    }}
                    onWarning={handleCheatWarning}
                    onCheatingMaxReached={handleMaxWarningsReached}
                />
            )}
        </div>
    );
};

export default WorkTestPage;
