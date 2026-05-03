import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  Sparkles,
  FileText,
  MessageSquare,
  Star,
  ArrowRight,
  Zap,
  Target,
  BarChart3,
  Users,
  Search,
  Mail,
  Megaphone,
  Loader2,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCcw,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useFeatures, FeatureId } from "../hooks/useFeatures";
import { generateMarketingContent } from "../lib/gemini";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function MarketingHub() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { isFeatureEnabled } = useFeatures();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [platformConfig, setPlatformConfig] = useState<any>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isTrialDialogOpen, setIsTrialDialogOpen] = useState(false);

  // Feature Specific States
  const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isCopywriterModalOpen, setIsCopywriterModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [seoResult, setSeoResult] = useState<any>(null);
  const [adResult, setAdResult] = useState<any>(null);
  const [copywriterResult, setCopywriterResult] = useState<any>(null);
  const [copywriterGoal, setCopywriterGoal] = useState("");

  const [isApplyingFix, setIsApplyingFix] = useState<string | null>(null);
  const [fixedIssues, setFixedIssues] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!profile?.uid) return;

        console.log("Fetching Marketing Hub Config and Business Data...");
        const results = await Promise.allSettled([
          supabase
            .from("settings")
            .select("*")
            .eq("id", "marketing_hub_config")
            .maybeSingle(),
          supabase
            .from("businesses")
            .select("*")
            .eq("id", profile.businessId)
            .maybeSingle(),
        ]);

        const settingsResult = results[0];
        const bizResult = results[1];

        if (
          settingsResult.status === "fulfilled" &&
          settingsResult.value.data
        ) {
          console.log(
            "Marketing Hub Config Found:",
            settingsResult.value.data.content,
          );
          setPlatformConfig(settingsResult.value.data.content);
        } else {
          const error =
            settingsResult.status === "rejected"
              ? settingsResult.reason
              : settingsResult.value?.error;
          console.log("Marketing Hub Config NOT Found or Error:", error);
          // Fallback
          setPlatformConfig({
            marketingFeatures: {
              seoAudit: "coming_soon",
              adGenerator: "coming_soon",
            },
          });
        }

        if (bizResult.status === "fulfilled" && bizResult.value.data) {
          setBusiness(bizResult.value.data);
        } else {
          const error =
            bizResult.status === "rejected"
              ? bizResult.reason
              : bizResult.value?.error;
          console.error(
            "Error fetching business data (likely missing columns):",
            error,
          );
          // If columns are missing, bizResult.value.data might be null or undefined
        }
      } catch (err) {
        console.error("Unexpected error in Marketing Hub fetchData:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const handleStartTrial = async () => {
    try {
      if (!business?.id) {
        throw new Error(
          "No business found to start trial for. Please set up your business first.",
        );
      }
      setLoading(true);
      const trialDuration = 14; // Default 14 day trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDuration);

      const { error } = await supabase
        .from("businesses")
        .update({
          marketing_status: "trialing",
          marketing_trial_ends_at: trialEndsAt.toISOString(),
          marketing_plan: "none", // Still on none, but trialing
        })
        .eq("id", business.id);

      if (error) throw error;

      setBusiness({
        ...business,
        marketing_status: "trialing",
        marketing_trial_ends_at: trialEndsAt.toISOString(),
        marketing_plan: "none",
      });

      toast.success(
        `Your ${trialDuration}-day Marketing Hub trial has started!`,
      );
      setIsTrialDialogOpen(false);
    } catch (err: any) {
      toast.error("Failed to start trial: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getToolStatus = (toolId: string) => {
    if (
      toolId === "copywriter" ||
      toolId === "blog" ||
      toolId === "leads" ||
      toolId === "reviews"
    ) {
      return "active";
    }

    if (!platformConfig?.marketingFeatures) {
      console.log(
        `[getToolStatus] No platformConfig.marketingFeatures for ${toolId}`,
      );
      return "coming_soon";
    }

    const status =
      platformConfig.marketingFeatures[
        toolId === "seo" ? "seoAudit" : "adGenerator"
      ];
    console.log(`[getToolStatus] toolId: ${toolId}, status: ${status}`);
    return status || "coming_soon";
  };

  const checkAccess = (toolId: string) => {
    // Platform level check
    const status = getToolStatus(toolId);
    if (status === "disabled") return false;
    if (status === "coming_soon") return "coming_soon";

    // Feature gate checks
    if (toolId === "seo" && !isFeatureEnabled("advanced_seo")) return "upsell";
    if (toolId === "ads" && !isFeatureEnabled("advanced_seo")) return "upsell";
    if (toolId === "leads" && !isFeatureEnabled("lead_crm")) return "upsell";
    if (toolId === "reviews" && !isFeatureEnabled("review_management"))
      return "upsell";
    if (toolId === "blog" && !isFeatureEnabled("ai_synthesis")) return "upsell";

    // Business level check for premium features (SEO and Ads are premium automations)
    if (["seo", "ads"].includes(toolId)) {
      if (
        business?.marketing_plan === "active" ||
        business?.marketing_status === "trialing" ||
        business?.marketing_status === "active"
      ) {
        return true;
      }
      return "upsell";
    }

    return true; // Other tools might be free or part of base plan
  };

  const handleToolAction = (tool: any) => {
    const access = checkAccess(tool.id);

    if (access === "upsell") {
      setIsTrialDialogOpen(true);
      return;
    }

    if (access === "coming_soon") {
      toast.info("This feature is coming soon!");
      return;
    }

    if (!access) {
      toast.error("This feature is currently disabled by the administrator.");
      return;
    }

    if (tool.id === "seo") {
      setIsSeoModalOpen(true);
    } else if (tool.id === "ads") {
      setIsAdModalOpen(true);
    } else if (tool.id === "copywriter") {
      setIsCopywriterModalOpen(true);
    } else {
      tool.action();
    }
  };

  const handleGenerateAd = async () => {
    setIsGenerating(true);
    try {
      // Fetch website info for better prompt
      const { data: website } = await supabase
        .from("websites")
        .select("*")
        .eq("business_id", business.id)
        .single();

      const result = await generateMarketingContent("ad_copy", {
        id: business.id, // Add ID for credit tracking
        name: business.name,
        industry: business.industry,
        description:
          business.business_nature || website?.seo?.description || "",
        location: business.location,
      });

      setAdResult(result);
    } catch (err: any) {
      toast.error("Failed to generate ads: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCopy = async () => {
    setIsGenerating(true);
    try {
      const { data: website } = await supabase
        .from("websites")
        .select("*")
        .eq("business_id", business.id)
        .single();

      const result = await generateMarketingContent("ad_copy", {
        id: business.id,
        name: business.name,
        industry: business.industry,
        description: `${business.business_nature || website?.seo?.description || ""}. Goal: ${copywriterGoal}`,
        location: business.location,
      });

      setCopywriterResult(result);
      toast.success("Copy variations generated!");
    } catch (err: any) {
      toast.error("Failed to generate copy: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyFix = async (issueIndex: number, issue: any) => {
    setIsApplyingFix(`fix-${issueIndex}`);
    try {
      // 1. Fetch current website config
      const { data: website, error: fetchError } = await supabase
        .from("websites")
        .select("*")
        .eq("business_id", business.id)
        .single();

      if (fetchError) throw fetchError;

      // 2. Prepare updated SEO object
      const updatedSeo = { ...(website.seo || {}) };

      if (issue.fixType === "title") {
        updatedSeo.title = issue.solution;
      } else if (issue.fixType === "description") {
        updatedSeo.description = issue.solution;
      } else if (issue.fixType === "keywords") {
        // Simple append or replace? Let's intelligently merge or replace if it's a list
        if (
          typeof issue.solution === "string" &&
          issue.solution.includes(",")
        ) {
          updatedSeo.keywords = issue.solution
            .split(",")
            .map((s: string) => s.trim());
        } else {
          updatedSeo.keywords = Array.isArray(updatedSeo.keywords)
            ? [...new Set([...updatedSeo.keywords, issue.solution])]
            : [issue.solution];
        }
      }

      // 3. Update the website
      const { error: updateError } = await supabase
        .from("websites")
        .update({ seo: updatedSeo })
        .eq("id", website.id);

      if (updateError) throw updateError;

      setFixedIssues((prev) => [...prev, issueIndex]);
      toast.success("SEO fix applied successfully!");
    } catch (err: any) {
      console.error("Failed to apply SEO fix:", err);
      toast.error("Failed to apply fix: " + err.message);
    } finally {
      setIsApplyingFix(null);
    }
  };

  const handleRunSeoAudit = async () => {
    setIsGenerating(true);
    setFixedIssues([]);
    try {
      // Fetch website info
      const { data: website } = await supabase
        .from("websites")
        .select("*")
        .eq("business_id", business.id)
        .single();

      const result = await generateMarketingContent("seo_audit", {
        name: business.name,
        industry: business.industry,
        description: business.business_nature || "",
        location: business.location || "",
        targetAudience: website?.seo?.targetAudience || "General Public",
        currentSeo: website?.seo || {},
      });

      setSeoResult(result);
      toast.success("SEO Audit complete!");
    } catch (err: any) {
      toast.error("Failed to run SEO audit: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const tools = [
    {
      id: "copywriter",
      title: "AI Copywriter",
      desc: "Generate high-converting sales copy, ad headlines, and website content optimized for your niche.",
      icon: Sparkles,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      action: () => {},
      status: "active",
    },
    {
      id: "blog",
      title: "Blog Automation",
      desc: "Let AI research and draft SEO-optimized articles for your business on a weekly schedule.",
      icon: FileText,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      action: () => navigate("/dashboard/blog"),
      status: "active",
    },
    {
      id: "leads",
      title: "Email Seeding",
      desc: "Connect with your captured leads and draft personalized follow-up campaigns automatically.",
      icon: MessageSquare,
      color: "text-blue-600",
      bg: "bg-blue-50",
      action: () => navigate("/dashboard/leads"),
      status: "active",
    },
    {
      id: "reviews",
      title: "Review Booster",
      desc: "Automatically request reviews from happy customers and boost your Google/Yelp rankings.",
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
      action: () => navigate("/dashboard/reviews"),
      status: "active",
    },
    {
      id: "seo",
      title: "SEO Audit",
      desc: "Scan your website for SEO gaps and get a prioritized list of improvements to rank higher.",
      icon: Search,
      color: "text-purple-600",
      bg: "bg-purple-50",
      action: () => {},
      status: getToolStatus("seo"),
    },
    {
      id: "ads",
      title: "Ad Generator",
      desc: "Create Facebook and Google Ad headlines and descriptions that actually convert.",
      icon: Megaphone,
      color: "text-red-600",
      bg: "bg-red-50",
      action: () => {},
      status: getToolStatus("ads"),
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!business && !loading) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in fade-in duration-700">
        <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Megaphone className="h-10 w-10 text-slate-300" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
          Marketing Engine Offline.
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-sm mx-auto">
          To activate AI SEO audits and automated ad generation, you must first
          initialize your business infrastructure.
        </p>
        <Button
          onClick={() => navigate("/dashboard/website/regenerate")}
          size="lg"
          className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200"
        >
          Synthesize Business Ecosystem
        </Button>
      </div>
    );
  }

  const isTrialActive = business?.marketing_status === "trialing";
  const hasMarketingPlan =
    business?.marketing_plan === "active" ||
    business?.marketing_status === "active";

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      <motion.div
        variants={fadeInUp}
        className="flex justify-between items-end"
      >
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Marketing Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Accelerate your business growth with AI-powered marketing
            automations.
          </p>
        </div>

        {isTrialActive && (
          <Badge className="bg-amber-50 text-amber-600 border-amber-200 px-4 py-2 rounded-full flex items-center gap-2">
            <Clock className="h-4 w-4" /> Trial active until{" "}
            {new Date(business.marketing_trial_ends_at).toLocaleDateString()}
          </Badge>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <motion.div
            key={tool.id}
            variants={fadeInUp}
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm transition-all group flex flex-col justify-between relative overflow-hidden"
          >
            {checkAccess(tool.id) === "upsell" && (
              <div className="absolute top-0 right-0 p-4">
                <Lock className="h-5 w-5 text-slate-300" />
              </div>
            )}

            <div>
              <div className="flex justify-between items-start mb-6">
                <div
                  className={`${tool.bg} dark:bg-slate-800 ${tool.color} p-4 rounded-2xl`}
                >
                  <tool.icon className="h-8 w-8" />
                </div>
                {tool.status === "coming_soon" && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-widest text-slate-400"
                  >
                    Coming Soon
                  </Badge>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {tool.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                {tool.desc}
              </p>
            </div>

            <Button
              onClick={() => handleToolAction(tool)}
              disabled={
                tool.status === "coming_soon" || tool.status === "disabled"
              }
              variant={tool.status === "coming_soon" ? "outline" : "default"}
              className={`w-full rounded-2xl h-14 font-bold border-none transition-all ${
                tool.status === "coming_soon" || tool.status === "disabled"
                  ? "bg-slate-100 text-slate-400"
                  : checkAccess(tool.id) === "upsell"
                    ? "bg-slate-900 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
              }`}
            >
              {tool.status === "coming_soon"
                ? "Waitlist"
                : tool.status === "disabled"
                  ? "Unavailable"
                  : checkAccess(tool.id) === "upsell"
                    ? "Unlock Feature"
                    : "Launch Tool"}{" "}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        ))}
      </div>

      <motion.div
        variants={fadeInUp}
        className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl space-y-6">
            <Badge className="bg-indigo-500 text-white border-none px-3 py-1 font-bold text-xs uppercase tracking-widest">
              Platform Update
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-bold leading-tight">
              Master your niche with Automated Sequences
            </h2>
            <p className="text-slate-400 text-lg">
              Deploy multi-channel marketing sequences that activate your brand
              and keep your customers engaged 24/7.
            </p>
            {!hasMarketingPlan && (
              <Button
                onClick={() => setIsTrialDialogOpen(true)}
                className="h-14 px-8 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-lg"
              >
                Unlock Full Automation
              </Button>
            )}
          </div>
          <div className="flex gap-4">
            <div className="h-24 w-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Target className="h-10 w-10 text-indigo-400" />
            </div>
            <div className="h-24 w-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Zap className="h-10 w-10 text-amber-400" />
            </div>
            <div className="h-24 w-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Users className="h-10 w-10 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Megaphone className="h-64 w-64" />
        </div>
      </motion.div>

      {/* Trial / Upsell Dialog */}
      <Dialog open={isTrialDialogOpen} onOpenChange={setIsTrialDialogOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-indigo-600 p-12 text-white relative">
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTrialDialogOpen(false)}
                className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Sparkles className="h-12 w-12 text-indigo-200 mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Start your Marketing Hub trial
            </h2>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Unlock powerful AI automations like SEO Audits and Ad Generators.
              Experience the full power of the Bennie Tay Studio Marketing
              Engine.
            </p>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {[
                { title: "SEO Audit", desc: "Scan your site for improvements" },
                {
                  title: "Ad Generator",
                  desc: "Convert visitors with AI copy",
                },
                {
                  title: "Email Seeding",
                  desc: "Automated follow-up campaigns",
                },
              ].map((benefit, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                >
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-slate-500">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleStartTrial}
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-lg"
              >
                Start 14-Day Free Trial
              </Button>
              <p className="text-center text-xs text-slate-400 font-medium italic">
                No credit card required to start your marketing trial.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SEO Audit Modal */}
      <Dialog open={isSeoModalOpen} onOpenChange={setIsSeoModalOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none">
          <DialogHeader className="p-8 bg-purple-600 text-white shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <Search className="h-7 w-7" /> AI SEO Auditor
                </DialogTitle>
                <DialogDescription className="text-purple-100/80 font-medium">
                  Scan your digital presence and identify ranking gaps.
                </DialogDescription>
              </div>
              {!seoResult && !isGenerating && (
                <Button
                  onClick={handleRunSeoAudit}
                  className="rounded-xl bg-white text-purple-600 hover:bg-purple-50 font-bold"
                >
                  Start Scan
                </Button>
              )}
              {seoResult && !isGenerating && (
                <Button
                  onClick={handleRunSeoAudit}
                  className="rounded-xl bg-purple-700 text-white hover:bg-purple-800 font-bold"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Scan Again
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white dark:bg-slate-950">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <div className="relative mb-8">
                  <div className="h-24 w-24 rounded-full border-4 border-purple-100 dark:border-purple-900 border-t-purple-600 animate-spin" />
                  <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-purple-600 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Analyzing Site Presence...
                </h3>
                <p className="text-slate-500 mt-2">
                  Connecting to search engines and analyzing page structure.
                </p>
              </div>
            ) : seoResult ? (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="rounded-3xl border-purple-100 bg-purple-50/30 overflow-hidden text-center p-8">
                    <h4 className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-2">
                      Health Score
                    </h4>
                    <div className="text-6xl font-black text-purple-700">
                      {seoResult.score}
                    </div>
                    <Progress
                      value={seoResult.score}
                      className="h-2 mt-4 bg-purple-100 [&>div]:bg-purple-600"
                    />
                  </Card>

                  <Card className="md:col-span-2 rounded-3xl p-8 border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Executive Summary
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-4 border-purple-200 pl-6">
                      "{seoResult.summary}"
                    </p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <h4 className="text-lg font-bold">Critical Issues</h4>
                    </div>
                    {seoResult.criticalIssues.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex flex-col gap-3 p-5 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20 relative overflow-hidden group"
                      >
                        {fixedIssues.includes(i) && (
                          <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] flex items-center justify-center z-10 animate-in fade-in">
                            <div className="bg-emerald-500 text-white rounded-full p-2 shadow-lg">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-4 items-start">
                          <Badge
                            variant="destructive"
                            className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0"
                          >
                            {i + 1}
                          </Badge>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-red-700 dark:text-red-400">
                              {item.issue}
                            </p>
                            <p className="text-xs text-red-600/70 dark:text-red-400/60 leading-relaxed">
                              {item.solution}
                            </p>
                          </div>
                        </div>

                        {item.isFixable && !fixedIssues.includes(i) && (
                          <Button
                            size="sm"
                            onClick={() => handleApplyFix(i, item)}
                            disabled={isApplyingFix === `fix-${i}`}
                            className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white h-9 text-xs font-bold shadow-sm"
                          >
                            {isApplyingFix === `fix-${i}` ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            ) : (
                              <Zap className="h-3 w-3 mr-2" />
                            )}
                            Auto-Fix Issue
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="h-5 w-5 text-emerald-500" />
                      <h4 className="text-lg font-bold">Opportunities</h4>
                    </div>
                    {seoResult.opportunities.map((opp: string, i: number) => (
                      <div
                        key={i}
                        className="flex gap-4 items-start p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20"
                      >
                        <Badge
                          variant="default"
                          className="h-6 w-6 rounded-full flex items-center justify-center p-0 bg-emerald-500"
                        >
                          {i + 1}
                        </Badge>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          {opp}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Card className="rounded-3xl p-8 bg-slate-900 text-white overflow-hidden relative">
                  <div className="relative z-10">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6">
                      High-Yield Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {seoResult.recommendedKeywords.map(
                        (kw: string, i: number) => (
                          <Badge
                            key={i}
                            className="bg-white/10 hover:bg-white/20 border-white/10 text-white px-4 py-1.5 rounded-xl text-sm transition-all cursor-default"
                          >
                            {kw}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                  <Search className="absolute bottom-[-20px] right-[-20px] h-48 w-48 text-white opacity-5 rotate-12" />
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-200">
                  <Search className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Website SEO Scan Ready</h3>
                  <p className="text-slate-500 max-w-sm">
                    We'll use your current website content to perform a deep
                    analysis of your performance.
                  </p>
                </div>
                <Button
                  onClick={handleRunSeoAudit}
                  className="rounded-2xl h-14 px-10 bg-purple-600 hover:bg-purple-700 font-bold"
                >
                  Launch Scan Now
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ad Generator Modal */}
      <Dialog open={isAdModalOpen} onOpenChange={setIsAdModalOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none">
          <DialogHeader className="p-8 bg-red-600 text-white shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <Megaphone className="h-7 w-7" /> AI Ad Generator
                </DialogTitle>
                <DialogDescription className="text-red-100/80 font-medium">
                  Create high-performance social and search campaigns in
                  seconds.
                </DialogDescription>
              </div>
              {!adResult && !isGenerating && (
                <Button
                  onClick={handleGenerateAd}
                  className="rounded-xl bg-white text-red-600 hover:bg-red-50 font-bold"
                >
                  Generate Ads
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white dark:bg-slate-950">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <div className="relative mb-8">
                  <div className="h-24 w-24 rounded-full border-4 border-red-100 dark:border-red-900 border-t-red-600 animate-spin" />
                  <Target className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-red-600 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Drafting Ad Variations...
                </h3>
                <p className="text-slate-500 mt-2">
                  Optimizing for engagement and click-through rates.
                </p>
              </div>
            ) : adResult ? (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adResult.variations.map((ad: any, i: number) => (
                    <Card
                      key={i}
                      className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                        <Badge className="bg-red-50 text-red-600 border-red-100 rounded-lg">
                          {ad.platform}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Variation {i + 1}
                        </span>
                      </div>
                      <CardContent className="p-6 space-y-4 flex-1">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Headline
                          </Label>
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {ad.headline}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Primary Text
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed h-[120px] overflow-y-auto scrollbar-hide">
                            {ad.primaryText}
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 mt-auto">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `Headline: ${ad.headline}\nText: ${ad.primaryText}`,
                            );
                            toast.success("Ad copied to clipboard!");
                          }}
                          className="w-full rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                        >
                          Copy Content
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-center pt-8">
                  <Button
                    onClick={handleGenerateAd}
                    variant="outline"
                    className="rounded-2xl h-14 px-8 border-red-200 text-red-600 hover:bg-red-50 font-bold"
                  >
                    Regenerate New Variations
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-200">
                  <Megaphone className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">
                    Multi-Channel Ad Generator
                  </h3>
                  <p className="text-slate-500 max-w-sm">
                    We'll create tailored ad copy for Facebook, Instagram, and
                    Google Ads using your brand voice.
                  </p>
                </div>
                <Button
                  onClick={handleGenerateAd}
                  className="rounded-2xl h-14 px-10 bg-red-600 hover:bg-red-700 font-bold"
                >
                  Generate Ad Sets
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Copywriter Modal */}
      <Dialog
        open={isCopywriterModalOpen}
        onOpenChange={setIsCopywriterModalOpen}
      >
        <DialogContent className="rounded-[2.5rem] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          <DialogHeader className="p-8 bg-indigo-600 text-white shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <Sparkles className="h-7 w-7" /> Professional AI Copywriter
                </DialogTitle>
                <DialogDescription className="text-indigo-100/80 font-medium">
                  Craft high-converting headlines, social posts, and ad copy in
                  seconds.
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCopywriterModalOpen(false)}
                className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white dark:bg-slate-950">
            {!copywriterResult && !isGenerating && (
              <div className="max-w-xl mx-auto space-y-6 py-8">
                <div className="text-center space-y-2 mb-8">
                  <h3 className="text-xl font-bold">
                    What are we promoting today?
                  </h3>
                  <p className="text-slate-500">
                    Provide a few details and I'll handle the professional
                    copywriting.
                  </p>
                </div>

                <div className="space-y-4 p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Marketing Goal
                    </Label>
                    <Textarea
                      placeholder="e.g. Promoting a 20% summer sale on luxury watches, or announcing our new consulting services for startups..."
                      className="min-h-[120px] rounded-2xl resize-none"
                      value={copywriterGoal}
                      onChange={(e) => setCopywriterGoal(e.target.value)}
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleGenerateCopy}
                      disabled={!copywriterGoal.trim() || isGenerating}
                      className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-lg shadow-lg shadow-indigo-100 dark:shadow-none"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Zap className="h-5 w-5 mr-2" />
                      )}
                      Generate Copy Variations
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <Badge className="bg-indigo-50 text-indigo-600 h-8 w-8 rounded-lg flex items-center justify-center p-0">
                      <Target className="h-4 w-4" />
                    </Badge>
                    <span className="text-xs font-bold text-slate-600">
                      High-Conversion
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <Badge className="bg-indigo-50 text-indigo-600 h-8 w-8 rounded-lg flex items-center justify-center p-0">
                      <MessageSquare className="h-4 w-4" />
                    </Badge>
                    <span className="text-xs font-bold text-slate-600">
                      Brand Consistent
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <div className="relative mb-8">
                  <div className="h-24 w-24 rounded-full border-4 border-indigo-100 dark:border-indigo-900 border-t-indigo-600 animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-indigo-600 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  AI Copywriter is thinking...
                </h3>
                <p className="text-slate-500 mt-2">
                  Drafting high-impact variations for your campaign.
                </p>
              </div>
            )}

            {copywriterResult && !isGenerating && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <p className="text-sm font-medium">
                      3 Professional variations generated based on your goal.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCopywriterResult(null)}
                    className="text-xs font-bold text-indigo-600 hover:bg-white"
                  >
                    Start Over
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {copywriterResult.variations.map((ad: any, i: number) => (
                    <Card
                      key={i}
                      className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col group"
                    >
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                        <Badge className="bg-white text-indigo-600 border-slate-100 shadow-sm rounded-lg uppercase text-[9px] font-black tracking-widest">
                          {ad.platform}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Option {i + 1}
                        </span>
                      </div>
                      <CardContent className="p-6 space-y-6 flex-1">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Headline
                          </Label>
                          <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                            {ad.headline}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Primary Text
                          </Label>
                          <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            {ad.primaryText}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 mt-auto group-hover:bg-indigo-600 transition-colors duration-300">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `Headline: ${ad.headline}\n\n${ad.primaryText}`,
                            );
                            toast.success("Copy saved to clipboard!");
                          }}
                          className="w-full rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-white hover:bg-white/10"
                        >
                          Copy to Clipboard
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-center pt-8">
                  <Button
                    onClick={handleGenerateCopy}
                    variant="outline"
                    className="rounded-2xl h-14 px-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold"
                  >
                    Regenerate New Variations
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
