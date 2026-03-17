'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import UpgradeModal from './UpgradeModal';
import styles from './Sidebar.module.css';

interface SidebarProps {
    activeItem?: string;
}

export default function Sidebar({ activeItem = 'Analyze Channel' }: SidebarProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userPlan, setUserPlan] = useState<string>('free');
    const [isLoadingPlan, setIsLoadingPlan] = useState(true);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const getUserAndPlan = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email ?? null);
                
                // Fetch their plan status
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
                } finally {
                    setIsLoadingPlan(false);
                }
            } else {
                setIsLoadingPlan(false);
            }
        };
        getUserAndPlan();
    }, []);

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
        <>
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
                <div style={{ width: '24px' }}></div> {/* Spacer */}
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
                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`${styles.navItem} ${activeItem === item.name ? styles.navItemActive : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarBottom}>
                    <div className={styles.planContainer}>
                        {isLoadingPlan ? (
                            <div className={styles.planLoading}>Checking status...</div>
                        ) : userPlan === 'pro' ? (
                            <div className={styles.proBadge}>⭐ Pro Member</div>
                        ) : (
                            <button 
                                className={styles.upgradeBtnSidebar}
                                onClick={() => setUpgradeModalOpen(true)}
                            >
                                💎 Upgrade to Pro
                            </button>
                        )}
                            </div>
                            {userEmail && <div className={styles.userEmail}>{userEmail}</div>}
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

                    {isUpgradeModalOpen && (
                        <UpgradeModal 
                            feature="Pro Features" 
                            onClose={() => setUpgradeModalOpen(false)} 
                        />
                    )}
                </>
            );
        }
