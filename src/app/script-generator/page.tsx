'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Sidebar from '@/app/components/Sidebar';
import styles from './script-generator.module.css';

interface DropdownOption {
    value: string;
    label: string;
}

function GlassDropdown({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: DropdownOption[];
    value: string;
    onChange: (val: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.value === value);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className={styles.dropdownWrapper} ref={ref}>
            <span className={styles.optionLabel}>{label}</span>
            <button
                className={`${styles.dropdownTrigger} ${open ? styles.dropdownTriggerOpen : ''}`}
                onClick={() => setOpen(!open)}
                type="button"
            >
                <span>{selected?.label}</span>
                <svg className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            {open && (
                <div className={styles.dropdownPopup}>
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            className={`${styles.dropdownItem} ${opt.value === value ? styles.dropdownItemActive : ''}`}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            type="button"
                        >
                            {opt.label}
                            {opt.value === value && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ScriptGeneratorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ScriptGeneratorContent />
        </Suspense>
    );
}

function ScriptGeneratorContent() {
    const [videoType, setVideoType] = useState('long');
    const [duration, setDuration] = useState('10');
    const [tone, setTone] = useState('informative');
    const [prompt, setPrompt] = useState('');

    const [script, setScript] = useState('');
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const scriptRef = useRef<HTMLDivElement>(null);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    const searchParams = useSearchParams();
    const ideaParam = searchParams.get('idea');

    // Get user ID on mount
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id);
        });
    }, []);

    // Auto-generate if idea is passed in URL
    useEffect(() => {
        if (ideaParam && !generating && script === '' && !error) {
            setPrompt(ideaParam);
            generateScript(ideaParam);
        }
    }, [ideaParam]);

    const videoTypeOptions: DropdownOption[] = [
        { value: 'long', label: 'Long' },
        { value: 'short', label: 'Short' },
    ];

    const durationOptions: DropdownOption[] = [
        { value: '5', label: '5 Mins' },
        { value: '10', label: '10 Mins' },
        { value: '15', label: '15 Mins' },
        { value: '20', label: '20 Mins' },
        { value: '30', label: '30 Mins' },
        { value: '60s', label: '60s' },
    ];

    const toneOptions: DropdownOption[] = [
        { value: 'informative', label: 'Informative' },
        { value: 'formal', label: 'Formal' },
        { value: 'storytelling', label: 'Storytelling' },
    ];

    // Auto-scroll to bottom as script streams in
    useEffect(() => {
        if (scriptRef.current && generating) {
            scriptRef.current.scrollTop = scriptRef.current.scrollHeight;
        }
    }, [script, generating]);

    const generateScript = async (manualPrompt?: string) => {
        const currentPrompt = manualPrompt || prompt;
        if (!currentPrompt.trim() || generating) return;

        setGenerating(true);
        setScript('');
        setError('');

        // Only clear the prompt state if it's NOT an auto-generated one (so user sees what's being generated)
        if (!manualPrompt) {
            setPrompt('');
        }

        try {
            const res = await fetch(`${backendUrl}/generate-script`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: currentPrompt, videoType, duration, tone, userId }),
            });

            if (res.status === 429) {
                const limitData = await res.json();
                setError(`⚡ Daily limit reached — You've used all ${limitData.limit} script generation(s) today. Upgrade to Pro for more!`);
                setGenerating(false);
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to generate script');
                setGenerating(false);
                return;
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                setError('Streaming not supported');
                setGenerating(false);
                return;
            }

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process SSE events from the buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            break;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                setScript(prev => prev + parsed.content);
                            }
                            if (parsed.error) {
                                setError(parsed.error);
                            }
                        } catch {
                            // Skip malformed JSON
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Script generation error:', err);
            setError('Failed to connect to the server. Make sure the backend is running.');
        } finally {
            setGenerating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateScript();
        }
    };

    // Simple markdown renderer for bold and line breaks
    const renderScript = (text: string) => {
        return text.split('\n').map((line, i) => {
            // Handle **bold** text
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <div key={i} className={line.trim() === '' ? styles.scriptBreak : styles.scriptLine}>
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className={styles.scriptBold}>{part.slice(2, -2)}</strong>;
                        }
                        // Handle [VISUAL CUE] brackets
                        const cueParts = part.split(/(\[.*?\])/g);
                        return cueParts.map((cue, k) => {
                            if (cue.startsWith('[') && cue.endsWith(']')) {
                                return <span key={`${j}-${k}`} className={styles.visualCue}>{cue}</span>;
                            }
                            return <span key={`${j}-${k}`}>{cue}</span>;
                        });
                    })}
                </div>
            );
        });
    };

    const hasScript = script.length > 0;

    return (
        <div className={styles.container}>
            <Sidebar activeItem="Script Generator" />

            <main className={styles.main}>
                {/* Show hero when no script, show script output when generating/generated */}
                {!hasScript && !generating ? (
                    <div className={styles.heroSection}>
                        <h1 className={styles.heroTitle}>
                            Craft your Next <span>Viral</span> Video from Here
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Describe your video idea and let AI generate a complete, engaging script tailored to your style.
                        </p>
                    </div>
                ) : (
                    <div className={styles.scriptOutputArea} ref={scriptRef}>
                        {generating && (
                            <div className={styles.streamingBadge}>
                                <span className={styles.streamingDot}></span>
                                Generating...
                            </div>
                        )}
                        <div className={styles.scriptContent}>
                            {renderScript(script)}
                            {generating && <span className={styles.cursor}>|</span>}
                        </div>
                    </div>
                )}

                {error && (
                    <p className={styles.errorMsg}>{error}</p>
                )}

                {/* Bottom Chat Bar */}
                <div className={styles.chatBarWrapper}>
                    <div className={styles.chatBarCard}>
                        {/* Options Row with Glass Dropdowns */}
                        <div className={styles.optionsRow}>
                            <GlassDropdown
                                label="Video Type"
                                options={videoTypeOptions}
                                value={videoType}
                                onChange={setVideoType}
                            />
                            <GlassDropdown
                                label="Duration"
                                options={durationOptions}
                                value={duration}
                                onChange={setDuration}
                            />
                            <GlassDropdown
                                label="Tone"
                                options={toneOptions}
                                value={tone}
                                onChange={setTone}
                            />
                        </div>

                        {/* Text Input Row */}
                        <div className={styles.inputRow}>
                            <input
                                type="text"
                                className={styles.textInput}
                                placeholder="Describe your video idea... e.g. 'A beginner's guide to investing in stocks'"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={generating}
                            />
                            <button
                                className={styles.sendBtn}
                                disabled={!prompt.trim() || generating}
                                onClick={() => generateScript()}
                                title="Generate Script"
                            >
                                {generating ? (
                                    <div className={styles.sendSpinner}></div>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
