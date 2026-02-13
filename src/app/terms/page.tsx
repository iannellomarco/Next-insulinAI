'use client';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="w-full px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-bold text-display-md text-brand-dark mb-8">
            Terms of Service
          </h1>
          
          <p className="text-brand-gray mb-8">
            Last updated: February 13, 2026
          </p>

          <div className="space-y-8 text-brand-gray">
            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using insulinAI ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                2. Description of Service
              </h2>
              <p>
                insulinAI is a mobile application that uses artificial intelligence to assist with diabetes management, including meal analysis, carbohydrate estimation, and insulin dose calculations. The Service is designed for individuals with Type 1 Diabetes.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                3. Medical Disclaimer
              </h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                <p className="font-medium text-brand-dark">
                  IMPORTANT: insulinAI is an assistive tool only and does not provide medical advice.
                </p>
              </div>
              <ul className="list-disc pl-5 space-y-2">
                <li>The Service is not a substitute for professional medical advice, diagnosis, or treatment.</li>
                <li>Always consult your healthcare provider before making any changes to your diabetes management plan.</li>
                <li>AI-generated insulin recommendations should be verified against your personal experience and medical guidance.</li>
                <li>You are solely responsible for verifying the accuracy of carbohydrate counts and insulin doses.</li>
                <li>Never disregard professional medical advice or delay seeking it because of information provided by the Service.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                4. User Accounts
              </h2>
              <p>
                To use certain features of the Service, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
              <p className="mt-4">
                We reserve the right to terminate accounts that violate these Terms.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                5. Subscriptions and Payments
              </h2>
              <p>
                Some features of the Service require a paid subscription. By subscribing:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>You agree to pay all fees associated with your subscription plan</li>
                <li>Subscriptions automatically renew unless cancelled at least 24 hours before the renewal date</li>
                <li>You may cancel your subscription at any time through your App Store or Google Play account</li>
                <li>No refunds will be provided for partial subscription periods</li>
                <li>We reserve the right to change subscription fees upon notice</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                6. Free Trial
              </h2>
              <p>
                We may offer a free trial period for new subscribers. At the end of the trial period:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Your subscription will automatically convert to a paid subscription unless cancelled</li>
                <li>You will be charged the applicable subscription fee</li>
                <li>You may cancel at any time during the trial to avoid charges</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                7. User Data and Privacy
              </h2>
              <p>
                Your use of the Service is also governed by our <a href="/privacy" className="text-brand-accent hover:underline">Privacy Policy</a>. By using the Service, you consent to the collection and use of your data as described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                8. Acceptable Use
              </h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Share your account credentials with others</li>
                <li>Use the Service to provide medical advice to others</li>
                <li>Reverse engineer or attempt to extract the source code</li>
                <li>Upload malicious content or viruses</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                9. Intellectual Property
              </h2>
              <p>
                The Service and its original content, features, and functionality are owned by insulinAI and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                10. Limitation of Liability
              </h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, INSULINAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Your use or inability to use the Service</li>
                <li>Any inaccurate insulin calculations or health recommendations</li>
                <li>Any unauthorized access to or use of our servers</li>
                <li>Any interruption or cessation of transmission to or from the Service</li>
                <li>Any bugs, viruses, or similar issues transmitted through the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                11. Disclaimer of Warranties
              </h2>
              <p>
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                12. Governing Law
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Italy, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                13. Changes to Terms
              </h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-brand-dark mb-4">
                14. Contact Us
              </h2>
              <p>
                If you have any questions about these Terms, please contact us at:
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

export default TermsOfService;
