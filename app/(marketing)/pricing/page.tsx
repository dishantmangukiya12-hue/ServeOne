"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Check,
  X,
  Zap,
  Crown,
  Building2,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { PLANS, type Plan, type PlanId, FEATURE_LABELS, type FeatureKey, FREE_TRIAL_DAYS } from "@/lib/plans";

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const planIcons: Record<PlanId, React.ReactNode> = {
  starter: <Zap className="h-7 w-7" />,
  pro: <Crown className="h-7 w-7" />,
  enterprise: <Building2 className="h-7 w-7" />,
};

const allBooleanFeatures: FeatureKey[] = [
  "qrOrdering",
  "kds",
  "reports",
  "inventory",
  "loyalty",
  "reservations",
  "expenses",
  "customReceipts",
  "multiLocation",
  "apiAccess",
  "prioritySupport",
];

const faqs = [
  {
    q: "Is there really a free plan?",
    a: "Yes! The Starter plan is free forever with 5 tables, 50 menu items, and 2 staff. No credit card required. No trial expiration.",
  },
  {
    q: "What happens after my 14-day trial ends?",
    a: "If you don't subscribe, your account automatically downgrades to the free Starter plan. Your data is preserved — you just lose access to Pro features until you upgrade.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Absolutely. Upgrade takes effect immediately. When downgrading, you keep your current plan until the billing period ends. No partial refunds for downgrades.",
  },
  {
    q: "How does payment work?",
    a: "We use secure recurring billing via trusted payment providers. You'll receive invoices via email. Cancel anytime from the billing page.",
  },
  {
    q: "Is my data safe?",
    a: "Your data is encrypted, passwords are hashed with bcrypt, and each restaurant's data is completely isolated. We never share or sell your data.",
  },
  {
    q: "Do I need any special hardware?",
    a: "No. ServeOne works on any device with a browser — phones, tablets, laptops. For printing, you can use any thermal printer (58mm or 80mm) or a regular A4 printer.",
  },
];

export default function PricingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="py-20 md:py-28 text-center relative">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[100px]"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Pricing</p>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Start free. Upgrade when your restaurant grows. Every plan includes a {FREE_TRIAL_DAYS}-day Pro trial.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {(Object.values(PLANS) as Plan[]).map((plan, i) => (
              <AnimatedSection key={plan.id} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className={`p-8 rounded-2xl border bg-card relative h-full flex flex-col ${
                    plan.popular ? "ring-2 ring-primary shadow-xl shadow-primary/10" : ""
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-semibold rounded-full shadow-lg">
                      Most Popular
                    </span>
                  )}

                  <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                      {planIcons[plan.id]}
                    </div>
                    <h2 className="text-2xl font-bold">{plan.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-5xl font-bold">{plan.price === 0 ? "Free" : `₹${plan.price}`}</span>
                      {plan.price > 0 && <span className="text-muted-foreground text-lg">/month</span>}
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="space-y-3 mb-6 p-4 bg-muted/50 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tables</span>
                      <span className="font-semibold">{plan.features.maxTables}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Menu Items</span>
                      <span className="font-semibold">{plan.features.maxMenuItems}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Staff Members</span>
                      <span className="font-semibold">{plan.features.maxUsers}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 flex-1 mb-8">
                    {allBooleanFeatures.map((f) => (
                      <div key={f} className="flex items-center gap-3 text-sm">
                        {plan.features[f] ? (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                        )}
                        <span className={plan.features[f] ? "text-foreground" : "text-muted-foreground/50"}>
                          {FEATURE_LABELS[f]}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    href="/register"
                    className={`block w-full text-center py-3.5 rounded-xl font-semibold transition-all ${
                      plan.popular
                        ? "bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {plan.price === 0 ? "Get Started Free" : `Start ${FREE_TRIAL_DAYS}-Day Free Trial`}
                  </Link>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-muted/20">
        <div className="max-w-4xl mx-auto px-6">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Full feature comparison</h2>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="bg-card rounded-2xl border overflow-hidden">
              <div className="grid grid-cols-4 gap-0 border-b bg-muted/50 p-4 text-sm font-semibold">
                <div>Feature</div>
                <div className="text-center">Starter</div>
                <div className="text-center text-primary">Pro</div>
                <div className="text-center">Enterprise</div>
              </div>

              {/* Limits */}
              {[
                { label: "Tables", key: "maxTables" as const },
                { label: "Menu Items", key: "maxMenuItems" as const },
                { label: "Staff Members", key: "maxUsers" as const },
              ].map((row) => (
                <div key={row.key} className="grid grid-cols-4 gap-0 border-b p-4 text-sm">
                  <div className="text-muted-foreground">{row.label}</div>
                  {(["starter", "pro", "enterprise"] as PlanId[]).map((planId) => (
                    <div key={planId} className="text-center font-medium">
                      {PLANS[planId].features[row.key]}
                    </div>
                  ))}
                </div>
              ))}

              {/* Boolean features */}
              {allBooleanFeatures.map((f) => (
                <div key={f} className="grid grid-cols-4 gap-0 border-b last:border-b-0 p-4 text-sm">
                  <div className="text-muted-foreground">{FEATURE_LABELS[f]}</div>
                  {(["starter", "pro", "enterprise"] as PlanId[]).map((planId) => (
                    <div key={planId} className="text-center">
                      {PLANS[planId].features[f] ? (
                        <Check className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection className="text-center mb-12">
            <HelpCircle className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-foreground">Frequently asked questions</h2>
          </AnimatedSection>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <AnimatedSection key={i} delay={i * 0.08}>
                <div className="p-6 rounded-2xl border bg-card">
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Start your free trial today</h2>
            <p className="mt-3 text-emerald-100/80">
              {FREE_TRIAL_DAYS} days of Pro features. No credit card required.
            </p>
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 mt-8 px-8 py-4 bg-white text-emerald-700 font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
