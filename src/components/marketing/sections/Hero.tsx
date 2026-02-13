'use client';

import Link from 'next/link';

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center bg-brand-light overflow-hidden">
      <div className="w-full px-6 lg:px-12 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center max-w-7xl mx-auto">
          {/* Left: Content */}
          <div className="order-2 lg:order-1">
            {/* Micro label */}
            <p className="font-mono text-xs uppercase tracking-widest text-brand-gray mb-6 opacity-0 animate-fade-in-up">
              AI-Powered Diabetes Care
            </p>

            {/* Headline */}
            <h1 className="font-display font-bold text-display-xl text-brand-dark mb-6 opacity-0 animate-fade-in-up delay-100">
              Insulin dosing,
              <br />
              without the guesswork.
            </h1>

            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-brand-gray max-w-md mb-8 opacity-0 animate-fade-in-up delay-200">
              Snap a meal. Get a personalized bolus. Move on.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 opacity-0 animate-fade-in-up delay-300">
              <Link
                href="/app"
                className="btn-primary"
              >
                Get the app
              </Link>
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-brand-accent hover:underline underline-offset-4 transition-all"
              >
                View demo
              </button>
            </div>
          </div>

          {/* Right: Phone */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end opacity-0 animate-slide-right delay-200">
            <div className="phone-frame w-[260px] sm:w-[300px] lg:w-[320px] xl:w-[340px]">
              <img
                src="/screenshot-home.jpg"
                alt="insulinAI app home screen showing glucose reading and meal logging"
                className="w-full h-auto"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator - subtle */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in-up delay-500">
        <div className="w-6 h-10 border-2 border-brand-dark/20 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-brand-dark/40 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
