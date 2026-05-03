/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "@/src/contexts/AuthContext";
import { generateWebsiteContent } from "@/src/lib/gemini";
import { supabase } from "@/src/lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import {
  Zap,
  CheckCircle2,
  Layout,
  Globe,
  Loader2,
  Shield,
  Sparkles,
} from "lucide-react";
import { generateId, cn } from "@/src/lib/utils";
import { Website } from "../types";
import { SECTION_TEMPLATES } from "../constants/sectionTemplates";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const generatorSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters"),
  industry: z.string().min(1, "Please select an industry"),
  otherIndustry: z.string().optional(),
  businessNature: z
    .string()
    .min(10, "Please describe your business nature (min 10 chars)"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  tone: z.string().min(1, "Please select a tone"),
  template: z.string().min(1, "Please select a template"),
});

type GeneratorFormData = z.infer<typeof generatorSchema>;

const TEMPLATES = [
  {
    id: "modern",
    name: "Modern (Clean)",
    description:
      "The industry standard. Clean, fast, and optimized for conversions.",
    icon: "Layout",
  },
  {
    id: "editorial",
    name: "Editorial",
    description:
      "Wide margins, serif headlines, and clean aesthetics for high-trust niches.",
    icon: "Layout",
  },
  {
    id: "corporate",
    name: "Corporate",
    description:
      "Structured, reliable, and professional layout for enterprises.",
    icon: "Shield",
  },
  {
    id: "action",
    name: "High-Contrast",
    description:
      "Bold condensed typography and dynamic colors for local services.",
    icon: "Zap",
  },
  {
    id: "immersive",
    name: "Narrative Immersive",
    description:
      "Full-bleed imagery and romantic typography for experiential brands.",
    icon: "Globe",
  },
  {
    id: "authority",
    name: "Asymmetrical Authority",
    description: "Asymmetrical layouts and social proof focus for consultants.",
    icon: "Shield",
  },
  {
    id: "neumorphic",
    name: "Neumorphic (Soft UI Design)",
    description:
      "Unique soft-shadow design language for a tactile, futuristic feel.",
    icon: "Sparkles",
  },
  {
    id: "glassmorphic",
    name: "Glassmorphic (Frosted Glass)",
    description:
      "Transparent layers and blurred backgrounds for modern startups.",
    icon: "Layout",
  },
  {
    id: "luxury_dark",
    name: "Midnight Luxury",
    description: "Ultra-dark glassmorphism palette with obsidian and gold accents.",
    icon: "Shield",
  },
  {
    id: "prestige",
    name: "Elite Prestige",
    description: "Timeless high-luxury aesthetic with pure black and gold accents.",
    icon: "Sparkles",
  },
];

const INDUSTRIES = [
  "Real Estate",
  "Consulting",
  "E-commerce",
  "Health & Wellness",
  "Beauty & Personal Care",
  "Education",
  "Technology",
  "Food & Beverage",
  "Automotive",
  "Construction",
  "Legal",
  "Other",
];

const TONES = [
  {
    id: "professional",
    name: "Professional",
    description: "Authoritative, stable, and high-trust.",
  },
  {
    id: "playful",
    name: "Friendly & Playful",
    description: "Approachable, warm, and energetic.",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Direct, clean, and essentialist.",
  },
  {
    id: "technical",
    name: "Technical",
    description: "Precise, data-driven, and innovative.",
  },
  {
    id: "persuasive",
    name: "Persuasive",
    description: "High-energy, benefit-driven, and bold.",
  },
];

interface WebsiteGeneratorProps {
  onSuccess?: (businessId?: string) => void;
}

export function WebsiteGenerator({ onSuccess }: WebsiteGeneratorProps) {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState(
    "Initializing AI Builder...",
  );
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedName, setGeneratedName] = useState("");
  const [enabledStyles, setEnabledStyles] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);

  React.useEffect(() => {
    const fetchTemplates = async () => {
      const configRes = await supabase
        .from("settings")
        .select("*")
        .eq("id", "archetype_config")
        .maybeSingle();

      if (configRes.data) {
        setEnabledStyles(configRes.data.content.enabledStyles || []);
      } else {
        // Fallback to all if no config
        setEnabledStyles(TEMPLATES.map((t) => t.id));
      }
    };
    fetchTemplates();
  }, []);

  const filteredTemplates = TEMPLATES.filter(
    (t) => enabledStyles.length === 0 || enabledStyles.includes(t.id),
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm<GeneratorFormData>({
    resolver: zodResolver(generatorSchema),
    mode: "onChange",
    defaultValues: {
      industry: "",
      tone: "professional",
      template: "modern",
    },
  });

  React.useEffect(() => {
    const fetchBusiness = async () => {
      if (profile?.businessId) {
        try {
          const { data } = await supabase
            .from("businesses")
            .select("*")
            .eq("id", profile.businessId)
            .single();

          if (data) {
            setValue("businessName", data.name);
            setValue("industry", data.industry || "");
            setValue("location", data.location || "");
            if (data.business_nature) {
              setValue("businessNature", data.business_nature);
            }
          }
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };
    fetchBusiness();
  }, [profile?.businessId, setValue]);

  const selectedTemplate = watch("template");
  const selectedTone = watch("tone");
  const selectedIndustry = watch("industry");
  const otherIndustry = watch("otherIndustry");

  const onSubmit = async (data: GeneratorFormData) => {
    if (!user?.id) return;

    setLoading(true);
    setProgress(0);
    setError(null);
    if (!agreed) {
      toast.error("Please agree to the Service Protocols to continue.");
      setLoading(false);
      return;
    }

    const finalIndustry =
      data.industry === "Other" ? data.otherIndustry : data.industry;

    // Simulate progress with an asymptotic curve to avoid getting stuck at 100%
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      setProgress((prev) => {
        // Asymptotic approach to 99%
        // We want to reach ~60% in 1s, ~85% in 4s, ~95% in 8s
        let targetProgress = 0;
        if (elapsed < 1000) {
          targetProgress = (elapsed / 1000) * 60;
        } else if (elapsed < 5000) {
          targetProgress = 60 + ((elapsed - 1000) / 4000) * 28;
        } else if (elapsed < 15000) {
          targetProgress = 88 + ((elapsed - 5000) / 10000) * 7;
        } else if (elapsed < 45000) {
          // Creep even slower towards 99.5% after 15s
          targetProgress = 95 + ((elapsed - 15000) / 30000) * 4.5;
        } else {
          targetProgress = 99.5;
        }

        const nextProgress = Math.max(prev, Math.floor(targetProgress));

        if (nextProgress < 20) setProgressMessage("Initializing neural synthesis...");
        else if (nextProgress < 40) setProgressMessage("Analyzing competitive vectors...");
        else if (nextProgress < 60) setProgressMessage("Synthesizing copy architecture...");
        else if (nextProgress < 75) setProgressMessage("Generating conversion framework...");
        else if (nextProgress < 85) setProgressMessage("Optimizing asset delivery...");
        else if (nextProgress < 95) setProgressMessage("Injecting SEO intelligence...");
        else if (nextProgress < 98) setProgressMessage("Finalizing neural verification...");
        else if (nextProgress < 99) setProgressMessage("Synthesizing conversion-optimized copy (this may take 30-60s)...");
        else if (nextProgress < 99.7) setProgressMessage("Assembling high-fidelity components and SEO framework...");
        else setProgressMessage("Executing final deployment protocols and cache warming...");

        return Math.min(nextProgress, 99.99);
      });
    }, 200);

    try {
      let websiteData: any;
      let businessId = profile?.businessId;

      if (!websiteData) {
        // 1. Generate AI Content
        const aiContent = await generateWebsiteContent(
          data.businessName,
          finalIndustry || "Business",
          data.location,
          data.tone,
          data.template,
          data.businessNature,
          businessId,
        );

        if (!aiContent || !aiContent.pages) {
          throw new Error(
            "AI Engine returned an invalid website structure. Please try again or use a template.",
          );
        }

        setProgress(60);
        setProgressMessage("Organizing spatial layout and SEO framework...");

        const websiteId = generateId();
        console.log("AI Synthesis Output:", aiContent);

        if (!aiContent || (!aiContent.pages && !aiContent.sections)) {
          throw new Error(
            "AI failed to generate structural pages. Please refine your business description or try again.",
          );
        }

        const formattedPages = (aiContent.pages || []).map((page: any) => {
          const sections = (page.sections || []).map((section: any) => {
            // Get default template for this type
            const template = SECTION_TEMPLATES[section.type] || { content: {} };

            return {
              ...section,
              id: generateId(),
              isVisible: true,
              // Deep merge content to ensure any missing fields are filled with template defaults
              content: {
                ...template.content,
                ...section.content,
              },
            };
          });

          return {
            ...page,
            id: generateId(),
            seo: page.seo || {
              title: `${page.title} | ${data.businessName}`,
              description: `Learn more about our ${
                page.title?.toLowerCase() || "professional"
              } services at ${data.businessName}.`,
              keywords: [
                ...(aiContent.seo?.keywords || []),
                page.title?.toLowerCase() || "",
              ].filter(Boolean),
            },
            sections,
          };
        });

        websiteData = {
          id: websiteId,
          theme: {
            primaryColor: aiContent.theme?.primaryColor || "#4f46e5",
            secondaryColor: aiContent.theme?.secondaryColor || "#1e293b",
            fontFamily: aiContent.theme?.fontFamily || "Inter",
            style: aiContent.theme?.style || data.template || "modern",
            footer: {
              showMenu: true,
              showSocials: true,
              showContact: true,
              contactEmail: `contact@${data.businessName.toLowerCase().replace(/\s+/g, "")}.com`,
              contactPhone: "+1 (555) 000-0000",
              contactAddress: data.location,
              socialLinks: [
                { platform: "facebook", url: "", isVisible: true },
                { platform: "instagram", url: "", isVisible: true },
                { platform: "twitter", url: "", isVisible: true },
                { platform: "linkedin", url: "", isVisible: true },
              ],
            },
          },
          pages: formattedPages,
          seo: {
            title:
              aiContent.seo?.title || `${data.businessName} | ${data.industry}`,
            description: aiContent.seo?.description || data.businessNature,
            keywords: aiContent.seo?.keywords || [],
            coreValueProposition: aiContent.seo?.coreValueProposition || "",
            businessType: aiContent.seo?.businessType || "LocalBusiness",
            region: aiContent.seo?.region || "",
            placename: aiContent.seo?.placename || "",
          },
          status: "draft",
        };
      }

      console.log("Website to be saved:", websiteData);

      setProgress(85);
      setProgressMessage(
        "Finalizing framework infrastructure and security headers...",
      );

      // 2. Create Business if it doesn't exist
      if (!businessId) {
        businessId = generateId();
        const subdomain =
          data.businessName.toLowerCase().replace(/[^a-z0-9]/g, "") +
          "-" +
          Math.random().toString(36).substring(2, 7);

        const trialDays = 14; // Default to 14 if settings can't be reached

        const businessPayload = {
          id: businessId,
          name: data.businessName,
          owner_id: user.id,
          subdomain: subdomain,
          industry: finalIndustry,
          business_nature: data.businessNature,
          location: data.location,
          plan: "starter",
          status: "active",
          subscription_status: "trialing",
          trial_ends_at: new Date(
            Date.now() + trialDays * 24 * 60 * 60 * 1000,
          ).toISOString(),
        };

        const { error: businessError } = await supabase
          .from("businesses")
          .insert([businessPayload]);

        if (businessError) {
          console.error("Business creation error:", businessError);
          if (businessError.code === "42501") {
            throw new Error(
              "Permission denied: You do not have permission to create this business. Please contact support.",
            );
          }
          if (businessError.code === "23505") {
            throw new Error(
              "This subdomain is already taken. Please choose a different business name or try again.",
            );
          }
          throw new Error(
            `Failed to create business profile: ${businessError.message}`,
          );
        }

        // Always update the profile to ensure it's linked, but DON'T mark as completed yet
        const { error: pError } = await supabase
          .from("profiles")
          .update({
            business_id: businessId,
            role:
              profile?.role === "super_admin"
                ? "super_admin"
                : "business_admin",
          })
          .eq("id", user.id);

        if (pError) console.warn("Profile link warning:", pError);
      }

      // 3. Save Website to Supabase
      // CRITICAL FIX: To avoid ".single()" failures in the renderer when multiple websites exist for one business
      // we must ensure we only have one active website. We'll delete old ones or upsert if we know the ID.
      // Since we generated a new random ID for the website, we should clean up any existing ones for this business.

      setProgress(90);
      setProgressMessage(
        "Purging legacy frameworks and initializing fresh ecosystem...",
      );

      const { error: deleteError } = await supabase
        .from("websites")
        .delete()
        .eq("business_id", businessId);

      if (deleteError) {
        console.warn("Legacy cleanup failed (non-critical):", deleteError);
      }

      const finalWebsiteData = {
        ...websiteData,
        business_id: businessId,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { error: websiteError } = await supabase
        .from("websites")
        .insert([finalWebsiteData]);

      if (websiteError)
        throw new Error(`Failed to save website: ${websiteError.message}`);

      // 4. Mark Onboarding as Completed ONLY NOW
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      // 5. Refresh profile to include new businessId
      await refreshProfile();

      clearInterval(progressInterval);
      setProgress(100);
      setGeneratedName(data.businessName);

      // Set success first, then clear loading after a small delay
      setSuccess(true);
      setTimeout(() => {
        setLoading(false);
      }, 100);

      if (onSuccess) {
        setTimeout(() => onSuccess(businessId), 1500);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(
        err.message || "An unexpected error occurred. Please try again.",
      );
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <div className="h-full flex flex-col justify-center max-w-2xl mx-auto p-4">
        <Card className="border-none bg-white shadow-2xl rounded-[3rem] overflow-hidden">
          <CardContent className="py-12 text-center space-y-6 px-10">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="mx-auto h-20 w-20 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-xl relative"
            >
              <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse rounded-full" />
              <CheckCircle2 className="h-10 w-10 relative z-10 text-primary" />
            </motion.div>
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                Synthesis Success
              </span>
              <CardTitle className="text-4xl font-black tracking-tight uppercase leading-none">
                Website Ready.
              </CardTitle>
              <CardDescription className="text-base text-slate-500 max-w-sm mx-auto leading-relaxed">
                The high-conversion infrastructure for{" "}
                <strong>{generatedName}</strong> is now live and fully
                optimized.
              </CardDescription>
            </div>
            <div className="pt-6 flex flex-col items-center gap-4">
              <Button
                size="lg"
                onClick={() => {
                  if (onSuccess) {
                    onSuccess(profile?.businessId);
                  } else {
                    navigate("/dashboard/website");
                  }
                }}
                className="gap-3 h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-black uppercase tracking-widest shadow-xl transition-all active:scale-[0.98]"
              >
                <Layout className="h-5 w-5" />
                Control Center
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900"
                  onClick={() =>
                    window.open(`/w/${profile?.businessId}`, "_blank")
                  }
                >
                  Live Preview
                </Button>
                <div className="w-px h-3 bg-slate-100 self-center" />
                <Button
                  variant="ghost"
                  className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900"
                  onClick={() => window.location.reload()}
                >
                  New Brand
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center max-w-6xl mx-auto p-2 sm:p-4">
      <Card className="border-none shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardHeader className="bg-slate-50/50 p-6 text-center border-b border-slate-100 flex flex-row items-center gap-6 text-left">
          <div className="h-12 w-12 bg-slate-950 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tight uppercase">
              AI Website Builder
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 font-medium">
              Professional website synthesis powered by multi-agent AI.
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Column 1: Basics */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 block">
                    1. Identity & Market
                  </Label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400 ml-1">
                        Business Name
                      </Label>
                      <Input
                        placeholder="e.g. Acme Consulting"
                        className="h-10 rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-bold"
                        {...register("businessName")}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400 ml-1">
                        Industry
                      </Label>
                      <Controller
                        name="industry"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-bold">
                              <SelectValue placeholder="Select Industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {selectedIndustry === "Other" && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                        <Label className="text-[10px] font-bold text-slate-400 ml-1">
                          Specify Industry
                        </Label>
                        <Input
                          placeholder="e.g. Pet Care"
                          className="h-10 rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-bold"
                          {...register("otherIndustry")}
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400 ml-1">
                        Location
                      </Label>
                      <Input
                        placeholder="e.g. New York, NY"
                        className="h-10 rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-bold"
                        {...register("location")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Nature */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 block">
                  2. Business Description
                </Label>
                <textarea
                  className="w-full h-[180px] rounded-2xl border border-slate-200 bg-white px-4 py-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300 resize-none"
                  placeholder="What do you do? Who are your customers? What makes you special? (Provide details for better copy)"
                  {...register("businessNature")}
                />
                <p className="text-[9px] text-slate-400 font-medium italic">
                  AI uses this to generate your services, hero section, and FAQ.
                </p>
              </div>

              {/* Column 3: Style & Tone */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 block">
                    3. Tone & Aesthetics
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setValue("tone", t.id, { shouldValidate: true })
                        }
                        className={`py-2 px-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all text-center ${selectedTone === t.id ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"}`}
                        title={t.description}
                      >
                        {t.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {filteredTemplates.slice(0, 4).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setValue("template", t.id, { shouldValidate: true })
                        }
                        className={`p-2 text-left rounded-xl border transition-all flex flex-col gap-0.5 group ${selectedTemplate === t.id ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-white hover:border-slate-200"}`}
                      >
                        <span
                          className={`text-[9px] font-black uppercase tracking-tight ${selectedTemplate === t.id ? "text-indigo-600" : "text-slate-900"}`}
                        >
                          {t.name.split(" ")[0]}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold leading-tight line-clamp-1">
                          {t.description.split(".")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-indigo-600 rounded-2xl flex items-start gap-3">
                  <Shield className="h-4 w-4 text-indigo-200 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-indigo-50 leading-relaxed font-medium">
                    Automated SEO, mobile optimization, and conversion-ready
                    layout included.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0 border-t border-slate-50 flex flex-col gap-4 mt-2">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-black uppercase tracking-wider text-center"
              >
                {error}
              </motion.div>
            )}

            {loading ? (
              <div className="w-full p-6 bg-slate-950 rounded-2xl relative overflow-hidden h-24 flex items-center justify-center shadow-xl">
                <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_80%_20%,rgba(79,70,229,0.1),transparent)]" />
                <div className="flex items-center gap-6 relative z-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Loader2 className="h-6 w-6 text-indigo-500" />
                  </motion.div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white tracking-widest uppercase">
                      {progressMessage}
                    </h3>
                    <div className="flex gap-2 items-center">
                      <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-indigo-500"
                        />
                      </div>
                      <span className="text-[9px] text-indigo-400 font-black tracking-widest">
                        {progress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 w-full">
                <div className="flex items-start gap-3 px-2">
                  <input
                    type="checkbox"
                    id="gen-agree-protocols"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                  />
                  <label
                    htmlFor="gen-agree-protocols"
                    className="text-[10px] font-bold text-slate-500 leading-relaxed cursor-pointer"
                  >
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => window.open("/terms-of-service", "_blank")}
                      className="text-slate-900 underline hover:text-indigo-600"
                    >
                      Service Protocols
                    </button>{" "}
                    and acknowledge the{" "}
                    <button
                      type="button"
                      onClick={() => window.open("/privacy-policy", "_blank")}
                      className="text-slate-900 underline hover:text-indigo-600"
                    >
                      AI Liability Policy
                    </button>. I understand that I am 100% responsible for auditing and approving all AI-generated content before use.
                  </label>
                </div>
                <div className="flex items-center justify-between w-full">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    AI Synthesis takes ~25s
                  </p>
                  <Button
                    type="submit"
                    disabled={!isValid || !agreed}
                    className={`h-12 px-8 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                      agreed 
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Generate My Website <Zap className={`ml-2 h-4 w-4 ${agreed ? "text-white" : "text-slate-400"}`} />
                  </Button>
                </div>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
