import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - ServeOne",
  description: "Terms of Service for ServeOne restaurant management platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

      <div className="prose prose-sm max-w-none text-foreground space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using the ServeOne platform (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all users, including restaurant owners, staff members, and end customers who interact with the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            ServeOne is a cloud-based restaurant management platform that provides tools for order management, menu management, table management, QR ordering, kitchen display systems, inventory tracking, billing, reporting, customer management, and related services. The Service is provided on a subscription basis with different pricing tiers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">3. Account Registration</h2>
          <p className="text-muted-foreground leading-relaxed">
            To use the Service, you must register an account by providing accurate and complete information including your restaurant name, mobile number, and a secure passcode. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">4. Subscription Plans and Payment</h2>
          <p className="text-muted-foreground leading-relaxed">
            ServeOne offers multiple subscription plans: Starter (free), Pro, and Enterprise. Paid plans are billed monthly through Razorpay. By subscribing to a paid plan, you authorize us to charge your payment method on a recurring monthly basis. All prices are in Indian Rupees (INR) and are exclusive of applicable taxes (GST).
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            New accounts receive a 14-day free trial of the Pro plan. After the trial period, your account will be downgraded to the Starter plan unless you subscribe to a paid plan. You may upgrade, downgrade, or cancel your subscription at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">5. Acceptable Use</h2>
          <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its systems</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
            <li>Upload or transmit viruses, malware, or other malicious code</li>
            <li>Use the Service to store or transmit content that infringes on intellectual property rights</li>
            <li>Resell, sublicense, or redistribute the Service without prior written consent</li>
            <li>Use automated tools to scrape, crawl, or extract data from the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">6. Data Ownership</h2>
          <p className="text-muted-foreground leading-relaxed">
            You retain full ownership of all data you input into the Service, including menu items, orders, customer records, financial data, and any other business information. ServeOne does not claim ownership over your data. You may export your data at any time using the built-in export functionality.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">7. Service Availability</h2>
          <p className="text-muted-foreground leading-relaxed">
            We strive to maintain 99.9% uptime for the Service. However, the Service may be temporarily unavailable due to scheduled maintenance, updates, or circumstances beyond our control. We will make reasonable efforts to notify you in advance of any planned downtime. We are not liable for any losses resulting from service interruptions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">8. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, ServeOne shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising out of or related to your use of the Service. Our total liability shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">9. Termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            Either party may terminate the agreement at any time. You may cancel your subscription through the billing page. We may terminate or suspend your account if you violate these Terms. Upon termination, your data will be retained for 30 days, after which it may be permanently deleted. You may request data export before termination.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">10. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on our website and, where possible, by sending a notification to your registered mobile number or email. Your continued use of the Service after such changes constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">11. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms shall be resolved through good-faith negotiation or, if necessary, through binding arbitration or the competent courts of the jurisdiction where ServeOne operates.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">12. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about these Terms, please contact us at:
          </p>
          <p className="text-muted-foreground mt-2">
            <strong className="text-foreground">ServeOne</strong><br />
            Email: legal@dineflow.in<br />
            Support: support@dineflow.in
          </p>
        </section>
      </div>
    </div>
  );
}
