import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - DineFlow",
  description: "Privacy Policy for DineFlow restaurant management platform.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

      <div className="prose prose-sm max-w-none text-foreground space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            DineFlow Technologies (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use the DineFlow platform (&quot;Service&quot;). By using the Service, you consent to the practices described in this policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">2. Information We Collect</h2>

          <h3 className="text-lg font-medium mt-4 mb-2">2.1 Information You Provide</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li><strong className="text-foreground">Account Information:</strong> Restaurant name, owner name, mobile number, email address, and business address</li>
            <li><strong className="text-foreground">Staff Information:</strong> Staff names, mobile numbers, email addresses, and roles</li>
            <li><strong className="text-foreground">Business Data:</strong> Menu items, prices, orders, table configurations, inventory records, expense records, and customer information</li>
            <li><strong className="text-foreground">Payment Information:</strong> Subscription plan and billing details (processed securely by Razorpay; we do not store credit/debit card numbers)</li>
          </ul>

          <h3 className="text-lg font-medium mt-4 mb-2">2.2 Information Collected Automatically</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li><strong className="text-foreground">Usage Data:</strong> Pages visited, features used, time spent on the platform</li>
            <li><strong className="text-foreground">Device Information:</strong> Browser type, operating system, device type, and screen resolution</li>
            <li><strong className="text-foreground">Log Data:</strong> IP addresses, access timestamps, and error logs for security and debugging purposes</li>
          </ul>

          <h3 className="text-lg font-medium mt-4 mb-2">2.3 Customer Data</h3>
          <p className="text-muted-foreground leading-relaxed">
            When end customers place orders via QR codes, we collect their order details and, if provided, their name and contact number. This data is stored as part of your restaurant&apos;s order records and is accessible only to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>To provide, maintain, and improve the Service</li>
            <li>To process your subscription payments</li>
            <li>To send service-related notifications (e.g., subscription renewal, plan changes)</li>
            <li>To provide customer support</li>
            <li>To monitor and analyze usage patterns to improve user experience</li>
            <li>To detect, prevent, and address security issues and fraud</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-2">
            <strong className="text-foreground">We do not sell, rent, or share your personal information with third parties for marketing purposes.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">4. Data Storage and Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your data is stored securely on cloud infrastructure. We implement industry-standard security measures including:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Encryption of data in transit (TLS/HTTPS)</li>
            <li>Hashed passwords using bcrypt with salt rounds</li>
            <li>Session-based authentication with secure JWT tokens</li>
            <li>Rate limiting to prevent brute-force attacks</li>
            <li>Input validation on all API endpoints</li>
            <li>Multi-tenant data isolation (restaurants cannot access each other&apos;s data)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">5. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use the following third-party services that may process your data:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li><strong className="text-foreground">Razorpay:</strong> Payment processing for subscriptions. Razorpay&apos;s privacy policy applies to payment data they handle.</li>
            <li><strong className="text-foreground">Vercel:</strong> Application hosting and deployment.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-2">
            We only share the minimum data necessary with these providers for them to perform their services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">6. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your data for as long as your account is active. If you cancel your account, we will retain your data for 30 days to allow for reactivation. After 30 days, your data may be permanently deleted. You may request data export at any time before deletion using the built-in export feature.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">7. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li><strong className="text-foreground">Access:</strong> Request a copy of all data we hold about you</li>
            <li><strong className="text-foreground">Correction:</strong> Update or correct inaccurate data through your account settings</li>
            <li><strong className="text-foreground">Deletion:</strong> Request deletion of your account and associated data</li>
            <li><strong className="text-foreground">Export:</strong> Export your restaurant data in standard formats (JSON)</li>
            <li><strong className="text-foreground">Restriction:</strong> Request that we limit processing of your data in certain circumstances</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-2">
            To exercise any of these rights, contact us at privacy@dineflow.in.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">8. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use essential cookies for authentication and session management. These cookies are strictly necessary for the Service to function and cannot be disabled. We do not use tracking cookies or third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">9. Children&apos;s Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service is intended for use by businesses and individuals aged 18 and above. We do not knowingly collect personal information from children under 18. If we become aware that we have collected data from a child, we will take steps to delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">10. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the updated policy on our website. Your continued use of the Service after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">11. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy-related questions or concerns, please contact:
          </p>
          <p className="text-muted-foreground mt-2">
            <strong className="text-foreground">DineFlow Technologies</strong><br />
            Email: privacy@dineflow.in<br />
            Support: support@dineflow.in
          </p>
        </section>
      </div>
    </div>
  );
}
