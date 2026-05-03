import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Pricing } from "./Pricing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Loader2,
  CreditCard,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Star,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { Business } from "../types";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { stripePublishableKey, holdsValidStripeKey } from "../lib/stripe";

export const Billing = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success")) {
      toast.success("Payment successful! Your account is being updated.");
      // Remove query params from URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (urlParams.get("canceled")) {
      toast.error("Payment canceled.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!profile?.businessId) return;

    const fetchBusiness = async () => {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", profile.businessId)
          .single();

        if (error) throw error;

        // Map snake_case to camelCase
        const mappedBusiness: Business = {
          id: data.id,
          name: data.name,
          ownerId: data.owner_id,
          plan: data.plan,
          status: data.status,
          industry: data.industry,
          location: data.location,
          subdomain: data.subdomain,
          stripeCustomerId: data.stripe_customer_id,
          stripeSubscriptionId: data.stripe_subscription_id,
          subscriptionStatus: data.subscription_status,
          aiCredits: data.ai_credits || 0,
          aiCreditsUsed: data.ai_credits_used || 0,
          trialEndsAt: data.trial_ends_at
            ? new Date(data.trial_ends_at).getTime()
            : 0,
          marketingStatus: data.marketing_status,
          marketingTrialEndsAt: data.marketing_trial_ends_at
            ? new Date(data.marketing_trial_ends_at).getTime()
            : undefined,
          marketingPlan: data.marketing_plan,
          createdAt: data.created_at
            ? new Date(data.created_at).getTime()
            : Date.now(),
        };

        setBusiness(mappedBusiness);
      } catch (err) {
        console.error("Error fetching business:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [profile?.businessId]);

  const handleManageBilling = async () => {
    if (!business?.stripeCustomerId) {
      toast.error("No active subscription found");
      return;
    }

    setPortalLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: business.stripeCustomerId,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create portal session");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      const message = error.message || "";
      if (
        message.includes("STRIPE_SECRET_KEY") ||
        message.includes("STRIPE_CONFIG_MISSING") ||
        message.includes("STRIPE_INVALID_KEY")
      ) {
        toast.error(
          "Payment system not configured or invalid key. Please contact the Support.",
        );
      } else {
        toast.error(message || "Failed to open billing portal");
      }
    } finally {
      setPortalLoading(false);
    }
  };

  const handleBuyCredits = async (priceId: string) => {
    if (!priceId || priceId === "") {
      toast.error("This bundle is not configured yet.");
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast.error("You must be logged in to purchase credits");
        return;
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId,
          businessId: profile?.businessId,
          customerEmail: profile?.email,
          type: "credits",
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to start checkout");
    }
  };

  const [creditBundles, setCreditBundles] = useState<any[]>([]);

  useEffect(() => {
    const fetchBundles = async () => {
      const { data } = await supabase
        .from("settings")
        .select("content")
        .eq("id", "credit_bundles")
        .maybeSingle();
      if (data?.content?.bundles) {
        setCreditBundles(data.content.bundles);
      }
    };
    fetchBundles();
  }, []);

  const defaultBundles = [
    {
      id: "starter",
      name: "Starter Pack",
      amount: 10,
      price: 10,
      priceId: import.meta.env.VITE_STRIPE_PRICE_10_CREDITS,
    },
    {
      id: "growth",
      name: "Pro Growth",
      amount: 50,
      price: 40,
      priceId: import.meta.env.VITE_STRIPE_PRICE_50_CREDITS,
      bestValue: true,
    },
    {
      id: "agency",
      name: "Agency Bundle",
      amount: 200,
      price: 150,
      priceId: import.meta.env.VITE_STRIPE_PRICE_200_CREDITS,
    },
  ];

  const activeBundles =
    creditBundles.length > 0 ? creditBundles : defaultBundles;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isSubscribed = business?.subscriptionStatus === "active";
  const isTrialing = business?.subscriptionStatus === "trialing";
  const hasStripeSubscription = !!business?.stripeSubscriptionId;

  const handleEndTrialEarly = async () => {
    // This is now handled by picking a plan in the Pricing component,
    // which will use the trial_end in Stripe.
    // If they already have a subscription, this button shouldn't really be here
    // unless we want to manually end the trial in Stripe (which would start billing immediately).
    // The user wants to fulfill the trial, so we just let it run.
    toast.info(
      "Your trial is active. To commit to a plan, please select one below. Your billing will only start after the trial ends.",
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Billing & Subscription
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manage your plan and payment methods.
        </p>
      </div>

      {/* Stripe Operational Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-slate-200 shadow-sm overflow-hidden bg-slate-50/50">
          <CardHeader className="py-4 px-6 border-b border-slate-200">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Merchant Status
            </h3>
          </CardHeader>
          <CardContent className="py-6 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-3 w-3 rounded-full animate-pulse",
                  holdsValidStripeKey()
                    ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
                )}
              />
              <span className="text-sm font-bold text-slate-700">
                {holdsValidStripeKey()
                  ? "Live Connection"
                  : "Offline / Unconfigured"}
              </span>
            </div>
            {stripePublishableKey && (
              <Badge
                variant="outline"
                className="text-[9px] font-bold border-slate-200 text-slate-500"
              >
                {stripePublishableKey.startsWith("pk_test_")
                  ? "TEST MODE"
                  : "PRODUCTION"}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-slate-200 shadow-sm overflow-hidden bg-slate-50/50">
          <CardHeader className="py-4 px-6 border-b border-slate-200">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Security & Compliance
            </h3>
          </CardHeader>
          <CardContent className="py-6 px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-slate-600">
                PCI DSS Level 1 Compliant Payments via Stripe
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-px bg-slate-300 mx-2" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                SSL Secure
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {isTrialing && (
        <Card
          className={cn(
            "border-2",
            hasStripeSubscription
              ? "border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10"
              : "border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10",
          )}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-xl text-white",
                    hasStripeSubscription ? "bg-emerald-500" : "bg-amber-500",
                  )}
                >
                  {hasStripeSubscription ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <AlertCircle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {hasStripeSubscription
                      ? "Subscription Confirmed"
                      : "Trial Period"}
                  </CardTitle>
                  <CardDescription>
                    {hasStripeSubscription
                      ? `Your paid subscription starts on ${new Date(business.trialEndsAt).toLocaleDateString()}`
                      : `Your trial ends on ${new Date(business.trialEndsAt).toLocaleDateString()}`}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "border-2",
                  hasStripeSubscription
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
                )}
              >
                {hasStripeSubscription ? "COMMITTED" : "TRIALING"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {hasStripeSubscription
                ? "You've successfully set up your subscription. You will not be charged until your trial period concludes. Enjoy full access to all features!"
                : "You are currently in your free trial period. Select a plan below to commit to a subscription. Your billing cycle will only begin after your trial expires."}
            </p>
            {!hasStripeSubscription && (
              <Button
                onClick={() => {
                  const pricingSection =
                    document.getElementById("pricing-plans");
                  pricingSection?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              >
                Select a Plan to Commit
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {isSubscribed ? (
        <Card className="border-2 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Active Subscription</CardTitle>
                  <CardDescription className="capitalize">
                    You are currently on the {business?.plan} plan
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
              >
                {business?.subscriptionStatus?.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Payment Method
                  </p>
                  <p className="text-xs text-slate-500">
                    Manage your card and billing history in Stripe
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="rounded-xl gap-2"
                onClick={handleManageBilling}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Manage in Stripe
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-6 rounded-2xl flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400">
              No Active Subscription
            </h3>
            <p className="text-amber-700 dark:text-amber-500 text-sm mb-4">
              Your account is currently in a trial or limited state. Choose a
              plan below to unlock all features and start growing your business.
            </p>
          </div>
        </div>
      )}

      {/* Marketing Hub Add-on */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-indigo-100 shadow-sm overflow-hidden">
          <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Marketing Hub Add-on
                </h2>
              </div>
              <Badge
                variant={
                  business?.marketingStatus === "active"
                    ? "default"
                    : business?.marketingStatus === "trialing"
                      ? "secondary"
                      : "outline"
                }
                className={
                  business?.marketingStatus === "active"
                    ? "bg-indigo-600"
                    : business?.marketingStatus === "trialing"
                      ? "bg-amber-100 text-amber-700 border-none"
                      : "text-slate-400"
                }
              >
                {business?.marketingStatus === "active"
                  ? "Active"
                  : business?.marketingStatus === "trialing"
                    ? "Trialing"
                    : "Not Active"}
              </Badge>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Supercharge your business with AI-powered marketing
                  automations, SEO audits, and social media campaign generators.
                </p>
                <div className="space-y-2">
                  {[
                    "AI SEO Audit & Optimization",
                    "Smart Ad Generator (FB/Google)",
                    "Automated Social Media Planner",
                    "Advanced Lead Filtering",
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[11px] text-slate-500 font-medium"
                    >
                      <div className="h-1 w-1 rounded-full bg-indigo-400" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                {business?.marketingStatus === "active" ? (
                  <div className="text-center space-y-3">
                    <div className="bg-emerald-100 text-emerald-700 w-fit mx-auto px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                      Premium Active
                    </div>
                    <p className="text-xs text-slate-500">
                      You have full access to all marketing automation tools.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full h-10 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      Manage Subscription
                    </Button>
                  </div>
                ) : business?.marketingStatus === "trialing" ? (
                  <div className="text-center space-y-4">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-slate-900">
                        {business.marketingTrialEndsAt
                          ? Math.max(
                              0,
                              Math.ceil(
                                (business.marketingTrialEndsAt - Date.now()) /
                                  (1000 * 60 * 60 * 24),
                              ),
                            )
                          : 0}{" "}
                        Days Left
                      </div>
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">
                        Free Trial Period
                      </p>
                    </div>
                    <Button
                      className="w-full h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                      onClick={() =>
                        toast.info("Checkout for Marketing Hub coming soon!")
                      }
                    >
                      Upgrade to Marketing Pro
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-slate-900">
                        $49/mo
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest italic">
                        Marketing Hub Pro Add-on
                      </p>
                    </div>
                    <Button
                      className="w-full h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                      onClick={() => navigate("/marketing-hub")}
                    >
                      Start Free Trial
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Credits Section */}
      <Card className="border-2 border-indigo-100 dark:border-indigo-900/30 overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" /> AI Production
              Credits
            </CardTitle>
            <CardDescription>
              Credits used for AI website and content generation.
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white font-black px-4 py-1.5 rounded-full text-base">
              {business?.aiCredits || 0} TOTAL
            </Badge>
            <span className="text-[10px] text-slate-400 font-medium px-2">
              {business?.aiCreditsUsed || 0} Credits Used
            </span>
          </div>
        </CardHeader>
        <CardContent className="py-8 space-y-8">
          <div className="space-y-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">Usage Progress</span>
              <span className="font-bold text-indigo-600">
                {Math.min(
                  100,
                  Math.round(
                    ((business?.aiCreditsUsed || 0) /
                      (business?.aiCredits || 1)) *
                      100,
                  ),
                )}
                %
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, ((business?.aiCreditsUsed || 0) / (business?.aiCredits || 1)) * 100)}%`,
                }}
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  (business?.aiCreditsUsed || 0) / (business?.aiCredits || 1) >
                    0.9
                    ? "bg-red-500"
                    : "bg-indigo-600",
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeBundles.map((bundle) => (
              <div
                key={bundle.id}
                className={cn(
                  "space-y-2 p-6 rounded-2xl border transition-all text-center group",
                  bundle.bestValue
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 relative shadow-xl shadow-indigo-100 dark:shadow-none sm:scale-105"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200",
                )}
              >
                {bundle.bestValue && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                    Best Value
                  </div>
                )}
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {bundle.name}
                </h4>
                <p className="text-3xl font-black text-indigo-600">
                  ${bundle.price}
                </p>
                <p className="text-xs text-slate-500 pb-4">
                  {bundle.amount} AI Credits
                </p>
                <Button
                  variant={bundle.bestValue ? "default" : "outline"}
                  className={cn(
                    "w-full rounded-xl font-bold transition-all",
                    bundle.bestValue
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                      : "group-hover:bg-indigo-600 group-hover:text-white",
                  )}
                  onClick={() => handleBuyCredits(bundle.priceId)}
                >
                  Buy Now
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50/30 dark:bg-slate-800/20 py-4 px-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="h-4 w-4 text-slate-400" />
            <span>
              AI Credits never expire. Consumed per generation: Website (3),
              Blog Post (1).
            </span>
          </div>
        </CardFooter>
      </Card>

      <div id="pricing-plans" className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
          Available Plans
        </h2>
        <Pricing currentPlan={business?.plan} />
      </div>
    </div>
  );
};
