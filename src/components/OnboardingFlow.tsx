/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import {
  Globe,
  Zap,
  Shield,
  Check,
  ArrowRight,
  Loader2,
  Rocket,
  Sparkles,
  Scale,
  Palette,
  Dumbbell,
  TrendingUp,
  Building,
  Key,
  Cpu,
  Layout,
  AlertCircle,
} from "lucide-react";
import { generateWebsiteContent } from "@/src/lib/gemini";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import { Badge } from "./ui/badge";
import { generateId } from "@/src/lib/utils";
import { SECTION_TEMPLATES } from "../constants/sectionTemplates";
import { toast } from "sonner";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState(14);
  const [businessData, setBusinessData] = useState({
    name: "BennieTay Studio",
    subdomain: "bennietay",
    customDomain: "",
    businessType: "creative",
    industry: "",
    businessNature: "",
    description: "",
    location: "",
  });
  const [agreed, setAgreed] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data: tData } = await supabase.from("templates").select("*");
      if (tData) setTemplates(tData);

      const { data: sData } = await supabase
        .from("settings")
        .select("*")
        .eq("id", "platform")
        .single();
      if (sData?.content?.defaultTrialDays) {
        setTrialDays(sData.content.defaultTrialDays);
      }
    };
    fetchData();
  }, []);

  const BUSINESS_TYPES = [
    {
      id: "aesthetic",
      title: "Aesthetic Clinic",
      description: "Medical spas, skin clinics, and beauty studios",
      icon: Sparkles,
    },
    {
      id: "law",
      title: "Law Firm",
      description: "Legal practices and professional services",
      icon: Scale,
    },
    {
      id: "creative",
      title: "Creative Agency",
      description: "Design, marketing, and branding agencies",
      icon: Palette,
    },
    {
      id: "fitness",
      title: "Fitness Studio",
      description: "Boutique gyms, yoga, and pilates studios",
      icon: Dumbbell,
    },
    {
      id: "wealth",
      title: "Wealth Management",
      description: "Financial advisors and wealth management",
      icon: TrendingUp,
    },
    {
      id: "architecture",
      title: "Architecture Firm",
      description: "Architects and interior design studios",
      icon: Building,
    },
    {
      id: "realestate",
      title: "Luxury Real Estate",
      description: "High-end property management and sales",
      icon: Key,
    },
    {
      id: "tech",
      title: "Tech Startup",
      description: "Software companies and technology ventures",
      icon: Cpu,
    },
  ];

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const startTrial = async () => {
    if (!user || !profile) return;
    setLoading(true);
    setProgress(5);
    setProgressMessage("Initializing infrastructure...");
    setError(null);

    try {
      if (!agreed) {
        toast.error("Please agree to the Service Protocols to continue.");
        return;
      }
      // Check if user already owns a business (defensive check)
      const { data: existingBusiness } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      let businessId: string;

      if (existingBusiness) {
        businessId = existingBusiness.id;
        setProgress(15);
        setProgressMessage("Connecting existing business profile...");
      } else {
        businessId = generateId();
        const subdomain =
          businessData.subdomain ||
          businessData.name.toLowerCase().replace(/[^a-z0-9]/g, "") +
            "-" +
            Math.random().toString(36).substring(2, 7);

        // 1. Create Business
        setProgress(20);
        setProgressMessage("Synthesizing business core...");
        const businessPayload: any = {
          id: businessId,
          name: businessData.name,
          subdomain: subdomain,
          custom_domain: businessData.customDomain || null,
          industry: businessData.industry || businessData.businessType,
          business_nature: businessData.businessNature,
          owner_id: user.id,
          status: "active",
          plan: "starter",
          subscription_status: "trialing",
          trial_ends_at: new Date(
            Date.now() + trialDays * 24 * 60 * 60 * 1000,
          ).toISOString(),
        };

        const { error: businessError } = await supabase
          .from("businesses")
          .insert([businessPayload]);

        if (businessError) {
          if (businessError.code === "42501") {
            throw new Error(
              "Permission denied: Database security policies restricted business creation.",
            );
          }
          throw businessError;
        }
      }

      // 2. Update User Profile (Linking business but NOT completing onboarding yet)
      setProgress(40);
      setProgressMessage("Configuring security protocols...");
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          business_id: businessId,
          role:
            profile.role === "super_admin" ? "super_admin" : "business_admin",
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 3. Create Default Website or Use Selected Template
      const websiteId = generateId();
      let websiteData: any;

      if (selectedTemplate) {
        setProgress(60);
        setProgressMessage("Deploying blueprint architecture...");
        const template = (templates || []).find(
          (t) => t.id === selectedTemplate,
        );
        if (template && template.config) {
          const config = template.config;
          const formattedPages = (config.pages || []).map((page: any) => ({
            ...page,
            id: page.id || generateId(),
            sections: (page.sections || []).map((section: any) => ({
              ...section,
              id: section.id || generateId(),
              isVisible: true,
            })),
          }));

          websiteData = {
            id: websiteId,
            business_id: businessId,
            theme: config.theme || {
              primaryColor: "#4f46e5",
              secondaryColor: "#1e293b",
              fontFamily: "Inter",
              style: "modern",
            },
            pages: formattedPages,
            seo: config.seo || {
              title: `${businessData.name} | Professional Services`,
              description:
                businessData.businessNature ||
                "Welcome to our professional business website.",
              keywords: [
                businessData.industry,
                "services",
                businessData.name,
              ].filter(Boolean),
            },
            status: "draft",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }

      if (!websiteData) {
        // Use AI to generate content if no template is selected
        try {
          setProgress(50);
          setProgressMessage("Synchronizing with AI Synthesis Engine...");
          const aiContent = await generateWebsiteContent(
            businessData.name,
            businessData.industry || businessData.businessType,
            businessData.location || "Global",
            "professional", // Default tone
            "modern", // Default template style
            businessData.businessNature || businessData.description,
            businessId,
          );

          if (!aiContent || !aiContent.pages) {
            throw new Error("AI Engine returned invalid structure");
          }

          setProgress(75);
          setProgressMessage("Refining neural content frameworks...");
          const formattedPages = (aiContent.pages || []).map((page: any) => ({
            ...page,
            id: generateId(),
            sections: (page.sections || []).map((section: any) => ({
              ...section,
              id: generateId(),
              isVisible: true,
            })),
          }));

          websiteData = {
            id: websiteId,
            business_id: businessId,
            theme: aiContent.theme,
            pages: formattedPages,
            seo: aiContent.seo,
            status: "draft",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        } catch (aiError) {
          console.error(
            "AI Generation failed, falling back to templates:",
            aiError,
          );
          setProgress(70);
          setProgressMessage(
            "AI Engine busy. Rerouting to emergency templates...",
          );
          const defaultSections = [
            { ...SECTION_TEMPLATES.hero, id: generateId() },
            { ...SECTION_TEMPLATES.problem, id: generateId() },
            { ...SECTION_TEMPLATES.solution, id: generateId() },
            { ...SECTION_TEMPLATES.benefits, id: generateId() },
            { ...SECTION_TEMPLATES.proof, id: generateId() },
            { ...SECTION_TEMPLATES.pricing, id: generateId() },
            { ...SECTION_TEMPLATES.faq, id: generateId() },
            { ...SECTION_TEMPLATES.cta, id: generateId() },
          ];

          websiteData = {
            id: websiteId,
            business_id: businessId,
            theme: {
              primaryColor: "#4f46e5",
              secondaryColor: "#1e293b",
              fontFamily: "Inter, sans-serif",
            },
            pages: [
              {
                id: generateId(),
                title: "Home",
                slug: "home",
                sections: defaultSections,
              },
            ],
            seo: {
              title: `${businessData.name} | Professional Services`,
              description:
                businessData.businessNature ||
                "Welcome to our professional business website.",
              keywords: [
                businessData.industry,
                "services",
                businessData.name,
              ].filter(Boolean),
            },
            status: "draft",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }

      setProgress(90);
      setProgressMessage("Finalizing framework infrastructure...");
      const { error: websiteError } = await supabase
        .from("websites")
        .insert([websiteData]);

      if (websiteError) throw websiteError;

      // 4. MARK ONBOARDING COMPLETED ONLY NOW
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      setProgress(100);
      setProgressMessage("Deployment successful!");
      toast.success("Your ecosystem is ready!");

      // Ensure state is updated before navigating out
      await refreshProfile();

      // Use a small delay to let the toast show and profile state propagate
      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (err: any) {
      console.error("Synthesis failed:", err);
      setError(
        err.message || "The generative engine encountered a critical error.",
      );
      toast.error(err.message || "Synthesis failed. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 shrink-0">
          <motion.div
            className="h-full bg-indigo-600"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 sm:p-14">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-12"
                >
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 bg-slate-950 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200">
                        <Rocket className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">
                        Initialize Your Empire
                      </h2>
                      <p className="text-slate-500 text-lg font-medium">
                        Configure your professional ecosystem headquarters.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                          Brand Identity
                        </label>
                        <Input
                          className="h-14 text-lg px-6 bg-slate-50 border-slate-100 rounded-2xl focus:bg-white transition-all font-bold placeholder:font-normal"
                          placeholder="e.g. BennieTay Studio"
                          value={businessData.name}
                          onChange={(e) =>
                            setBusinessData({
                              ...businessData,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                          Global Address (Subdomain)
                        </label>
                        <div className="relative">
                          <Input
                            className="h-14 text-lg px-6 bg-slate-50 border-slate-100 rounded-2xl focus:bg-white transition-all pr-40 font-bold"
                            placeholder="bennietay"
                            value={businessData.subdomain}
                            onChange={(e) =>
                              setBusinessData({
                                ...businessData,
                                subdomain: e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]/g, ""),
                              })
                            }
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                            .bennietay.com
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                          Market Sector
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {BUSINESS_TYPES.slice(0, 4).map((type) => (
                            <button
                              key={type.id}
                              onClick={() =>
                                setBusinessData({
                                  ...businessData,
                                  businessType: type.id,
                                })
                              }
                              className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 items-start text-left ${
                                businessData.businessType === type.id
                                  ? "border-indigo-600 bg-indigo-50 shadow-sm"
                                  : "border-slate-50 bg-white hover:border-slate-100"
                              }`}
                            >
                              <type.icon
                                className={`h-5 w-5 ${businessData.businessType === type.id ? "text-indigo-600" : "text-slate-300"}`}
                              />
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest ${businessData.businessType === type.id ? "text-indigo-600" : "text-slate-500"}`}
                              >
                                {type.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                          Mission Intelligence
                        </label>
                        <Textarea
                          className="min-h-[140px] text-base px-6 py-5 bg-slate-50 border-slate-100 rounded-[2rem] focus:bg-white transition-all font-medium leading-relaxed"
                          placeholder="Describe your core offering and value proposition..."
                          value={businessData.businessNature}
                          onChange={(e) =>
                            setBusinessData({
                              ...businessData,
                              businessNature: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="p-6 bg-slate-950 rounded-[2rem] text-indigo-100/60 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/10 blur-3xl" />
                        <div className="flex gap-4 relative z-10">
                          <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">
                              Neural Tip
                            </p>
                            <p className="text-[11px] leading-relaxed">
                              Our AI models perform best when you provide 2-3
                              specific sentences about your unique methodology.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-50 flex justify-center">
                    <Button
                      onClick={handleNext}
                      className="h-18 px-12 text-lg font-black uppercase tracking-[0.2em] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 rounded-2xl group transition-all"
                      disabled={
                        !businessData.name ||
                        !businessData.subdomain ||
                        !businessData.businessNature
                      }
                    >
                      Establish Architecture{" "}
                      <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 bg-slate-950 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200">
                        <Layout className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        Architecture Blueprints
                      </h2>
                      <p className="text-slate-500 text-lg font-medium">
                        Select the foundational structure for your
                        high-performance ecosystem.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto p-4 custom-scrollbar">
                    {templates.length === 0 ? (
                      <div className="col-span-full text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-100">
                          <Layout className="h-10 w-10 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                          Neural core refreshing blueprints...
                        </p>
                      </div>
                    ) : (
                      templates.map((t) => (
                        <motion.div
                          key={t.id}
                          whileHover={{ y: -8, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedTemplate(t.id)}
                          className={`group relative p-4 rounded-[2.5rem] border-4 transition-all cursor-pointer flex flex-col gap-4 ${
                            selectedTemplate === t.id
                              ? "border-indigo-600 bg-white shadow-2xl shadow-indigo-100"
                              : "border-slate-50 bg-white hover:border-slate-100 hover:shadow-xl shadow-slate-100"
                          }`}
                        >
                          <div className="aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 relative">
                            <img
                              src={t.thumbnail}
                              alt={t.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {selectedTemplate === t.id && (
                              <div className="absolute top-4 right-4 h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl">
                                <Check className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="px-2 pb-2">
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                {t.name}
                              </h4>
                              {t.isPremium && (
                                <Badge className="bg-slate-950 text-white text-[8px] font-black uppercase tracking-widest py-0.5 rounded-lg px-2">
                                  Elite
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed line-clamp-2">
                              {t.description ||
                                "Optimized for high-conversion performance."}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  <div className="pt-8 border-t border-slate-50 flex gap-6">
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      className="h-18 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
                    >
                      Previous Step
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex-1 h-18 text-lg font-black uppercase tracking-[0.2em] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 rounded-2xl transition-all"
                      disabled={!selectedTemplate && templates.length > 0}
                    >
                      Proceed to Deployment{" "}
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-950 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-500/20 shadow-2xl shadow-indigo-900/10 mb-2">
                        <Sparkles className="h-3 w-3" /> System Access Granted
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        Activate Infrastructure
                      </h2>
                      <p className="text-slate-500 text-lg font-medium">
                        Verify your high-performance ecosystem and begin your
                        takeover.
                      </p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-20 bg-slate-950 rounded-[4rem] relative overflow-hidden transition-all duration-700">
                      <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-indigo-500/10 to-transparent" />
                      <div className="flex flex-col items-center justify-center space-y-8 relative z-10">
                        <div className="relative">
                          <div className="h-32 w-32 rounded-full border-4 border-white/5 border-t-indigo-500 animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Rocket className="h-10 w-10 text-indigo-500 animate-pulse" />
                          </div>
                        </div>
                        <div className="text-center space-y-4 px-12 max-w-md">
                          <h3 className="text-3xl font-black text-white tracking-widest uppercase leading-none">
                            {progressMessage}
                          </h3>
                          <div className="space-y-3">
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner p-0.5">
                              <motion.div
                                className="h-full bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                                initial={{ width: "0%" }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                                Neural Link Active
                              </span>
                              <span className="text-[10px] text-indigo-400 font-black tracking-widest">
                                {progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="p-12 bg-red-50 border-4 border-red-100 rounded-[3rem] space-y-6 text-center relative overflow-hidden">
                      <div className="absolute -top-12 -right-12 h-40 w-40 bg-red-100/50 blur-3xl" />
                      <div className="h-20 w-20 bg-white text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-red-100 relative z-10">
                        <AlertCircle className="h-10 w-10" />
                      </div>
                      <div className="space-y-3 relative z-10 px-4">
                        <h3 className="text-3xl font-black text-red-950 uppercase tracking-tighter">
                          Synthesis Failed
                        </h3>
                        <p className="text-red-700 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                          {error}
                        </p>
                      </div>
                      <div className="pt-4 flex flex-col gap-4 relative z-10">
                        <Button
                          onClick={startTrial}
                          className="w-full h-18 bg-red-600 hover:bg-red-700 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-red-200"
                        >
                          Retry Synthesis
                        </Button>
                        <button
                          onClick={() => setError(null)}
                          className="text-[10px] text-red-400 uppercase font-black tracking-widest hover:text-red-600 transition-colors"
                        >
                          Abort & Return
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                      <Card className="bg-slate-950 border-none rounded-[3rem] overflow-hidden relative group">
                        <div className="absolute top-0 right-0 h-64 w-64 bg-indigo-500/10 blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-700" />
                        <CardContent className="p-12 space-y-10 relative z-10">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                                Control Hub
                              </h3>
                              <p className="text-indigo-200/40 text-[10px] font-black uppercase tracking-widest">
                                Starter Federation
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-black text-white">
                                $0.00
                              </div>
                              <div className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">
                                Trial: {trialDays} Days
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-white/10" />

                          <ul className="grid grid-cols-1 gap-5">
                            {[
                              "Synthesis Engine (Unlimited)",
                              "Global CDN Deployment",
                              "Lead Acquisition Nexus",
                              "Neural Insights Core",
                              "Custom Identity Protocol",
                              "24/7 Strategic Support",
                            ].map((f, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-4 text-xs font-black text-indigo-100/60 uppercase tracking-widest"
                              >
                                <div className="h-6 w-6 bg-indigo-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                                  <Check className="h-4 w-4" />
                                </div>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <div className="flex flex-col justify-between py-4 space-y-8">
                        <div className="space-y-6 px-4">
                          <div className="flex gap-4 items-start">
                            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100">
                              <Globe className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                                Live Subdomain
                              </p>
                              <p className="text-xs font-medium text-slate-500 line-clamp-1">
                                {businessData.subdomain}.bennietay.com
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 items-start">
                            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100">
                              <Shield className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                                Data Sovereignty
                              </p>
                              <p className="text-xs font-medium text-slate-500">
                                Encrypted business intelligence hosted on
                                tier-IV infrastructure.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-start gap-3 px-4">
                            <input
                              type="checkbox"
                              id="agree-protocols"
                              checked={agreed}
                              onChange={(e) => setAgreed(e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                            />
                            <label
                              htmlFor="agree-protocols"
                              className="text-[10px] font-bold text-slate-500 leading-relaxed cursor-pointer"
                            >
                              I agree to the{" "}
                              <button
                                onClick={() => window.open("/terms-of-service", "_blank")}
                                className="text-slate-900 underline hover:text-indigo-600"
                              >
                                Service Protocols
                              </button>{" "}
                              and understand the{" "}
                              <button
                                onClick={() => window.open("/privacy-policy", "_blank")}
                                className="text-slate-900 underline hover:text-indigo-600"
                              >
                                AI Liability Disclaimers
                              </button>. I acknowledge my duty to review all generated assets.
                            </label>
                          </div>
                          <Button
                            onClick={startTrial}
                            disabled={!agreed || loading}
                            className={`w-full h-20 text-xl font-black uppercase tracking-[0.3em] shadow-2xl rounded-[2rem] group transition-all ${
                              agreed 
                                ? "bg-slate-950 hover:bg-black text-white shadow-slate-200" 
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            Synthesize Life{" "}
                            <Zap className={`ml-4 h-6 w-6 group-hover:scale-125 transition-transform ${agreed ? "text-indigo-500" : "text-slate-400"}`} />
                          </Button>
                          <button
                            onClick={handleBack}
                            className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            Return to Blueprinting
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-left text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-sm">
                    By engaging the synthesis engine, you acknowledge the{" "}
                    <span className="text-slate-900 underline cursor-pointer">
                      Service Protocols
                    </span>{" "}
                    and{" "}
                    <span className="text-slate-900 underline cursor-pointer">
                      Privacy Encryptors
                    </span>
                    .
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
