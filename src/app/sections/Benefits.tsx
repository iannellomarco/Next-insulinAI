import { Clock, Target, TrendingUp, Shield, Globe, WifiOff } from 'lucide-react';

const Benefits = () => {
  const benefits = [
    {
      icon: Clock,
      title: 'Save time on carb counting',
      description: 'AI recognizes meals instantly—no more manual searching.',
    },
    {
      icon: Target,
      title: 'Increase dosing accuracy',
      description: 'Personalized calculations based on your unique ratios.',
    },
    {
      icon: TrendingUp,
      title: 'Learn personal glucose patterns',
      description: 'Insights that help you understand your body better.',
    },
    {
      icon: Shield,
      title: 'Privacy-first data handling',
      description: 'Your health data stays secure and encrypted.',
    },
    {
      icon: Globe,
      title: 'Global food coverage',
      description: 'Works with cuisines from around the world.',
    },
    {
      icon: WifiOff,
      title: 'Core features available offline',
      description: 'Calculate doses even without an internet connection.',
    },
  ];

  return (
    <section className="relative bg-brand-light overflow-hidden border-t border-brand-dark/5">
      <div className="w-full px-6 lg:px-12 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-16 reveal">
            <h2 className="font-display font-bold text-display-lg text-brand-dark mb-4">
              Why insulinAI?
            </h2>
            <p className="text-lg text-brand-gray max-w-xl">
              Built for people who manage insulin every day.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="reveal"
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-dark/5 flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-brand-dark" strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="font-display font-semibold text-lg text-brand-dark mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-brand-gray leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
