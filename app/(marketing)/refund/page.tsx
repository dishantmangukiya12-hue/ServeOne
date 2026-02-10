import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - DineFlow",
  description: "Refund and Cancellation Policy for DineFlow restaurant management platform.",
};

export default function RefundPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">Refund &amp; Cancellation Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

      <div className="prose prose-sm max-w-none text-foreground space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">1. Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            This Refund &amp; Cancellation Policy outlines the terms for subscription cancellations and refunds on the DineFlow platform. We aim to be fair and transparent in all billing matters.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">2. Free Trial</h2>
          <p className="text-muted-foreground leading-relaxed">
            All new accounts receive a 14-day free trial of the Pro plan. No payment information is required during the trial period. If you do not subscribe to a paid plan before the trial ends, your account will automatically be downgraded to the free Starter plan. No charges are incurred during the trial, and no refund is applicable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">3. Subscription Cancellation</h2>
          <p className="text-muted-foreground leading-relaxed">
            You may cancel your subscription at any time from the Billing page in your dashboard. Upon cancellation:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Your paid plan features will remain active until the end of the current billing period</li>
            <li>No further charges will be made after cancellation</li>
            <li>At the end of the billing period, your account will be downgraded to the Starter plan</li>
            <li>Your data will be retained and accessible on the Starter plan (subject to plan limits)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">4. Refund Eligibility</h2>
          <p className="text-muted-foreground leading-relaxed">
            We offer refunds under the following circumstances:
          </p>

          <h3 className="text-lg font-medium mt-4 mb-2">4.1 Full Refund (within 7 days)</h3>
          <p className="text-muted-foreground leading-relaxed">
            If you are not satisfied with the Service, you may request a full refund within 7 days of your first paid subscription charge. This applies only to the first subscription payment and not to subsequent renewals.
          </p>

          <h3 className="text-lg font-medium mt-4 mb-2">4.2 Prorated Refund</h3>
          <p className="text-muted-foreground leading-relaxed">
            If you experience a significant service disruption (more than 48 hours of continuous downtime) that is within our control, you may be eligible for a prorated refund for the affected period. Contact our support team to request this.
          </p>

          <h3 className="text-lg font-medium mt-4 mb-2">4.3 No Refund</h3>
          <p className="text-muted-foreground leading-relaxed">
            Refunds are generally not provided for:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Subscription renewals beyond the 7-day window</li>
            <li>Partial months of usage after cancellation (you retain access until the period ends)</li>
            <li>Downgrade from a higher plan to a lower plan mid-cycle</li>
            <li>Account termination due to Terms of Service violations</li>
            <li>Change of mind after the 7-day refund window</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">5. How to Request a Refund</h2>
          <p className="text-muted-foreground leading-relaxed">
            To request a refund, please contact our support team with:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Your registered restaurant name and mobile number</li>
            <li>The reason for the refund request</li>
            <li>The date of the transaction</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Send your request to: <strong className="text-foreground">billing@dineflow.in</strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">6. Refund Processing</h2>
          <p className="text-muted-foreground leading-relaxed">
            Approved refunds will be processed within 5-7 business days. The refund will be credited to the original payment method used for the subscription. Razorpay processes the actual refund transaction, and the timeline may vary based on your bank or payment provider.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">7. Plan Changes</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Upgrades:</strong> When you upgrade to a higher plan, you will be charged the new plan rate starting from the next billing cycle. The upgrade takes effect immediately.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            <strong className="text-foreground">Downgrades:</strong> When you downgrade to a lower plan, the change takes effect at the end of the current billing period. You will continue to have access to the higher plan features until then. No refund is provided for the difference.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">8. Failed Payments</h2>
          <p className="text-muted-foreground leading-relaxed">
            If a subscription payment fails, we will retry the charge and notify you. You will have a 7-day grace period to update your payment method. If the payment issue is not resolved within 7 days, your account will be downgraded to the Starter plan. Your data will be retained.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">9. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For billing or refund queries, please contact:
          </p>
          <p className="text-muted-foreground mt-2">
            <strong className="text-foreground">DineFlow Technologies</strong><br />
            Email: billing@dineflow.in<br />
            Support: support@dineflow.in
          </p>
        </section>
      </div>
    </div>
  );
}
