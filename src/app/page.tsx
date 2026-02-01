'use client';

import { Camera, Zap, TrendingUp, Shield, ArrowRight, Sparkles, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { SignInButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

const STATS = [
    { value: '10K+', label: 'Meals analyzed' },
    { value: '98%', label: 'Accuracy rate' },
    { value: '<2s', label: 'Analysis time' },
    { value: '4.9', label: 'User rating' },
];

const FEATURES = [
    {
        icon: Camera,
        title: 'Photo Recognition',
        description: 'Point your camera at any meal. Our AI identifies individual foods and portions with remarkable accuracy.',
    },
    {
        icon: Zap,
        title: 'Instant Calculations',
        description: 'Get carb counts and insulin suggestions in under 2 seconds. No more manual lookups or guesswork.',
    },
    {
        icon: TrendingUp,
        title: 'Smart Insights',
        description: 'Track patterns over time. Understand how different foods affect your glucose response.',
    },
    {
        icon: Shield,
        title: 'Privacy First',
        description: 'Your health data stays on your device. We never share or sell your personal information.',
    },
];

const STEPS = [
    {
        number: '01',
        title: 'Snap a photo',
        description: 'Take a picture of your meal or type what you\'re eating',
    },
    {
        number: '02',
        title: 'Get instant analysis',
        description: 'AI identifies foods, calculates carbs, and suggests insulin',
    },
    {
        number: '03',
        title: 'Track & improve',
        description: 'Log your meals and monitor trends over time',
    },
];

export default function LandingPage() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="landing-page">
            {/* Gradient Background */}
            <div className="gradient-bg" />
            
            {/* Header */}
            <header className={`landing-header ${isScrolled ? 'scrolled' : ''}`}>
                <div className="header-inner">
                    <Link href="/" className="landing-logo">
                        <div className="logo-icon">
                            <Sparkles size={18} />
                        </div>
                        <span>InsulinAI</span>
                    </Link>
                    <nav className="header-nav">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How it works</a>
                    </nav>
                    <div className="header-actions">
                        <SignInButton mode="modal">
                            <button className="btn-ghost">Log in</button>
                        </SignInButton>
                        <Link href="/app">
                            <button className="btn-primary-sm">
                                Get Started
                                <ArrowRight size={16} />
                            </button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-dot" />
                        <span>AI-Powered Insulin Calculator</span>
                        <ChevronRight size={14} />
                    </div>
                    
                    <h1 className="hero-title">
                        Calculate insulin
                        <br />
                        <span className="text-gradient">in seconds, not minutes</span>
                    </h1>
                    
                    <p className="hero-subtitle">
                        Snap a photo of your meal. Get instant carb counts and personalized 
                        insulin recommendations powered by advanced AI.
                    </p>
                    
                    <div className="hero-cta">
                        <Link href="/app">
                            <button className="btn-primary">
                                Start Free
                                <ArrowRight size={18} />
                            </button>
                        </Link>
                        <a href="#how-it-works" className="btn-secondary">
                            See how it works
                        </a>
                    </div>

                    <div className="hero-proof">
                        <div className="avatars">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="avatar" style={{ '--i': i } as React.CSSProperties}>
                                    <div className="avatar-placeholder" />
                                </div>
                            ))}
                        </div>
                        <div className="proof-text">
                            <div className="stars">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                ))}
                            </div>
                            <span>Loved by thousands of users</span>
                        </div>
                    </div>
                </div>

                {/* App Preview */}
                <div className="hero-visual">
                    <div className="phone-mockup">
                        <div className="phone-screen">
                            <div className="screen-header">
                                <div className="screen-logo">
                                    <Sparkles size={14} />
                                    <span>InsulinAI</span>
                                </div>
                            </div>
                            <div className="screen-content">
                                <div className="mock-card">
                                    <div className="mock-icon">
                                        <Camera size={24} />
                                    </div>
                                    <span>Tap to scan food</span>
                                </div>
                                <div className="mock-result">
                                    <div className="result-header">
                                        <span className="food-emoji">🍝</span>
                                        <span>Pasta Carbonara</span>
                                    </div>
                                    <div className="result-stats">
                                        <div className="stat">
                                            <span className="stat-value">72g</span>
                                            <span className="stat-label">carbs</span>
                                        </div>
                                        <div className="stat highlight">
                                            <span className="stat-value">7.2u</span>
                                            <span className="stat-label">insulin</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="phone-glow" />
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="stats-bar">
                <div className="stats-inner">
                    {STATS.map((stat, i) => (
                        <div key={i} className="stat-item">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features">
                <div className="section-header">
                    <span className="section-badge">Features</span>
                    <h2 className="section-title">Everything you need</h2>
                    <p className="section-subtitle">
                        Powerful tools designed to simplify your daily insulin management.
                    </p>
                </div>
                
                <div className="features-grid">
                    {FEATURES.map((feature, i) => (
                        <div key={i} className="feature-card">
                            <div className="feature-icon">
                                <feature.icon size={22} />
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="how-it-works">
                <div className="section-header">
                    <span className="section-badge">How it works</span>
                    <h2 className="section-title">Three simple steps</h2>
                    <p className="section-subtitle">
                        From photo to insulin recommendation in seconds.
                    </p>
                </div>

                <div className="steps-container">
                    {STEPS.map((step, i) => (
                        <div key={i} className="step-card">
                            <span className="step-number">{step.number}</span>
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>
                            {i < STEPS.length - 1 && (
                                <div className="step-connector">
                                    <ArrowRight size={20} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Benefits */}
            <section className="benefits">
                <div className="benefits-content">
                    <span className="section-badge">Why InsulinAI</span>
                    <h2 className="section-title">Built for real life</h2>
                    <ul className="benefits-list">
                        <li>
                            <Check size={18} />
                            <span>Works offline - no internet required for basic features</span>
                        </li>
                        <li>
                            <Check size={18} />
                            <span>Supports multiple insulin ratios for different times of day</span>
                        </li>
                        <li>
                            <Check size={18} />
                            <span>Chain multiple foods together for complex meals</span>
                        </li>
                        <li>
                            <Check size={18} />
                            <span>Track post-meal glucose to improve future predictions</span>
                        </li>
                        <li>
                            <Check size={18} />
                            <span>Export your data anytime - you own your information</span>
                        </li>
                    </ul>
                    <Link href="/app">
                        <button className="btn-primary">
                            Try it now
                            <ArrowRight size={18} />
                        </button>
                    </Link>
                </div>
                <div className="benefits-visual">
                    <div className="benefit-card-stack">
                        <div className="benefit-card b1">
                            <div className="bc-icon green">
                                <Check size={16} />
                            </div>
                            <span>Meal saved successfully</span>
                        </div>
                        <div className="benefit-card b2">
                            <div className="bc-icon teal">
                                <TrendingUp size={16} />
                            </div>
                            <span>Average glucose improved 12%</span>
                        </div>
                        <div className="benefit-card b3">
                            <div className="bc-icon purple">
                                <Zap size={16} />
                            </div>
                            <span>Analysis complete in 1.2s</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-glow" />
                <div className="cta-content">
                    <h2>Ready to simplify your routine?</h2>
                    <p>Join thousands who manage their insulin with confidence.</p>
                    <div className="cta-buttons">
                        <Link href="/app">
                            <button className="btn-primary btn-lg">
                                Get Started Free
                                <ArrowRight size={20} />
                            </button>
                        </Link>
                    </div>
                    <span className="cta-note">No credit card required</span>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <div className="logo-icon small">
                            <Sparkles size={14} />
                        </div>
                        <span>InsulinAI</span>
                    </div>
                    <p className="footer-disclaimer">
                        For informational purposes only. Always consult your healthcare provider for medical advice.
                    </p>
                    <div className="footer-links">
                        <a href="#">Privacy</a>
                        <a href="#">Terms</a>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                .landing-page {
                    min-height: 100vh;
                    background: #0a0a0b;
                    color: #fafafa;
                    overflow-x: hidden;
                    position: relative;
                }

                .gradient-bg {
                    position: fixed;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100%;
                    max-width: 1200px;
                    height: 600px;
                    background: radial-gradient(ellipse at center top, rgba(20, 184, 166, 0.15) 0%, transparent 60%);
                    pointer-events: none;
                    z-index: 0;
                }

                /* Header */
                .landing-header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 100;
                    padding: 1rem 1.5rem;
                    transition: all 0.3s ease;
                }

                .landing-header.scrolled {
                    background: rgba(10, 10, 11, 0.8);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }

                .header-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .landing-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #fafafa;
                    text-decoration: none;
                }

                .logo-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .logo-icon.small {
                    width: 26px;
                    height: 26px;
                    border-radius: 6px;
                }

                .header-nav {
                    display: flex;
                    gap: 2rem;
                }

                .header-nav a {
                    color: #a1a1aa;
                    font-size: 0.875rem;
                    font-weight: 500;
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .header-nav a:hover {
                    color: #fafafa;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .btn-ghost {
                    background: transparent;
                    border: none;
                    color: #a1a1aa;
                    font-size: 0.875rem;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    cursor: pointer;
                    transition: color 0.2s;
                }

                .btn-ghost:hover {
                    color: #fafafa;
                }

                .btn-primary-sm {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    background: #fafafa;
                    border: none;
                    color: #0a0a0b;
                    font-size: 0.875rem;
                    font-weight: 600;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-primary-sm:hover {
                    background: #e4e4e7;
                    transform: translateY(-1px);
                }

                @media (max-width: 768px) {
                    .header-nav {
                        display: none;
                    }
                }

                /* Hero */
                .hero {
                    position: relative;
                    z-index: 1;
                    min-height: 100vh;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    align-items: center;
                    gap: 4rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 8rem 1.5rem 4rem;
                }

                @media (max-width: 968px) {
                    .hero {
                        grid-template-columns: 1fr;
                        text-align: center;
                        padding-top: 7rem;
                        min-height: auto;
                    }
                }

                .hero-content {
                    max-width: 560px;
                }

                @media (max-width: 968px) {
                    .hero-content {
                        max-width: 100%;
                        margin: 0 auto;
                    }
                }

                .hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(20, 184, 166, 0.1);
                    border: 1px solid rgba(20, 184, 166, 0.2);
                    padding: 0.375rem 0.875rem;
                    border-radius: 100px;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: #14b8a6;
                    margin-bottom: 1.5rem;
                }

                .badge-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #14b8a6;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .hero-title {
                    font-size: clamp(2.5rem, 5vw, 3.75rem);
                    font-weight: 700;
                    line-height: 1.1;
                    letter-spacing: -0.03em;
                    margin-bottom: 1.5rem;
                }

                .text-gradient {
                    background: linear-gradient(135deg, #14b8a6 0%, #2dd4bf 50%, #5eead4 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .hero-subtitle {
                    font-size: 1.125rem;
                    color: #a1a1aa;
                    line-height: 1.7;
                    margin-bottom: 2rem;
                }

                .hero-cta {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 3rem;
                }

                @media (max-width: 968px) {
                    .hero-cta {
                        justify-content: center;
                        flex-wrap: wrap;
                    }
                }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #fafafa;
                    border: none;
                    color: #0a0a0b;
                    font-size: 0.9375rem;
                    font-weight: 600;
                    padding: 0.875rem 1.5rem;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-primary:hover {
                    background: #e4e4e7;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
                }

                .btn-primary.btn-lg {
                    padding: 1rem 2rem;
                    font-size: 1rem;
                    border-radius: 12px;
                }

                .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: transparent;
                    border: 1px solid #27272a;
                    color: #fafafa;
                    font-size: 0.9375rem;
                    font-weight: 600;
                    padding: 0.875rem 1.5rem;
                    border-radius: 10px;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .btn-secondary:hover {
                    background: #18181b;
                    border-color: #3f3f46;
                }

                .hero-proof {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                @media (max-width: 968px) {
                    .hero-proof {
                        justify-content: center;
                    }
                }

                .avatars {
                    display: flex;
                }

                .avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 2px solid #0a0a0b;
                    margin-left: calc(var(--i, 1) * -8px);
                    overflow: hidden;
                }

                .avatar:first-child {
                    margin-left: 0;
                }

                .avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #3f3f46 0%, #52525b 100%);
                }

                .proof-text {
                    display: flex;
                    flex-direction: column;
                    gap: 0.125rem;
                }

                .stars {
                    display: flex;
                    gap: 2px;
                    color: #fbbf24;
                }

                .proof-text span {
                    font-size: 0.8125rem;
                    color: #71717a;
                }

                /* Hero Visual */
                .hero-visual {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                @media (max-width: 968px) {
                    .hero-visual {
                        display: none;
                    }
                }

                .phone-mockup {
                    position: relative;
                    width: 280px;
                    height: 560px;
                    background: linear-gradient(135deg, #18181b 0%, #0a0a0b 100%);
                    border-radius: 40px;
                    padding: 12px;
                    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), 
                                0 25px 50px -12px rgba(0, 0, 0, 0.5),
                                inset 0 1px 0 rgba(255, 255, 255, 0.05);
                }

                .phone-screen {
                    width: 100%;
                    height: 100%;
                    background: #0a0a0b;
                    border-radius: 30px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .screen-header {
                    padding: 1.25rem;
                    border-bottom: 1px solid #27272a;
                }

                .screen-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #14b8a6;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .screen-content {
                    flex: 1;
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .mock-card {
                    background: #18181b;
                    border: 1px dashed #3f3f46;
                    border-radius: 16px;
                    padding: 2rem 1rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    color: #71717a;
                }

                .mock-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: #27272a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #14b8a6;
                }

                .mock-result {
                    background: #18181b;
                    border: 1px solid #27272a;
                    border-radius: 16px;
                    padding: 1rem;
                }

                .result-header {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    margin-bottom: 1rem;
                    font-weight: 500;
                }

                .food-emoji {
                    font-size: 1.5rem;
                }

                .result-stats {
                    display: flex;
                    gap: 0.75rem;
                }

                .result-stats .stat {
                    flex: 1;
                    background: #27272a;
                    border-radius: 10px;
                    padding: 0.75rem;
                    text-align: center;
                }

                .result-stats .stat.highlight {
                    background: rgba(20, 184, 166, 0.15);
                    border: 1px solid rgba(20, 184, 166, 0.3);
                }

                .result-stats .stat-value {
                    display: block;
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #fafafa;
                }

                .result-stats .stat.highlight .stat-value {
                    color: #14b8a6;
                }

                .result-stats .stat-label {
                    font-size: 0.75rem;
                    color: #71717a;
                }

                .phone-glow {
                    position: absolute;
                    inset: -40px;
                    background: radial-gradient(circle at center, rgba(20, 184, 166, 0.2) 0%, transparent 70%);
                    pointer-events: none;
                    z-index: -1;
                }

                /* Stats Bar */
                .stats-bar {
                    position: relative;
                    z-index: 1;
                    border-top: 1px solid #27272a;
                    border-bottom: 1px solid #27272a;
                    background: rgba(24, 24, 27, 0.5);
                    backdrop-filter: blur(8px);
                }

                .stats-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    padding: 2rem 1.5rem;
                }

                @media (max-width: 640px) {
                    .stats-inner {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1.5rem;
                    }
                }

                .stat-item {
                    text-align: center;
                }

                .stat-item .stat-value {
                    display: block;
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #fafafa;
                    margin-bottom: 0.25rem;
                }

                .stat-item .stat-label {
                    font-size: 0.8125rem;
                    color: #71717a;
                }

                /* Section Styles */
                .section-header {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .section-badge {
                    display: inline-block;
                    background: rgba(20, 184, 166, 0.1);
                    border: 1px solid rgba(20, 184, 166, 0.2);
                    padding: 0.375rem 0.875rem;
                    border-radius: 100px;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: #14b8a6;
                    margin-bottom: 1rem;
                }

                .section-title {
                    font-size: clamp(1.75rem, 4vw, 2.5rem);
                    font-weight: 700;
                    letter-spacing: -0.02em;
                    margin-bottom: 0.75rem;
                }

                .section-subtitle {
                    color: #71717a;
                    font-size: 1.0625rem;
                    max-width: 500px;
                    margin: 0 auto;
                }

                /* Features */
                .features {
                    position: relative;
                    z-index: 1;
                    padding: 5rem 1.5rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 1.5rem;
                }

                .feature-card {
                    background: #18181b;
                    border: 1px solid #27272a;
                    border-radius: 16px;
                    padding: 1.75rem;
                    transition: all 0.3s ease;
                }

                .feature-card:hover {
                    border-color: #3f3f46;
                    transform: translateY(-4px);
                }

                .feature-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: rgba(20, 184, 166, 0.1);
                    border: 1px solid rgba(20, 184, 166, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #14b8a6;
                    margin-bottom: 1.25rem;
                }

                .feature-card h3 {
                    font-size: 1.0625rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }

                .feature-card p {
                    font-size: 0.9375rem;
                    color: #71717a;
                    line-height: 1.6;
                }

                /* How It Works */
                .how-it-works {
                    position: relative;
                    z-index: 1;
                    padding: 5rem 1.5rem;
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .steps-container {
                    display: flex;
                    justify-content: center;
                    gap: 0;
                }

                @media (max-width: 768px) {
                    .steps-container {
                        flex-direction: column;
                        gap: 2rem;
                    }
                }

                .step-card {
                    position: relative;
                    flex: 1;
                    text-align: center;
                    padding: 2rem 1.5rem;
                }

                .step-number {
                    display: inline-block;
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: #14b8a6;
                    margin-bottom: 1rem;
                }

                .step-card h3 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }

                .step-card p {
                    font-size: 0.9375rem;
                    color: #71717a;
                }

                .step-connector {
                    position: absolute;
                    right: -10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #3f3f46;
                }

                @media (max-width: 768px) {
                    .step-connector {
                        display: none;
                    }
                }

                /* Benefits */
                .benefits {
                    position: relative;
                    z-index: 1;
                    padding: 5rem 1.5rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4rem;
                    align-items: center;
                }

                @media (max-width: 868px) {
                    .benefits {
                        grid-template-columns: 1fr;
                        gap: 3rem;
                    }
                }

                .benefits-content .section-badge {
                    margin-bottom: 0.75rem;
                }

                .benefits-content .section-title {
                    text-align: left;
                    margin-bottom: 1.5rem;
                }

                .benefits-list {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 2rem 0;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .benefits-list li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    color: #a1a1aa;
                    font-size: 0.9375rem;
                    line-height: 1.5;
                }

                .benefits-list li svg {
                    color: #14b8a6;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .benefits-visual {
                    display: flex;
                    justify-content: center;
                }

                .benefit-card-stack {
                    position: relative;
                    width: 320px;
                    height: 200px;
                }

                .benefit-card {
                    position: absolute;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: #18181b;
                    border: 1px solid #27272a;
                    padding: 1rem 1.25rem;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                }

                .benefit-card.b1 {
                    top: 0;
                    left: 0;
                    animation: float1 3s ease-in-out infinite;
                }

                .benefit-card.b2 {
                    top: 50%;
                    left: 20px;
                    transform: translateY(-50%);
                    animation: float2 3s ease-in-out infinite 0.5s;
                }

                .benefit-card.b3 {
                    bottom: 0;
                    right: 0;
                    animation: float3 3s ease-in-out infinite 1s;
                }

                @keyframes float1 {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }

                @keyframes float2 {
                    0%, 100% { transform: translateY(-50%); }
                    50% { transform: translateY(calc(-50% - 8px)); }
                }

                @keyframes float3 {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }

                .bc-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .bc-icon.green {
                    background: rgba(34, 197, 94, 0.15);
                    color: #22c55e;
                }

                .bc-icon.teal {
                    background: rgba(20, 184, 166, 0.15);
                    color: #14b8a6;
                }

                .bc-icon.purple {
                    background: rgba(168, 85, 247, 0.15);
                    color: #a855f7;
                }

                @media (max-width: 868px) {
                    .benefits-visual {
                        display: none;
                    }
                }

                /* CTA Section */
                .cta-section {
                    position: relative;
                    z-index: 1;
                    text-align: center;
                    padding: 6rem 1.5rem;
                    margin-top: 2rem;
                }

                .cta-glow {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 600px;
                    height: 400px;
                    background: radial-gradient(ellipse at center, rgba(20, 184, 166, 0.1) 0%, transparent 70%);
                    pointer-events: none;
                }

                .cta-content {
                    position: relative;
                }

                .cta-section h2 {
                    font-size: clamp(1.75rem, 4vw, 2.25rem);
                    font-weight: 700;
                    margin-bottom: 0.75rem;
                }

                .cta-section p {
                    color: #71717a;
                    margin-bottom: 2rem;
                    font-size: 1.0625rem;
                }

                .cta-buttons {
                    margin-bottom: 1rem;
                }

                .cta-note {
                    font-size: 0.8125rem;
                    color: #52525b;
                }

                /* Footer */
                .landing-footer {
                    border-top: 1px solid #27272a;
                    padding: 2rem 1.5rem;
                }

                .footer-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    text-align: center;
                }

                .footer-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    color: #fafafa;
                }

                .footer-disclaimer {
                    font-size: 0.8125rem;
                    color: #52525b;
                    max-width: 400px;
                }

                .footer-links {
                    display: flex;
                    gap: 1.5rem;
                }

                .footer-links a {
                    font-size: 0.8125rem;
                    color: #71717a;
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .footer-links a:hover {
                    color: #fafafa;
                }
            `}</style>
        </div>
    );
}
