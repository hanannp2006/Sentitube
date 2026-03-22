'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import styles from '../replies.module.css';
import UpgradeModal from '@/app/components/UpgradeModal';

interface CategorizedComment {
    id: string;
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    replyCount: number;
    alreadyReplied: boolean;
}

export default function SmartRepliesPage() {
    const { videoId } = useParams();
    const searchParams = useSearchParams();
    const videoTitle = searchParams.get('title') || 'This Video';

    const [categorizedComments, setCategorizedComments] = useState<CategorizedComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Tracks index of comments being processed and their suggestions
    const [suggesting, setSuggesting] = useState<Record<number, boolean>>({});
    const [suggestions, setSuggestions] = useState<Record<number, string>>({});

    // Post state per comment index
    const [posting, setPosting] = useState<Record<number, boolean>>({});
    const [posted, setPosted] = useState<Record<number, boolean>>({});
    const [postError, setPostError] = useState<Record<number, string>>({});

    // Replies state
    const [replies, setReplies] = useState<Record<string, any[]>>({});
    const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
    const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

    const [userId, setUserId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState('ALL');

    // Upgrade modal
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [limitedFeature, setLimitedFeature] = useState('');

    // Direct post state (for post-OAuth immediate posting)
    const [directPostStatus, setDirectPostStatus] = useState<'idle' | 'posting' | 'success' | 'error'>('idle');

    const hasFetched = useRef(false);
    const pendingHandled = useRef(false);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    // Get user ID from Supabase and handle pending post BEFORE fetching comments
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(async ({ data }) => {
            if (data.user) {
                setUserId(data.user.id);
                const currentUserId = data.user.id;

                // Check for pending post from OAuth callback FIRST
                const pendingRaw = sessionStorage.getItem('pendingPost');
                if (pendingRaw && !pendingHandled.current) {
                    pendingHandled.current = true;
                    try {
                        const pending = JSON.parse(pendingRaw);
                        sessionStorage.removeItem('pendingPost');

                        if (pending.commentId && pending.replyText) {
                            // Post the reply immediately — no need to re-fetch comments
                            setDirectPostStatus('posting');
                            setLoading(false);

                            const res = await fetch(`${backendUrl}/post-reply`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    userId: currentUserId,
                                    commentId: pending.commentId,
                                    replyText: pending.replyText,
                                }),
                            });
                            const result = await res.json();

                            if (res.ok && result.success) {
                                setDirectPostStatus('success');
                            } else {
                                setDirectPostStatus('error');
                            }

                            // After a short delay, load comments normally
                            setTimeout(() => {
                                if (videoId && !hasFetched.current) {
                                    hasFetched.current = true;
                                    fetchAndCategorize(currentUserId);
                                }
                            }, 2000);
                            return;
                        }
                    } catch {
                        sessionStorage.removeItem('pendingPost');
                    }
                }

                // Normal flow: no pending post, fetch comments
                if (videoId && !hasFetched.current) {
                    hasFetched.current = true;
                    fetchAndCategorize(currentUserId);
                }
            }
        });
    }, [videoId]);


    const fetchAndCategorize = async (currentUserId?: string) => {
        try {
            setLoading(true);
            setError('');
            setCategorizedComments([]);

            // 1. Fetch fresh comments (metadata only)
            const fetchRes = await fetch(`${backendUrl}/fetch-comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId, userId: currentUserId || userId }),
            });
            const { comments: rawComments } = await fetchRes.json();

            if (!rawComments || rawComments.length === 0) {
                setError('No comments found for this video.');
                setLoading(false);
                return;
            }

            // Remove duplicates and slice to 50
            const seen = new Set<string>();
            const uniqueComments: { id: string; text: string; replyCount: number; alreadyReplied: boolean }[] = [];
            for (const c of rawComments) {
                const text = typeof c === 'string' ? c : c.text;
                if (!seen.has(text)) {
                    seen.add(text);
                    uniqueComments.push({
                        id: typeof c === 'string' ? '' : c.id,
                        text,
                        replyCount: typeof c === 'string' ? 0 : (c.replyCount || 0),
                        alreadyReplied: typeof c === 'string' ? false : !!c.alreadyReplied
                    });
                }
            }
            const targetComments = uniqueComments.slice(0, 50);

            // 2. Check Sentiment Cache
            const cacheKey = `sentiment_map_${videoId}`;
            const cachedMapRaw = sessionStorage.getItem(cacheKey);
            const cachedMap = cachedMapRaw ? JSON.parse(cachedMapRaw) : {};

            const resolvedComments: CategorizedComment[] = [];
            const missingComments: typeof targetComments = [];

            targetComments.forEach(c => {
                if (cachedMap[c.text]) {
                    resolvedComments.push({
                        ...c,
                        sentiment: cachedMap[c.text]
                    } as CategorizedComment);
                } else {
                    missingComments.push(c);
                }
            });

            // Set immediately with whatever we found in cache
            if (resolvedComments.length > 0) {
                setCategorizedComments(resolvedComments);
            }

            // If everything was cached, we are done
            if (missingComments.length === 0) {
                setLoading(false);
                return;
            }

            // 3. Process MISSING comments in chunks
            const mid = Math.ceil(missingComments.length / 2);
            const chunk1 = missingComments.slice(0, mid);
            const chunk2 = missingComments.slice(mid);

            let completedChunks = 0;
            const processChunk = async (chunk: typeof targetComments) => {
                if (chunk.length === 0) return;
                try {
                    const categorizeRes = await fetch(`${backendUrl}/categorize-comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ comments: chunk.map(c => c.text), userId: currentUserId || userId }),
                    });

                    if (categorizeRes.status === 429) {
                        setLimitedFeature('sentiment classifications');
                        setShowUpgradeModal(true);
                        setLoading(false);
                        return;
                    }

                    const { categorized } = await categorizeRes.json();

                    // Update sessionStorage cache with new sentiments
                    const currentCache = JSON.parse(sessionStorage.getItem(cacheKey) || '{}');
                    categorized.forEach((cat: any) => {
                        currentCache[cat.text] = cat.sentiment;
                    });
                    sessionStorage.setItem(cacheKey, JSON.stringify(currentCache));

                    const withMetadata = (categorized || []).map((cat: { text: string; sentiment: string }, i: number) => ({
                        id: chunk[i]?.id || '',
                        text: cat.text,
                        sentiment: cat.sentiment,
                        replyCount: chunk[i]?.replyCount || 0,
                        alreadyReplied: chunk[i]?.alreadyReplied || false
                    }));
                    setCategorizedComments(prev => [...prev, ...withMetadata]);
                } catch (err) {
                    console.error('Chunk processing error:', err);
                } finally {
                    completedChunks++;
                    if (completedChunks === (chunk2.length > 0 ? 2 : 1)) {
                        setLoading(false);
                    }
                }
            };

            processChunk(chunk1);
            processChunk(chunk2);

        } catch (err) {
            console.error('Error fetching replies:', err);
            setError('Failed to load comment sentiments.');
            setLoading(false);
        }
    };

    const fetchReplies = async (commentId: string) => {
        if (replies[commentId] || loadingReplies[commentId]) {
            setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
            return;
        }

        setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
        setExpandedReplies(prev => ({ ...prev, [commentId]: true }));

        try {
            const res = await fetch(`${backendUrl}/fetch-replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId }),
            });
            const { replies: newReplies } = await res.json();
            setReplies(prev => ({ ...prev, [commentId]: newReplies || [] }));
        } catch (err) {
            console.error('Error fetching replies:', err);
        } finally {
            setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
        }
    };

    const suggestReply = async (index: number, text: string) => {
        setSuggesting(prev => ({ ...prev, [index]: true }));
        try {
            const res = await fetch(`${backendUrl}/generate-smart-reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoTitle, commentText: text, userId }),
            });

            // Handle quota limit
            if (res.status === 429) {
                setLimitedFeature('AI replies');
                setShowUpgradeModal(true);
                return;
            }

            const data = await res.json();
            setSuggestions(prev => ({ ...prev, [index]: data.reply }));
        } catch (err) {
            console.error('Suggest error:', err);
            setSuggestions(prev => ({ ...prev, [index]: 'Could not generate a reply.' }));
        } finally {
            setSuggesting(prev => ({ ...prev, [index]: false }));
        }
    };

    const executePost = async (index: number, commentId: string, replyText: string) => {
        setPosting(prev => ({ ...prev, [index]: true }));
        setPostError(prev => ({ ...prev, [index]: '' }));

        try {
            const res = await fetch(`${backendUrl}/post-reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, commentId, replyText }),
            });

            const data = await res.json();

            if (data.needsAuth) {
                // Need OAuth — save intent and redirect
                sessionStorage.setItem('pendingPost', JSON.stringify({
                    commentId,
                    replyText,
                    videoId,
                }));

                // Get auth URL from backend
                const authRes = await fetch(`${backendUrl}/youtube/auth-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                const { url } = await authRes.json();
                window.location.href = url;
                return;
            }

            if (!res.ok) {
                setPostError(prev => ({ ...prev, [index]: data.error || 'Failed to post reply' }));
                return;
            }

            setPosted(prev => ({ ...prev, [index]: true }));
            // Also mark as alreadyReplied in our main state
            setCategorizedComments(prev => {
                const next = [...prev];
                if (next[index]) {
                    next[index] = { ...next[index], alreadyReplied: true };
                }
                return next;
            });
        } catch (err) {
            console.error('Post error:', err);
            setPostError(prev => ({ ...prev, [index]: 'Network error. Please try again.' }));
        } finally {
            setPosting(prev => ({ ...prev, [index]: false }));
        }
    };

    const handlePost = async (index: number) => {
        const comment = categorizedComments[index];
        const replyText = suggestions[index];
        if (!comment || !replyText) return;

        if (!userId) {
            setPostError(prev => ({ ...prev, [index]: 'You must be signed in to post replies.' }));
            return;
        }

        // First check if YouTube is already connected
        try {
            const checkRes = await fetch(`${backendUrl}/youtube/check-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const { connected } = await checkRes.json();

            if (!connected) {
                // Save intent and start OAuth
                sessionStorage.setItem('pendingPost', JSON.stringify({
                    commentId: comment.id,
                    replyText,
                    videoId,
                }));

                const authRes = await fetch(`${backendUrl}/youtube/auth-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                const { url } = await authRes.json();
                window.location.href = url;
                return;
            }

            // Already connected — post directly
            executePost(index, comment.id, replyText);
        } catch (err) {
            console.error('Check auth error:', err);
            setPostError(prev => ({ ...prev, [index]: 'Failed to check YouTube connection.' }));
        }
    };

    const getCardStyle = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return styles.positiveCard;
            case 'negative': return styles.negativeCard;
            default: return styles.neutralCard;
        }
    };

    const isQuestion = (text: string) => {
        const questionWords = ['how', 'what', 'why', 'can', 'could', 'when', 'where', 'which', 'who', 'whom', 'whose', 'shall', 'should', 'will', 'would', 'do', 'does', 'did', 'is', 'am', 'are', 'was', 'were', 'has', 'have', 'had', 'may', 'might', 'must'];
        const lowerText = text.toLowerCase().trim();
        if (lowerText.includes('?')) return true;
        const firstWord = lowerText.split(/\s+/)[0];
        return questionWords.includes(firstWord);
    };

    const filteredComments = categorizedComments.filter(comment => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'QUESTION') return isQuestion(comment.text);
        return comment.sentiment.toUpperCase() === activeFilter;
    });

    return (
        <div className={styles.container}>
            {showUpgradeModal && (
                <UpgradeModal
                    feature={limitedFeature}
                    onClose={() => setShowUpgradeModal(false)}
                />
            )}

            <main className={styles.maxContainer}>
                <Link href="/dashboard" className={styles.backBtn}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back to Dashboard
                </Link>

                <h1 className={styles.title}>AI Smart Reply Generator</h1>
                <p className={styles.subtitle}>Analyzing audience sentiments for {videoTitle}</p>

                {/* Post-OAuth banner */}
                {directPostStatus !== 'idle' && (
                    <div style={{
                        padding: '16px 24px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        textAlign: 'center',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        ...(directPostStatus === 'posting' ? {
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#60a5fa',
                        } : directPostStatus === 'success' ? {
                            background: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            color: '#4ade80',
                        } : {
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                        })
                    }}>
                        {directPostStatus === 'posting' && '✨ YouTube connected! Posting your reply...'}
                        {directPostStatus === 'success' && '✅ Reply posted to YouTube successfully!'}
                        {directPostStatus === 'error' && '❌ Failed to post reply. Please try again manually.'}
                    </div>
                )}

                {/* Primary Left Sidebar for Filters */}
                <aside className={styles.filterSidebar}>
                    <div className={styles.sidebarBrand}>
                        <div style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #3b82f6, #ef4444)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em'
                        }}>
                            Sentitube AI
                        </div>
                    </div>

                    <div className={styles.filterHeading}>Filter Comments</div>
                    {[
                        { id: 'ALL', label: 'All Comments', class: styles.filterAll, dot: styles.dotAll },
                        { id: 'POSITIVE', label: 'Positive', class: styles.filterPositive, dot: styles.dotPositive },
                        { id: 'NEGATIVE', label: 'Negative', class: styles.filterNegative, dot: styles.dotNegative },
                        { id: 'NEUTRAL', label: 'Neutral', class: styles.filterNeutral, dot: styles.dotNeutral },
                        { id: 'QUESTION', label: 'Questions', class: styles.filterQuestion, dot: styles.dotQuestion },
                    ].map(filter => (
                        <button
                            key={filter.id}
                            className={`${styles.filterBtn} ${filter.class} ${activeFilter === filter.id ? styles.filterBtnActive : ''}`}
                            onClick={() => setActiveFilter(filter.id)}
                        >
                            <div className={`${styles.filterDot} ${filter.dot}`} />
                            {filter.label}
                        </button>
                    ))}
                </aside>

                {error ? (
                    <div className={styles.loadingContainer}>
                        <p style={{ color: '#ef4444' }}>{error}</p>
                    </div>
                ) : (
                    <div className={styles.contentWrapper}>
                        <div className={styles.commentsContainer}>
                            {loading && categorizedComments.length === 0 && (
                                <div className={styles.loadingContainer} style={{ padding: '40px 0' }}>
                                    <div className={styles.spinner}></div>
                                    <p>Analyzing audience sentiments...</p>
                                </div>
                            )}

                            {filteredComments.length === 0 && !loading && categorizedComments.length > 0 && (
                                <div className={styles.loadingContainer} style={{ padding: '60px 0' }}>
                                    <p style={{ color: '#94a3b8' }}>No {activeFilter.toLowerCase()} comments found.</p>
                                </div>
                            )}

                            {filteredComments.map((comment) => {
                                const originalIndex = categorizedComments.indexOf(comment);
                                return (
                                    <div key={originalIndex} className={styles.commentWrapper}>
                                        <div
                                            className={`${styles.commentCard} ${getCardStyle(comment.sentiment)}`}
                                        >
                                            <p className={styles.commentText}>{comment.text}</p>

                                            <div className={styles.commentFooter}>
                                                {comment.alreadyReplied ? (
                                                    <div className={styles.repliedStatus}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                        Replied
                                                    </div>
                                                ) : (
                                                    <button
                                                        className={styles.suggestBtn}
                                                        onClick={() => suggestReply(originalIndex, comment.text)}
                                                        disabled={suggesting[originalIndex]}
                                                    >
                                                        {suggesting[originalIndex] ? '✨ Generating...' : 'suggest a reply ✨'}
                                                    </button>
                                                )}

                                                <button
                                                    className={`${styles.repliesToggle} ${expandedReplies[comment.id] ? styles.repliesToggleActive : ''}`}
                                                    onClick={() => fetchReplies(comment.id)}
                                                >
                                                    {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="6 9 12 15 18 9"></polyline>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {expandedReplies[comment.id] && (
                                            <div className={styles.repliesContainer}>
                                                {loadingReplies[comment.id] && (
                                                    <div className={styles.repliesLoading}>Loading replies...</div>
                                                )}
                                                {replies[comment.id]?.map((reply: any) => (
                                                    <div key={reply.id} className={styles.replyItemText}>
                                                        {reply.text}
                                                    </div>
                                                ))}
                                                {!loadingReplies[comment.id] && (!replies[comment.id] || replies[comment.id].length === 0) && (
                                                    <div className={styles.repliesLoading}>No replies found.</div>
                                                )}
                                            </div>
                                        )}

                                        {(suggesting[originalIndex] || suggestions[originalIndex]) && (
                                            <div className={styles.replyCard}>
                                                <div className={styles.replyHeader}>
                                                    <span className={styles.replyLabel}>Suggested Reply</span>
                                                    {suggesting[originalIndex] && (
                                                        <span className={styles.suggestLoading}>suggesting you a smart reply...</span>
                                                    )}
                                                </div>
                                                {!suggesting[originalIndex] && suggestions[originalIndex] && (
                                                    <>
                                                        <div className={styles.replyText}>
                                                            {suggestions[originalIndex]}
                                                        </div>
                                                        <div className={styles.replyFooter}>
                                                            {posted[originalIndex] ? (
                                                                <span className={styles.postedBadge}>
                                                                    ✅ Posted to YouTube
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    className={styles.postBtn}
                                                                    onClick={() => handlePost(originalIndex)}
                                                                    disabled={posting[originalIndex]}
                                                                >
                                                                    {posting[originalIndex] ? (
                                                                        'Posting...'
                                                                    ) : (
                                                                        <>
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                                                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                                            </svg>
                                                                            POST
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                        {postError[originalIndex] && (
                                                            <p className={styles.postErrorMsg}>{postError[originalIndex]}</p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {loading && categorizedComments.length > 0 && (
                                <div className={styles.loadingContainer} style={{ padding: '20px 0' }}>
                                    <div className={styles.spinner} style={{ width: '30px', height: '30px', borderWidth: '3px' }}></div>
                                    <p style={{ fontSize: '0.9rem' }}>Analyzing remaining comments...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
