import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { 
  Loader2, 
  CreditCard, 
  Wallet,
  Check,
  Zap,
  Eye,
  Shield
} from "lucide-react";

interface NewAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (sessionId: string) => void;
}

const TIERS = [
  {
    id: "standard",
    name: "Observer",
    price: 29,
    icon: Eye,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    features: ["Core UX Analysis", "Problem Breakdown", "Quick Insights"],
  },
  {
    id: "medium",
    name: "Insider",
    price: 79,
    icon: Shield,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    features: ["Everything in Observer", "Strategic Recommendations", "Competitor Analysis"],
  },
  {
    id: "full",
    name: "Syndicate",
    price: 199,
    icon: Zap,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    badge: "APEX",
    features: ["4-Part Deep Analysis", "Design Prompts", "Risk Assessment", "Perplexity Powered"],
  },
];

export function NewAnalysisModal({ open, onOpenChange, onSuccess }: NewAnalysisModalProps) {
  const [step, setStep] = useState<"problem" | "tier" | "payment">("problem");
  const [problemStatement, setProblemStatement] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("standard");
  const [isCreating, setIsCreating] = useState(false);

  const createSession = trpc.session.create.useMutation({
    onSuccess: (data) => {
      toast.success("Analysis session created!");
      onSuccess(data.sessionId);
      // Reset state
      setStep("problem");
      setProblemStatement("");
      setSelectedTier("standard");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to create session", { description: error.message });
      setIsCreating(false);
    },
  });

  const handleNext = () => {
    if (step === "problem") {
      if (problemStatement.trim().length < 10) {
        toast.error("Please describe your problem in at least 10 characters");
        return;
      }
      setStep("tier");
    } else if (step === "tier") {
      setStep("payment");
    }
  };

  const handleBack = () => {
    if (step === "tier") setStep("problem");
    if (step === "payment") setStep("tier");
  };

  const handleCreateSession = () => {
    setIsCreating(true);
    createSession.mutate({
      problemStatement,
      tier: selectedTier as "standard" | "medium" | "full",
    });
  };

  const selectedTierInfo = TIERS.find(t => t.id === selectedTier);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass-panel">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === "problem" && "Describe Your Challenge"}
            {step === "tier" && "Choose Your Package"}
            {step === "payment" && "Confirm & Pay"}
          </DialogTitle>
          <DialogDescription>
            {step === "problem" && "Tell us about the UX problem you want to solve"}
            {step === "tier" && "Select the analysis depth that fits your needs"}
            {step === "payment" && "Review your selection and proceed to payment"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Problem Statement */}
          {step === "problem" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="problem">Problem Statement</Label>
                <Textarea
                  id="problem"
                  placeholder="Describe the UX challenge you're facing. Be specific about your product, users, and the problems you've observed..."
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  className="min-h-[150px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {problemStatement.length}/5000 characters
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Tier Selection */}
          {step === "tier" && (
            <RadioGroup value={selectedTier} onValueChange={setSelectedTier} className="space-y-3">
              {TIERS.map((tier) => {
                const Icon = tier.icon;
                const isSelected = selectedTier === tier.id;
                
                return (
                  <div key={tier.id}>
                    <RadioGroupItem value={tier.id} id={tier.id} className="peer sr-only" />
                    <Label
                      htmlFor={tier.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? `${tier.borderColor} ${tier.bgColor}` 
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${tier.bgColor} ${tier.borderColor} border flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${tier.color}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${tier.color}`}>{tier.name}</span>
                          {tier.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded text-amber-400">
                              {tier.badge}
                            </span>
                          )}
                          <span className="ml-auto font-bold">${tier.price}</span>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {tier.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-emerald-400" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {isSelected && (
                        <div className={`w-5 h-5 rounded-full ${tier.bgColor} ${tier.borderColor} border flex items-center justify-center`}>
                          <Check className={`h-3 w-3 ${tier.color}`} />
                        </div>
                      )}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          )}

          {/* Step 3: Payment Confirmation */}
          {step === "payment" && selectedTierInfo && (
            <div className="space-y-4">
              {/* Summary */}
              <div className={`p-4 rounded-lg ${selectedTierInfo.bgColor} ${selectedTierInfo.borderColor} border`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-medium ${selectedTierInfo.color}`}>
                    {selectedTierInfo.name} Package
                  </span>
                  <span className="text-xl font-bold">${selectedTierInfo.price}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {problemStatement}
                </p>
              </div>

              {/* Payment Info */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Payment Methods</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll be redirected to our secure checkout page where you can pay with Stripe (Credit Card) or Cryptocurrency.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            {step !== "problem" && (
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            
            {step !== "payment" ? (
              <Button onClick={handleNext}>
                Continue
              </Button>
            ) : (
              <Button 
                onClick={handleCreateSession}
                disabled={isCreating}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Proceed to Checkout
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
