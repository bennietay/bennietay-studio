import React from "react";
import { useFeatures, FeatureId } from "../hooks/useFeatures";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Lock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  featureId: FeatureId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({
  featureId,
  children,
  fallback,
}: FeatureGateProps) {
  const { isFeatureEnabled, loading } = useFeatures();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">Loading...</div>
    );
  }

  if (isFeatureEnabled(featureId)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full rounded-3xl border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="h-2 bg-indigo-600" />
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Premium Feature</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            This feature is not available on your current package.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Upgrade your package to unlock{" "}
              <span className="font-bold text-indigo-600">
                {featureId.replace("_", " ").toUpperCase()}
              </span>{" "}
              and other advanced tools to grow your business.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                console.log("Navigating to billing...");
                navigate("/dashboard/billing");
              }}
              className="w-full rounded-xl h-12 bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              <Zap className="h-4 w-4 fill-current" />
              View Upgrade Options
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/dashboard");
                }
              }}
              className="w-full rounded-xl h-12"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
