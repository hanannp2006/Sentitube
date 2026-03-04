'use client';

import Link from 'next/link';
import styles from '../privacy/privacy.module.css'; // Reusing the premium privacy styles

export default function TermsOfService() {
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
                    <h1 className={styles.title}>Terms of Service</h1>
                    <p className={styles.lastUpdated}>Last Updated: March 03, 2026</p>
                </header>

                {/* Introduction */}
                <section className={styles.section}>
                    <p className={styles.text}>
                        Welcome to Sentitube (“we,” “our,” or “us”).
                        These Terms of Service (“Terms”) govern your access to and use of the Sentitube platform.
                    </p>
                    <p className={styles.text}>
                        By accessing or using Sentitube, you agree to be bound by these Terms. If you do not agree, you may not use the service.
                    </p>
                </section>

                {/* 1. Description of Service */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. Description of Service</h2>
                    <p className={styles.text}>Sentitube is a web-based software platform that provides:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>YouTube comment sentiment analysis</li>
                        <li className={styles.listItem}>AI-powered reply suggestions</li>
                        <li className={styles.listItem}>Content idea generation</li>
                        <li className={styles.listItem}>Direct reply posting via YouTube OAuth integration</li>
                    </ul>
                    <p className={styles.text}>Sentitube is designed for professional YouTube creators.</p>
                </section>

                {/* 2. Eligibility */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>2. Eligibility</h2>
                    <p className={styles.text}>You must:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Be at least 18 years old</li>
                        <li className={styles.listItem}>Have the legal capacity to enter into a binding agreement</li>
                        <li className={styles.listItem}>Comply with all applicable laws and YouTube’s Terms of Service</li>
                        <li className={styles.listItem}>You are responsible for maintaining the security of your account.</li>
                    </ul>
                </section>

                {/* 3. Account & YouTube Integration */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>3. Account & YouTube Integration</h2>
                    <p className={styles.text}>Sentitube uses Google OAuth to connect to your YouTube account.</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>By connecting your account, you grant Sentitube permission to access authorized YouTube data.</li>
                        <li className={styles.listItem}>You remain fully responsible for all content posted via your account.</li>
                        <li className={styles.listItem}>Sentitube does not assume ownership of your YouTube content.</li>
                        <li className={styles.listItem}>You may revoke access at any time via your Google account settings.</li>
                    </ul>
                </section>

                {/* 4. Subscriptions & Payments */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>4. Subscriptions & Payments</h2>
                    <p className={styles.text}>Sentitube operates on a paid subscription model. By subscribing:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>You agree to pay all applicable fees.</li>
                        <li className={styles.listItem}>Payments are processed securely by third-party payment providers.</li>
                        <li className={styles.listItem}>We do not store your full credit card information.</li>
                        <li className={styles.listItem}>Subscriptions may automatically renew unless canceled before the renewal date.</li>
                        <li className={styles.listItem}>You are responsible for managing your subscription status.</li>
                    </ul>
                </section>

                {/* 5. Refund Policy */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>5. Refund Policy</h2>
                    <p className={styles.text}>
                        Refund eligibility, if applicable, will be governed by our posted refund policy.
                        Unless otherwise stated, subscription fees are non-refundable once a billing cycle has started.
                    </p>
                </section>

                {/* 6. Acceptable Use */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>6. Acceptable Use</h2>
                    <p className={styles.text}>You agree NOT to use Sentitube to:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Violate YouTube’s policies</li>
                        <li className={styles.listItem}>Post spam or abusive content</li>
                        <li className={styles.listItem}>Harass individuals</li>
                        <li className={styles.listItem}>Engage in unlawful activity</li>
                        <li className={styles.listItem}>Circumvent platform safeguards</li>
                    </ul>
                    <p className={styles.text}>We reserve the right to suspend or terminate accounts that violate these rules.</p>
                </section>

                {/* 7. AI-Generated Content Disclaimer */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>7. AI-Generated Content Disclaimer</h2>
                    <p className={styles.text}>Sentitube uses AI models to generate suggestions and insights. You acknowledge that:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>AI-generated content may contain inaccuracies.</li>
                        <li className={styles.listItem}>You are solely responsible for reviewing and approving any reply before posting.</li>
                        <li className={styles.listItem}>Sentitube is not liable for consequences arising from AI-generated content.</li>
                    </ul>
                    <p className={styles.text}>All posting actions require user initiation.</p>
                </section>

                {/* 8. Intellectual Property */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>8. Intellectual Property</h2>
                    <p className={styles.text}>All Sentitube software, branding, and platform content are the property of Sentitube.</p>
                    <p className={styles.text}>You retain ownership of:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Your YouTube content</li>
                        <li className={styles.listItem}>Your comments</li>
                        <li className={styles.listItem}>Your generated replies</li>
                    </ul>
                    <p className={styles.text}>You may not copy, reverse engineer, or redistribute Sentitube’s software.</p>
                </section>

                {/* 9. Service Availability */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>9. Service Availability</h2>
                    <p className={styles.text}>We strive to provide reliable service but do not guarantee uninterrupted access. Sentitube may:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Update features</li>
                        <li className={styles.listItem}>Modify functionality</li>
                        <li className={styles.listItem}>Suspend services temporarily for maintenance</li>
                    </ul>
                    <p className={styles.text}>We are not liable for downtime or technical interruptions.</p>
                </section>

                {/* 10. Termination */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>10. Termination</h2>
                    <p className={styles.text}>We may suspend or terminate your account if:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>You violate these Terms</li>
                        <li className={styles.listItem}>You misuse the platform</li>
                        <li className={styles.listItem}>Payment fails</li>
                    </ul>
                    <p className={styles.text}>Termination does not relieve you of payment obligations already incurred.</p>
                </section>

                {/* 11. Limitation of Liability */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>11. Limitation of Liability</h2>
                    <p className={styles.text}>To the maximum extent permitted by law, Sentitube shall not be liable for:</p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Loss of revenue</li>
                        <li className={styles.listItem}>Channel performance outcomes</li>
                        <li className={styles.listItem}>Algorithm changes</li>
                        <li className={styles.listItem}>AI output inaccuracies</li>
                        <li className={styles.listItem}>Indirect or consequential damages</li>
                    </ul>
                    <p className={styles.text}>Use of Sentitube is at your own risk.</p>
                </section>

                {/* 12. Indemnification */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>12. Indemnification</h2>
                    <p className={styles.text}>
                        You agree to indemnify and hold harmless Sentitube from any claims arising from:
                        content posted through your account, misuse of the platform, or violation of these Terms.
                    </p>
                </section>

                {/* 13. Changes to Terms */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>13. Changes to Terms</h2>
                    <p className={styles.text}>
                        We may update these Terms from time to time.
                        Updated versions will include a revised “Last Updated” date.
                    </p>
                    <p className={styles.text}>
                        Continued use of Sentitube constitutes acceptance of the revised Terms.
                    </p>
                </section>

                {/* 14. Governing Law */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>14. Governing Law</h2>
                    <p className={styles.text}>
                        These Terms shall be governed by and interpreted in accordance with the laws of the developer's country (India).
                    </p>
                </section>

                {/* 15. Contact Us */}
                <section className={styles.contactBox}>
                    <h2 className={styles.sectionTitle} style={{ marginBottom: '1rem' }}>15. Contact Us</h2>
                    <p className={styles.text} style={{ marginBottom: '0.5rem' }}>If you have any questions regarding these Terms, contact us at:</p>
                    <p className={styles.text} style={{ color: 'white' }}>
                        Email:{' '}
                        <a href="mailto:sentitubeai@gmail.com" className={styles.contactEmail}>sentitubeai@gmail.com</a>
                    </p>
                    <p className={styles.text} style={{ color: 'white' }}>
                        Website: <span className={styles.contactEmail}>sentitubeai.com</span>
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
