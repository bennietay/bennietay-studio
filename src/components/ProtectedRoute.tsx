import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Shield, Zap } from "lucide-react";
import { Button } from "./ui/button";

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { user, profile, business, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/" replace />;

  if (profile?.status === "suspended") {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Account Suspended</h1>
        <p className="text-slate-500 mt-2 max-w-md">
          Your account has been suspended by an administrator. Please contact
          support if you believe this is a mistake.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => navigate("/")}
        >
          Return Home
        </Button>
      </div>
    );
  }

  // Trial Expiration Gate
  const isTrialExpired =
    business?.trial_ends_at &&
    new Date(business.trial_ends_at) < new Date() &&
    business?.subscription_status !== "active" &&
    profile?.role !== "super_admin";

  const isBillingPage = location.pathname.includes("/billing");

  if (
    isTrialExpired &&
    !isBillingPage &&
    (profile?.role === "business_admin" || profile?.role === "client")
  ) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
        <div className="h-20 w-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-amber-100 dark:shadow-none">
          <Zap className="h-10 w-10 fill-current" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Trial Period Ended
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-md text-lg">
          Your free trial has expired. To continue accessing your dashboard and
          features, please activate a subscription.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button
            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
            onClick={() => navigate("/dashboard/billing")}
          >
            Activate Subscription
          </Button>
          <Button
            variant="outline"
            className="h-12 px-8 rounded-xl"
            onClick={() => navigate("/")}
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role))
    return <Navigate to="/" replace />;

  return <>{children}</>;
};
