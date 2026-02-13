import { useState, useEffect } from 'react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-brand-light/90 backdrop-blur-md border-b border-brand-dark/5'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-3 opacity-0 animate-fade-in-up"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <img
              src="/logo.png"
              alt="insulinAI"
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-display font-semibold text-lg tracking-tight text-brand-dark">
              insulinAI
            </span>
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8 opacity-0 animate-fade-in-up delay-200">
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm font-medium text-brand-gray hover:text-brand-dark transition-colors"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-medium text-brand-gray hover:text-brand-dark transition-colors"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-sm font-medium text-brand-gray hover:text-brand-dark transition-colors"
            >
              Support
            </button>
          </nav>

          {/* CTA Button */}
          <div className="opacity-0 animate-fade-in-up delay-300">
            <button
              onClick={() => scrollToSection('contact')}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 bg-brand-dark text-white text-sm font-medium rounded-lg hover:bg-brand-dark/90 transition-colors"
            >
              Get the app
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
