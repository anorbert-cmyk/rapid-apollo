import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  CreditCard,
  Crown,
  Eye,
  LayoutDashboard,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { TIER_CONFIGS, type Tier } from "@shared/pricing";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const [problemStatement, setProblemStatement] = useState("");
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Countdown timer state
  const [countdown] = useState("03:58:54");

  const createSession = trpc.session.create.useMutation({
    onSuccess: (data) => {
      navigate(`/checkout/${data.sessionId}?tier=${selectedTier}`);
    },
  });

  const handleStartAnalysis = (tier: Tier) => {
    if (!problemStatement.trim()) {
      return;
    }
    setSelectedTier(tier);
    createSession.mutate({
      problemStatement: problemStatement.trim(),
      tier,
    });
  };

  const faqs = [
    {
      question: "How does the validation process work?",
      answer:
        "Our multi-agent AI system analyzes your problem statement through 4 distinct phases: Market Analysis, Technical Feasibility, Competitive Landscape, and Strategic Roadmap. Each phase builds on the previous, creating a comprehensive validation report.",
    },
    {
      question: "Is my idea kept private?",
      answer:
        "Absolutely. We use zero-knowledge architecture and never store your raw problem statements. All analysis is processed in isolated environments and results are encrypted end-to-end.",
    },
    {
      question: "What do I get in the final report?",
      answer:
        "Depending on your tier, you receive: Executive Summary, Market Size Analysis, Competitor Matrix, Technical Architecture Recommendations, MVP Roadmap, Risk Assessment, and Actionable Next Steps.",
    },
    {
      question: "Can I upgrade my tier later?",
      answer:
        "Yes! You can upgrade any existing analysis to a higher tier at any time. You'll only pay the difference and receive the additional insights immediately.",
    },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Noise Texture */}
      <div className="bg-noise" />

      {/* Fractal Blob Background */}
      <div className="fractal-container">
        <div className="fractal-blob blob-1" />
        <div className="fractal-blob blob-2" />
        <div className="fractal-blob blob-3" />
      </div>

      {/* Alert Banner */}
      <div className="relative z-50 bg-red-950/30 dark:bg-red-950/30 bg-red-50 backdrop-blur-md border-b border-red-500/20 dark:border-red-500/20 border-red-200 text-center py-3">
        <div className="flex items-center justify-center gap-3 text-xs md:text-sm font-mono tracking-wide text-red-600 dark:text-red-200 px-4">
          <span className="flex h-2 w-2 relative flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="truncate">
            GATE CLOSING: PRICE SPIKE IN{" "}
            <span className="text-foreground font-bold">{countdown}</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-6 z-40 mx-auto max-w-[95%] px-4">
        <div className="hud-card rounded-full px-5 py-2.5 flex justify-between items-center">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight font-mono">AETHER LOGIC</span>
          </a>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Button>
            )}

            {/* Theme Toggle */}
            <div className="flex items-center gap-2 bg-muted/50 px-1.5 py-1.5 rounded-full border border-border">
              <Sun className="w-3.5 h-3.5 text-yellow-500" />
              <button
                onClick={toggleTheme}
                className="relative w-10 h-5 bg-muted rounded-full transition-colors duration-300 hover:bg-muted/80"
                aria-label="Toggle theme"
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-foreground rounded-full transition-transform duration-300 shadow-lg ${
                    theme === "dark" ? "translate-x-0" : "translate-x-5"
                  }`}
                />
              </button>
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            </div>

            {/* Connect Wallet / User */}
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] font-bold py-1.5 px-3 flex items-center gap-2"
              >
                <Wallet className="w-3.5 h-3.5" />
                {user?.name || "Connected"}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => window.location.href = "/api/oauth/login"}
                className="text-[10px] font-bold py-1.5 px-3 flex items-center gap-2"
              >
                <Wallet className="w-3.5 h-3.5" />
                CONNECT
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="logic-badge mb-10">
            <Zap className="w-3.5 h-3.5" />
            LOGIC_ENGINE_V8: READY FOR DEPLOYMENT
          </div>

          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.95]">
            Stop building in the dark.
            <br />
            <span className="text-gradient-primary">Validate your idea today.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
            Transform your raw problem statement into an executable strategy, market
            analysis, and MVP roadmap in{" "}
            <strong className="text-foreground font-medium">under 24 hours</strong>.
          </p>

          <div className="flex flex-col gap-4 justify-center items-center">
            <Button
              onClick={() =>
                document.getElementById("protocol")?.scrollIntoView({ behavior: "smooth" })
              }
              className="btn-primary px-8 py-4 text-lg flex items-center gap-3 group"
            >
              Start Analysis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Zero-Knowledge Privacy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Info Box */}
      <div className="max-w-3xl mx-auto px-4 mb-24 relative z-10">
        <div className="glass-panel p-6 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed font-light tracking-wide">
            <ShieldCheck className="w-4 h-4 text-primary inline mr-2" />
            <strong className="text-foreground font-medium">Why Aether Logic?</strong> Unlike
            generic chat bots, our engine uses a rigorous, multi-agent validation protocol to
            stress-test your ideas against real-world market constraints, giving you a
            battle-tested roadmap, not just text.
          </p>
        </div>
      </div>

      {/* The Pipeline / Input Section */}
      <section id="protocol" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-2 font-playfair tracking-tight">
              The Logic Pipeline
            </h2>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-[0.2em]">
              Transmuting Ambiguity into Strategy
            </p>
          </div>

          {/* Input Section */}
          <div className="max-w-2xl mx-auto mb-20 relative group">
            {/* Decorative Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur opacity-50 transition duration-1000 group-hover:opacity-75" />

            <div className="relative glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Problem Input Terminal
                </span>
              </div>

              <Textarea
                id="problemInput"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="// Enter your challenge here...&#10;> e.g. 'Automate my client reporting flow'&#10;> or 'Design a fintech onboarding UX'"
                className="min-h-[150px] bg-background/50 border-border font-mono text-sm resize-none"
              />

              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground font-mono">
                <span>{problemStatement.length} / 2000 characters</span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  End-to-end encrypted
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="mint" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-playfair">
              Choose Your Protocol
            </h2>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-[0.2em]">
              Select your analysis depth
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-center">
            {/* Tier 1: Observer */}
            <div className="pricing-card pricing-card-muted">
              <div className="flex items-center gap-2 mb-6">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Observer
                </h3>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold font-playfair">${TIER_CONFIGS.standard.priceUsd}</span>
                <span className="text-muted-foreground ml-2">USD</span>
              </div>

              <ul className="space-y-3 mb-8 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  Basic market analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  Executive summary
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  Single API call
                </li>
              </ul>

              <div className="space-y-3">
                <Button
                  onClick={() => handleStartAnalysis("standard")}
                  disabled={!problemStatement.trim() || createSession.isPending}
                  className="w-full btn-secondary"
                  variant="outline"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  PAY WITH STRIPE
                </Button>
                <button className="w-full text-xs text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-2">
                  <Wallet className="w-3.5 h-3.5" />
                  Pay with PayPal
                </button>
                <button className="w-full text-xs text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-2">
                  <Wallet className="w-3.5 h-3.5" />
                  Pay with Any Crypto (Coinbase)
                </button>
              </div>
            </div>

            {/* Tier 2: Insider (Highlighted) */}
            <div className="pricing-card-highlight">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em]">Insider</h3>
                </div>
                <span className="urgency-badge">GENESIS MINT</span>
              </div>

              <div className="mb-2">
                <span className="text-muted-foreground line-through text-lg mr-2">
                  $149
                </span>
              </div>
              <div className="mb-6">
                <span className="text-6xl font-bold font-playfair">${TIER_CONFIGS.medium.priceUsd}</span>
                <span className="text-muted-foreground ml-2">USD</span>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Everything in Observer
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Competitive analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Technical feasibility
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  MVP roadmap
                </li>
              </ul>

              <div className="space-y-3">
                <Button
                  onClick={() => handleStartAnalysis("medium")}
                  disabled={!problemStatement.trim() || createSession.isPending}
                  className="w-full btn-primary"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  PAY WITH STRIPE
                </Button>
                <button className="w-full text-xs text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-2">
                  <Wallet className="w-3.5 h-3.5" />
                  Pay with PayPal
                </button>
                <button className="w-full text-xs text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-2">
                  <Wallet className="w-3.5 h-3.5" />
                  Pay with Any Crypto (Coinbase)
                </button>
              </div>

              <p className="text-xs text-destructive font-mono mt-4 text-center uppercase tracking-wider">
                ⚠ ONLY 3 SPOTS LEFT AT THIS PRICE
              </p>
            </div>

            {/* Tier 3: Syndicate */}
            <div className="pricing-card">
              <div className="flex items-center gap-2 mb-6">
                <Crown className="w-5 h-5 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                  Syndicate
                </h3>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold font-playfair">${TIER_CONFIGS.full.priceUsd}</span>
                <span className="text-muted-foreground ml-2">USD</span>
              </div>

              <ul className="space-y-3 mb-8 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  Everything in Insider
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  4-part deep analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  Real-time streaming
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  10 Wallet Licenses
                </li>
              </ul>

              <div className="space-y-3">
                <Button
                  onClick={() => handleStartAnalysis("full")}
                  disabled={!problemStatement.trim() || createSession.isPending}
                  className="w-full"
                  variant="outline"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  PAY WITH STRIPE
                </Button>
                <button className="w-full text-xs text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-2">
                  <Wallet className="w-3.5 h-3.5" />
                  Pay with PayPal
                </button>
                <button className="w-full text-xs text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-2">
                  <Wallet className="w-3.5 h-3.5" />
                  Pay with Any Crypto (Coinbase)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 relative z-10 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 font-playfair">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about the protocol.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4 text-muted-foreground text-sm">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 relative z-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight font-mono">AETHER LOGIC</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <a href="/terms" className="hover:text-foreground transition">
                Terms of Service
              </a>
              <a href="/privacy" className="hover:text-foreground transition">
                Privacy Policy
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              © 2024 Aether Logic. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
