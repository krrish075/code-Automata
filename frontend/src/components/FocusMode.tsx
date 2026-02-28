import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import { Camera, CameraOff, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './FocusMode.css';

interface FocusModeProps {
    isActive: boolean;
}

const FocusMode: React.FC<FocusModeProps> = ({ isActive }) => {
    const webcamRef = useRef<Webcam>(null);
    const [model, setModel] = useState<blazeface.BlazeFaceModel | null>(null);
    const [hasFace, setHasFace] = useState(true);
    const [isInitializing, setIsInitializing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const consecutiveMisses = useRef(0);
    const audioContext = useRef<AudioContext | null>(null);
    const alertInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // Initialize TensorFlow and load Blazeface model
    useEffect(() => {
        const initTF = async () => {
            try {
                setIsInitializing(true);
                await tf.ready();
                const loadedModel = await blazeface.load();
                setModel(loadedModel);
                // Initialize an AudioContext for the alert beep
                audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (err) {
                console.error("Failed to load TensorFlow model:", err);
                setError("Camera focus tracking unavailable.");
            } finally {
                setIsInitializing(false);
            }
        };
        initTF();
        return () => {
            if (audioContext.current) {
                audioContext.current.close();
            }
        };
    }, []);

    // Continuous buzzing function for accountability
    const playAlertBuzz = () => {
        if (!audioContext.current) return;
        const oscillator = audioContext.current.createOscillator();
        const gainNode = audioContext.current.createGain();
        // Create a square wave for a harsher "buzz" sound
        oscillator.type = 'square';
        // Alternating frequencies for a siren/buzz effect
        oscillator.frequency.setValueAtTime(300, audioContext.current.currentTime);
        oscillator.frequency.setValueAtTime(450, audioContext.current.currentTime + 0.1);
        // Quick attack and release for a stuttering buzz
        gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, audioContext.current.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 0.3);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.current.destination);
        oscillator.start();
        oscillator.stop(audioContext.current.currentTime + 0.3);
    };

    // Manage continuous alert loop based on hasFace state
    useEffect(() => {
        if (!isActive) {
            if (alertInterval.current) clearInterval(alertInterval.current);
            return;
        }
        if (!hasFace) {
            // Start continuous buzzing if user is away
            if (!alertInterval.current) {
                // Play immediately once
                playAlertBuzz();
                // Then loop every 600ms
                alertInterval.current = setInterval(playAlertBuzz, 600);
            }
        } else {
            // Stop when user returns
            if (alertInterval.current) {
                clearInterval(alertInterval.current);
                alertInterval.current = null;
            }
        }
        return () => {
            if (alertInterval.current) clearInterval(alertInterval.current);
        };
    }, [hasFace, isActive]);

    // The detection loop
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        const detectFace = async () => {
            if (
                model &&
                webcamRef.current &&
                webcamRef.current.video &&
                webcamRef.current.video.readyState === 4 &&
                isActive
            ) {
                const video = webcamRef.current.video;
                const predictions = await model.estimateFaces(video, false);
                if (predictions.length > 0) {
                    // Face found, reset misses
                    if (!hasFace) setHasFace(true);
                    consecutiveMisses.current = 0;
                } else {
                    // Nout found
                    consecutiveMisses.current += 1;
                    // If out of frame for ~3 scans (~3 seconds), trigger alert
                    if (consecutiveMisses.current > 2) {
                        setHasFace(false);
                    }
                }
            }
        };
        if (isActive && model) {
            // Scan every 1 second
            interval = setInterval(detectFace, 1000);
        } else {
            // Reset if not active
            setHasFace(true);
            consecutiveMisses.current = 0;
        }
        return () => clearInterval(interval);
    }, [isActive, model, hasFace]);

    if (error) {
        return (
            <div className="focus-mode-error">
                <AlertTriangle size={14} /> {error}
            </div>
        );
    }

    return (
        <div className="focus-mode-container glass-card p-4">
            <div className="focus-mode-status mb-4 text-center">
                {isInitializing ? (
                    <span className="status-loading flex items-center justify-center gap-2 text-primary font-medium">
                        <span className="status-dot w-2 h-2 rounded-full bg-primary animate-pulse" /> Loading AI Tracker...
                    </span>
                ) : isActive ? (
                    <span className="status-active flex items-center justify-center gap-2 text-green-500 font-medium font-display">
                        <Camera size={18} className="animate-pulse" /> AI Focus Track Active
                    </span>
                ) : (
                    <span className="status-offline flex items-center justify-center gap-2 text-muted-foreground font-medium">
                        <CameraOff size={18} /> Camera Offline (Start Timer)
                    </span>
                )}
            </div>

            <AnimatePresence>
                {!hasFace && isActive && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="distraction-alert flex flex-col items-center justify-center p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive mb-4"
                    >
                        <AlertTriangle size={32} className="alert-icon mb-2 animate-bounce flex-shrink-0" />
                        <span className="alert-title font-bold text-lg">Distraction Detected!</span>
                        <span className="alert-subtitle text-sm opacity-80 text-center">Please return to the camera view immediately to stop the alarm.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`webcam-container overflow-hidden rounded-xl border-2 transition-colors duration-300 ${isActive ? (!hasFace ? 'border-destructive shadow-lg shadow-destructive/20' : 'border-primary/50') : 'border-transparent opacity-50 grayscale'}`}>
                <Webcam
                    ref={webcamRef}
                    muted={true}
                    style={{
                        width: "100%",
                        height: "140px",
                        objectFit: "cover",
                        transform: "scaleX(-1)" // mirror
                    }}
                />
            </div>
        </div>
    );
};

export default FocusMode;
