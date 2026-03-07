'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import { createClient } from '@/utils/supabase/client';
import styles from './suggest-content.module.css';

interface ContentIdea {
    title: string;
    description: string;
    engagementScore: number;
}

export default function SuggestContentPage() {
    const [ideas, setIdeas] = useState<ContentIdea[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [error, setError] = useState('');
    const supabase = createClient();

    useEffect(() => {
        fetchIdeas();
    }, []);

    const fetchIdeas = async (isMore = false) => {
        try {
            if (isMore) setFetchingMore(true);
            else setLoading(true);

            setError('');

            // 1. Get the user and their connected channel
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('User not found. Please sign in again.');
                if (isMore) setFetchingMore(false);
                else setLoading(false);
                return;
            }

            const { data: channelEntry } = await supabase
                .from('channels')
                .select('channel_input')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!channelEntry) {
                setError('No connected channel found. Please go to the dashboard and connect your channel.');
                if (isMore) setFetchingMore(false);
                else setLoading(false);
                return;
            }

            // Collect existing titles to exclude
            const excludeTitles = ideas.map(i => i.title);

            // 2. Fetch ideas from the backend
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const res = await fetch(`${backendUrl}/suggest-content-ideas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelHandle: channelEntry.channel_input,
                    excludeTitles: excludeTitles,
                    userId: user.id
                }),
            });

            // Handle quota limit
            if (res.status === 429) {
                const limitData = await res.json();
                throw new Error(`\u26a1 Daily limit reached \u2014 You've used all ${limitData.limit} content idea generations today. Upgrade to Pro for more!`);
            }

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch ideas');
            }

            const data = await res.json();
            const newIdeas = data.ideas || [];

            if (isMore) {
                setIdeas(prev => [...prev, ...newIdeas]);
            } else {
                setIdeas(newIdeas);
            }
        } catch (err: any) {
            console.error('Error fetching ideas:', err);
            setError(err.message || 'Something went wrong while generating ideas.');
        } finally {
            setLoading(false);
            setFetchingMore(false);
        }
    };

    const getEngagementEmoji = (score: number) => {
        if (score >= 9) return '🔥';
        if (score >= 8) return '🚀';
        if (score >= 7) return '📈';
        return '✨';
    };

    return (
        <div className={styles.pageWrapper}>
            <Sidebar activeItem="Suggest Content Ideas" />

            <div className={styles.bgDecor}>
                <div className={styles.bgOrb1}></div>
                <div className={styles.bgOrb2}></div>
            </div>

            <main className={styles.mainContent}>
                <div className={styles.titleSection}>
                    <h1 className={styles.heading}>Growth-Driven Content Ideas</h1>
                    <p className={styles.subheading}>
                        Personalized suggestions based on your channel's recent performance and audience signals.
                    </p>
                </div>

                {loading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Analyzing channel performance...</p>
                    </div>
                ) : error ? (
                    <div className={styles.errorContainer}>
                        <p>{error}</p>
                        <button onClick={() => fetchIdeas()} className={styles.retryBtn}>Retry</button>
                    </div>
                ) : (
                    <>
                        <div className={styles.ideasGrid}>
                            {ideas.map((idea, index) => (
                                <div key={index} className={styles.ideaCard}>
                                    <div className={styles.ideaTop}>
                                        <h3 className={styles.ideaTitle}>{idea.title}</h3>
                                        <div className={styles.engagementTag}>
                                            {getEngagementEmoji(idea.engagementScore)}
                                            <span>Potential:</span>
                                            <span className={styles.scoreValue}>{idea.engagementScore}/10</span>
                                        </div>
                                    </div>
                                    <p className={styles.ideaDesc}>{idea.description}</p>
                                    <button
                                        className={styles.generateScriptBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `/script-generator?idea=${encodeURIComponent(idea.title + ": " + idea.description)}`;
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <line x1="10" y1="9" x2="8" y2="9"></line>
                                        </svg>
                                        Generate Script
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.moreContainer}>
                            <button
                                className={styles.suggestMoreBtn}
                                onClick={() => fetchIdeas(true)}
                                disabled={fetchingMore}
                            >
                                {fetchingMore ? (
                                    <>
                                        <div className={styles.miniSpinner}></div>
                                        <span>Exploring fresh angles...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2v8"></path>
                                            <path d="M16 4.3a8 8 0 1 0-8 0"></path>
                                            <path d="M10 14h4"></path>
                                            <path d="M10 18h4"></path>
                                        </svg>
                                        Suggest More
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
