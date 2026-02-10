import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-base">D</span>
            </div>
            <span className="font-bold text-xl text-foreground tracking-tight">DineFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Legal</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="font-bold text-foreground">DineFlow</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All-in-one restaurant management platform built for Indian restaurants.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-4">Product</h4>
              <div className="space-y-2.5">
                <Link href="/#features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                <Link href="/pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                <Link href="/register" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Start Free Trial</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-4">Legal</h4>
              <div className="space-y-2.5">
                <Link href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link href="/refund" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Refund Policy</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-4">Contact</h4>
              <div className="space-y-2.5">
                <span className="block text-sm text-muted-foreground">support@dineflow.in</span>
                <span className="block text-sm text-muted-foreground">DineFlow Technologies</span>
                <span className="block text-sm text-muted-foreground">Made in India</span>
              </div>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} DineFlow Technologies. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/refund" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Refund</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
