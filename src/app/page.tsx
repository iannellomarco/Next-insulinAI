'use client';

import { useEffect, useRef } from 'react';
import Header from '@/components/marketing/sections/Header';
import Hero from '@/components/marketing/sections/Hero';
import FeaturePhoto from '@/components/marketing/sections/FeaturePhoto';
import FeatureBolus from '@/components/marketing/sections/FeatureBolus';
import FeatureCGM from '@/components/marketing/sections/FeatureCGM';
import FeatureSplit from '@/components/marketing/sections/FeatureSplit';
import FeatureInsights from '@/components/marketing/sections/FeatureInsights';
import HowItWorks from '@/components/marketing/sections/HowItWorks';
import Benefits from '@/components/marketing/sections/Benefits';
import Closing from '@/components/marketing/sections/Closing';

export default function MarketingPage() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intersection Observer for reveal animations
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all reveal elements
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={mainRef} className="relative min-h-screen bg-brand-light marketing-page">
      {/* Noise overlay */}
      <div className="noise-overlay" aria-hidden="true" />
      
      {/* Header */}
      <Header />
      
      {/* Main content */}
      <main className="relative">
        {/* Hero Section */}
        <Hero />
        
        {/* Feature Sections */}
        <FeaturePhoto />
        <FeatureBolus />
        <FeatureCGM />
        <FeatureSplit />
        <FeatureInsights />
        
        {/* How It Works */}
        <HowItWorks />
        
        {/* Benefits */}
        <Benefits />
        
        {/* Closing CTA */}
        <Closing />
      </main>
    </div>
  );
}
