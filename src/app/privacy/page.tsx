'use client';

import Link from 'next/link';
import styles from './privacy.module.css';

export default function PrivacyPolicy() {
    return (
        <main className={styles.container}>
            <div className={styles.glow} />

            <div className={styles.content}>
                {/* Back Link */}
                <Link href="/" className={styles.backHome}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Back to Sentitube
                </Link>

                {/* Header */}
                <header className={styles.header}>
                    <h1 className={styles.title}>Privacy Policy</h1>
                    <p className={styles.lastUpdated}>Last Updated: March 16, 2026</p>
                </header>

                {/* Content Section */}
                <section className={styles.section}>
                    <p className={styles.text}>
                        Welcome to Sentitube (“we,” “our,” or “us”).
                        Sentitube is a web-based platform that helps YouTube creators analyze audience sentiment, generate AI-powered replies, and discover content ideas.
                    </p>
                    <p className={styles.text}>
                        This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. Information We Collect</h2>

                    <h3 className={styles.sectionTitle} style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>1.1 Account Information</h3>
                    <p className={styles.text}>When you create an account, we may collect:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Your name</li>
                        <li className={styles.listItem}>Email address</li>
                        <li className={styles.listItem}>Authentication details via Google OAuth</li>
                        <li className={styles.listItem}>User ID from our authentication provider (Supabase)</li>
                        <li className={styles.listItem}>We do not store your Google password.</li>
                    </ul>

                    <h3 className={styles.sectionTitle} style={{ fontSize: '1.2rem', margin: '2rem 0 0.75rem' }}>1.2 YouTube Data</h3>
                    <p className={styles.text}>When you connect your YouTube channel through Google OAuth, we may access:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Channel ID</li>
                        <li className={styles.listItem}>Public video metadata</li>
                        <li className={styles.listItem}>Public video statistics</li>
                        <li className={styles.listItem}>Public comments on selected videos</li>
                    </ul>
                    <p className={styles.text}>We request only the minimum YouTube permissions required to:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Analyze comment sentiment</li>
                        <li className={styles.listItem}>Generate AI replies</li>
                        <li className={styles.listItem}>Post replies when explicitly approved by you</li>
                    </ul>
                    <p className={styles.text}>We do not access private YouTube data beyond the granted scope.</p>

                    <h3 className={styles.sectionTitle} style={{ fontSize: '1.2rem', margin: '2rem 0 0.75rem' }}>1.3 Usage Data</h3>
                    <p className={styles.text}>We may collect limited technical information such as:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Browser type</li>
                        <li className={styles.listItem}>Device type</li>
                        <li className={styles.listItem}>Pages visited</li>
                        <li className={styles.listItem}>Basic interaction logs</li>
                    </ul>
                    <p className={styles.text}>This helps us improve platform performance and reliability.</p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>2. How We Use Your Information</h2>
                    <p className={styles.text}>We use collected data to:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Provide sentiment analysis reports</li>
                        <li className={styles.listItem}>Generate AI-powered replies</li>
                        <li className={styles.listItem}>Suggest content ideas</li>
                        <li className={styles.listItem}>Enable direct reply posting to YouTube</li>
                        <li className={styles.listItem}>Improve platform functionality</li>
                        <li className={styles.listItem}>Maintain account security</li>
                    </ul>
                    <p className={styles.text}>We do not sell your data to third parties.</p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>3. OAuth & YouTube Integration</h2>
                    <p className={styles.text}>Sentitube uses Google OAuth 2.0 to securely connect to your YouTube account.</p>
                    <p className={styles.text}>We access YouTube data (such as comments and basic video information) only after explicit user authorization.</p>
                    <p className={styles.text}>This data is used solely to:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Retrieve comments from your own YouTube videos</li>
                        <li className={styles.listItem}>Analyze sentiment and engagement</li>
                        <li className={styles.listItem}>Generate AI-based reply suggestions</li>
                        <li className={styles.listItem}>Allow you to post replies to comments</li>
                    </ul>
                    <p className={styles.text}>All YouTube data is processed in real-time and is not stored for long-term use. We do not use this data for advertising or for training AI models.</p>
                    <p className={styles.text}>YouTube data is processed only as needed to provide core features such as sentiment analysis and reply suggestions. This processing is performed securely and is not used for any purpose other than delivering the requested functionality.</p>
                    <p className={styles.text}>We never store your Google password. You may revoke access at any time via your Google Account permissions page. Once access is revoked, Sentitube will no longer be able to access or interact with your YouTube data.</p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>4. AI Processing</h2>
                    <p className={styles.text}>Sentitube uses AI models to process:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Video titles</li>
                        <li className={styles.listItem}>Comment text</li>
                        <li className={styles.listItem}>Engagement metrics</li>
                    </ul>
                    <p className={styles.text}>This processing is used solely to generate insights, reports, and suggested replies.</p>
                    <p className={styles.text}>We do not use your data to train external AI models beyond what is required to provide the service.</p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>5. Data Storage & Security</h2>
                    <p className={styles.text}>We use industry-standard security measures to protect your information.</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Authentication is handled securely via Supabase.</li>
                        <li className={styles.listItem}>Access tokens are stored securely server-side.</li>
                        <li className={styles.listItem}>Sensitive credentials are never exposed to the client.</li>
                        <li className={styles.listItem}>While we implement strong safeguards, no system can guarantee absolute security.</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>6. Data Retention</h2>
                    <p className={styles.text}>We retain your data only as long as necessary to:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Provide our services</li>
                        <li className={styles.listItem}>Maintain your account</li>
                        <li className={styles.listItem}>Comply with legal obligations</li>
                    </ul>
                    <p className={styles.text}>You may request account deletion at any time.</p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>7. Payments and Subscriptions</h2>
                    <p className={styles.text}>Sentitube offers paid subscription plans.</p>
                    <p className={styles.text}>
                        Payments are processed securely through third-party payment providers. We do not store or have direct access to your full credit card information.
                    </p>
                    <p className={styles.text}>When you subscribe, we may collect:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Billing name</li>
                        <li className={styles.listItem}>Billing email</li>
                        <li className={styles.listItem}>Subscription plan details</li>
                        <li className={styles.listItem}>Transaction history</li>
                        <li className={styles.listItem}>Payment status</li>
                    </ul>
                    <p className={styles.text}>
                        All payment processing is handled by our payment provider in accordance with their own privacy and security policies.
                    </p>
                    <p className={styles.text}>
                        Subscription management, renewals, and cancellations are governed by our Terms of Service.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>8. Third-Party Services</h2>
                    <p className={styles.text}>Sentitube relies on trusted third-party providers, including:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Google (YouTube Data API & OAuth)</li>
                        <li className={styles.listItem}>Supabase (Authentication & Database)</li>
                        <li className={styles.listItem}>AI service providers</li>
                    </ul>
                    <p className={styles.text}>Each third-party service operates under its own privacy policy.</p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>9. Your Rights</h2>
                    <p className={styles.text}>Depending on your jurisdiction, you may have the right to:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Access your stored data</li>
                        <li className={styles.listItem}>Request correction of inaccuracies</li>
                        <li className={styles.listItem}>Request deletion of your account</li>
                        <li className={styles.listItem}>Withdraw consent</li>
                    </ul>
                    <p className={styles.text}>
                        To exercise these rights, contact us at:{' '}
                        <a href="mailto:sentitubeai@gmail.com" className={styles.contactEmail}>
                            sentitubeai@gmail.com
                        </a>
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>10. Children’s Privacy</h2>
                    <p className={styles.text}>
                        Sentitube is not intended for individuals under the age of 13.
                        We do not knowingly collect data from children.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>11. Changes to This Policy</h2>
                    <p className={styles.text}>
                        We may update this Privacy Policy from time to time.
                        Updates will be reflected with a new “Last Updated” date.
                    </p>
                    <p className={styles.text}>
                        Continued use of Sentitube after changes indicates acceptance of the revised policy.
                    </p>
                </section>

                <section className={styles.contactBox}>
                    <h2 className={styles.sectionTitle} style={{ marginBottom: '1rem' }}>12. Contact Us</h2>
                    <p className={styles.text} style={{ marginBottom: '0.5rem' }}>If you have any questions about this Privacy Policy, contact us at:</p>
                    <p className={styles.text} style={{ color: 'white' }}>
                        Email:{' '}
                        <a href="mailto:sentitubeai@gmail.com" className={styles.contactEmail}>sentitubeai@gmail.com</a>
                    </p>
                    <p className={styles.text} style={{ color: 'white' }}>
                        Website: <span className={styles.contactEmail}>sentitube.com</span>
                    </p>
                </section>

                <div style={{ marginTop: '6rem', opacity: 0.3 }}>
                    <p className={styles.text} style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                        © {new Date().getFullYear()} Sentitube AI. All rights reserved.
                    </p>
                </div>
            </div>
        </main>
    );
}
