'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import styles from '../analysis.module.css';
import Sidebar from '@/app/components/Sidebar';
import UpgradeModal from '@/app/components/UpgradeModal';

export default function AnalysisPage() {
    const { videoId } = useParams();
    const [comments, setComments] = useState<string[]>([]);
    const [analysisText, setAnalysisText] = useState('');
    const [questions, setQuestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [streaming, setStreaming] = useState(false);
    const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
    const [answer, setAnswer] = useState('');

    // Sentiment values parsed from plain text
    const [sentiment, setSentiment] = useState({ pos: '0', neg: '0', neu: '0' });

    // User auth
    const [userId, setUserId] = useState<string | null>(null);

    // Upgrade modal
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [limitedFeature, setLimitedFeature] = useState('');

    // AbortController ref to cancel duplicate streams (React StrictMode fires useEffect twice)
    const abortRef = useRef<AbortController | null>(null);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    // Get user ID on mount
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id);
        });
    }, []);

    useEffect(() => {
        if (videoId && userId) {
            // Cancel any in-progress analysis (prevents StrictMode double-stream)
            if (abortRef.current) {
                abortRef.current.abort();
            }
            const controller = new AbortController();
            abortRef.current = controller;

            startAnalysis(controller.signal);

            return () => {
                controller.abort();
            };
        }
    }, [videoId, userId]);

    // Parse sentiment percentages from plain text
    useEffect(() => {
        const posMatch = analysisText.match(/Positive:\s*(\d+)%/);
        const negMatch = analysisText.match(/Negative:\s*(\d+)%/);
        const neuMatch = analysisText.match(/Neutral:\s*(\d+)%/);

        if (posMatch || negMatch || neuMatch) {
            setSentiment({
                pos: posMatch ? posMatch[1] : '0',
                neg: negMatch ? negMatch[1] : '0',
                neu: neuMatch ? neuMatch[1] : '0',
            });
        }
    }, [analysisText]);

    // Render **bold** inline text
    const renderInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className={styles.boldText}>{part.slice(2, -2)}</strong>;
            }
            return <span key={j}>{part}</span>;
        });
    };

    // Render analysis text as React elements (same pattern as script generator's renderScript)
    const renderAnalysis = (text: string) => {
        return text.split('\n').map((line, i) => {
            const trimmed = line.trim();

            // Empty line = spacer
            if (trimmed === '') {
                return <div key={i} className={styles.analysisBreak} />;
            }

            // ## Heading — strip any # level and render as styled heading
            if (/^#{1,4}\s/.test(trimmed)) {
                const headingText = trimmed.replace(/^#{1,4}\s+/, '');
                return <h2 key={i} className={styles.sectionHeading}>{headingText}</h2>;
            }

            // Bullet point: - item or * item
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                    <div key={i} className={styles.listItem}>
                        <span className={styles.bullet}>•</span>
                        <span className={styles.listText}>{renderInline(trimmed.slice(2))}</span>
                    </div>
                );
            }

            // Regular paragraph
            return <p key={i} className={styles.analysisPara}>{renderInline(trimmed)}</p>;
        });
    };

    const startAnalysis = async (signal: AbortSignal) => {
        try {
            setLoading(true);
            setAnalysisText('');
            setQuestions([]);
            setQuestions([]);

            // STEP 1: Fetch Comments
            const fetchResponse = await fetch(`${backendUrl}/fetch-comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId }),
                signal,
            });

            const fetchResult = await fetchResponse.json();
            const rawComments = fetchResult.comments || [];
            const videoComments = rawComments.map((c: { id: string; text: string } | string) =>
                typeof c === 'string' ? c : c.text
            );
            setComments(videoComments);

            if (videoComments.length === 0) {
                setAnalysisText('No comments found for this video.');
                setLoading(false);
                return;
            }

            // STEP 2: Analyze Comments (SSE streaming — same pattern as script generator)
            setStreaming(true);

            const analyzeResponse = await fetch(`${backendUrl}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comments: videoComments, userId }),
                signal,
            });

            // Handle quota limit
            if (analyzeResponse.status === 429) {
                setStreaming(false);
                setLimitedFeature('video analyses');
                setShowUpgradeModal(true);
                setLoading(false);
                return;
            }

            const reader = analyzeResponse.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                setAnalysisText('Streaming not supported.');
                setStreaming(false);
                setLoading(false);
                return;
            }

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Check if aborted before processing
                if (signal.aborted) {
                    reader.cancel();
                    return;
                }

                buffer += decoder.decode(value, { stream: true });

                // Process SSE events from the buffer (same as script generator)
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                setAnalysisText(prev => prev + parsed.content);
                            }
                        } catch {
                            // Skip malformed JSON
                        }
                    }
                }
            }

            setStreaming(false);

            // STEP 3: Fetch Follow-up Questions
            const questionsResponse = await fetch(`${backendUrl}/followup-questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comments: videoComments, userId }),
                signal,
            });

            if (questionsResponse.ok) {
                const qResult = await questionsResponse.json();
                setQuestions(qResult.questions || []);
            }
            // Silently skip if follow-up questions quota is reached

        } catch (error: unknown) {
            // Don't show error if we intentionally aborted
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }
            console.error('Error during analysis:', error);
            setAnalysisText('Error connecting to the backend. Please ensure the server is running.');
        } finally {
            setLoading(false);
        }
    };

    const askQuestion = async (question: string) => {
        if (activeQuestion === question) {
            setActiveQuestion(null);
            return;
        }

        setActiveQuestion(question);
        setAnswer('');
        setErrorMsg('');
        try {
            const response = await fetch(`${backendUrl}/followup-answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comments, question, userId }),
            });

            // Handle quota limit
            if (response.status === 429) {
                setLimitedFeature('follow-up answers');
                setShowUpgradeModal(true);
                return;
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let streamContent = '';
            let rafScheduled = false;

            const flushAnswer = () => {
                setAnswer(streamContent);
                rafScheduled = false;
            };

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    streamContent += decoder.decode(value, { stream: true });

                    if (!rafScheduled) {
                        rafScheduled = true;
                        requestAnimationFrame(flushAnswer);
                    }
                }
                // Final flush
                streamContent += decoder.decode();
                setAnswer(streamContent);
            }
        } catch (error) {
            console.error('Error fetching answer:', error);
            setAnswer('Error fetching answer.');
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <Sidebar activeItem="Analyze Channel" />

            {showUpgradeModal && (
                <UpgradeModal
                    feature={limitedFeature}
                    onClose={() => setShowUpgradeModal(false)}
                />
            )}

            <main className={styles.mainContent}>
                <div className={styles.maxContainer}>
                    <Link href={`/video/${videoId}`} className={styles.backBtn}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back
                    </Link>

                    <h1 className={styles.title}>Comment Analysis Report</h1>

                    {loading && !streaming && (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner}></div>
                            <p>Gathering audience data...</p>
                        </div>
                    )}

                    {/* Sentiment Split Card */}
                    {(streaming || analysisText) && (
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Sentiment Split</h2>
                            <div className={styles.splitGrid}>
                                <div className={`${styles.splitBar} ${styles.positiveBar}`}>
                                    POSITIVE {sentiment.pos}%
                                </div>
                                <div className={`${styles.splitBar} ${styles.negativeBar}`}>
                                    NEGATIVE {sentiment.neg}%
                                </div>
                                <div className={`${styles.splitBar} ${styles.neutralBar}`}>
                                    NEUTRAL {sentiment.neu}%
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Audience Insight card */}
                    {(streaming || analysisText) && (
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Audience Insight</h2>
                            <div className={styles.insightContent}>
                                {renderAnalysis(analysisText)}
                                {streaming && (
                                    <div className={styles.streamingIndicator}>
                                        <span className={styles.cursor}>|</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Follow-up Questions Section */}
                    {questions.length > 0 && (
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Explore Further</h2>
                            <div className={styles.questionsList}>
                                {questions.map((q, i) => (
                                    <div key={i} className={styles.questionWrapper}>
                                        <button
                                            className={styles.questionCard}
                                            onClick={() => askQuestion(q)}
                                        >
                                            <div className={styles.questionText}>{q}</div>
                                        </button>
                                        {activeQuestion === q && (
                                            <div className={styles.answerBox}>
                                                {answer || <em>Generating answer...</em>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
