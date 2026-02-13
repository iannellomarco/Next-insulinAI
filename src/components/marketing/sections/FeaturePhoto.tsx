'use client';

const FeaturePhoto = () => {
  return (
    <section id="features" className="relative min-h-screen flex items-center bg-brand-light overflow-hidden border-t border-brand-dark/5">
      <div className="w-full px-6 lg:px-12 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center max-w-7xl mx-auto">
          {/* Left: Content */}
          <div className="reveal-left">
            {/* Micro label */}
            <p className="font-mono text-xs uppercase tracking-widest text-brand-gray mb-6">
              Meal Recognition
            </p>

            {/* Headline */}
            <h2 className="font-display font-bold text-display-lg text-brand-dark mb-6">
              Snap a photo.
              <br />
              Know your carbs.
            </h2>

            {/* Body */}
            <p className="text-lg text-brand-gray max-w-md leading-relaxed">
              Our AI recognizes dishes and portions, then estimates carbs, protein, and fat—in under two seconds.
            </p>
          </div>

          {/* Right: Phone */}
          <div className="flex justify-center lg:justify-end reveal-right">
            <div className="phone-frame w-[260px] sm:w-[300px] lg:w-[320px] xl:w-[340px]">
              <img
                src="/screenshot-dashboard.jpg"
                alt="insulinAI app showing AI photo analysis with macro estimates"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturePhoto;
