'use client';

import { Camera, Zap, History, BarChart3, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { SignInButton } from '@clerk/nextjs';

export default function LandingPage() {
    return (
        <div className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <div className="landing-logo">
                    <div className="logo-icon">
                        <Sparkles size={20} />
                    </div>
                    <span>InsulinAI</span>
                </div>
                <div className="header-actions">
                    <SignInButton mode="modal">
                        <button className="btn-ghost">Log in</button>
                    </SignInButton>
                    <Link href="/app">
                        <button className="btn-primary-sm">Get Started</button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-badge">
                    <Sparkles size={14} />
                    <span>AI-Powered Insulin Calculator</span>
                </div>
                <h1 className="hero-title">
                    Calculate insulin doses
                    <br />
                    <span className="text-gradient">in seconds</span>
                </h1>
                <p className="hero-subtitle">
                    Snap a photo of your meal and let AI analyze the carbs. 
                    Get instant insulin recommendations tailored to your settings.
                </p>
                <div className="hero-cta">
                    <Link href="/app">
                        <button className="btn-primary">
                            Try It Free
                            <ArrowRight size={18} />
                        </button>
                    </Link>
                    <SignInButton mode="modal">
                        <button className="btn-secondary">Sign In</button>
                    </SignInButton>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features">
                <h2 className="section-title">Everything you need</h2>
                <p className="section-subtitle">Simple tools to help manage your daily insulin calculations.</p>
                
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Camera size={24} />
                        </div>
                        <h3>Snap & Analyze</h3>
                        <p>Take a photo of any meal. Our AI identifies foods and calculates carbs automatically.</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Instant Results</h3>
                        <p>Get insulin recommendations in seconds based on your personal carb ratio.</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon">
                            <History size={24} />
                        </div>
                        <h3>Meal History</h3>
                        <p>Track all your meals and doses. Log post-meal glucose to spot patterns.</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon">
                            <BarChart3 size={24} />
                        </div>
                        <h3>Insights</h3>
                        <p>View trends and analytics to better understand your glucose response.</p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <h2 className="section-title">How it works</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Scan your food</h3>
                        <p>Take a photo or type what you're eating</p>
                    </div>
                    <div className="step-connector" />
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Review analysis</h3>
                        <p>AI calculates carbs and suggests insulin</p>
                    </div>
                    <div className="step-connector" />
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Save & track</h3>
                        <p>Log meals and monitor your progress</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <h2>Ready to simplify your insulin calculations?</h2>
                <p>Start using InsulinAI today. No credit card required.</p>
                <Link href="/app">
                    <button className="btn-primary btn-lg">
                        Get Started Free
                        <ArrowRight size={20} />
                    </button>
                </Link>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-brand">
                    <div className="logo-icon small">
                        <Sparkles size={16} />
                    </div>
                    <span>InsulinAI</span>
                </div>
                <p className="footer-disclaimer">
                    For informational purposes only. Always consult your healthcare provider.
                </p>
            </footer>

            <style jsx>{`
                .landing-page {
                    min-height: 100vh;
                    background: var(--background);
                    color: var(--foreground);
                }

                /* Header */
                .landing-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .landing-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--primary);
                }

                .logo-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, var(--primary) 0%, #2dd4bf 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .logo-icon.small {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .btn-ghost {
                    background: transparent;
                    border: none;
                    color: var(--muted-foreground);
                    font-size: 0.875rem;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    cursor: pointer;
                    transition: color 0.2s;
                }

                .btn-ghost:hover {
                    color: var(--foreground);
                }

                .btn-primary-sm {
                    background: var(--primary);
                    border: none;
                    color: white;
                    font-size: 0.875rem;
                    font-weight: 600;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: filter 0.2s;
                }

                .btn-primary-sm:hover {
                    filter: brightness(1.1);
                }

                /* Hero */
                .hero {
                    text-align: center;
                    padding: 4rem 1.5rem 5rem;
                    max-width: 800px;
                    margin: 0 auto;
                }

                .hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: var(--secondary);
                    border: 1px solid var(--border);
                    padding: 0.5rem 1rem;
                    border-radius: 100px;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: var(--primary);
                    margin-bottom: 1.5rem;
                }

                .hero-title {
                    font-size: clamp(2.5rem, 8vw, 4rem);
                    font-weight: 700;
                    line-height: 1.1;
                    letter-spacing: -0.02em;
                    margin-bottom: 1.5rem;
                }

                .text-gradient {
                    background: linear-gradient(135deg, var(--primary) 0%, #2dd4bf 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .hero-subtitle {
                    font-size: 1.125rem;
                    color: var(--muted-foreground);
                    line-height: 1.6;
                    max-width: 560px;
                    margin: 0 auto 2rem;
                }

                .hero-cta {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: var(--primary);
                    border: none;
                    color: white;
                    font-size: 1rem;
                    font-weight: 600;
                    padding: 0.875rem 1.5rem;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: filter 0.2s, transform 0.2s;
                }

                .btn-primary:hover {
                    filter: brightness(1.1);
                    transform: translateY(-1px);
                }

                .btn-primary.btn-lg {
                    padding: 1rem 2rem;
                    font-size: 1.0625rem;
                }

                .btn-secondary {
                    background: var(--secondary);
                    border: 1px solid var(--border);
                    color: var(--foreground);
                    font-size: 1rem;
                    font-weight: 600;
                    padding: 0.875rem 1.5rem;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .btn-secondary:hover {
                    background: var(--accent);
                }

                /* Features */
                .features {
                    padding: 4rem 1.5rem;
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .section-title {
                    text-align: center;
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                }

                .section-subtitle {
                    text-align: center;
                    color: var(--muted-foreground);
                    margin-bottom: 3rem;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 1.5rem;
                }

                .feature-card {
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 1.5rem;
                    transition: border-color 0.2s;
                }

                .feature-card:hover {
                    border-color: var(--primary);
                }

                .feature-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: var(--secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                    margin-bottom: 1rem;
                }

                .feature-card h3 {
                    font-size: 1.0625rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }

                .feature-card p {
                    font-size: 0.875rem;
                    color: var(--muted-foreground);
                    line-height: 1.5;
                }

                /* How It Works */
                .how-it-works {
                    padding: 4rem 1.5rem;
                    max-width: 900px;
                    margin: 0 auto;
                }

                .steps {
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    gap: 0;
                    flex-wrap: wrap;
                }

                .step {
                    flex: 1;
                    min-width: 180px;
                    text-align: center;
                    padding: 1rem;
                }

                .step-number {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--primary);
                    color: white;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                }

                .step h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    margin-bottom: 0.375rem;
                }

                .step p {
                    font-size: 0.875rem;
                    color: var(--muted-foreground);
                }

                .step-connector {
                    width: 40px;
                    height: 2px;
                    background: var(--border);
                    margin-top: 30px;
                    flex-shrink: 0;
                }

                @media (max-width: 640px) {
                    .step-connector {
                        display: none;
                    }
                    .steps {
                        flex-direction: column;
                        gap: 1rem;
                    }
                }

                /* CTA Section */
                .cta-section {
                    text-align: center;
                    padding: 4rem 1.5rem;
                    background: var(--secondary);
                    margin: 2rem 0 0;
                }

                .cta-section h2 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                }

                .cta-section p {
                    color: var(--muted-foreground);
                    margin-bottom: 1.5rem;
                }

                /* Footer */
                .landing-footer {
                    text-align: center;
                    padding: 2rem 1.5rem;
                    border-top: 1px solid var(--border);
                }

                .footer-brand {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    color: var(--primary);
                    margin-bottom: 0.75rem;
                }

                .footer-disclaimer {
                    font-size: 0.75rem;
                    color: var(--muted-foreground);
                }
            `}</style>
        </div>
    );
}
