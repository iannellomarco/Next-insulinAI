'use client';

import { Mail, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const Closing = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <section id="contact" className="relative bg-brand-dark overflow-hidden">
      <div className="w-full px-6 lg:px-12 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left: Content */}
            <div className="reveal">
              <h2 className="font-display font-bold text-display-lg text-white mb-6">
                Ready to simplify dosing?
              </h2>
              <p className="text-lg text-white/60 mb-8 max-w-md leading-relaxed">
                Join the beta. Get early access and help shape the next version.
              </p>

              {/* Contact info */}
              <div className="flex items-center gap-3 text-white/60">
                <Mail className="w-5 h-5" strokeWidth={1.5} />
                <a
                  href="mailto:support@insulinai.app"
                  className="text-sm hover:text-white transition-colors"
                >
                  support@insulinai.app
                </a>
              </div>
            </div>

            {/* Right: Form */}
            <div className="reveal" style={{ transitionDelay: '100ms' }}>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 lg:p-10">
                {!submitted ? (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-white/80 mb-2"
                        >
                          Email address
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-accent text-white font-medium rounded-lg hover:bg-brand-accent/90 transition-colors"
                      >
                        Request access
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-6 h-6 text-brand-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="font-display font-semibold text-xl text-white mb-2">
                      You&apos;re on the list
                    </h3>
                    <p className="text-white/60">
                      We&apos;ll be in touch soon with early access.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-24 pt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="insulinAI"
                  className="w-8 h-8 rounded-lg"
                />
                <span className="font-display font-semibold text-lg text-white">
                  insulinAI
                </span>
              </div>

              {/* Availability */}
              <p className="text-sm text-white/40">
                Available on iOS and Android.
              </p>

              {/* Copyright */}
              <p className="text-sm text-white/40">
                © 2026 insulinAI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Closing;
