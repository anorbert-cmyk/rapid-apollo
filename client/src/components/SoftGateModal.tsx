import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  X, 
  Zap, 
  Mail, 
  ArrowRight, 
  Sparkles,
  Shield,
  Clock,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface SoftGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  onSkip: () => void;
}

export function SoftGateModal({ isOpen, onClose, onSubmit, onSkip }: SoftGateModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay for entrance animation
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const subscribeMutation = trpc.emailSubscriber.subscribe.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save email to database
      const result = await subscribeMutation.mutateAsync({
        email: email.trim(),
        source: "demo_gate",
      });
      
      onSubmit(email);
      
      if (result.isNew) {
        toast.success("Welcome to the inner circle!", {
          description: "You now have full access to the demo analysis."
        });
      } else {
        toast.success("Welcome back!", {
          description: "You already have full access to the demo."
        });
      }
    } catch (error) {
      console.error("Failed to save email:", error);
      // Still allow access even if save fails
      onSubmit(email);
      toast.success("Welcome to the inner circle!", {
        description: "You now have full access to the demo analysis."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    toast.info("No problem!", {
      description: "You can continue viewing the demo."
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-lg transform transition-all duration-500 ${
          isVisible 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-8"
        }`}
      >
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
        
        {/* Card */}
        <div className="relative bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-2xl">
          {/* Animated top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />
          
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Content */}
          <div className="p-8 pt-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-50" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            {/* Headline */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">
                You're Halfway Through!
              </h2>
              <p className="text-muted-foreground">
                Enjoying the analysis? Enter your email to unlock the full demo and get notified when we launch new features.
              </p>
            </div>
            
            {/* Benefits */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/30 border border-border/50">
                <Shield className="w-5 h-5 text-emerald-400 mb-2" />
                <span className="text-xs text-muted-foreground">Zero Spam</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/30 border border-border/50">
                <Zap className="w-5 h-5 text-amber-400 mb-2" />
                <span className="text-xs text-muted-foreground">Early Access</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/30 border border-border/50">
                <Clock className="w-5 h-5 text-cyan-400 mb-2" />
                <span className="text-xs text-muted-foreground">5 Sec Setup</span>
              </div>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 bg-muted/30 border-border/50 focus:border-primary/50 text-base"
                  autoFocus
                />
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-base font-semibold group"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    Unlock Full Demo
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
            
            {/* Skip option */}
            <div className="mt-4 text-center">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                No thanks, I'll continue without full access
              </button>
            </div>
            
            {/* Trust badges */}
            <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Unsubscribe anytime
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
