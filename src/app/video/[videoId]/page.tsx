'use client';
export const dynamic = 'force-dynamic';

import { useSearchParams, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './video.module.css';

export default function VideoPage() {
    const { videoId } = useParams();
    const searchParams = useSearchParams();

    const [videoData, setVideoData] = useState({
        title: searchParams.get('title') || '',
        thumbnail: searchParams.get('thumbnail') || ''
    });
    const [loading, setLoading] = useState(!videoData.title || !videoData.thumbnail);

    useEffect(() => {
        // Only fetch if data is missing
        if (!videoData.title || !videoData.thumbnail) {
            fetchVideoMetadata();
        }
    }, [videoId]);

    const fetchVideoMetadata = async () => {
        try {
            setLoading(true);
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const res = await fetch(`${backendUrl}/video-metadata`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId }),
            });
            const data = await res.json();
            if (data.title) {
                setVideoData({
                    title: data.title,
                    thumbnail: data.thumbnail
                });
            }
        } catch (err) {
            console.error('Failed to fetch video metadata:', err);
        } finally {
            setLoading(false);
        }
    };

    const displayTitle = videoData.title || 'Selected Video';
    const displayThumbnail = videoData.thumbnail || '';

    return (
        <div className={styles.container}>
            <div className={styles.maxContainer}>
                <Link href="/dashboard" className={styles.backLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back to Dashboard
                </Link>

                {/* Top Section */}
                <div className={styles.topSection}>
                    <div className={styles.thumbnailWrapper}>
                        {loading ? (
                            <div className={styles.thumbnailSkeleton}></div>
                        ) : displayThumbnail && (
                            <Image
                                src={displayThumbnail}
                                alt={displayTitle}
                                fill
                                className={styles.thumbnail}
                                style={{ objectFit: 'cover' }}
                            />
                        )}
                    </div>
                    <h1 className={styles.videoTitle}>
                        {loading ? 'Loading video title...' : displayTitle}
                    </h1>
                </div>

                {/* Actions Section */}
                <div className={styles.actionsSection}>
                    <h2 className={styles.heading}>Choose what you want to do with this video</h2>

                    <div className={styles.cardGrid}>
                        {/* Card 1: Sentiment Analysis */}
                        <div className={styles.glassCard}>
                            <div className={styles.iconBg} style={{ backgroundColor: 'rgba(196, 35, 35, 0.9)' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l4-4V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v10Z"></path>
                                    <path d="M3 21v-8a2 2 0 0 1 2-2h2"></path>
                                </svg>
                            </div>
                            <h3 className={styles.cardTitle}>Comment Sentiment Analysis</h3>
                            <p className={styles.cardDesc}>Understand what your audience are saying in the comments.</p>
                            <Link
                                href={`/analysis/${videoId}`}
                                className={styles.actionBtn}
                                style={{ backgroundColor: 'rgba(196, 35, 35, 0.9)' }}
                            >
                                Analyze Comments
                            </Link>
                        </div>

                        {/* Card 2: AI Reply Generator */}
                        <div className={styles.glassCard}>
                            <div className={styles.iconBg} style={{ backgroundColor: 'rgba(10, 154, 96, 0.9)' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
                                </svg>
                            </div>
                            <h3 className={styles.cardTitle}>AI Smart Reply Generator</h3>
                            <p className={styles.cardDesc}>Generate smart, engaging replies to comments automatically.</p>
                            <Link
                                href={`/replies/${videoId}?title=${encodeURIComponent(displayTitle)}`}
                                className={styles.actionBtn}
                                style={{ backgroundColor: 'rgba(10, 154, 96, 0.9)' }}
                            >
                                Generate AI Replies
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
