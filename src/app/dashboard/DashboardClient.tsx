'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface DashboardClientProps {
    user: any;
    youtubeData: any;
    error: string | null;
    channelInput: string;
}

export default function DashboardClient({ user, youtubeData, error, channelInput }: DashboardClientProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    const menuItems = [
        {
            name: 'Analyze Channel',
            href: '/dashboard',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                </svg>
            )
        },
        {
            name: 'Growth Tips',
            href: '#',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
            )
        },
        {
            name: 'Suggest Content Ideas',
            href: '/suggest-content',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v8"></path>
                    <path d="M16 4.3a8 8 0 1 0-8 0"></path>
                    <path d="M10 14h4"></path>
                    <path d="M10 18h4"></path>
                </svg>
            )
        },
        {
            name: 'Script Generator',
            href: '/script-generator',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <line x1="10" y1="9" x2="8" y2="9"></line>
                </svg>
            )
        },
    ];

    return (
        <div className={styles.container}>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <button className={styles.hamburger} onClick={toggleSidebar}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <div className={styles.appName}>Sentitube AI</div>
                {youtubeData?.channel && (
                    <div className={styles.mobileChannel}>
                        <Image
                            src={youtubeData.channel.profilePicture}
                            alt={youtubeData.channel.title}
                            className={styles.mobileChannelPic}
                            width={32}
                            height={32}
                        />
                        <span>{youtubeData.channel.title}</span>
                    </div>
                )}
            </header>

            {/* Overlay */}
            <div
                className={`${styles.overlay} ${isSidebarOpen ? styles.overlayVisible : ''}`}
                onClick={toggleSidebar}
            />

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.appName}>Sentitube AI</div>
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item, i) => (
                        <Link key={item.name} href={item.href || '#'} className={`${styles.navItem} ${i === 0 ? styles.navItemActive : ''}`}>
                            {item.icon}
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarBottom}>
                    <div className={styles.userEmail}>{user?.email}</div>
                    <form action="/auth/signout" method="post">
                        <button className={styles.logoutBtn} type="submit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Logout
                        </button>
                    </form>
                </div>
            </aside>

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
        </div>
    );
}
