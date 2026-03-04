"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

interface FeatureProps {
  badge: string;
  title: string;
  subtitle: string;
  description?: string;
  extraText?: string;
  footerText?: string;
  points: string[];
  videoSrc?: string;
  reversed?: boolean;
}

function FeatureSection({
  badge,
  title,
  subtitle,
  description,
  extraText,
  footerText,
  points,
  videoSrc,
  reversed,
}: FeatureProps) {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  const videoElement = (
    <div className={styles.featureVideoContainer}>
      <div className={styles.videoMockup}>
        {isVisible && videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            className={`${styles.featureVideo} ${styles.videoVisible}`}
          />
        ) : (
          <div
            ref={(el) => {
              if (el) observerRef.current = el;
            }}
            className={styles.videoPlaceholder}
          >
            {videoSrc ? "Loading Proof..." : "Video Proof Coming Soon"}
          </div>
        )}
      </div>
    </div>
  );

  const contentElement = (
    <div className={styles.featureContent}>
      <span className={styles.featureBadge}>{badge}</span>
      <h2 className={styles.featureTitle}>{title}</h2>
      <p className={styles.featureSubtitle}>{subtitle}</p>

      {description && <p className={styles.featureDescription}>{description}</p>}
      {extraText && <p className={styles.featureExtraText}>{extraText}</p>}

      <div className={styles.featureList}>
        {points.map((point, i) => (
          <div key={i} className={styles.featureItem}>
            <span className={styles.checkIcon}>✔</span>
            <span>{point}</span>
          </div>
        ))}
      </div>

      {footerText && <p className={styles.featureFooterText}>{footerText}</p>}
    </div>
  );

  return (
    <div className={`${styles.featureRow} ${reversed ? styles.reversedRow : ""}`}>
      {reversed ? (
        <>
          {contentElement}
          {videoElement}
        </>
      ) : (
        <>
          {videoElement}
          {contentElement}
        </>
      )}
    </div>
  );
}

function FAQAccordion({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ""}`}>
      <button
        className={styles.faqTrigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={styles.faqQuestionText}>{question}</span>
        <span className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ""}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>
      <div className={`${styles.faqContent} ${isOpen ? styles.faqContentOpen : ""}`}>
        <div className={styles.faqAnswerText}>{answer}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ""}`}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>
            Sentitube<span className={styles.redDot}>.</span>
          </div>
          <a href="/connect-channel" className={styles.navButton}>
            Get Started
          </a>
        </div>
      </nav>

      <main className={styles.main}>
        {/* Top Badge */}
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
            </svg>
          </span>
          AI-Powered Comment Analysis
        </div>

        {/* Main Heading */}
        <h1 className={styles.heading}>
          Unlock the <span className={styles.redText}>True</span>
          <br />
          <span className={styles.redText}>Sentiment</span>
          <br />
          Behind Your
          <br />
          Comments
        </h1>

        {/* Subheading */}
        <p className={styles.subheading}>
          Analyze sentiment, generate engagement-driven AI replies, and uncover
          your next high-impact content idea - all from one intelligent
          dashboard.
        </p>

        {/* CTA Buttons */}
        <div className={styles.buttonGroup}>
          <a href="/connect-channel" className={styles.primaryButton}>
            Get Started
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>

          <button className={styles.secondaryButton}>
            <span style={{ opacity: 0.8 }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            Watch Demo
          </button>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        {/* Feature 1: Sentiment Intelligence */}
        <FeatureSection
          badge="🔍"
          title="Sentiment Intelligence"
          subtitle="Understand What Your Audience Really Thinks"
          description="See beyond likes and views. Get a deep understanding of the emotions and recurring themes in your comment section."
          points={[
            "Positive vs negative sentiment split",
            "Recurring concerns and objections",
            "Topic-based discussion breakdown",
            "Actionable creator insights",
          ]}
          videoSrc="/features_videos/feature1.mp4"
        />

        {/* Feature 2: AI Smart Reply Generator */}
        <FeatureSection
          badge="🤖"
          title="AI Smart Reply Generator"
          subtitle="Turn One Comment Into Ten More."
          extraText="Most creators kill conversations with “Thanks for watching.” Sentitube helps you:"
          points={[
            "Automatically categorize every comment by sentiment",
            "Generate engagement-multiplier replies",
            "Spark deeper discussion",
            "Post directly to YouTube in one click",
          ]}
          footerText="Your replies shouldn’t end conversations. They should help you grow"
          videoSrc="/features_videos/feature2.mp4"
          reversed
        />

        {/* Feature 3: Content Idea Suggestion */}
        <FeatureSection
          badge="🎥"
          title="Content Idea Suggestion"
          subtitle="Stop Guessing Your Next Video"
          description="Then generate high-probability content ideas backed by real engagement data."
          extraText="We analyze:"
          points={[
            "Your recent video performance",
            "Engagement patterns",
            "Comment themes",
            "Audience intent signals",
          ]}
          footerText="Not trends. Not guesses. Strategic content decisions."
          videoSrc="/features_videos/feature3.mp4"
        />
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className={styles.howItWorksSection}>
        <div className={styles.howHeadingWrapper}>
          <h2 className={styles.howTitle}>How it Works</h2>
          <p className={styles.howSub}>Simple. Secure. Strategic.</p>
        </div>

        <div className={styles.stepsGrid}>
          {[
            {
              n: "1",
              t: "Connect Your Channel",
              d: "Securely connect your YouTube account using OAuth.",
              e: "No passwords. No risk. Full control."
            },
            {
              n: "2",
              t: "Analyze a Video",
              d: "We scan your video comments and performance data to uncover sentiment shifts and patterns."
            },
            {
              n: "3",
              t: "Generate Strategic Outputs",
              d: "Get AI-powered sentiment reports, replies, and content ideas — all backed by audience signals."
            },
            {
              n: "4",
              t: "Execute in One Click",
              d: "Post optimized replies directly to YouTube and implement ideas with clarity and confidence."
            }
          ].map((s, idx) => (
            <div key={idx} className={styles.stepCard}>
              <div className={styles.stepNumber}>{s.n}</div>
              <h3 className={styles.stepTitle}>{s.t}</h3>
              <p className={styles.stepDesc}>{s.d}</p>
              {s.e && <p className={styles.stepExtra}>{s.e}</p>}
            </div>
          ))}
        </div>

        <div className={styles.howCTA}>
          <a href="/connect-channel" className={styles.primaryButton}>
            Get started free
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </div>
      </section>

      {/* Summary Highlight Section */}
      <section className={styles.summarySection}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryBadge}>Final Verdict</div>
          <h2 className={styles.summaryHeading}>Built for Serious Creators</h2>

          <div className={styles.summaryPoints}>
            {[
              "OAuth-secured YouTube integration",
              "Individual level comment sentiments",
              "Direct reply posting",
              "Content suggestion & script generation",
              "Scalable for growth-focused channels"
            ].map((p, i) => (
              <div key={i} className={styles.summaryPoint}>
                <span className={styles.summaryCheck}>✔</span>
                <span>{p}</span>
              </div>
            ))}
          </div>

          <div className={styles.summaryFooter}>
            <p className={styles.footerAccent}>This isn’t a hobby tool.</p>
            <p className={styles.footerMain}>It’s a creator growth system.</p>
          </div>
        </div>
      </section>

      {/* Visual Separator */}
      <div className={styles.sectionDivider} />

      {/* FAQ Section */}
      <section id="faq" className={styles.faqSection}>
        <div className={styles.faqHeadingWrapper}>
          <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
        </div>

        <div className={styles.faqList}>
          <FAQAccordion
            question="Who is Sentitube built for?"
            answer="Growth-focused creators who want to treat their channel like a business, not a hobby."
          />
          <FAQAccordion
            question="How accurate is the sentiment analysis?"
            answer="Sentitube analyzes patterns across multiple comments to identify emotional trends, recurring concerns, and engagement signals — not just isolated opinions."
          />
          <FAQAccordion
            question="Is my YouTube account safe?"
            answer="Sentitube uses official Google OAuth authentication. We never store your password and you can revoke access anytime from your Google account."
          />
          <FAQAccordion
            question="Can Sentitube post replies without my permission?"
            answer="No. Replies are only posted when you click “Post.” You stay in full control at all times."
          />
          <FAQAccordion
            question="Can I disconnect my channel anytime?"
            answer="Yes. You can revoke access from your Google account settings instantly."
          />
        </div>
      </section>

      {/* Footer Section */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerGrid}>
            <div className={styles.footerCol}>
              <div className={styles.logo} style={{ marginBottom: '1.5rem', padding: 0 }}>
                Senti<span className={styles.redDot}>Tube</span>.
              </div>
              <p className={styles.footerTagline}>
                Empowering creators with AI-driven sentiment intelligence to build stronger communities.
              </p>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerLabel}>Product</h4>
              <nav className={styles.footerNav}>
                <a href="#features">Features</a>
                <a href="#how-it-works">How it Works</a>
                <a href="#faq">FAQ</a>
                <a href="/connect-channel">Sign In</a>
              </nav>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerLabel}>Legal</h4>
              <nav className={styles.footerNav}>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
                <a href="/cookies">Cookie Policy</a>
              </nav>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerLabel}>Support</h4>
              <nav className={styles.footerNav}>
                <a href="mailto:hello@sentitube.ai">Contact Us</a>
                <a href="/help">Help Center</a>
                <a href="/community">Community</a>
              </nav>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} Sentitube AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Fading light red light from center */}
      <div className={styles.glow} />
    </div>
  );
}
