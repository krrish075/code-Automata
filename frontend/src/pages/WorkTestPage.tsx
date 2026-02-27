import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle, Zap, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Tesseract from 'tesseract.js';

const mockQuestions = [
    {
        id: 1,
        question: "What is the primary objective of the uploaded material?",
        options: ["To summarize the text", "To provide a complete overview", "To analyze specific concepts", "To provide references"],
        answer: 1
    },
    {
        id: 2,
        question: "Which of the following best describes the key methodology mentioned?",
        options: ["Algorithmic approach", "Theoretical analysis", "Empirical study", "Literature review"],
        answer: 0
    },
    {
        id: 3,
        question: "What conclusion can be drawn from the core arguments?",
        options: ["The results are inconclusive", "Further research is necessary", "The proposed solution is effective", "None of the above"],
        answer: 2
    },
];

const WorkTestPage = () => {
    const [workText, setWorkText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [testGenerated, setTestGenerated] = useState(false);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        setAnswers({});

        // Simulate AI Generation
        setTimeout(() => {
            setIsGenerating(false);
            setTestGenerated(true);
            toast({
                title: "Test Generated",
                description: "Your AI-powered test is ready based on the provided material!",
            });
        }, 2500);
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

    const calculateScore = () => {
        let score = 0;
        mockQuestions.forEach(q => {
            if (answers[q.id] === q.answer) score++;
        });
        return score;
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length < mockQuestions.length) {
            toast({
                title: "Incomplete Test",
                description: "Please answer all questions before submitting.",
                variant: "destructive"
            });
            return;
        }
        setSubmitted(true);
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

                        <textarea
                            className="w-full flex-grow min-h-[300px] p-4 rounded-xl bg-muted/50 border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all mb-4"
                            placeholder="Paste your text here... (e.g., lecture notes, chapter summaries, code explanations)"
                            value={workText}
                            onChange={(e) => setWorkText(e.target.value)}
                            disabled={isGenerating}
                        />

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
                                {submitted && (
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                                        Score: {calculateScore()} / {mockQuestions.length}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                <AnimatePresence>
                                    {mockQuestions.map((q, i) => (
                                        <motion.div
                                            key={q.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-4 rounded-xl border border-border bg-background/50"
                                        >
                                            <h3 className="font-medium text-foreground mb-3">{i + 1}. {q.question}</h3>
                                            <div className="space-y-2">
                                                {q.options.map((opt, optIdx) => {
                                                    const isSelected = answers[q.id] === optIdx;
                                                    const isCorrect = q.answer === optIdx;
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
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {!submitted && (
                                <div className="pt-6 mt-4 border-t border-border">
                                    <button
                                        onClick={handleSubmit}
                                        className="w-full py-3 rounded-xl gradient-bg text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all"
                                    >
                                        Submit Test
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default WorkTestPage;
