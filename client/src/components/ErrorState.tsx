import { AlertCircle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  variant?: "default" | "inline" | "fullpage";
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again.",
  onRetry,
  onGoHome,
  onGoBack,
  showRetry = true,
  showHome = true,
  showBack = false,
  variant = "default"
}: ErrorStateProps) {
  const content = (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-8 w-8" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
      </div>
      
      <div className="flex items-center justify-center gap-3 pt-2">
        {showBack && onGoBack && (
          <Button variant="outline" size="sm" onClick={onGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        )}
        {showRetry && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        {showHome && onGoHome && (
          <Button size="sm" onClick={onGoHome}>
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  );

  if (variant === "inline") {
    return (
      <div className="py-8 px-4">
        {content}
      </div>
    );
  }

  if (variant === "fullpage") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6">
            {content}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="pt-8 pb-6">
        {content}
      </CardContent>
    </Card>
  );
}

// Form field error component
interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  
  return (
    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {icon && (
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Loading state with skeleton
export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-muted rounded-full"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// Network error state
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      showHome={false}
    />
  );
}

// Not found state
export function NotFoundState({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <ErrorState
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved."
      onGoHome={onGoHome}
      showRetry={false}
      variant="fullpage"
    />
  );
}
