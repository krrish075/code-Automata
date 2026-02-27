export interface MCQQuestion {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty: "Easy" | "Medium" | "Hard";
}

const STOPWORDS = new Set([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "will", "would", "could", "should", "may", "might",
    "shall", "can", "need", "dare", "ought", "used", "it", "its", "this", "that",
    "these", "those", "i", "you", "he", "she", "we", "they", "what", "which", "who",
    "whom", "when", "where", "why", "how", "all", "both", "each", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
    "than", "too", "very", "just", "about", "above", "after", "before", "between",
    "into", "through", "during", "without", "within", "along", "following", "across",
    "behind", "beyond", "plus", "except", "up", "down", "over", "under", "there",
    "here", "then", "also", "therefore", "however", "thus", "moreover", "hence",
    "as", "if", "although", "because", "since", "while", "whether", "although",
]);

export class NLPEngine {
    private text: string;
    private sentences: string[];
    private words: string[];
    private termFreq: Map<string, number>;
    private docFreq: Map<string, number>;
    private tfidf: Map<string, number>;

    constructor(text: string) {
        this.text = text.replace(/\s+/g, " ").trim();
        this.sentences = this.extractSentences(this.text);
        this.words = this.tokenize(this.text);
        this.termFreq = new Map();
        this.docFreq = new Map();
        this.tfidf = new Map();
        this.computeTFIDF();
    }

    private extractSentences(text: string): string[] {
        const raw = text.match(/[^.!?]+[.!?]+/g) || [];
        return raw
            .map((s) => s.trim())
            .filter((s) => s.split(" ").length >= 6 && s.split(" ").length <= 60);
    }

    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length > 2 && !STOPWORDS.has(w));
    }

    private computeTFIDF() {
        this.words.forEach((w) => {
            this.termFreq.set(w, (this.termFreq.get(w) || 0) + 1);
        });

        this.sentences.forEach((sent) => {
            const seen = new Set(this.tokenize(sent));
            seen.forEach((w) => {
                this.docFreq.set(w, (this.docFreq.get(w) || 0) + 1);
            });
        });

        const N = this.sentences.length || 1;
        this.termFreq.forEach((tf, term) => {
            const df = this.docFreq.get(term) || 1;
            const idf = Math.log((N + 1) / (df + 1)) + 1;
            this.tfidf.set(term, (tf / this.words.length) * idf);
        });
    }

    getTopKeywords(n = 30): string[] {
        return [...this.tfidf.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([term]) => term);
    }

    scoreSentence(sentence: string): number {
        const words = this.tokenize(sentence);
        if (!words.length) return 0;
        const score = words.reduce((sum, w) => sum + (this.tfidf.get(w) || 0), 0);
        return score / words.length;
    }

    getTopSentences(n = 20): string[] {
        return this.sentences
            .map((s) => ({ s, score: this.scoreSentence(s) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, n)
            .map(({ s }) => s);
    }

    generateMCQs(count = 10): MCQQuestion[] {
        const topSentences = this.getTopSentences(Math.min(40, this.sentences.length));
        const topKeywords = this.getTopKeywords(50);
        const questions: MCQQuestion[] = [];

        for (const sentence of topSentences) {
            if (questions.length >= count) break;
            const q = this.sentenceToQuestion(sentence, topKeywords, questions.length);
            if (q) questions.push(q);
        }

        if (questions.length < count) {
            for (const sent of this.sentences) {
                if (questions.length >= count) break;
                const q = this.generateFillBlank(sent, topKeywords, questions.length);
                if (q && !questions.find((x) => x.question === q.question)) {
                    questions.push(q);
                }
            }
        }

        return questions.slice(0, count);
    }

    private sentenceToQuestion(
        sentence: string,
        keywords: string[],
        id: number
    ): MCQQuestion | null {
        const lower = sentence.toLowerCase();

        const defMatch = sentence.match(
            /^(.+?)\s+(?:is|are|was|were|refers? to|defined as|means?)\s+(.+)/i
        );
        if (defMatch) {
            const subject = defMatch[1].trim();
            const definition = defMatch[2].trim().replace(/[.!?]$/, "");
            if (subject.length < 60 && definition.length > 10) {
                const distractors = this.generateDistractors(definition, keywords, sentence);
                if (distractors.length < 3) return null;
                const correctIndex = Math.floor(Math.random() * 4);
                const options = this.buildOptions(definition, distractors, correctIndex);
                return {
                    id,
                    question: `What ${lower.includes("are") || lower.includes("were") ? "are" : "is"} ${subject}?`,
                    options,
                    correctIndex,
                    explanation: `According to the document: "${sentence}"`,
                    difficulty: definition.split(" ").length > 15 ? "Hard" : "Medium",
                };
            }
        }

        const compMatch = sentence.match(/(.+?)\s+(most|largest|smallest|highest|lowest|greatest|first|last|only|main|primary|key|major)\s+(.+)/i);
        if (compMatch) {
            return this.generateFillBlank(sentence, keywords, id);
        }

        const numMatch = sentence.match(/\b(\d[\d,.%]*\s*(?:percent|million|billion|km|kg|m|years?|months?|days?|hours?)?)\b/i);
        if (numMatch) {
            const num = numMatch[1];
            const blanked = sentence.replace(num, "___");
            const numDistractors = this.generateNumericDistractors(num);
            if (numDistractors.length < 3) return this.generateFillBlank(sentence, keywords, id);
            const correctIndex = Math.floor(Math.random() * 4);
            const options = this.buildOptions(num.trim(), numDistractors, correctIndex);
            return {
                id,
                question: `Fill in the blank: "${blanked}"`,
                options,
                correctIndex,
                explanation: `The correct value mentioned in the document is ${num}.`,
                difficulty: "Medium",
            };
        }

        return this.generateFillBlank(sentence, keywords, id);
    }

    private generateFillBlank(
        sentence: string,
        keywords: string[],
        id: number
    ): MCQQuestion | null {
        const words = this.tokenize(sentence);
        const scored = words
            .map((w) => ({ w, score: this.tfidf.get(w) || 0 }))
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score);

        if (!scored.length) return null;

        const target = scored[0].w;
        const regex = new RegExp(`\\b${target}\\b`, "i");
        const match = sentence.match(regex);
        if (!match) return null;
        const original = match[0];

        const blanked = sentence.replace(regex, "______");
        const distractors = this.generateDistractors(original, keywords, sentence);
        if (distractors.length < 3) return null;

        const correctIndex = Math.floor(Math.random() * 4);
        const options = this.buildOptions(original, distractors, correctIndex);

        return {
            id,
            question: `Fill in the blank: "${blanked}"`,
            options,
            correctIndex,
            explanation: `The correct answer is "${original}", as mentioned in the document.`,
            difficulty: scored[0].score > 0.01 ? "Hard" : "Easy",
        };
    }

    private generateDistractors(correct: string, keywords: string[], context: string): string[] {
        const contextWords = new Set(this.tokenize(context));
        const candidates = keywords
            .filter((k) => k.toLowerCase() !== correct.toLowerCase() && !contextWords.has(k))
            .slice(0, 20);

        const scored = candidates.map((c) => ({
            c,
            score: this.similarityScore(correct, c),
        }));

        const similar = scored.sort((a, b) => b.score - a.score).slice(0, 5).map((x) => x.c);
        const different = candidates.slice(-10).filter((c) => !similar.includes(c)).slice(0, 3);

        const pool = [...new Set([...similar, ...different])];
        return this.shuffle(pool).slice(0, 3);
    }

    private generateNumericDistractors(num: string): string[] {
        const n = parseFloat(num.replace(/[,%]/g, ""));
        if (isNaN(n)) return [];
        const unit = num.replace(/[\d,. ]/g, "").trim();
        const variants = [
            n * 2, n * 0.5, n + Math.round(n * 0.3) || n + 10, n - Math.round(n * 0.2) || n - 5,
        ].filter((v) => v > 0 && v !== n);
        return [...new Set(variants)].slice(0, 3).map((v) => `${v}${unit ? " " + unit : ""}`);
    }

    private similarityScore(a: string, b: string): number {
        const lenScore = 1 - Math.abs(a.length - b.length) / Math.max(a.length, b.length);
        const aChars = new Set(a.toLowerCase().split(""));
        const bChars = new Set(b.toLowerCase().split(""));
        const intersection = [...aChars].filter((c) => bChars.has(c)).length;
        const union = new Set([...aChars, ...bChars]).size;
        return (lenScore + intersection / union) / 2;
    }

    private buildOptions(correct: string, distractors: string[], correctIndex: number): string[] {
        const d = this.shuffle(distractors).slice(0, 3);
        const opts = [...d];
        opts.splice(correctIndex, 0, correct);
        return opts.slice(0, 4);
    }

    private shuffle<T>(arr: T[]): T[] {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
}
