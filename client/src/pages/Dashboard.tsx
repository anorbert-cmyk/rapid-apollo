import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Plus,
  Sparkles,
  TrendingUp,
  Eye,
  ChevronRight,
  LayoutDashboard,
  History,
  Settings,
  Crown,
  Wallet,
  Activity,
  Brain,
  ChartLine,
  Download,
  Share2,
  Zap,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Shield,
  Target,
  Home
} from "lucide-react";

const TIER_INFO = {
  standard: { name: "Observer", badge: "tier-badge-observer", color: "text-slate-400", icon: Eye },
  medium: { name: "Insider", badge: "tier-badge-insider", color: "text-indigo-400", icon: Zap },
  full: { name: "Syndicate", badge: "tier-badge-syndicate", color: "text-purple-400", icon: Crown },
};

const STATUS_CONFIG = {
  pending_payment: { icon: Clock, label: "Pending Payment", color: "text-yellow-500" },
  processing: { icon: Loader2, label: "Processing", color: "text-blue-500", animate: true },
  completed: { icon: CheckCircle2, label: "Completed", color: "text-green-500" },
  failed: { icon: AlertCircle, label: "Failed", color: "text-red-500" },
};

type ViewType = 'dashboard' | 'history' | 'output' | 'settings';

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isNewAnalysisOpen, setIsNewAnalysisOpen] = useState(false);
  const [newProblemStatement, setNewProblemStatement] = useState("");
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  const { data: analyses, isLoading, refetch } = trpc.session.getMyAnalyses.useQuery();

  const createSession = trpc.session.create.useMutation({
    onSuccess: (data) => {
      setIsNewAnalysisOpen(false);
      setNewProblemStatement("");
      navigate(`/checkout/${data.sessionId}`);
    },
    onError: (error) => {
      toast.error("Failed to create session", { description: error.message });
    },
  });

  const handleNewAnalysis = (tier: "standard" | "medium" | "full") => {
    if (!newProblemStatement.trim() || newProblemStatement.length < 10) {
      toast.error("Problem statement must be at least 10 characters");
      return;
    }
    createSession.mutate({ problemStatement: newProblemStatement, tier });
  };

  const completedAnalyses = analyses?.filter(a => a.status === "completed") || [];
  const processingAnalyses = analyses?.filter(a => a.status === "processing") || [];
  const pendingAnalyses = analyses?.filter(a => a.status === "pending_payment") || [];
  const latestAnalysis = completedAnalyses[0] || processingAnalyses[0];

  // Animation bars
  const [riskBar, setRiskBar] = useState(0);
  const [ambiguityBar, setAmbiguityBar] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setRiskBar(75), 500);
    const timer2 = setTimeout(() => setAmbiguityBar(45), 800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const switchView = (view: ViewType) => {
    setCurrentView(view);
  };

  return (
    <div className="h-screen w-full bg-background fixed inset-0 overflow-hidden transition-all duration-500 z-[60]">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-primary/10 rounded-full blur-[150px] mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-500/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <div className="flex h-full w-full relative z-10">
        {/* Sidebar: Premium Glass Rail */}
        <aside className="w-20 lg:w-72 flex-shrink-0 flex flex-col py-6 z-50 border-r border-border bg-gradient-to-b from-card/90 to-background/95 backdrop-blur-2xl transition-all duration-300">
          {/* Logo */}
          <div className="px-4 lg:px-6 mb-8">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300 group-hover:scale-105">
                <Zap className="text-white w-6 h-6" />
              </div>
              <div className="hidden lg:block">
                <h2 className="text-foreground font-bold text-lg tracking-tight">Aether</h2>
                <p className="text-[10px] text-indigo-400 font-mono -mt-0.5">INTELLIGENCE</p>
              </div>
            </a>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 lg:px-4 space-y-2">
            <p className="hidden lg:block text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-3 mb-4">
              Main Menu
            </p>

            <button 
              onClick={() => switchView('dashboard')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                currentView === 'dashboard' ? 'sidebar-item-active' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/10 ${currentView === 'dashboard' ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                currentView === 'dashboard' ? 'bg-indigo-500/20' : 'bg-accent'
              }`}>
                <LayoutDashboard className={`w-5 h-5 ${currentView === 'dashboard' ? 'text-indigo-400' : 'text-muted-foreground'}`} />
              </div>
              <div className="hidden lg:block relative z-10">
                <span className={`text-sm font-medium ${currentView === 'dashboard' ? 'text-foreground' : 'text-muted-foreground'}`}>Dashboard</span>
                <p className={`text-[10px] ${currentView === 'dashboard' ? 'text-indigo-400/70' : 'text-muted-foreground'}`}>Overview & Results</p>
              </div>
              {currentView === 'dashboard' && (
                <div className="hidden lg:block ml-auto relative z-10">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
                </div>
              )}
            </button>

            <button 
              onClick={() => switchView('history')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                currentView === 'history' ? 'sidebar-item-active' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                currentView === 'history' ? 'bg-indigo-500/20' : 'bg-accent'
              }`}>
                <History className={`w-5 h-5 ${currentView === 'history' ? 'text-indigo-400' : ''}`} />
              </div>
              <div className="hidden lg:block">
                <span className="text-sm font-medium">History</span>
                <p className="text-[10px] text-muted-foreground">Past Sessions</p>
              </div>
            </button>

            <button 
              onClick={() => switchView('output')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                currentView === 'output' ? 'sidebar-item-active' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                currentView === 'output' ? 'bg-indigo-500/20' : 'bg-accent'
              }`}>
                <FileText className={`w-5 h-5 ${currentView === 'output' ? 'text-indigo-400' : ''}`} />
              </div>
              <div className="hidden lg:block">
                <span className="text-sm font-medium">Output</span>
                <p className="text-[10px] text-muted-foreground">Product Strategy</p>
              </div>
              <span className="hidden lg:flex ml-auto text-[9px] font-mono bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">NEW</span>
            </button>

            <button 
              onClick={() => switchView('settings')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                currentView === 'settings' ? 'sidebar-item-active' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                currentView === 'settings' ? 'bg-indigo-500/20' : 'bg-accent'
              }`}>
                <Settings className={`w-5 h-5 ${currentView === 'settings' ? 'text-indigo-400' : ''}`} />
              </div>
              <div className="hidden lg:block">
                <span className="text-sm font-medium">Settings</span>
                <p className="text-[10px] text-muted-foreground">Preferences</p>
              </div>
            </button>
          </nav>

          {/* Bottom Section */}
          <div className="mt-auto px-3 lg:px-4 space-y-3">
            {/* Tier Badge */}
            {latestAnalysis && (
              <div className="hidden lg:block p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Crown className="text-white w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {TIER_INFO[latestAnalysis.tier as keyof typeof TIER_INFO]?.name || 'Pro'} Tier
                    </p>
                    <p className="text-[10px] text-indigo-400">Active Session</p>
                  </div>
                </div>
                <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                </div>
              </div>
            )}

            {/* User Avatar */}
            <div className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl hover:bg-accent transition cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <Wallet className="text-foreground w-4 h-4" />
                </div>
              </div>
              <div className="hidden lg:block flex-1 overflow-hidden">
                <p className="text-xs font-medium text-foreground truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-muted-foreground">Click to view</p>
              </div>
              <ChevronRight className="hidden lg:block text-muted-foreground group-hover:text-foreground transition w-4 h-4" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Bar */}
          <header className="h-20 flex-shrink-0 flex justify-between items-center px-8 border-b border-border bg-background/20 backdrop-blur-sm">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-3 tracking-tight">
                Strategic Dashboard
                <span className="text-[9px] font-mono bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 tracking-wider">LIVE_SESSION</span>
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5 flex gap-2">
                <span>TX: {latestAnalysis?.sessionId?.substring(0, 10) || 'INITIALIZING'}...</span>
              </p>
            </div>
            <div className="flex gap-4">
              <Dialog open={isNewAnalysisOpen} onOpenChange={setIsNewAnalysisOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    New Analysis
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Start New Analysis</DialogTitle>
                    <DialogDescription>
                      Describe your challenge and select an analysis tier
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Textarea
                      placeholder="Describe your UX challenge or problem statement..."
                      className="min-h-[120px]"
                      value={newProblemStatement}
                      onChange={(e) => setNewProblemStatement(e.target.value)}
                      maxLength={5000}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {newProblemStatement.length} / 5000
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        className="flex flex-col h-auto py-4"
                        onClick={() => handleNewAnalysis("standard")}
                        disabled={createSession.isPending}
                      >
                        <span className="text-lg font-bold">$29</span>
                        <span className="text-xs text-muted-foreground">Observer</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex flex-col h-auto py-4 border-primary/50"
                        onClick={() => handleNewAnalysis("medium")}
                        disabled={createSession.isPending}
                      >
                        <span className="text-lg font-bold">$79</span>
                        <span className="text-xs text-muted-foreground">Insider</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex flex-col h-auto py-4"
                        onClick={() => handleNewAnalysis("full")}
                        disabled={createSession.isPending}
                      >
                        <span className="text-lg font-bold">$199</span>
                        <span className="text-xs text-muted-foreground">Syndicate</span>
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="hud-card px-4 py-2 rounded-lg flex items-center gap-3 border border-border bg-card/40">
                <div className="flex gap-1 h-3 items-end">
                  <div className="w-1 h-2 bg-indigo-500/50 rounded-sm animate-pulse" />
                  <div className="w-1 h-3 bg-indigo-500 rounded-sm animate-pulse" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1 h-1.5 bg-indigo-500/50 rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">SYSTEM_OPTIMAL</span>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
            {/* VIEW: DASHBOARD (Bento Grid) */}
            {currentView === 'dashboard' && (
              <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 animate-slide-up pb-8">
                {/* ROW 1: METRICS & CONTEXT */}
                
                {/* 1. INPUT CONTEXT (Span 3) */}
                <div className="col-span-12 md:col-span-3 dash-panel p-5 flex flex-col h-64 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex gap-2 items-center">
                      <Activity className="w-3 h-3" /> Vector
                    </h3>
                  </div>
                  <div className="flex-1 flex flex-col relative z-10">
                    <div className="flex-1 bg-card/20 rounded border border-border p-3 text-xs text-muted-foreground font-mono leading-relaxed overflow-y-auto">
                      {latestAnalysis?.problemStatement || "No active analysis. Start a new one to see your input vector here."}
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <span className="px-2 py-1 bg-accent rounded text-[9px] text-muted-foreground border border-border">PRIORITY: HIGH</span>
                      <span className="px-2 py-1 bg-accent rounded text-[9px] text-muted-foreground border border-border">CAT: STRATEGY</span>
                    </div>
                  </div>
                </div>

                {/* 2. DIAGNOSIS VISUALIZER (Span 5) */}
                <div className="col-span-12 md:col-span-5 dash-panel p-5 h-64 relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 p-3 opacity-20">
                    <Brain className="w-16 h-16 text-indigo-500" />
                  </div>
                  <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4 flex gap-2 items-center">
                    <Activity className="w-3 h-3" /> Logic Engine v8.0
                  </h3>
                  <div className="flex-1 flex flex-col justify-center gap-6 relative z-10">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground font-mono">TRUST_DECAY_DETECTED</span>
                        <span className="text-red-400 font-bold">CRITICAL</span>
                      </div>
                      <div className="w-full bg-card/50 h-1.5 rounded-full overflow-hidden backdrop-blur-sm border border-border">
                        <div 
                          className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-1000"
                          style={{ width: `${riskBar}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground font-mono">STRATEGIC_AMBIGUITY</span>
                        <span className="text-yellow-400 font-bold">RESOLVING...</span>
                      </div>
                      <div className="w-full bg-card/50 h-1.5 rounded-full overflow-hidden backdrop-blur-sm border border-border">
                        <div 
                          className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full transition-all duration-1000 delay-300"
                          style={{ width: `${ambiguityBar}%` }}
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <div>
                        <div className="text-[10px] text-indigo-400 font-mono leading-tight">STATUS</div>
                        <div className="text-xs text-foreground font-bold">Optimization Complete</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. ACTION / ROI (Span 4) */}
                <div className="col-span-12 md:col-span-4 dash-panel p-5 h-64 flex flex-col relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-500/10 to-transparent pointer-events-none" />
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Projected Impact</h3>
                    <div className="bg-accent rounded-full p-1 flex">
                      <button className="px-2 py-0.5 text-[9px] text-foreground bg-accent rounded-full">1M</button>
                      <button className="px-2 py-0.5 text-[9px] text-muted-foreground hover:text-foreground transition">1Y</button>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl font-bold text-foreground tracking-tighter">+$18.5k</div>
                    <div className="text-xs text-green-400 font-mono mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> 14% Efficiency Gain
                    </div>
                  </div>
                  <div className="flex-1 mt-4 relative z-10 flex items-end">
                    {/* Simple bar chart visualization */}
                    <div className="flex items-end gap-1 h-full w-full">
                      {[40, 55, 45, 60, 75, 65, 80, 70, 85, 90, 85, 95].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-green-500/50 to-green-400/30 rounded-t transition-all duration-500"
                          style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* ROW 2: MAIN OUTPUT */}
                
                {/* 4. STRATEGIC REPORT (Span 8) */}
                <div className="col-span-12 md:col-span-8 dash-panel p-0 flex flex-col h-[600px] relative overflow-hidden">
                  {/* Tabs Header */}
                  <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-accent/20">
                    <div className="flex gap-6">
                      <button className="text-xs font-bold text-foreground border-b-2 border-indigo-500 pb-4 -mb-4.5 transition-colors tracking-wide">REPORT_V1</button>
                      <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors pb-4 -mb-4.5 tracking-wide">VISUALS</button>
                      <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors pb-4 -mb-4.5 tracking-wide">RESILIENCE_MAP</button>
                    </div>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded bg-accent hover:bg-accent/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:text-foreground transition shadow-lg shadow-indigo-500/10">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="flex-1 overflow-y-auto p-8 relative space-y-8">
                    {latestAnalysis?.status === 'completed' && latestAnalysis?.result ? (
                      <>
                        {/* Executive Summary */}
                        <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
                          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-indigo-400" /> Executive Summary
                          </h2>
                          <p className="text-muted-foreground leading-relaxed">
                            {latestAnalysis.result && typeof (latestAnalysis.result as any)?.fullResult === 'string' 
                              ? ((latestAnalysis.result as any).fullResult as string).substring(0, 500) + '...'
                              : 'Analysis complete. View full results for detailed insights.'}
                          </p>
                        </div>

                        {/* Key Insight */}
                        <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                          <h3 className="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" /> Key Insight
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Your strategic analysis has identified critical optimization opportunities.
                          </p>
                        </div>

                        {/* Next Step */}
                        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                          <h3 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4" /> Recommended Next Step
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Review the full analysis and implement the priority recommendations.
                          </p>
                        </div>

                        <Button 
                          className="w-full"
                          onClick={() => navigate(`/analysis/${latestAnalysis.sessionId}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Full Analysis
                        </Button>
                      </>
                    ) : latestAnalysis?.status === 'processing' ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground font-mono space-y-4">
                        <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        <span className="animate-pulse tracking-widest text-xs">&gt; PROCESSING_ANALYSIS...</span>
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/analysis/${latestAnalysis.sessionId}`)}
                        >
                          View Progress
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground font-mono space-y-4">
                        <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        <span className="animate-pulse tracking-widest text-xs">&gt; AWAITING_INPUT...</span>
                        <p className="text-sm text-center max-w-md">
                          Start a new analysis to see your strategic insights here.
                        </p>
                        <Button onClick={() => setIsNewAnalysisOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          New Analysis
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Fade */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                </div>

                {/* 5. SIDEBAR WIDGETS (Span 4) */}
                <div className="col-span-12 md:col-span-4 flex flex-col gap-6 h-[600px]">
                  {/* Terminal */}
                  <div className="dash-panel p-4 flex-1 bg-card/80 font-mono text-[10px] overflow-hidden flex flex-col border-indigo-500/10 shadow-inner">
                    <div className="text-muted-foreground border-b border-border pb-2 mb-2 flex justify-between uppercase tracking-wider">
                      <span>System_Log</span>
                      <span className="text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        LIVE
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 text-muted-foreground">
                      <p><span className="text-indigo-400">[SYS]</span> Session initialized</p>
                      <p><span className="text-green-400">[OK]</span> Authentication verified</p>
                      <p><span className="text-yellow-400">[PROC]</span> Loading analysis engine...</p>
                      <p><span className="text-green-400">[OK]</span> Engine ready</p>
                      <p><span className="text-indigo-400">[SYS]</span> Awaiting input vector</p>
                      {latestAnalysis && (
                        <>
                          <p><span className="text-cyan-400">[DATA]</span> Analysis: {latestAnalysis.sessionId?.substring(0, 8)}...</p>
                          <p><span className="text-green-400">[OK]</span> Status: {latestAnalysis.status}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="dash-panel p-5">
                    <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{completedAnalyses.length}</div>
                        <div className="text-[10px] text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{processingAnalyses.length}</div>
                        <div className="text-[10px] text-muted-foreground">Processing</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{pendingAnalyses.length}</div>
                        <div className="text-[10px] text-muted-foreground">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{analyses?.length || 0}</div>
                        <div className="text-[10px] text-muted-foreground">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: HISTORY */}
            {currentView === 'history' && (
              <div className="animate-slide-up space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Analysis History</h2>
                  <Badge variant="outline" className="font-mono">
                    {analyses?.length || 0} Total
                  </Badge>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="dash-panel p-6">
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : analyses && analyses.length > 0 ? (
                  <div className="space-y-4">
                    {analyses.map((analysis) => {
                      const tierInfo = TIER_INFO[analysis.tier as keyof typeof TIER_INFO];
                      const statusConfig = STATUS_CONFIG[analysis.status as keyof typeof STATUS_CONFIG];
                      const StatusIcon = statusConfig?.icon || Clock;
                      
                      return (
                        <div key={analysis.sessionId} className="dash-panel p-6 group hover:border-primary/20 transition-all">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <p className="text-sm text-foreground line-clamp-2">
                                {analysis.problemStatement}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`tier-badge ${tierInfo.badge}`}>
                                  {tierInfo.name}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`${statusConfig?.color} border-current/30`}
                                >
                                  <StatusIcon className={`h-3 w-3 mr-1 ${analysis.status === "processing" ? "animate-spin" : ""}`} />
                                  {statusConfig?.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(analysis.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {analysis.status === "completed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/analysis/${analysis.sessionId}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Result
                                </Button>
                              )}
                              {analysis.status === "pending_payment" && (
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/checkout/${analysis.sessionId}`)}
                                >
                                  Complete Payment
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              )}
                              {analysis.status === "processing" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/analysis/${analysis.sessionId}`)}
                                >
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  View Progress
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="dash-panel py-12">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">No analyses yet</h3>
                        <p className="text-sm text-muted-foreground">
                          Start your first analysis to get strategic UX insights
                        </p>
                      </div>
                      <Button onClick={() => setIsNewAnalysisOpen(true)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create Your First Analysis
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW: OUTPUT */}
            {currentView === 'output' && (
              <div className="animate-slide-up space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Output & Strategy</h2>
                </div>
                
                {completedAnalyses.length > 0 ? (
                  <div className="grid gap-6">
                    {completedAnalyses.map((analysis) => (
                      <div key={analysis.sessionId} className="dash-panel p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className={`tier-badge ${TIER_INFO[analysis.tier as keyof typeof TIER_INFO].badge} mb-2`}>
                              {TIER_INFO[analysis.tier as keyof typeof TIER_INFO].name}
                            </span>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-2">
                              {analysis.problemStatement}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/analysis/${analysis.sessionId}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Completed: {new Date(analysis.updatedAt || analysis.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dash-panel py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No completed analyses</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete an analysis to see your strategic outputs here
                    </p>
                    <Button onClick={() => setIsNewAnalysisOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Start Analysis
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* VIEW: SETTINGS */}
            {currentView === 'settings' && (
              <div className="animate-slide-up space-y-6">
                <h2 className="text-xl font-bold text-foreground">Settings</h2>
                
                <div className="dash-panel p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Logged in as: {user?.name || 'User'}
                    </p>
                  </div>
                  
                  <div className="border-t border-border pt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Theme and notification settings coming soon.
                    </p>
                  </div>
                  
                  <div className="border-t border-border pt-6">
                    <Button variant="outline" onClick={() => navigate('/')}>
                      <Home className="h-4 w-4 mr-2" />
                      Back to Home
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
