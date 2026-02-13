'use client';

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Capture',
      description: 'Take a photo or describe your meal.',
    },
    {
      number: '02',
      title: 'Analyze',
      description: 'AI calculates macros and suggests a dose.',
    },
    {
      number: '03',
      title: 'Inject',
      description: 'Review, adjust if needed, and log.',
    },
  ];

  return (
    <section id="how-it-works" className="relative bg-brand-light overflow-hidden border-t border-brand-dark/5">
      <div className="w-full px-6 lg:px-12 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 reveal">
            <h2 className="font-display font-bold text-display-lg text-brand-dark mb-4">
              How it works
            </h2>
            <p className="text-lg text-brand-gray">
              Three steps to a smarter dose.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="reveal"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="bg-white rounded-2xl p-8 lg:p-10 border border-brand-dark/5 hover-lift">
                  {/* Step number */}
                  <span className="font-mono text-sm text-brand-accent font-medium mb-4 block">
                    {step.number}
                  </span>

                  {/* Title */}
                  <h3 className="font-display font-semibold text-2xl text-brand-dark mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-brand-gray leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
