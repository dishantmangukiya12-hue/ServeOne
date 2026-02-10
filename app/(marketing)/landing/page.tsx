"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  type MotionValue,
} from "framer-motion";
import {
  ClipboardList,
  QrCode,
  ChefHat,
  BarChart3,
  Package,
  Heart,
  Users,
  CreditCard,
  CalendarDays,
  Receipt,
  Smartphone,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Check,
  Star,
  Crown,
  Building2,
  ChevronUp,
} from "lucide-react";
import { PLANS, type Plan, type PlanId, FEATURE_LABELS, type FeatureKey, FREE_TRIAL_DAYS } from "@/lib/plans";

// --- Reusable animated section wrapper ---
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
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- Floating card for hero ---
function FloatingCard({
  children,
  className = "",
  delay = 0,
  y = 10,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -y, 0] }}
        transition={{ duration: 4 + delay, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// --- Animated counter ---
function Counter({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="text-center">
      <motion.div
        className="text-4xl md:text-5xl font-bold text-foreground"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {isInView ? end : 0}{suffix}
      </motion.div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

// --- Individual shutter slat with 3D rotation ---
const SLAT_COUNT = 22;
const SLAT_COLORS = [
  "#C8C4BC", "#CCC8C0", "#C5C1B9", "#CAC6BE", "#C7C3BB",
  "#CBC7BF", "#C6C2BA", "#C9C5BD", "#C4C0B8", "#CDC9C1",
  "#C8C4BC", "#CCC8C0", "#C5C1B9", "#CAC6BE", "#C7C3BB",
  "#CBC7BF", "#C6C2BA", "#C9C5BD", "#C4C0B8", "#CDC9C1",
  "#C8C4BC", "#CCC8C0",
];

function ShutterSlat({
  progress,
  index,
}: {
  progress: MotionValue<number>;
  index: number;
}) {
  // Bottom slats curl first (reversed stagger)
  const reversedIndex = SLAT_COUNT - 1 - index;
  const startRotate = reversedIndex * (0.55 / SLAT_COUNT);
  const endRotate = startRotate + 0.35;

  const rotateX = useTransform(progress, [startRotate, endRotate], [0, 110]);
  const opacity = useTransform(progress, [startRotate, endRotate - 0.05, endRotate], [1, 1, 0]);

  return (
    <motion.div
      style={{
        rotateX,
        opacity,
        transformOrigin: "top center",
        backfaceVisibility: "hidden",
        backgroundColor: SLAT_COLORS[index] || "#C8C4BC",
        backgroundImage: `linear-gradient(
          to bottom,
          rgba(255,255,255,0.5) 0%,
          rgba(255,255,255,0.2) 15%,
          transparent 30%,
          transparent 60%,
          rgba(0,0,0,0.05) 75%,
          rgba(0,0,0,0.12) 90%,
          rgba(0,0,0,0.2) 100%
        )`,
      }}
      className="w-full will-change-transform"
    >
      {/* Slat body */}
      <div
        className="w-full"
        style={{ height: `calc(100vh / ${SLAT_COUNT} - 2px)` }}
      />
      {/* Dark gap between slats */}
      <div className="w-full h-[2px]" style={{ backgroundColor: "#8A857D" }} />
    </motion.div>
  );
}

// --- Feature data ---
const features = [
  {
    icon: ClipboardList,
    title: "Smart Order Management",
    description: "Take dine-in, takeaway, delivery & aggregator orders from one screen. Split bills, merge tables, and handle pay-later with ease.",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: QrCode,
    title: "QR Code Self-Ordering",
    description: "Customers scan, browse your menu, and order directly from their table. Real-time status tracking from kitchen to serve.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: ChefHat,
    title: "Kitchen Display System",
    description: "Live order feed with color-coded urgency timers. Kitchen staff tap to advance items through Preparing, Ready, and Served stages.",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: Package,
    title: "Inventory & Recipes",
    description: "Track stock levels with auto-deduction on orders. Link menu items to recipe ingredients for precise cost control.",
    color: "from-violet-500 to-violet-600",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "7 report types: sales, items, waiters, channels, tables, payments, and daily summaries. Export to CSV for deeper analysis.",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    icon: Heart,
    title: "Loyalty & CRM",
    description: "Auto-track customer visits and spending. Loyalty tiers from Bronze to Platinum reward your best customers automatically.",
    color: "from-pink-500 to-pink-600",
  },
  {
    icon: Receipt,
    title: "Tax-Compliant Billing",
    description: "Configurable tax rates and breakdowns, service charge, custom receipt headers. Print to thermal or A4. Fully compliant.",
    color: "from-amber-500 to-amber-600",
  },
  {
    icon: Users,
    title: "Staff Management",
    description: "Role-based access for Admin, Manager, Waiter, Cashier, Kitchen. Track attendance, assign orders, monitor performance.",
    color: "from-indigo-500 to-indigo-600",
  },
  {
    icon: CalendarDays,
    title: "Reservations & Waitlist",
    description: "Schedule reservations with table assignment. Manage walk-in waitlists with estimated wait times and status tracking.",
    color: "from-teal-500 to-teal-600",
  },
];

const steps = [
  {
    step: "01",
    title: "Register in 30 seconds",
    description: "Enter your restaurant name and phone number. No credit card needed. Get a 14-day free Pro trial instantly.",
  },
  {
    step: "02",
    title: "Set up your menu & tables",
    description: "Our guided wizard walks you through adding categories, menu items, table layouts, tax rates, and staff accounts.",
  },
  {
    step: "03",
    title: "Start taking orders",
    description: "That's it. Take orders, print bills, track inventory, and grow your restaurant. All from one dashboard.",
  },
];

const testimonials = [
  {
    name: "Carlos Mendez",
    role: "Owner, La Mesa Kitchen",
    quote: "ServeOne replaced 3 different apps we were using. The QR ordering alone saved us hiring an extra server during peak hours.",
    rating: 5,
  },
  {
    name: "Sarah Chen",
    role: "Manager, The Noodle Bar",
    quote: "The kitchen display system is a game-changer. No more lost order tickets. Our food delivery time dropped by 40%.",
    rating: 5,
  },
  {
    name: "David Okonkwo",
    role: "Owner, Savanna Grill",
    quote: "The inventory tracking with recipe linking cut our food waste costs significantly. We finally know where every dollar goes.",
    rating: 5,
  },
];

const booleanFeatures: FeatureKey[] = [
  "qrOrdering", "kds", "inventory", "loyalty", "reservations", "customReceipts",
];

const planIcons: Record<PlanId, React.ReactNode> = {
  starter: <Zap className="h-6 w-6" />,
  pro: <Crown className="h-6 w-6" />,
  enterprise: <Building2 className="h-6 w-6" />,
};

// === MAIN PAGE ===
export default function LandingPage() {
  // --- Shutter scroll animation ---
  const shutterRef = useRef<HTMLDivElement>(null);
  const [shutterOpen, setShutterOpen] = useState(false);
  const [showShutter, setShowShutter] = useState(true);

  // Respect reduced motion preference
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShowShutter(false);
      setShutterOpen(true);
    }
  }, []);

  const { scrollYProgress: shutterProgress } = useScroll({
    target: shutterRef,
    offset: ["start start", "end start"],
  });

  // Whole shutter also rises slightly as slats curl
  const shutterY = useTransform(shutterProgress, [0, 0.5, 1], ["0%", "-10%", "-30%"]);

  // Handle bar fades out early (since bottom slats curl first)
  const handleBarOpacity = useTransform(shutterProgress, [0, 0.15, 0.3], [1, 0.5, 0]);

  // Detect when fully open
  useEffect(() => {
    const unsubscribe = shutterProgress.on("change", (v) => {
      if (v >= 0.95 && !shutterOpen) {
        setShutterOpen(true);
        setShowShutter(false);
      }
    });
    return unsubscribe;
  }, [shutterProgress, shutterOpen]);

  // --- Hero parallax ---
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 60]);

  return (
    <div className="overflow-hidden">
      {/* ====== REAL 3D SHOP SHUTTER ====== */}
      {showShutter && (
        <>
          {/* Scroll trigger zone */}
          <div ref={shutterRef} className="h-screen w-full" aria-hidden="true" />

          {/* 3D Shutter with individual rotating slats */}
          <motion.div
            style={{ y: shutterY }}
            className={`fixed inset-0 z-[60] will-change-transform ${
              shutterOpen ? "pointer-events-none" : ""
            }`}
          >
            {/* 3D perspective container */}
            <div
              className="relative w-full h-full flex flex-col"
              style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
            >
              {/* Side channel guides — the metal tracks shutters slide in */}
              <div className="absolute left-0 top-0 bottom-0 w-4 z-20" style={{ background: "linear-gradient(to right, #7A7570, #9A9590, transparent)" }} />
              <div className="absolute right-0 top-0 bottom-0 w-4 z-20" style={{ background: "linear-gradient(to left, #7A7570, #9A9590, transparent)" }} />

              {/* Individual slats */}
              {Array.from({ length: SLAT_COUNT }).map((_, i) => (
                <ShutterSlat key={i} progress={shutterProgress} index={i} />
              ))}

              {/* Bottom handle bar — stays flat, fades out as bottom slats curl */}
              <motion.div className="w-full flex-shrink-0" style={{ opacity: handleBarOpacity, backgroundColor: "#8A8478" }}>
                <div
                  className="w-full h-12 flex items-center justify-center"
                  style={{ background: "linear-gradient(to bottom, #B0A898, #9A9080, #888070)" }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-36 h-[3px] rounded-sm" style={{ backgroundColor: "#706860" }} />
                    <div className="w-28 h-[2px] rounded-sm" style={{ backgroundColor: "#807870" }} />
                  </div>
                </div>
                <div
                  className="w-full py-3 flex flex-col items-center gap-1.5"
                  style={{ background: "linear-gradient(to bottom, #706858, #605848)" }}
                >
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronUp className="h-5 w-5 rotate-180" style={{ color: "#D0C8B8" }} />
                  </motion.div>
                  <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "#C0B8A8" }}>
                    Scroll to open
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}

      {/* ====== HERO ====== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center py-20">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]"
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-600/8 blur-[100px]"
            animate={{ scale: [1.2, 1, 1.2], y: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-[80px]"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 max-w-6xl mx-auto px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-sm font-medium text-emerald-700">{FREE_TRIAL_DAYS}-day free Pro trial — No credit card</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground leading-[1.05]"
          >
            Run your entire restaurant
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              from one screen
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Orders, kitchen display, QR menus, inventory, billing, loyalty — everything in one platform.
            Works offline. <span className="text-foreground font-medium">Free to start</span>.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="group relative px-8 py-4 bg-primary text-white font-semibold rounded-2xl text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 text-foreground font-medium rounded-2xl text-base border border-border hover:bg-muted/50 transition-all"
            >
              View Pricing
            </Link>
          </motion.div>

          {/* Floating feature cards */}
          <div className="relative mt-20 h-[200px] hidden lg:block">
            <FloatingCard delay={0} y={8} className="absolute left-[5%] top-0">
              <div className="flex items-center gap-3 px-5 py-3 bg-card rounded-2xl border shadow-lg shadow-black/5">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Order #127</p>
                  <p className="text-xs text-muted-foreground">Table 5 — 3 items</p>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard delay={0.5} y={12} className="absolute left-[30%] top-10">
              <div className="flex items-center gap-3 px-5 py-3 bg-card rounded-2xl border shadow-lg shadow-black/5">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <ChefHat className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">KDS Active</p>
                  <p className="text-xs text-emerald-600 font-medium">4 orders preparing</p>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard delay={1} y={6} className="absolute right-[28%] top-4">
              <div className="flex items-center gap-3 px-5 py-3 bg-card rounded-2xl border shadow-lg shadow-black/5">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">QR Order</p>
                  <p className="text-xs text-muted-foreground">Table 8 — New!</p>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard delay={1.5} y={10} className="absolute right-[5%] top-12">
              <div className="flex items-center gap-3 px-5 py-3 bg-card rounded-2xl border shadow-lg shadow-black/5">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Today&apos;s Revenue</p>
                  <p className="text-xs text-emerald-600 font-medium">+12% from yesterday</p>
                </div>
              </div>
            </FloatingCard>
          </div>
        </motion.div>
      </section>

      {/* ====== STATS ====== */}
      <section className="py-16 border-y bg-muted/30">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Counter end={45} suffix="+" label="Features" />
          <Counter end={10} suffix="" label="Modules" />
          <Counter end={7} suffix="" label="Report Types" />
          <Counter end={0} suffix="" label="Monthly to Start" />
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Everything you need</p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
              One platform. Every tool.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Stop juggling multiple apps. ServeOne replaces your POS, kitchen printer, inventory sheet, and CRM — all in one place.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <AnimatedSection key={feature.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="group p-6 rounded-2xl border bg-card hover:shadow-xl hover:shadow-black/5 transition-shadow"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ====== HIGHLIGHT FEATURES (Alternating) ====== */}
      <section className="py-24 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 space-y-32">
          {/* QR Ordering */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">Customer Self-Service</p>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                QR ordering that actually works
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Print QR codes for each table. Customers scan, browse your full menu, and place orders — all from their phone. You approve with one tap. They track preparation status in real-time.
              </p>
              <div className="space-y-3">
                {["No app download required", "Real-time order status tracking", "Manager approval before kitchen", "Reduces staff workload by 40%"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <div className="relative">
                <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border flex items-center justify-center overflow-hidden">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-48 bg-card rounded-2xl border shadow-xl p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-semibold">Table 5 Menu</span>
                    </div>
                    <div className="space-y-2">
                      {["Margherita Pizza", "Caesar Salad", "Grilled Salmon"].map((item, i) => (
                        <div key={item} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{item}</span>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.3 }}
                            className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t text-center">
                      <span className="text-[10px] text-emerald-600 font-semibold">Order Placed!</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* KDS */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection delay={0.2} className="md:order-2">
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-3">Kitchen Operations</p>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                Kitchen Display that keeps you in sync
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Replace printed tickets with a live digital board. Color-coded timers show urgency at a glance. Tap to advance items through each stage. Sound alerts for new orders.
              </p>
              <div className="space-y-3">
                {["Color-coded urgency (green → yellow → red)", "Item-by-item status progression", "Sound notifications for new orders", "Filter by status: New, Preparing, Ready"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-orange-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-orange-600" />
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="md:order-1">
              <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border flex items-center justify-center p-6">
                <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                  {[
                    { order: "#124", time: "2m", status: "New", color: "bg-emerald-500" },
                    { order: "#125", time: "8m", status: "Preparing", color: "bg-amber-500" },
                    { order: "#126", time: "15m", status: "Preparing", color: "bg-orange-500" },
                    { order: "#127", time: "1m", status: "Ready", color: "bg-blue-500" },
                  ].map((card, i) => (
                    <motion.div
                      key={card.order}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.15 }}
                      viewport={{ once: true }}
                      className="bg-card rounded-xl border p-3 shadow-md"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold">{card.order}</span>
                        <span className="text-[10px] text-muted-foreground">{card.time}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[10px] text-white font-medium ${card.color} inline-block`}>
                        {card.status}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Multi-channel */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3">All Channels, One Place</p>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                Dine-in. Delivery. Online orders.
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Track every order source separately. Know exactly how much revenue comes from dine-in vs aggregators. One dashboard, every channel. No more switching between apps.
              </p>
              <div className="space-y-3">
                {["6 order channels supported", "Channel-wise revenue analytics", "Separate commission tracking", "Unified kitchen workflow"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-violet-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-violet-600" />
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border flex items-center justify-center p-6">
                <div className="space-y-3 w-full max-w-xs">
                  {[
                    { channel: "Dine-In", pct: 45, color: "bg-emerald-500" },
                    { channel: "Take-Away", pct: 25, color: "bg-blue-500" },
                    { channel: "Delivery App", pct: 18, color: "bg-orange-500" },
                    { channel: "Online", pct: 12, color: "bg-violet-500" },
                  ].map((ch, i) => (
                    <motion.div
                      key={ch.channel}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xs font-medium text-foreground w-20">{ch.channel}</span>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${ch.pct}%` }}
                          transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                          viewport={{ once: true }}
                          className={`h-full rounded-full ${ch.color}`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{ch.pct}%</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Get started in minutes</p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
              Three steps. That&apos;s it.
            </h2>
          </AnimatedSection>

          <div className="space-y-8">
            {steps.map((step, i) => (
              <AnimatedSection key={step.step} delay={i * 0.15}>
                <motion.div
                  whileHover={{ x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-6 items-start p-6 rounded-2xl border bg-card hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    <span className="text-white font-bold text-lg">{step.step}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ====== WHY SERVEONE ====== */}
      <section className="py-24 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Built different</p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
              Why restaurants choose ServeOne
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Smartphone, title: "Works Offline", description: "Data stored locally. Orders don't stop when WiFi does." },
              { icon: Shield, title: "Bank-Level Security", description: "Encrypted passwords, rate limiting, session auth, data isolation." },
              { icon: Globe, title: "Tax Ready", description: "Configurable tax structures, receipt formatting, and service charge support." },
              { icon: Zap, title: "Blazing Fast", description: "Under 2-second load times. No lag during rush hours." },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.1}>
                <div className="text-center p-6">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                    className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  >
                    <item.icon className="h-7 w-7 text-primary" />
                  </motion.div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Loved by restaurant owners</p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
              Don&apos;t take our word for it
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={t.name} delay={i * 0.15}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 rounded-2xl border bg-card h-full flex flex-col"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed flex-1">&quot;{t.quote}&quot;</p>
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ====== PRICING ====== */}
      <section className="py-24 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Simple pricing</p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
              Start free. Scale when ready.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              No hidden fees. No contracts. Cancel anytime.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {(Object.values(PLANS) as Plan[]).map((plan, i) => (
              <AnimatedSection key={plan.id} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className={`p-6 rounded-2xl border bg-card relative ${plan.popular ? "ring-2 ring-primary shadow-xl shadow-primary/10" : ""}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-semibold rounded-full shadow-lg">
                      Most Popular
                    </span>
                  )}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mx-auto mb-3">
                      {planIcons[plan.id]}
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div className="mt-3">
                      <span className="text-4xl font-bold">{plan.price === 0 ? "Free" : `₹${plan.price}`}</span>
                      {plan.price > 0 && <span className="text-muted-foreground">/mo</span>}
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Tables</span><span className="font-medium">{plan.features.maxTables}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Menu Items</span><span className="font-medium">{plan.features.maxMenuItems}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Staff</span><span className="font-medium">{plan.features.maxUsers}</span></div>
                  </div>

                  <div className="space-y-2 border-t pt-4 mb-6">
                    {booleanFeatures.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        {plan.features[f] ? (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-muted flex-shrink-0" />
                        )}
                        <span className={plan.features[f] ? "text-foreground" : "text-muted-foreground/50"}>
                          {FEATURE_LABELS[f]}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/register"
                    className={`block w-full text-center py-3 rounded-xl font-medium transition-all ${
                      plan.popular
                        ? "bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {plan.price === 0 ? "Get Started" : `Start ${FREE_TRIAL_DAYS}-Day Free Trial`}
                  </Link>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <motion.div
          className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-white/5 blur-[80px]"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Ready to transform your restaurant?
            </h2>
            <p className="mt-4 text-lg text-emerald-100/80">
              Join restaurants already using ServeOne. Start your {FREE_TRIAL_DAYS}-day free trial today — no credit card required.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group px-8 py-4 bg-white text-emerald-700 font-semibold rounded-2xl text-base shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 text-white font-medium rounded-2xl text-base border border-white/20 hover:bg-white/10 transition-all"
              >
                Compare Plans
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
