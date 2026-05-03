import React from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { Business } from "../types";

interface TrialReminderProps {
  business: Business;
}

export const TrialReminder: React.FC<TrialReminderProps> = ({ business }) => {
  const navigate = useNavigate();

  if (business.subscriptionStatus !== "trialing") return null;

  const trialEndsAt = new Date(business.trialEndsAt).getTime();
  const now = new Date().getTime();
  const daysLeft = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));

  // Only show reminder 1 and 3 days before trial end (and day 0)
  const shouldShow = daysLeft === 3 || daysLeft === 1 || daysLeft === 0;
  if (!shouldShow || daysLeft < 0) return null;

  const getMessage = () => {
    if (daysLeft === 0)
      return "Your trial ends today! Upgrade now to avoid any service interruption.";
    if (daysLeft === 1)
      return "Your trial ends tomorrow! Upgrade now to keep your business running smoothly.";
    return `Your trial ends in 3 days. Upgrade to a paid plan to unlock full potential.`;
  };

  return (
    <div className="bg-indigo-600 text-white px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-indigo-200" />
        <p className="text-sm font-medium">{getMessage()}</p>
      </div>
      <Button
        size="sm"
        onClick={() => navigate("/dashboard/billing")}
        className="bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold text-xs h-8 gap-2"
      >
        Upgrade Now <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
};
