import { useState, useEffect } from "react";
import { X, ChevronRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TooltipStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

const ONBOARDING_STEPS: TooltipStep[] = [
  {
    id: "welcome",
    target: "[data-onboarding='problem-input']",
    title: "Start Here 👋",
    content: "Describe your product challenge or UX problem. Be specific about what you're trying to solve.",
    position: "bottom"
  },
  {
    id: "tier-select",
    target: "[data-onboarding='tier-select']",
    title: "Choose Your Analysis Depth",
    content: "Observer for quick insights, Insider for detailed strategy, Syndicate for comprehensive APEX analysis with AI research.",
    position: "top"
  },
  {
    id: "dashboard",
    target: "[data-onboarding='dashboard-link']",
    title: "Your Dashboard",
    content: "Track all your analyses, view results, and manage your account from here.",
    position: "bottom"
  }
];

const STORAGE_KEY = "aether_onboarding_completed";

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check if onboarding was already completed
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Start onboarding after a short delay
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsActive(false);
    setCurrentStep(-1);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsActive(true);
    setCurrentStep(0);
  };

  return {
    currentStep,
    isActive,
    steps: ONBOARDING_STEPS,
    nextStep,
    skipOnboarding,
    resetOnboarding
  };
}

interface OnboardingTooltipProps {
  step: TooltipStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export function OnboardingTooltip({ 
  step, 
  currentIndex, 
  totalSteps, 
  onNext, 
  onSkip 
}: OnboardingTooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const targetElement = document.querySelector(step.target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;

      let top = 0;
      let left = 0;

      switch (step.position) {
        case "bottom":
          top = rect.bottom + scrollTop + 12;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case "top":
          top = rect.top + scrollTop - 12;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case "left":
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.left + scrollLeft - 12;
          break;
        case "right":
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.right + scrollLeft + 12;
          break;
        default:
          top = rect.bottom + scrollTop + 12;
          left = rect.left + scrollLeft + rect.width / 2;
      }

      setPosition({ top, left });
      
      // Scroll element into view
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Show tooltip after scroll
      setTimeout(() => setIsVisible(true), 300);
    }
  }, [step]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onSkip}
      />
      
      {/* Tooltip */}
      <div
        className="fixed z-[9999] w-80 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{
          top: position.top,
          left: position.left,
          transform: step.position === "bottom" || step.position === "top" 
            ? "translateX(-50%)" 
            : step.position === "left" 
              ? "translate(-100%, -50%)" 
              : "translateY(-50%)"
        }}
      >
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-300" />
              <span className="text-xs font-medium text-white/80">
                Step {currentIndex + 1} of {totalSteps}
              </span>
            </div>
            <button 
              onClick={onSkip}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4">
            <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-white/80 text-sm leading-relaxed">{step.content}</p>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/20">
            <button 
              onClick={onSkip}
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Skip tour
            </button>
            <Button 
              size="sm" 
              onClick={onNext}
              className="bg-white text-indigo-600 hover:bg-white/90"
            >
              {currentIndex === totalSteps - 1 ? "Got it!" : "Next"}
              {currentIndex < totalSteps - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
        
        {/* Arrow */}
        <div 
          className={`absolute w-3 h-3 bg-gradient-to-br from-indigo-600 to-purple-600 transform rotate-45 ${
            step.position === "bottom" ? "-top-1.5 left-1/2 -translate-x-1/2" :
            step.position === "top" ? "-bottom-1.5 left-1/2 -translate-x-1/2" :
            step.position === "left" ? "top-1/2 -right-1.5 -translate-y-1/2" :
            "top-1/2 -left-1.5 -translate-y-1/2"
          }`}
        />
      </div>
    </>
  );
}

// Provider component to wrap the app
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { currentStep, isActive, steps, nextStep, skipOnboarding } = useOnboarding();

  return (
    <>
      {children}
      {isActive && currentStep >= 0 && currentStep < steps.length && (
        <OnboardingTooltip
          step={steps[currentStep]}
          currentIndex={currentStep}
          totalSteps={steps.length}
          onNext={nextStep}
          onSkip={skipOnboarding}
        />
      )}
    </>
  );
}
