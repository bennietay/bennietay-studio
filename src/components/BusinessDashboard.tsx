import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { OnboardingFlow } from "./OnboardingFlow";

export const BusinessDashboard = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { profile, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    // If onboarding is not completed, show the flow
    // We only trigger this if we have a profile
    if (profile && profile.onboardingCompleted === false) {
      setShowOnboarding(true);
    }
  }, [profile?.onboardingCompleted]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <>
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}
      {children}
    </>
  );
};
