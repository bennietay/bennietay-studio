/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/contexts/AuthContext";
import { supabase } from "@/src/lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Helmet } from "react-helmet-async";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Loader2,
  Save,
  Building2,
  Globe,
  MapPin,
  Briefcase,
  Clock,
  AlertCircle,
  Lock,
  Check,
  Link2,
  Settings,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Business } from "../types";
import { useFeatures } from "../hooks/useFeatures";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Shield,
  CheckCircle2,
  Globe2,
  ExternalLink,
  Cpu,
  Zap,
  BrainCircuit,
} from "lucide-react";
import {
  AI_MODELS,
  USE_CASE_LABELS,
  AIUseCase,
  DEFAULT_MODEL_CONFIG,
} from "../constants/aiModels";

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Real Estate",
  "Retail",
  "Manufacturing",
  "Hospitality",
  "Consulting",
  "Other",
];

const BUSINESS_TYPES = [
  "Aesthetic Clinic",
  "Law Firm",
  "Creative Agency",
  "Fitness Studio",
  "Wealth Management",
  "Architecture Firm",
  "Luxury Real Estate",
  "Tech Startup",
  "Other",
];

export function BusinessSettings() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { isFeatureEnabled } = useFeatures();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [showManualStripe, setShowManualStripe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!business?.trialEndsAt) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = business.trialEndsAt! - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [business?.trialEndsAt]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "stripe_connected") {
      toast.success("Stripe account connected successfully!");
      // Refresh URL to remove params
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      toast.error(`Stripe connection failed: ${error}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!profile?.businessId) {
      setLoading(false);
      return;
    }

    const fetchBusiness = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", profile.businessId)
          .maybeSingle();

        if (error) {
          console.error("Supabase error fetching business:", error);
          // Check if it's a permission error (RLS)
          if (error.code === "42501") {
            setError("Permission denied. We are initializing your access permissions. Please wait a moment or refresh.");
          } else {
            setError(error.message);
          }
          throw error;
        }

        if (data) {
          setBusiness({
            id: data.id,
            name: data.name,
            ownerId: data.owner_id,
            plan: data.plan,
            status: data.status,
            industry: data.industry,
            businessNature: data.business_nature,
            location: data.location,
            subdomain: data.subdomain,
            customDomain: data.custom_domain,
            businessType: data.business_type,
            trialEndsAt: data.trial_ends_at
              ? new Date(data.trial_ends_at).getTime()
              : undefined,
            stripeCustomerId: data.stripe_customer_id,
            stripeSubscriptionId: data.stripe_subscription_id,
            stripeSecretKey: data.stripe_secret_key,
            stripePublishableKey: data.stripe_publishable_key,
            stripeWebhookSecret: data.stripe_webhook_secret,
            stripeConnectedAccountId: data.stripe_connected_account_id,
            subscriptionStatus: data.subscription_status,
            aiCredits: data.ai_credits || 0,
            aiCreditsUsed: data.ai_credits_used || 0,
            gaMeasurementId: data.ga_measurement_id,
            metaPixelId: data.meta_pixel_id,
            trackingScriptsHeader: data.tracking_scripts_header,
            trackingScriptsFooter: data.tracking_scripts_footer,
            aiModelConfig: data.ai_model_config || DEFAULT_MODEL_CONFIG,
            createdAt: new Date(data.created_at).getTime(),
          });
          if (data.stripe_secret_key || data.stripe_publishable_key) {
            setShowManualStripe(true);
          }
        } else {
          console.warn(`[Settings] No business record found for ID: ${profile.businessId}`);
          setError("Your business record could not be found. If you recently completed onboarding, please wait a minute for synchronization.");
        }
      } catch (err: any) {
        console.error("Error fetching business:", err);
        if (!error) setError("An unexpected error occurred while connecting to your business engine.");
        toast.error("Failed to load business settings");
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [profile?.businessId]);

  const handleSave = async () => {
    if (!business || !profile?.businessId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          name: business.name,
          industry: business.industry,
          business_type: business.businessType,
          business_nature: business.businessNature,
          location: business.location,
          subdomain: business.subdomain,
          custom_domain: business.customDomain,
          ga_measurement_id: business.gaMeasurementId,
          meta_pixel_id: business.metaPixelId,
          tracking_scripts_header: business.trackingScriptsHeader,
          tracking_scripts_footer: business.trackingScriptsFooter,
          stripe_secret_key: business.stripeSecretKey,
          stripe_publishable_key: business.stripePublishableKey,
          stripe_webhook_secret: business.stripeWebhookSecret,
          stripe_connected_account_id: business.stripeConnectedAccountId,
          ai_model_config: business.aiModelConfig || DEFAULT_MODEL_CONFIG,
          trial_ends_at: business.trialEndsAt
            ? new Date(business.trialEndsAt).toISOString()
            : null,
          plan: business.plan,
          ai_credits: business.aiCredits,
          status: business.status,
        })
        .eq("id", profile.businessId);

      if (error) throw error;
      toast.success("Business settings updated successfully");
    } catch (err: any) {
      console.error("Error updating business:", err);
      toast.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const [fetchingPlans, setFetchingPlans] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.role !== "super_admin") return;

    const fetchPlans = async () => {
      setFetchingPlans(true);
      try {
        const { data } = await supabase
          .from("settings")
          .select("content")
          .eq("id", "plans")
          .maybeSingle();

        if (data?.content?.pricing) {
          setAvailablePlans(data.content.pricing);
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
      } finally {
        setFetchingPlans(false);
      }
    };
    fetchPlans();
  }, [profile?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
          <CardContent className="p-12 text-center">
            <div className="h-32 w-32 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner group transition-transform hover:scale-110 duration-500">
              <Globe className="h-14 w-14 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
            </div>

            <Badge className="mb-6 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 border-none font-black px-4 py-1.5 rounded-full text-[10px] tracking-widest uppercase">
              Operational Status: Disconnected
            </Badge>

            <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6 leading-tight">
              Domain <span className="text-indigo-600 italic">Offline</span>.
            </h2>

            <p className="text-slate-500 dark:text-slate-400 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
              {error ? error : "Your business core has not been synthesized. To deploy your infrastructure and activate your digital presence, you must initialize the generative business engine."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => navigate("/dashboard/website/regenerate")}
                size="lg"
                className="w-full sm:w-auto h-20 px-12 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] group"
              >
                <Zap className="mr-2 h-5 w-5 fill-current group-hover:animate-pulse" />
                Initialize Engine
              </Button>

              <Button
                onClick={async () => {
                  try {
                    await supabase
                      .from("profiles")
                      .update({ onboarding_completed: false })
                      .eq("id", profile?.uid);
                    window.location.reload();
                  } catch (e) {
                    toast.error("Failed to reset onboarding");
                  }
                }}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-20 px-10 rounded-3xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest hover:bg-slate-50"
              >
                Restart Onboarding
              </Button>
            </div>

            <div className="mt-16 pt-10 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-indigo-600 font-black text-xl mb-1 uppercase tracking-tighter">
                  AI-Sync
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Automated Framework
                </p>
              </div>
              <div className="text-center">
                <div className="text-indigo-600 font-black text-xl mb-1 uppercase tracking-tighter">
                  1-Click
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Rapid Deployment
                </p>
              </div>
              <div className="text-center">
                <div className="text-indigo-600 font-black text-xl mb-1 uppercase tracking-tighter">
                  GEO-Ready
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Engine Optimized
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trialDaysLeft = business.trialEndsAt
    ? Math.ceil((business.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <Helmet>
        <title>
          {business?.name
            ? `${business.name} | Business Settings`
            : "Business Settings"}
        </title>
        <meta
          name="description"
          content={`Configure core infrastructure, AI orchestration, and deployment settings for ${business?.name || "your enterprise"}.`}
        />
      </Helmet>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Business Settings
          </h1>
          <p className="text-slate-500">
            Manage your business profile and subscription.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {business.trialEndsAt && trialDaysLeft > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-indigo-900">Free Trial Active</h3>
            <p className="text-indigo-700 text-sm">
              Your 14-day free trial ends in{" "}
              <span className="font-bold font-mono">
                {timeLeft || `${trialDaysLeft} days`}
              </span>
              . Billing will start automatically after the trial ends.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-100"
            onClick={() => navigate("/dashboard/billing")}
          >
            Upgrade Now
          </Button>
        </div>
      )}

      {business.trialEndsAt &&
        trialDaysLeft <= 0 &&
        !business.subscriptionStatus && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-900">Trial Expired</h3>
              <p className="text-red-700 text-sm">
                Your free trial has ended. Please upgrade your plan to continue
                using all features.
              </p>
            </div>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => navigate("/dashboard/billing")}
            >
              Upgrade Plan
            </Button>
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              General Information
            </CardTitle>
            <CardDescription>
              Basic details about your business.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                value={business.name}
                onChange={(e) =>
                  setBusiness({ ...business, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={business.industry || ""}
                onValueChange={(value) =>
                  setBusiness({ ...business, industry: value })
                }
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="businessType">Business Type</Label>
              <Select
                value={business.businessType || ""}
                onValueChange={(value) =>
                  setBusiness({ ...business, businessType: value })
                }
              >
                <SelectTrigger id="businessType">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="businessNature">
                Business Description (Nature)
              </Label>
              <Textarea
                id="businessNature"
                className="min-h-[100px]"
                value={business.businessNature || ""}
                onChange={(e) =>
                  setBusiness({ ...business, businessNature: e.target.value })
                }
                placeholder="Briefly describe what your business does..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="location"
                  className="pl-10"
                  value={business.location || ""}
                  onChange={(e) =>
                    setBusiness({ ...business, location: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {profile?.role === "super_admin" && (
          <Card className="md:col-span-2 shadow-lg border-indigo-200 bg-indigo-50/10 overflow-hidden ring-1 ring-indigo-500/10">
            <CardHeader className="pb-3 border-b border-indigo-100/50 bg-white/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <BrainCircuit className="h-5 w-5 text-indigo-600" />
                  AI Model Orchestration
                </CardTitle>
                <Badge className="bg-indigo-600 text-white border-transparent">
                  ACTIVE
                </Badge>
              </div>
              <CardDescription className="text-indigo-700/70">
                Customize the AI engines powering your synthesis, SEO, and
                content strategy.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {(Object.keys(USE_CASE_LABELS) as AIUseCase[]).map((useCase) => (
                <div key={useCase} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                      {USE_CASE_LABELS[useCase]}
                    </Label>
                    <Cpu className="h-3 w-3 text-indigo-400" />
                  </div>

                  <Select
                    value={
                      business.aiModelConfig?.[useCase] ||
                      DEFAULT_MODEL_CONFIG[useCase]
                    }
                    onValueChange={(value) =>
                      setBusiness({
                        ...business,
                        aiModelConfig: {
                          ...(business.aiModelConfig || DEFAULT_MODEL_CONFIG),
                          [useCase]: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="h-12 border-indigo-100 bg-white hover:border-indigo-300 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex flex-col gap-0.5 py-1">
                            <span className="font-bold text-slate-900 flex items-center gap-2">
                              {model.name}
                              <Badge
                                variant="outline"
                                className={`text-[8px] h-4 font-black uppercase ${model.provider === "gemini" ? "border-blue-100 bg-blue-50 text-blue-600" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                              >
                                {model.provider}
                              </Badge>
                              {model.id === DEFAULT_MODEL_CONFIG[useCase] && (
                                <Badge
                                  variant="outline"
                                  className="text-[8px] h-4 border-indigo-200 text-indigo-400 font-black"
                                >
                                  DEFAULT
                                </Badge>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 leading-tight">
                              {model.description}
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-1 w-3 rounded-full ${i < model.costLevel ? "bg-indigo-400/60" : "bg-slate-100"}`}
                                />
                              ))}
                              <span className="text-[8px] font-black uppercase text-slate-400 ml-1">
                                Energy Demand
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
            <CardFooter className="bg-indigo-50/30 border-t border-indigo-100/50 py-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-700 uppercase tracking-widest">
                <Zap className="h-3 w-3 animate-pulse" />
                Real-time adaptive synthesis enabled.
              </div>
            </CardFooter>
          </Card>
        )}

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              Online Presence
            </CardTitle>
            <CardDescription>How your business appears online.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex items-center">
                <Input
                  id="subdomain"
                  className="rounded-r-none"
                  value={business.subdomain || ""}
                  onChange={(e) =>
                    setBusiness({ ...business, subdomain: e.target.value })
                  }
                />
                <div className="bg-slate-100 border border-l-0 border-slate-200 px-3 py-2 rounded-r-md text-sm text-slate-500">
                  .bennietay.com
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gaId">
                Google Analytics Measurement ID (GA4)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gaId"
                  placeholder="e.g. G-XXXXXXXXXX"
                  value={business.gaMeasurementId || ""}
                  onChange={(e) =>
                    setBusiness({
                      ...business,
                      gaMeasurementId: e.target.value,
                    })
                  }
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Your web tracking code for Google Analytics 4. This will enable
                session tracking on your website.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="metaPixelId">Meta Pixel ID</Label>
              <Input
                id="metaPixelId"
                placeholder="e.g. 1234567890"
                value={business.metaPixelId || ""}
                onChange={(e) =>
                  setBusiness({ ...business, metaPixelId: e.target.value })
                }
              />
              <p className="text-[10px] text-slate-400">
                Your Meta (Facebook) Pixel ID for tracking conversions and
                retargeting.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="headerScripts">Custom Header Scripts</Label>
              <Textarea
                id="headerScripts"
                placeholder="<!-- Any script to be placed in <head> -->"
                className="font-mono text-xs min-h-[100px]"
                value={business.trackingScriptsHeader || ""}
                onChange={(e) =>
                  setBusiness({
                    ...business,
                    trackingScriptsHeader: e.target.value,
                  })
                }
              />
              <p className="text-[10px] text-slate-400">
                Custom scripts (e.g. Hotjar, LinkedIn Insight) to be placed in
                the &lt;head&gt; tag.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="footerScripts">Custom Footer Scripts</Label>
              <Textarea
                id="footerScripts"
                placeholder="<!-- Any script to be placed before </body> -->"
                className="font-mono text-xs min-h-[100px]"
                value={business.trackingScriptsFooter || ""}
                onChange={(e) =>
                  setBusiness({
                    ...business,
                    trackingScriptsFooter: e.target.value,
                  })
                }
              />
              <p className="text-[10px] text-slate-400">
                Custom scripts to be placed at the end of the &lt;body&gt; tag.
              </p>
            </div>
          </CardContent>
        </Card>
        {isFeatureEnabled("custom_domain") && (
          <Card className="shadow-sm border-slate-200 relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-indigo-600" />
                Custom Domain
              </CardTitle>
              <CardDescription>Connect your own domain name.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="customDomain">Custom Domain</Label>
                <div className="flex gap-2">
                  <Input
                    id="customDomain"
                    placeholder="e.g. www.yourdomain.com"
                    value={business.customDomain || ""}
                    onChange={(e) =>
                      setBusiness({ ...business, customDomain: e.target.value })
                    }
                  />
                  <Button variant="outline" className="shrink-0">
                    Verify
                  </Button>
                </div>
              </div>

              {business.customDomain && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      DNS Configuration
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-600 border-amber-100"
                    >
                      Pending Verification
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        CNAME Record
                      </span>
                      <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-xs font-mono">
                        <span>www</span>
                        <span className="text-indigo-600">
                          cname.bennietay.com
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        A Record
                      </span>
                      <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-xs font-mono">
                        <span>@</span>
                        <span className="text-indigo-600">76.76.21.21</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    DNS changes can take up to 48 hours to propagate globally.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-600" />
              Payment Integration (Direct-to-Merchant)
            </CardTitle>
            <CardDescription>
              Connect your own Stripe account to receive payments directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {business.stripeConnectedAccountId ? (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Check className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">
                        Stripe Connected
                      </p>
                      <p className="text-xs text-emerald-700">
                        Account ID: {business.stripeConnectedAccountId}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    onClick={() =>
                      setBusiness({
                        ...business,
                        stripeConnectedAccountId: undefined,
                      })
                    }
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4 border-b border-slate-100 italic">
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-600">
                    The easiest way to get paid. Connect your Stripe account
                    with one click.
                  </p>
                  <Button
                    className="w-full bg-[#635bff] hover:bg-[#5851e0] text-white flex items-center justify-center gap-2 h-11"
                    disabled={connectingStripe}
                    onClick={async () => {
                      if (!business) return;
                      setConnectingStripe(true);
                      try {
                        const {
                          data: { session },
                        } = await supabase.auth.getSession();
                        const response = await fetch(
                          `/api/stripe/connect/${business.id}`,
                          {
                            headers: {
                              Authorization: `Bearer ${session?.access_token}`,
                            },
                          },
                        );
                        const data = await response.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else if (data.isConfigError && profile?.role === "super_admin") {
                          toast.error(data.error, {
                            action: {
                              label: "Configure Now",
                              onClick: () => navigate("/admin/settings"),
                            },
                            duration: 10000,
                          });
                          setConnectingStripe(false);
                        } else {
                          toast.error(
                            data.error || "Failed to start Stripe connection",
                          );
                          setConnectingStripe(false);
                        }
                      } catch (err) {
                        toast.error("Failed to connect to Stripe");
                        setConnectingStripe(false);
                      }
                    }}
                  >
                    {connectingStripe ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    {connectingStripe
                      ? "Connecting..."
                      : "Connect with Stripe"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-px bg-slate-100 flex-1" />
                  <button
                    type="button"
                    onClick={() => setShowManualStripe(!showManualStripe)}
                    className="text-[10px] text-slate-400 hover:text-primary font-bold uppercase tracking-wider transition-colors"
                  >
                    {showManualStripe
                      ? "Hide Manual Setup"
                      : "or provide keys manually"}
                  </button>
                  <div className="h-px bg-slate-100 flex-1" />
                </div>
              </div>
            )}

            {showManualStripe && (
              <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="text-xs text-amber-800">
                      <p className="font-bold mb-1">Direct-to-Merchant Mode</p>
                      <p>
                        By providing your own Stripe keys, customers will pay
                        you directly. You are responsible for managing your own
                        Stripe dashboard and refunds.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="stripePublishableKey">
                      Stripe Publishable Key
                    </Label>
                    <Input
                      id="stripePublishableKey"
                      placeholder="pk_test_..."
                      value={business.stripePublishableKey || ""}
                      onChange={(e) =>
                        setBusiness({
                          ...business,
                          stripePublishableKey: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-slate-400 font-mono italic">
                      Starts with pk_test_... or pk_live_...
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                    <Input
                      id="stripeSecretKey"
                      type="password"
                      placeholder="sk_test_..."
                      value={business.stripeSecretKey || ""}
                      onChange={(e) =>
                        setBusiness({
                          ...business,
                          stripeSecretKey: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-slate-400 font-mono italic">
                      Starts with sk_test_... or sk_live_...
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="stripeWebhookSecret">
                      Stripe Webhook Secret (Optional)
                    </Label>
                    <Input
                      id="stripeWebhookSecret"
                      type="password"
                      placeholder="whsec_..."
                      value={business.stripeWebhookSecret || ""}
                      onChange={(e) =>
                        setBusiness({
                          ...business,
                          stripeWebhookSecret: e.target.value,
                        })
                      }
                    />
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Your Webhook URL
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-[10px] bg-white px-2 py-1 rounded border border-slate-200 flex-1 break-all">
                          {`${window.location.origin}/api/webhook?businessId=${business.id}`}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/api/webhook?businessId=${business.id}`,
                            );
                            toast.success("Webhook URL copied");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">
                        Copy this URL to your Stripe Dashboard Webhooks to
                        receive payment notifications.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100 py-3 text-[10px] text-slate-400 italic">
            You can find these keys in your{" "}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 underline"
            >
              Stripe Dashboard
            </a>
            .
          </CardFooter>
        </Card>

        {profile?.role === "super_admin" && (
          <Card className="md:col-span-2 shadow-sm border-indigo-200 bg-indigo-50/20 ring-1 ring-indigo-500/10">
            <CardHeader className="border-b border-indigo-100/50 bg-white/40">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  Super Admin: Power Controls
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white text-[10px] uppercase font-black"
                    onClick={() => navigate("/admin/plans")}
                  >
                    <Settings className="h-3 w-3 mr-1" /> Manage Global Plans
                  </Button>
                </div>
              </div>
              <CardDescription>
                Override billing, credits, and infrastructure settings for this
                account.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-indigo-600">
                  Subscription Tier
                </Label>
                <Select
                  value={business.plan || "starter"}
                  onValueChange={(val) =>
                    setBusiness({ ...business, plan: val })
                  }
                >
                  <SelectTrigger className="h-11 bg-white border-indigo-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    {availablePlans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-indigo-600">
                  AI Credits (Override)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={business.aiCredits || 0}
                    onChange={(e) =>
                      setBusiness({
                        ...business,
                        aiCredits: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-11 bg-white border-indigo-100"
                  />
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter shrink-0">
                    Used: {business.aiCreditsUsed || 0}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-indigo-600">
                  Trial End Transition
                </Label>
                <Input
                  type="datetime-local"
                  value={
                    business.trialEndsAt
                      ? new Date(business.trialEndsAt)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setBusiness({
                      ...business,
                      trialEndsAt: new Date(e.target.value).getTime(),
                    })
                  }
                  className="h-11 bg-white border-indigo-100"
                />
              </div>

              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="bg-white text-xs font-bold"
                  onClick={() => {
                    const newDate = new Date();
                    newDate.setDate(newDate.getDate() + 7);
                    setBusiness({
                      ...business,
                      trialEndsAt: newDate.getTime(),
                    });
                  }}
                >
                  +7 Day Trial
                </Button>
                <Button
                  variant="outline"
                  className="bg-white text-xs font-bold"
                  onClick={() => {
                    const newDate = new Date();
                    newDate.setDate(newDate.getDate() + 30);
                    setBusiness({
                      ...business,
                      trialEndsAt: newDate.getTime(),
                    });
                  }}
                >
                  +30 Day Trial
                </Button>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
                  onClick={() => {
                    setBusiness({
                      ...business,
                      aiCredits: (business.aiCredits || 0) + 100,
                    });
                  }}
                >
                  Refill 100 Credits
                </Button>
                <Button
                  variant="destructive"
                  className="text-xs font-bold"
                  onClick={() => {
                    if (
                      confirm("Suspend this business? Website will go offline.")
                    ) {
                      setBusiness({ ...business, status: "inactive" });
                    }
                  }}
                >
                  Suspend Domain
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
