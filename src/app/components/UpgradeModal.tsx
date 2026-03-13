'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/utils/supabase/client';
import styles from './UpgradeModal.module.css';

interface UpgradeModalProps {
    feature: string;
    onClose: () => void;
}

export default function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [userData, setUserData] = useState<{ id: string, email: string } | null>(null);

    // Fetch user info when modal opens
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data, error }) => {
            if (data?.user) {
                setUserData({ id: data.user.id, email: data.user.email || "" });
            } else if (error) {
                console.error("Failed to get user details in modal:", error);
            }
        });
    }, []);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, isLoading]);

    const handleUpgrade = async () => {
        try {
            setIsLoading(true);
            setErrorMsg("");
            
            if (!userData?.id) {
                setErrorMsg("Please ensure you are logged in first.");
                setIsLoading(false);
                return;
            }

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const res = await fetch(`${backendUrl}/create-checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: userData.id, email: userData.email })
            });

            if (!res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to initialize checkout");
                } else {
                    const text = await res.text();
                    console.error("Non-JSON error from backend:", text);
                    throw new Error(`Server Error (${res.status}): Please check if your Render backend is running correctly.`);
                }
            }

            const data = await res.json();
            
            if (data.checkout_url) {
                // Redirect user to the DodoPayments checkout page
                window.location.href = data.checkout_url;
            } else {
                throw new Error("No checkout URL returned");
            }

        } catch (err: any) {
            console.error("Checkout error:", err);
            setErrorMsg(err.message || "Failed to connect to payment gateway.");
            setIsLoading(false);
        }
    };

    const modal = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <span className={styles.limitIcon}>⚡</span>
                <h2 className={styles.title}>Limit Reached</h2>
                <p className={styles.description}>
                    You&apos;ve reached the daily limit for <span className={styles.featureName}>{feature}</span>. Upgrade to Pro for higher limits and premium features.
                </p>

                <div className={styles.proCard}>
                    <div className={styles.proHeader}>
                        <span className={styles.proTitle}>Sentitube Pro</span>
                        <span className={styles.proBadge}>Popular</span>
                    </div>

                    <div className={styles.proFeatures}>
                        {[
                            'Unlimited Video Analysis per month',
                            '200 AI Reply Generations per day',
                            '20 Content Ideas per day',
                            '20 Script Generations per day',
                            'Direct YouTube Reply Posting',
                            'Faster AI processing',
                        ].map((item, i) => (
                            <div key={i} className={styles.proFeatureItem}>
                                <span className={styles.proCheck}>✔</span>
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.proPriceRow}>
                        <span className={styles.proPriceAmount}>$19</span>
                        <span className={styles.proPricePeriod}>/ month</span>
                    </div>
                </div>

                {errorMsg && <p style={{ color: '#ff4d4f', fontSize: '14px', marginTop: '10px', textAlign: 'center' }}>{errorMsg}</p>}

                <button 
                    className={styles.ctaButton} 
                    onClick={handleUpgrade}
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer', border: 'none', width: '100%' }}
                >
                    {isLoading ? "Redirecting..." : "Upgrade to Pro"}
                    {!isLoading && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    )}
                </button>

                <button className={styles.dismissLink} onClick={onClose} disabled={isLoading}>
                    Maybe later
                </button>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
