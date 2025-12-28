import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Streamdown } from "streamdown";
import { useEffect, useState } from "react";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Loader2,
  CheckCircle2,
  Lightbulb,
  Target,
  Layers,
  AlertTriangle,
  TrendingUp,
  FileText,
  Clock,
  Zap,
  Globe
} from "lucide-react";

const TIER_INFO = {
  standard: { name: "Observer", badge: "tier-badge-standard", isApex: false },
  medium: { name: "Insider", badge: "tier-badge-medium", isApex: false },
  full: { name: "Syndicate", badge: "tier-badge-full", isApex: true },
};

const PART_CONFIG = [
  { number: 1, name: "Discovery & Problem Analysis", icon: Target, color: "text-blue-500", bgColor: "bg-blue-500", description: "Deep dive into the problem space and user needs" },
  { number: 2, name: "Strategic Design & Roadmap", icon: Layers, color: "text-purple-500", bgColor: "bg-purple-500", description: "Design strategy and implementation roadmap" },
  { number: 3, name: "AI Toolkit & Figma Prompts", icon: Lightbulb, color: "text-yellow-500", bgColor: "bg-yellow-500", description: "Practical tools and 10 production-ready prompts" },
  { number: 4, name: "Risk, Metrics & Rationale", icon: AlertTriangle, color: "text-red-500", bgColor: "bg-red-500", description: "Risk assessment and success metrics" },
];

// Helper to format time remaining
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Completing...";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `~${minutes}m ${remainingSeconds}s remaining`;
  }
  return `~${remainingSeconds}s remaining`;
}

// Progress status type matching backend
type ProgressStatus = "pending" | "in_progress" | "completed" | "failed";

export default function AnalysisResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, navigate] = useLocation();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const { data: session } = trpc.session.get.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const { data: result, isLoading } = trpc.analysis.getResult.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId, refetchInterval: session?.status === "processing" ? 2000 : false }
  );

  const tierInfo = session ? TIER_INFO[session.tier as keyof typeof TIER_INFO] : null;
  const isMultiPart = session?.tier === "full";
  
  // Extract progress status from result
  const part1Status = (result?.part1Status as ProgressStatus) || "pending";
  const part2Status = (result?.part2Status as ProgressStatus) || "pending";
  const part3Status = (result?.part3Status as ProgressStatus) || "pending";
  const part4Status = (result?.part4Status as ProgressStatus) || "pending";
  const currentPart = result?.currentPart || 0;
  const estimatedCompletionAt = result?.estimatedCompletionAt;
  
  // Calculate progress for multi-part analysis
  const completedParts = [part1Status, part2Status, part3Status, part4Status].filter(s => s === "completed").length;
  const progressPercent = isMultiPart ? (completedParts / 4) * 100 : (result?.singleResult ? 100 : 0);

  // Update time remaining countdown
  useEffect(() => {
    if (session?.status !== "processing" || !estimatedCompletionAt) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const estimated = new Date(estimatedCompletionAt).getTime();
      const remaining = estimated - now;
      setTimeRemaining(remaining > 0 ? remaining : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session?.status, estimatedCompletionAt]);

  // Track elapsed time
  useEffect(() => {
    if (session?.status !== "processing") {
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.status]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  // Get status for a specific part
  const getPartStatus = (partNum: number): ProgressStatus => {
    switch (partNum) {
      case 1: return part1Status;
      case 2: return part2Status;
      case 3: return part3Status;
      case 4: return part4Status;
      default: return "pending";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Analysis Result</h1>
                {tierInfo && (
                  <div className="flex items-center gap-2">
                    <span className={`tier-badge ${tierInfo.badge}`}>
                      {tierInfo.name}
                    </span>
                    {tierInfo.isApex && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full text-cyan-400">
                        APEX • Perplexity Powered
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {session?.status === "processing" ? "Analysis in progress..." : "Completed"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Problem Statement */}
        <Card className="glass-panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Problem Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{session?.problemStatement}</p>
          </CardContent>
        </Card>

        {/* Enhanced Progress Indicator (for processing) */}
        {session?.status === "processing" && isMultiPart && (
          <Card className="glass-panel border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-background to-purple-950/20 overflow-hidden">
            <CardContent className="pt-6 relative">
              {/* Animated background grid */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }} />
              </div>
              
              <div className="relative space-y-6">
                {/* Header with status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-500 animate-ping" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">APEX Analysis Running</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-3 w-3 text-cyan-400" />
                        <span>Perplexity sonar-pro • Real-time web research</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {timeRemaining !== null && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <Clock className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm font-mono text-cyan-400">
                          {formatTimeRemaining(timeRemaining)}
                        </span>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-400">{completedParts}/4</p>
                      <p className="text-xs text-muted-foreground">Parts Complete</p>
                    </div>
                  </div>
                </div>

                {/* Main progress bar */}
                <div className="space-y-2">
                  <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${progressPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Elapsed: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span>
                    <span>{Math.round(progressPercent)}% complete</span>
                  </div>
                </div>

                {/* Part-by-part progress */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PART_CONFIG.map((part) => {
                    const status = getPartStatus(part.number);
                    const isActive = status === "in_progress";
                    const isComplete = status === "completed";
                    const isPending = status === "pending";
                    
                    return (
                      <div 
                        key={part.number}
                        className={`relative p-4 rounded-xl border transition-all duration-500 ${
                          isComplete 
                            ? "bg-green-500/10 border-green-500/30" 
                            : isActive
                              ? "bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                              : "bg-muted/20 border-border/50"
                        }`}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                            <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-500" />
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isComplete 
                              ? "bg-green-500/20" 
                              : isActive 
                                ? "bg-cyan-500/20" 
                                : "bg-muted/30"
                          }`}>
                            {isComplete ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : isActive ? (
                              <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                            ) : (
                              <part.icon className={`h-5 w-5 ${isPending ? "text-muted-foreground" : part.color}`} />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-mono ${
                                isComplete ? "text-green-400" : isActive ? "text-cyan-400" : "text-muted-foreground"
                              }`}>
                                PART {part.number}
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-400 rounded">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <p className={`text-sm font-medium truncate ${
                              isComplete ? "text-green-300" : isActive ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              {part.name.split(" & ")[0]}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {isComplete ? "✓ Complete" : isActive ? "Researching..." : "Queued"}
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress bar for active part */}
                        {isActive && (
                          <div className="mt-3 h-1 bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full w-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-pulse" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Live log simulation */}
                <div className="p-3 bg-black/30 rounded-lg border border-border/50 font-mono text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>SYSTEM LOG</span>
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    {completedParts >= 1 && <p><span className="text-green-400">[✓]</span> Part 1: Discovery complete</p>}
                    {completedParts >= 2 && <p><span className="text-green-400">[✓]</span> Part 2: Strategy mapped</p>}
                    {completedParts >= 3 && <p><span className="text-green-400">[✓]</span> Part 3: AI toolkit generated</p>}
                    {completedParts >= 4 && <p><span className="text-green-400">[✓]</span> Part 4: Risk analysis complete</p>}
                    {currentPart > 0 && currentPart <= 4 && getPartStatus(currentPart) === "in_progress" && (
                      <p className="text-cyan-400 animate-pulse">
                        [→] Processing Part {currentPart}: {PART_CONFIG[currentPart - 1]?.name}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Simple progress for non-APEX tiers */}
        {session?.status === "processing" && !isMultiPart && (
          <Card className="glass-panel border-primary/30">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="font-medium">Analysis in Progress</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Processing...</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <>
            {isMultiPart ? (
              /* Multi-Part Results (Full Tier) */
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="part1" disabled={!result.part1}>Part 1</TabsTrigger>
                  <TabsTrigger value="part2" disabled={!result.part2}>Part 2</TabsTrigger>
                  <TabsTrigger value="part3" disabled={!result.part3}>Part 3</TabsTrigger>
                  <TabsTrigger value="part4" disabled={!result.part4}>Part 4</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Full Analysis Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-invert max-w-none">
                      {result.fullMarkdown ? (
                        <Streamdown>{result.fullMarkdown}</Streamdown>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p>Compiling full report...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {PART_CONFIG.map((part) => {
                  const partKey = `part${part.number}` as "part1" | "part2" | "part3" | "part4";
                  const partContent = result[partKey];
                  
                  return (
                    <TabsContent key={part.number} value={`part${part.number}`}>
                      <Card className="glass-panel">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <part.icon className={`h-5 w-5 ${part.color}`} />
                            Part {part.number}: {part.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-invert max-w-none">
                          {partContent ? (
                            <Streamdown>{partContent}</Streamdown>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                              <p>Generating this section...</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  );
                })}
              </Tabs>
            ) : (
              /* Single Result (Standard/Medium Tier) */
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Analysis Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none">
                  {result.singleResult ? (
                    <Streamdown>{result.singleResult}</Streamdown>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p>Generating analysis...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upgrade CTA (for non-full tiers) */}
            {session?.tier !== "full" && session?.status === "completed" && (
              <Card className="glass-panel border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Want Deeper Insights?</h3>
                        <p className="text-sm text-muted-foreground">
                          Upgrade to Syndicate for a comprehensive 4-part analysis
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-purple-500 hover:bg-purple-600"
                      onClick={() => {
                        // Create new session with same problem but full tier
                        navigate("/");
                      }}
                    >
                      Upgrade to Full Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
