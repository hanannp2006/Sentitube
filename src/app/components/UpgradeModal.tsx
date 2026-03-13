'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './UpgradeModal.module.css';

interface UpgradeModalProps {
    feature: string;
    onClose: () => void;
}

export default function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

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

                <a href="/connect-channel" className={styles.ctaButton}>
                    Upgrade to Pro
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </a>

                <button className={styles.dismissLink} onClick={onClose}>
                    Maybe later
                </button>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
