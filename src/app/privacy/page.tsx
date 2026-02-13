'use client';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="w-full px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-bold text-display-md text-brand-dark mb-8">
            Privacy Policy
          </h1>
          
          <p className="text-brand-gray mb-8">
            Last updated: February 13, 2026
          </p>

          <div className="space-y-8 text-brand-gray">
            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                1. Introduction
              </h2>
              <p>
                insulinAI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Service").
              </p>
              <p className="mt-4">
                Please read this Privacy Policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                2. Information We Collect
              </h2>
              
              <h3 className="font-medium text-brand-dark mt-4 mb-2">Personal Information</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Email address (via Clerk authentication)</li>
                <li>Name (optional)</li>
                <li>Profile information you choose to provide</li>
              </ul>

              <h3 className="font-medium text-brand-dark mt-4 mb-2">Health Information</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Blood glucose readings (via CGM integration or manual entry)</li>
                <li>Insulin dosing calculations and history</li>
                <li>Meal photos and descriptions</li>
                <li>Carbohydrate estimates and nutritional data</li>
                <li>Medical settings (I:C ratios, ISF, target glucose)</li>
              </ul>

              <h3 className="font-medium text-brand-dark mt-4 mb-2">Device and Usage Information</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Device type and operating system</li>
                <li>App usage statistics</li>
                <li>Crash reports and performance data</li>
                <li>IP address and general location</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide and maintain the Service</li>
                <li>To perform AI-powered meal analysis and insulin calculations</li>
                <li>To sync your data across devices</li>
                <li>To send important notifications (e.g., split bolus reminders)</li>
                <li>To improve our AI algorithms and app functionality</li>
                <li>To process payments and manage subscriptions</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                4. Data Storage and Security
              </h2>
              <p>
                Your data is stored securely using industry-standard encryption. Health data is encrypted both in transit (TLS 1.3) and at rest. We use Supabase for database services and Clerk for authentication, both SOC 2 compliant.
              </p>
              <p className="mt-4">
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                5. Third-Party Services
              </h2>
              <p>We use the following third-party services:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Clerk</strong> - Authentication and user management</li>
                <li><strong>Supabase</strong> - Database and data storage</li>
                <li><strong>RevenueCat</strong> - Subscription management</li>
                <li><strong>Perplexity AI / OpenAI</strong> - Meal analysis (photos are processed but not stored by AI providers)</li>
                <li><strong>Vercel Analytics</strong> - Anonymous usage analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                6. Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at support@insulinai.app
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                7. Data Retention
              </h2>
              <p>
                We retain your data as long as your account is active. Upon account deletion, all personal and health data is permanently removed within 30 days. Some anonymized usage data may be retained for analytics purposes.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                8. Children's Privacy
              </h2>
              <p>
                Our Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you are a parent and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                9. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                10. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> support@insulinai.app
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
