'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import UpgradeModal from '@/app/components/UpgradeModal';
import styles from './dashboard.module.css';

interface DashboardClientProps {
    user: any;
    youtubeData: any;
    error: string | null;
    channelInput: string;
}

export default function DashboardClient({ user, youtubeData, error, channelInput }: DashboardClientProps) {
    const [userPlan, setUserPlan] = useState<string>('free');
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

    useEffect(() => {
        const fetchPlanStatus = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                const res = await fetch(`${backendUrl}/subscription-status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.id })
                });
                if (res.ok) {
                    const result = await res.json();
                    setUserPlan(result.plan);
                }
            } catch (err) {
                console.error("Failed to fetch plan status", err);
            }
        };
        fetchPlanStatus();
    }, [user.id]);

    return (
        <div className={styles.container}>
            <Sidebar activeItem="Analyze Channel" />


            {/* Main Content */}
            <main className={styles.main}>
                {error ? (
                    <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <p><strong>Error fetching YouTube data:</strong> {error}</p>
                        <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>Make sure your YOUTUBE_API_KEY is correct in .env.local and the channel handle "{channelInput}" is valid.</p>
                        <Link href="/connect-channel" style={{ display: 'inline-block', marginTop: '16px', color: '#3b82f6', textDecoration: 'underline' }}>
                            Change Channel
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className={styles.topBar}>
                            {youtubeData?.channel && (
                                <>
                                    <Image
                                        src={youtubeData.channel.profilePicture}
                                        alt={youtubeData.channel.title}
                                        className={styles.channelPic}
                                        width={56}
                                        height={56}
                                    />
                                    <div className={styles.channelInfo}>
                                        <h2 className={styles.channelName}>{youtubeData.channel.title}</h2>
                                        <Link href="/connect-channel" className={styles.moreBtn} title="Change Channel">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="1"></circle>
                                                <circle cx="19" cy="12" r="1"></circle>
                                                <circle cx="5" cy="12" r="1"></circle>
                                            </svg>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>

                        {userPlan === 'free' && (
                            <div style={{ 
                                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)', 
                                border: '1px solid rgba(147, 51, 234, 0.2)',
                                borderRadius: '12px',
                                padding: '24px',
                                marginBottom: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '20px'
                            }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>Unlock full potential with Sentitube Pro</h4>
                                    <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>Get unlimited analysis, script generation and faster AI results.</p>
                                </div>
                                <button 
                                    onClick={() => setUpgradeModalOpen(true)}
                                    style={{ 
                                        background: 'linear-gradient(to right, #9333ea, #4f46e5)',
                                        color: '#fff',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    💎 Upgrade to Pro
                                </button>
                            </div>
                        )}

                        <h3 className={styles.sectionHeading}>Select a video to analyze</h3>

                        <div className={styles.videoGrid}>
                            {youtubeData?.videos.map((video: any) => (
                                <Link
                                    key={video.id}
                                    href={`/video/${video.id}?title=${encodeURIComponent(video.title)}&thumbnail=${encodeURIComponent(video.thumbnail)}`}
                                    className={styles.videoCard}
                                >
                                    <div className={styles.thumbnailContainer}>
                                        <Image
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className={styles.thumbnail}
                                            fill
                                        />
                                    </div>
                                    <div className={styles.videoTitle}>{video.title}</div>
                                </Link>
                            ))}

                            {!youtubeData && !error && (
                                <div style={{ color: '#94a3b8' }}>Loading YouTube videos...</div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {isUpgradeModalOpen && (
                <UpgradeModal 
                    feature="Premium Features" 
                    onClose={() => setUpgradeModalOpen(false)} 
                />
            )}
        </div>
    );
}
