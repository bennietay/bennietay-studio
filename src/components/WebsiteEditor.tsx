/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
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
  Save,
  Globe,
  Eye,
  Palette,
  Layout,
  Settings as SettingsIcon,
  Plus,
  Loader2,
  EyeOff,
  Trash2,
  Bold,
  Italic,
  List as ListIcon,
  Image as ImageIcon,
  Type,
  Copy,
  ArrowRight,
  Paintbrush,
  PanelBottom,
  Calendar,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Shield,
  FileText,
  Lock,
  ChevronUp,
  ChevronDown,
  Music,
  Search,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  X,
  Monitor,
  MapPin,
  Edit3,
  Smartphone,
  Zap,
  GripVertical,
  Mail,
  HelpCircle,
  CreditCard,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  BarChart3,
  Code,
  Layers,
  Activity,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Website, WebsitePage, WebsiteSection } from "../types";
import { useFeatures } from "../hooks/useFeatures";
import {
  SECTION_TEMPLATES,
  createSectionFromTemplate,
} from "../constants/sectionTemplates";
import { DEFAULT_POLICIES } from "../constants/defaultPolicies";
import { WebsiteGenerator } from "./WebsiteGenerator";
import { WebsiteRenderer } from "./WebsiteRenderer";
import { TemplateGallery } from "./TemplateGallery";
import { ImageUpload } from "./ImageUpload";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateId, cn } from "../lib/utils";
import { generatePageContent, generateSectionContent } from "../lib/gemini";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

import { emailService } from "../services/emailService";
import { toast } from "sonner";

const seoSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(70, "Title should be under 70 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(160, "Description should be under 160 characters"),
  keywords: z.string().min(3, "At least one keyword is required"),
  favicon: z
    .string()
    .url("Please enter a valid URL for the favicon")
    .optional()
    .or(z.literal("")),
  ogImage: z
    .string()
    .url("Please enter a valid URL for the OG image")
    .optional()
    .or(z.literal("")),
  canonicalUrl: z
    .string()
    .url("Please enter a valid URL for the canonical link")
    .optional()
    .or(z.literal("")),
  // GEO & Local SEO
  region: z.string().optional(),
  placename: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  businessType: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  priceRange: z.string().optional(),
  // GEO (Generative Engine Optimization)
  brandVoice: z.string().optional(),
  targetAudience: z.string().optional(),
  coreValueProposition: z.string().optional(),
  knowledgeBaseSummary: z.string().optional(),
});

type SeoFormData = z.infer<typeof seoSchema>;

const THEME_PRESETS: {
  name: string;
  primary: string;
  secondary: string;
  font: string;
  style: string;
  premium?: boolean;
}[] = [
  {
    name: "Authority Master",
    primary: "#0f172a",
    secondary: "#0d9488",
    font: "Fraunces, serif",
    style: "authority",
  },
  {
    name: "Lead Multiplier",
    primary: "#4f46e5",
    secondary: "#ef4444",
    font: "Plus Jakarta Sans, sans-serif",
    style: "action",
  },
  {
    name: "Visual Narrative",
    primary: "#000000",
    secondary: "#6366f1",
    font: "Outfit, sans-serif",
    style: "immersive",
  },
  {
    name: "Minimalist Clean",
    primary: "#18181b",
    secondary: "#71717a",
    font: "Inter, sans-serif",
    style: "editorial",
  },
  {
    name: "Corporate Pro",
    primary: "#1e3a8a",
    secondary: "#334155",
    font: "Inter, sans-serif",
    style: "corporate",
  },
  {
    name: "Midnight Glass",
    primary: "#1e1b4b",
    secondary: "#f0abfc",
    font: "Outfit, sans-serif",
    style: "glassmorphic",
  },
  {
    name: "Scandinavian",
    primary: "#334155",
    secondary: "#94a3b8",
    font: "Inter, sans-serif",
    style: "modern",
  },
  {
    name: "Elite Prestige",
    primary: "#000000",
    secondary: "#C5A059",
    font: "'Playfair Display', serif",
    style: "prestige",
    premium: true,
  },
  {
    name: "Midnight Luxury",
    primary: "#0f172a",
    secondary: "#e2e8f0",
    font: "Outfit, sans-serif",
    style: "luxury_dark",
    premium: true,
  },
];

const FONTS = [
  { name: "Inter (Sans)", value: "Inter, sans-serif" },
  { name: "Outfit (Modern)", value: "Outfit, sans-serif" },
  { name: "Playfair Display (Serif)", value: "Playfair Display, serif" },
  { name: "JetBrains Mono (Tech)", value: "JetBrains Mono, monospace" },
  { name: "Public Sans (Clean)", value: "Public Sans, sans-serif" },
  {
    name: "Bricolage Grotesque (Bold)",
    value: "Bricolage Grotesque, sans-serif",
  },
  { name: "Syne (Artistic)", value: "Syne, sans-serif" },
  { name: "Fraunces (Elegant Serif)", value: "Fraunces, serif" },
  { name: "Space Grotesque (Tech Sans)", value: "Space Grotesque, sans-serif" },
  { name: "Plus Jakarta Sans (Sleek)", value: "Plus Jakarta Sans, sans-serif" },
];

interface WebsiteEditorProps {
  businessIdOverride?: string;
  templateIdOverride?: string;
  forceShowGenerator?: boolean;
}

export function WebsiteEditor({
  businessIdOverride,
  templateIdOverride,
  forceShowGenerator,
}: WebsiteEditorProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isFeatureEnabled } = useFeatures();
  const [website, setWebsite] = useState<Website | null>(null);
  const [business, setBusiness] = useState<any | null>(null);
  const [template, setTemplate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "content"
    | "general"
    | "theme"
    | "seo"
    | "footer"
    | "template"
    | "gallery"
    | "tracking"
    | "advanced"
  >("content");
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  // Sync activeTab with location
  useEffect(() => {
    if (location.pathname.includes("/templates")) {
      setActiveTab("gallery");
    } else {
      // If we are on /website but activeTab is gallery, reset it
      if (activeTab === "gallery") {
        setActiveTab("content");
      }
    }
  }, [location.pathname]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddSection, setShowAddSection] = useState<{
    pageId: string;
  } | null>(null);
  const [showGenerator, setShowGenerator] = useState(
    forceShowGenerator || false,
  );
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState<string | null>(null);
  const [seoAudit, setSeoAudit] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [legalAcknowledged, setLegalAcknowledged] = useState(false);
  const [activeElement, setActiveElement] = useState<{
    type: "page" | "section";
    pageId: string;
    sectionId?: string;
  } | null>(null);
  const [showAddPage, setShowAddPage] = useState(false);
  const [maxPages, setMaxPages] = useState(5);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [newPageData, setNewPageData] = useState({ title: "", slug: "" });
  const [isGeneratingPage, setIsGeneratingPage] = useState(false);
  const [isGeneratingSection, setIsGeneratingSection] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showAiEditor, setShowAiEditor] = useState(false);
  const [styleToPreview, setStyleToPreview] = useState<string | null>(null);
  const [enabledStyles, setEnabledStyles] = useState<string[]>([]);
  const [enabledThemes, setEnabledThemes] = useState<string[]>([]);

  const [activePageId, setActivePageId] = useState<string | null>(null);

  const businessId = businessIdOverride || profile?.businessId;
  const isTemplateMode = !!templateIdOverride;

  const {
    register: registerSeo,
    handleSubmit: handleSubmitSeo,
    formState: { errors: seoErrors, isDirty: isSeoDirty },
    reset: resetSeo,
    setValue: setSeoValue,
    watch: watchSeo,
    getValues: getValuesSeo,
  } = useForm<SeoFormData>({
    resolver: zodResolver(seoSchema),
    mode: "onChange",
  });

  const fetchData = React.useCallback(
    async (targetBusinessId?: string) => {
      const activeBusinessId = targetBusinessId || businessId;

      if (!activeBusinessId && !templateIdOverride) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Parallelize queries for maximum speed
        const [plansSettingsResult, businessResult, contentResult] =
          await Promise.all([
            supabase
              .from("settings")
              .select("content")
              .eq("id", "plans")
              .maybeSingle(),
            activeBusinessId && activeBusinessId !== "template"
              ? supabase
                  .from("businesses")
                  .select("*")
                  .eq("id", activeBusinessId)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
            isTemplateMode
              ? templateIdOverride === "new"
                ? Promise.resolve({ data: null })
                : supabase
                    .from("templates")
                    .select("*")
                    .eq("id", templateIdOverride)
                    .maybeSingle()
              : supabase
                  .from("websites")
                  .select("*")
                  .eq("business_id", activeBusinessId)
                  .maybeSingle(),
          ]);

        const planConfigs = plansSettingsResult.data?.content?.pricing || [];

        // Process Business Data
        if (businessResult.data) {
          setBusiness(businessResult.data);
          const currentPlan = planConfigs.find(
            (p: any) => p.id === businessResult.data.plan,
          );
          if (currentPlan?.maxPages) {
            setMaxPages(currentPlan.maxPages);
          }
        }

        // Process Website/Template Content
        if (isTemplateMode) {
          setMaxPages(50);
          if (templateIdOverride === "new") {
            const websiteData: Website = {
              id: generateId(),
              businessId: "template",
              theme: {
                primaryColor: THEME_PRESETS[0].primary,
                secondaryColor: THEME_PRESETS[0].secondary,
                fontFamily: THEME_PRESETS[0].font,
                style: THEME_PRESETS[0].style as any,
                footer: {
                  showMenu: true,
                  showSocials: true,
                  showContact: true,
                  customText: "",
                  contactEmail: "contact@example.com",
                  contactPhone: "+1 (555) 000-0000",
                  contactAddress: "123 Business St, City, Country",
                  socialLinks: [
                    { platform: "facebook", url: "", isVisible: true },
                    { platform: "instagram", url: "", isVisible: true },
                    { platform: "twitter", url: "", isVisible: true },
                    { platform: "linkedin", url: "", isVisible: true },
                    { platform: "youtube", url: "", isVisible: true },
                  ],
                },
              },
              pages: [
                { id: generateId(), title: "Home", slug: "", sections: [] },
              ],
              seo: {
                title: "New Template",
                description: "A professional website template.",
                keywords: ["template", "business"],
                businessType: "LocalBusiness",
              },
              status: "published",
              updatedAt: Date.now(),
            };
            setWebsite(websiteData);
            setActivePageId(websiteData.pages[0].id);
            setTemplate({ name: "New Template", category: "General" });
            resetSeo({
              title: websiteData.seo.title,
              description: websiteData.seo.description,
              keywords: websiteData.seo.keywords.join(", "),
              favicon: "",
              ogImage: "",
              canonicalUrl: "",
              businessType: "LocalBusiness",
              priceRange: "$$",
              brandVoice: "Professional",
              targetAudience: "",
              coreValueProposition: "",
              knowledgeBaseSummary: "",
            });
          } else if (contentResult.data) {
            const data = contentResult.data;
            setTemplate(data);
            const websiteData: Website = {
              id: data.id,
              businessId: "template",
              theme: data.config.theme,
              pages: data.config.pages,
              seo: data.config.seo,
              status: "published",
              updatedAt: new Date(data.created_at).getTime(),
            };
            setWebsite(websiteData);
            if (websiteData.pages.length > 0)
              setActivePageId(websiteData.pages[0].id);
            resetSeo({
              title: websiteData.seo.title,
              description: websiteData.seo.description,
              keywords: websiteData.seo.keywords.join(", "),
              favicon: websiteData.seo.favicon || "",
              ogImage: websiteData.seo.ogImage || "",
              canonicalUrl: websiteData.seo.canonicalUrl || "",
              region: websiteData.seo.region || "",
              placename: websiteData.seo.placename || "",
              latitude: websiteData.seo.latitude || "",
              longitude: websiteData.seo.longitude || "",
              businessType: websiteData.seo.businessType || "LocalBusiness",
              address: websiteData.seo.address || "",
              phone: websiteData.seo.phone || "",
              priceRange: websiteData.seo.priceRange || "$$",
              brandVoice: websiteData.seo.brandVoice || "Professional",
              targetAudience: websiteData.seo.targetAudience || "",
              coreValueProposition: websiteData.seo.coreValueProposition || "",
              knowledgeBaseSummary: websiteData.seo.knowledgeBaseSummary || "",
            });
          }
        } else {
          if (contentResult.data) {
            const websiteData = mapWebsite(contentResult.data);
            setWebsite(websiteData);
            if (websiteData.pages.length > 0)
              setActivePageId(websiteData.pages[0].id);
            resetSeo({
              title: websiteData.seo.title,
              description: websiteData.seo.description,
              keywords: websiteData.seo.keywords.join(", "),
              favicon: websiteData.seo.favicon || "",
              ogImage: websiteData.seo.ogImage || "",
              canonicalUrl: websiteData.seo.canonicalUrl || "",
              region: websiteData.seo.region || "",
              placename: websiteData.seo.placename || "",
              latitude: websiteData.seo.latitude || "",
              longitude: websiteData.seo.longitude || "",
              businessType: websiteData.seo.businessType || "LocalBusiness",
              address: websiteData.seo.address || "",
              phone: websiteData.seo.phone || "",
              priceRange: websiteData.seo.priceRange || "$$",
              brandVoice: websiteData.seo.brandVoice || "Professional",
              targetAudience: websiteData.seo.targetAudience || "",
              coreValueProposition: websiteData.seo.coreValueProposition || "",
              knowledgeBaseSummary: websiteData.seo.knowledgeBaseSummary || "",
            });
          } else {
            setWebsite(null);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setWebsite(null);
      } finally {
        setLoading(false);
      }
    },
    [businessId, templateIdOverride, resetSeo],
  );

  useEffect(() => {
    if (forceShowGenerator && !website) {
      setShowGenerator(true);
    }
  }, [forceShowGenerator, website]);

  useEffect(() => {
    fetchData();

    const fetchArchetypeConfig = async () => {
      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("id", "archetype_config")
        .maybeSingle();

      if (data) {
        setEnabledStyles(data.content.enabledStyles || []);
        setEnabledThemes(data.content.enabledThemes || []);
      }
    };
    fetchArchetypeConfig();

    if (businessId && !isTemplateMode) {
      const channel = supabase
        .channel(`website-editor-${Math.random()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "websites",
            filter: `business_id=eq.${businessId}`,
          },
          () => {
            if (!isDeleting) {
              fetchData();
            }
          },
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [businessId, isTemplateMode, fetchData, isDeleting]);

  const mapWebsite = (dbWebsite: any): Website => {
    const theme = { ...dbWebsite.theme };
    if (!theme.footer) {
      theme.footer = {
        showMenu: true,
        showSocials: true,
        showContact: true,
        customText: "",
        contactEmail:
          dbWebsite.theme.footer?.contactEmail || "contact@business.com",
        contactPhone:
          dbWebsite.theme.footer?.contactPhone || "+1 (555) 000-0000",
        contactAddress:
          dbWebsite.theme.footer?.contactAddress ||
          "123 Business St, City, Country",
        socialLinks: dbWebsite.theme.footer?.socialLinks || [
          { platform: "facebook", url: "", isVisible: true },
          { platform: "instagram", url: "", isVisible: true },
          { platform: "twitter", url: "", isVisible: true },
          { platform: "linkedin", url: "", isVisible: true },
          { platform: "youtube", url: "", isVisible: true },
        ],
      };
    }

    return {
      id: dbWebsite.id,
      businessId: dbWebsite.business_id,
      theme: theme,
      pages: dbWebsite.pages,
      seo: dbWebsite.seo,
      status: dbWebsite.status,
      updatedAt: new Date(dbWebsite.updated_at).getTime(),
    };
  };

  const handleSave = async (data?: any) => {
    if (!website) return;
    setSaving(true);
    try {
      const isWebsiteObject = data && data.pages && data.theme && data.seo;
      const targetWebsite = isWebsiteObject ? data : website;

      const updatedWebsiteConfig: any = {
        theme: targetWebsite.theme,
        pages: targetWebsite.pages,
        seo: targetWebsite.seo,
        status: targetWebsite.status,
        updated_at: new Date().toISOString(),
      };

      // If it's SEO form data
      if (data && activeTab === "seo" && !isWebsiteObject) {
        const seoData = {
          title: data.title,
          description: data.description,
          keywords: data.keywords.split(",").map((k: string) => k.trim()),
          favicon: data.favicon || "",
          ogImage: data.ogImage || "",
          canonicalUrl: data.canonicalUrl || "",
          region: data.region || "",
          placename: data.placename || "",
          latitude: data.latitude || "",
          longitude: data.longitude || "",
          businessType: data.businessType || "LocalBusiness",
          address: data.address || "",
          phone: data.phone || "",
          priceRange: data.priceRange || "$$",
          brandVoice: data.brandVoice || "Professional",
          targetAudience: data.targetAudience || "",
          coreValueProposition: data.coreValueProposition || "",
          knowledgeBaseSummary: data.knowledgeBaseSummary || "",
        };
        updatedWebsiteConfig.seo = seoData;
        if (isTemplateMode) {
          website.seo = seoData; // Update local state for consistency
        }
      }

      if (isTemplateMode) {
        const templateData = {
          name: template?.name || "New Template",
          category: template?.category || "General",
          description:
            template?.description || updatedWebsiteConfig.seo.description,
          thumbnail:
            template?.thumbnail ||
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
          config: {
            theme: updatedWebsiteConfig.theme,
            pages: updatedWebsiteConfig.pages,
            seo: updatedWebsiteConfig.seo,
          },
          is_premium: template?.is_premium || false,
        };

        if (templateIdOverride === "new") {
          const { data: newTemplate, error } = await supabase
            .from("templates")
            .insert([templateData])
            .select()
            .single();

          if (error) throw error;
          toast.success("Template created successfully!");
          window.location.hash = `admin/templates/edit/${newTemplate.id}`;
        } else {
          const { error } = await supabase
            .from("templates")
            .update(templateData)
            .eq("id", templateIdOverride);
          if (error) throw error;
          toast.success("Template saved successfully!");
        }
      } else {
        const websitePromise = supabase
          .from("websites")
          .update(updatedWebsiteConfig)
          .eq("id", website.id);

        // Also update business tracking settings if in tracking tab
        let businessPromise: Promise<any> = Promise.resolve({ error: null });
        if (activeTab === "tracking" && business) {
          businessPromise = supabase
            .from("businesses")
            .update({
              ga_measurement_id: business.ga_measurement_id,
              meta_pixel_id: business.meta_pixel_id,
              tracking_scripts_header: business.tracking_scripts_header,
              tracking_scripts_footer: business.tracking_scripts_footer,
            })
            .eq("id", business.id) as any;
        }

        const [websiteRes, businessRes] = await Promise.all([
          websitePromise,
          businessPromise,
        ]);

        if (websiteRes.error) throw websiteRes.error;
        if (businessRes.error) throw businessRes.error;

        toast.success("Settings saved successfully!");
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save website");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!website) return;
    setSaving(true);
    setShowPublishConfirm(false);
    try {
      const { error } = await supabase
        .from("websites")
        .update({
          status: "published",
          updated_at: new Date().toISOString(),
        })
        .eq("id", website.id);
      if (error) throw error;
      setWebsite({ ...website, status: "published" });
      toast.success("Website published successfully!");
    } catch (error) {
      console.error("Publish failed:", error);
      toast.error("Failed to publish website");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "published" | "draft") => {
    if (!website) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("websites")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", website.id);
      if (error) throw error;
      setWebsite({ ...website, status: newStatus });
      toast.success(`Website status updated to ${newStatus}`);
    } catch (error) {
      console.error("Status update failed:", error);
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWebsite = async () => {
    if (!website) return;
    setIsDeleting(true);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("websites")
        .delete()
        .eq("id", website.id);

      if (error) throw error;
      toast.success("Website deleted successfully");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast.error(err.message || "Failed to delete website");
      setIsDeleting(false);
      setSaving(false);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const updateSectionContent = (
    pageId: string,
    sectionId: string,
    newContent: any,
  ) => {
    if (!website) return;
    const newPages = website.pages.map((page) => {
      if (page.id === pageId) {
        return {
          ...page,
          sections: page.sections.map((section) => {
            if (section.id === sectionId) {
              return {
                ...section,
                content: { ...section.content, ...newContent },
              };
            }
            return section;
          }),
        };
      }
      return page;
    });
    setWebsite({ ...website, pages: newPages });
  };

  const generateAISectionContent = async (
    pageId: string,
    sectionId: string,
    sectionType: string,
  ) => {
    if (!website) return;
    setIsGeneratingSection(true);
    try {
      const result = await generateSectionContent(
        sectionType,
        business?.name || website.seo?.title || "Business",
        business?.industry || website.seo?.keywords?.[0] || "General",
        website.seo?.placename || business?.city || "Online",
        website.seo?.brandVoice || "Professional",
        business?.description || website.seo?.description,
        business?.id,
        customPrompt,
      );

      if (result && result.content) {
        // Update the section content
        const newPages = website.pages.map((page) => {
          if (page.id === pageId) {
            return {
              ...page,
              sections: page.sections.map((section) => {
                if (section.id === sectionId) {
                  return {
                    ...section,
                    content: result.content,
                  };
                }
                return section;
              }),
            };
          }
          return page;
        });

        setWebsite({ ...website, pages: newPages });
        toast.success("AI content generated successfully!");
        setShowAiEditor(false);
        setCustomPrompt("");
      }
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      toast.error(error.message || "Failed to generate AI content");
    } finally {
      setIsGeneratingSection(false);
    }
  };

  const updateSectionSettings = (
    pageId: string,
    sectionId: string,
    newSettings: any,
  ) => {
    if (!website) return;
    const newPages = website.pages.map((page) => {
      if (page.id === pageId) {
        return {
          ...page,
          sections: page.sections.map((section) => {
            if (section.id === sectionId) {
              return {
                ...section,
                settings: { ...section.settings, ...newSettings },
              };
            }
            return section;
          }),
        };
      }
      return page;
    });
    setWebsite({ ...website, pages: newPages });
  };

  const updateSectionSeo = (pageId: string, sectionId: string, newSeo: any) => {
    if (!website) return;
    const newPages = website.pages.map((page) => {
      if (page.id === pageId) {
        return {
          ...page,
          sections: page.sections.map((section) => {
            if (section.id === sectionId) {
              return { ...section, seo: { ...section.seo, ...newSeo } };
            }
            return section;
          }),
        };
      }
      return page;
    });
    setWebsite({ ...website, pages: newPages });
  };

  const updatePageSeo = (pageId: string, newSeo: any) => {
    if (!website) return;
    const newPages = website.pages.map((page) => {
      if (page.id === pageId) {
        return { ...page, seo: { ...page.seo, ...newSeo } };
      }
      return page;
    });
    setWebsite({ ...website, pages: newPages });
  };

  const updatePageTitle = (pageId: string, newTitle: string) => {
    if (!website) return;
    const newPages = website.pages.map((page) => {
      if (page.id === pageId) {
        return { ...page, title: newTitle };
      }
      return page;
    });
    setWebsite({ ...website, pages: newPages });
  };

  const updatePageSlug = (pageId: string, newSlug: string) => {
    if (!website) return;
    const newPages = website.pages.map((page) => {
      if (page.id === pageId) {
        // Prevent changing home page slug
        if (page.slug === "") return page;
        return {
          ...page,
          slug: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        };
      }
      return page;
    });
    setWebsite({ ...website, pages: newPages });
  };

  const movePage = (pageId: string, direction: "up" | "down") => {
    if (!website) return;
    const index = website.pages.findIndex((p) => p.id === pageId);
    if (index === -1) return;

    // Safety check: prevent moving out of bounds
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === website.pages.length - 1) return;

    const newPages = [...website.pages];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    [newPages[index], newPages[newIndex]] = [
      newPages[newIndex],
      newPages[index],
    ];
    setWebsite({ ...website, pages: newPages });
  };

  const moveSection = (
    pageId: string,
    sectionId: string,
    direction: "up" | "down",
  ) => {
    if (!website) return;
    const newPages = website.pages.map((page) => {
      if (page.id === pageId) {
        const index = page.sections.findIndex((s) => s.id === sectionId);
        if (index === -1) return page;

        const newSections = [...page.sections];
        const newIndex = direction === "up" ? index - 1 : index + 1;

        if (newIndex >= 0 && newIndex < newSections.length) {
          [newSections[index], newSections[newIndex]] = [
            newSections[newIndex],
            newSections[index],
          ];
        }

        return { ...page, sections: newSections };
      }
      return page;
    });
    setWebsite({ ...website, pages: newPages });
  };

  const [draggingSection, setDraggingSection] = useState<{
    pageId: string;
    index: number;
  } | null>(null);

  const handleDragStart = (pageId: string, index: number) => {
    setDraggingSection({ pageId, index });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropSection = (targetPageId: string, targetIndex: number) => {
    if (!draggingSection || !website) return;
    if (draggingSection.pageId !== targetPageId) return; // Only reorder within same page

    const sourceIndex = draggingSection.index;
    if (sourceIndex === targetIndex) return;

    const newPages = website.pages.map((page) => {
      if (page.id === targetPageId) {
        const newSections = [...page.sections];
        const [moved] = newSections.splice(sourceIndex, 1);
        newSections.splice(targetIndex, 0, moved);
        return { ...page, sections: newSections };
      }
      return page;
    });

    setWebsite({ ...website, pages: newPages });
    setDraggingSection(null);
  };

  const toggleSectionVisibility = (pageId: string, sectionId: string) => {
    if (!website) return;
    const newPages = website.pages.map((page) => {
      if (page.id === pageId) {
        return {
          ...page,
          sections: page.sections.map((section) => {
            if (section.id === sectionId) {
              return {
                ...section,
                isVisible: section.isVisible === false ? true : false,
              };
            }
            return section;
          }),
        };
      }
      return page;
    });
    setWebsite({ ...website, pages: newPages });
  };

  const removeSection = (pageId: string, sectionId: string) => {
    if (!website) return;
    const newPages = website.pages.map((page) => {
      if (page.id === pageId) {
        return {
          ...page,
          sections: page.sections.filter((s) => s.id !== sectionId),
        };
      }
      return page;
    });
    setWebsite({ ...website, pages: newPages });
  };

  const duplicateSection = (pageId: string, sectionId: string) => {
    if (!website) return;
    const newPages = website.pages.map((page) => {
      if (page.id === pageId) {
        const sectionIndex = page.sections.findIndex((s) => s.id === sectionId);
        if (sectionIndex === -1) return page;

        const sectionToDuplicate = page.sections[sectionIndex];
        const duplicatedSection = JSON.parse(
          JSON.stringify({
            ...sectionToDuplicate,
            id: generateId(),
          }),
        );

        const newSections = [...page.sections];
        newSections.splice(sectionIndex + 1, 0, duplicatedSection);

        return {
          ...page,
          sections: newSections,
        };
      }
      return page;
    });
    setWebsite({ ...website, pages: newPages });
  };

  const addStandardPage = (
    type:
      | "blog"
      | "privacy"
      | "terms"
      | "about"
      | "contact"
      | "services"
      | "pricing"
      | "faq"
      | "shop",
  ) => {
    if (!website) return;

    if (website.pages.length >= maxPages) {
      toast.error(
        `You have reached the maximum limit of ${maxPages} pages for your plan.`,
      );
      return;
    }

    const pageConfigs = {
      blog: { title: "Blog", slug: "blog", sectionType: "blog_list" },
      privacy: {
        title: "Privacy Policy",
        slug: "privacy-policy",
        sectionType: "text_content",
      },
      terms: {
        title: "Terms of Service",
        slug: "terms-of-service",
        sectionType: "text_content",
      },
      about: { title: "About Us", slug: "about", sectionType: "about" },
      contact: { title: "Contact", slug: "contact", sectionType: "contact" },
      services: {
        title: "Services",
        slug: "services",
        sectionType: "services",
      },
      pricing: { title: "Pricing", slug: "pricing", sectionType: "pricing" },
      faq: { title: "FAQ", slug: "faq", sectionType: "faq" },
      shop: { title: "Shop", slug: "shop", sectionType: "product_list" },
    };

    const config = pageConfigs[type];
    if (website.pages.some((p) => p.slug === config.slug)) {
      toast.error(`${config.title} page already exists`);
      return;
    }

    // Create optimized sections based on page type
    const sections: WebsiteSection[] = [];

    // 1. Hero Section (Common for all)
    const heroSection = createSectionFromTemplate("hero");
    heroSection.content.headline = config.title;
    heroSection.content.subheadline = `Learn more about our ${config.title.toLowerCase()} and how we can help you achieve your goals.`;
    sections.push(heroSection);

    // 2. Page Specific Sections
    if (type === "about") {
      const story = createSectionFromTemplate("about");
      story.content.text = `## Our Story\n\nFounded with a vision to redefine ${business?.industry || "our industry"}, we've grown from a small team to a leading provider of innovative solutions. Our journey is defined by a commitment to quality, integrity, and our clients' success.`;

      const vision = createSectionFromTemplate("vision");
      const team = createSectionFromTemplate("team");
      const cta = createSectionFromTemplate("cta");
      cta.content.title = "Want to learn more about our mission?";

      sections.push(story, vision, team, cta);
    } else if (type === "services") {
      const servicesList = createSectionFromTemplate("services");
      const howItWorks = createSectionFromTemplate("how_it_works");
      const benefits = createSectionFromTemplate("benefits");
      const cta = createSectionFromTemplate("cta");
      cta.content.title = "Ready to experience these services?";

      sections.push(servicesList, howItWorks, benefits, cta);
    } else if (type === "pricing") {
      const pricing = createSectionFromTemplate("pricing");
      const comparison = createSectionFromTemplate("comparison");
      const faq = createSectionFromTemplate("faq");
      faq.content.title = "Pricing Questions";
      const cta = createSectionFromTemplate("cta");

      sections.push(pricing, comparison, faq, cta);
    } else if (type === "contact") {
      const contact = createSectionFromTemplate("contact");
      const faq = createSectionFromTemplate("faq");
      faq.content.title = "Common Questions";

      sections.push(contact, faq);
    } else if (type === "faq") {
      const faq = createSectionFromTemplate("faq");
      const cta = createSectionFromTemplate("cta");
      cta.content.title = "Still have questions?";
      cta.content.buttonText = "Contact Support";

      sections.push(faq, cta);
    } else if (type === "blog") {
      sections.push(createSectionFromTemplate("blog_list"));
    } else if (type === "shop") {
      const shopHero = createSectionFromTemplate("hero");
      shopHero.content.headline = "The Professional Collection";
      shopHero.content.subheadline =
        "Experience excellence in every detail with our curated selection of premium offerings.";

      const productList = createSectionFromTemplate("products");
      const benefits = createSectionFromTemplate("benefits");
      benefits.content.title = "Why Shop With Us?";

      const cta = createSectionFromTemplate("cta");
      cta.content.title = "Can't find what you're looking for?";
      cta.content.buttonText = "Contact Support";

      sections.push(shopHero, productList, benefits, cta);
    } else if (type === "privacy" || type === "terms") {
      const doc = createSectionFromTemplate("text_content");
      if (type === "privacy") {
        doc.content.title = "Privacy Policy";
        doc.content.body = `# Privacy Policy\n\n**Last Updated: ${new Date().toLocaleDateString()}**\n\nYour privacy is important to us. This policy explains how we collect, use, and protect your information.`;
      } else {
        doc.content.title = "Terms of Service";
        doc.content.body = `# Terms of Service\n\n**Last Updated: ${new Date().toLocaleDateString()}**\n\nBy accessing our website, you agree to be bound by these terms. Please read them carefully.`;
      }
      sections.push(doc);
    }

    const newPage: WebsitePage = {
      id: generateId(),
      title: config.title,
      slug: config.slug,
      sections: sections,
    };

    setWebsite({ ...website, pages: [...website.pages, newPage] });
    setActivePageId(newPage.id);
    toast.success(`${config.title} page added`);
  };

  const handleAddPage = async () => {
    if (!website) return;
    if (website.pages.length >= maxPages) {
      toast.error(
        `You have reached the maximum limit of ${maxPages} pages for your plan.`,
      );
      return;
    }

    if (!newPageData.title.trim()) {
      toast.error("Page title is required");
      return;
    }

    setIsGeneratingPage(true);
    const toastId = toast.loading(
      `Generating content for "${newPageData.title}"...`,
    );

    try {
      const industry =
        business?.industry || (website as any).industry || "Business";
      const location = business?.location || (website as any).location || "";
      const businessNature =
        business?.description || (website as any).description || "";
      const tone = (website as any).tone || "Professional";

      const aiPage = await generatePageContent(
        newPageData.title.trim(),
        business?.name || website.seo?.title || "My Business",
        industry,
        location,
        tone,
        businessNature,
        businessId,
      );

      const newPage: WebsitePage = {
        id: generateId(),
        title: aiPage.title || newPageData.title.trim(),
        slug:
          aiPage.slug ||
          newPageData.slug.trim() ||
          newPageData.title.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        seo: aiPage.seo,
        sections: (aiPage.sections || []).map((section: any) => ({
          ...section,
          id: generateId(),
          isVisible: true,
        })),
      };

      setWebsite({ ...website, pages: [...website.pages, newPage] });
      setActivePageId(newPage.id);
      setShowAddPage(false);
      setNewPageData({ title: "", slug: "" });
      toast.success("Page created with AI-powered content!", { id: toastId });
    } catch (error) {
      console.error("AI Page Generation Error:", error);

      // Fallback to manual creation if AI fails
      const slug =
        newPageData.slug.trim() ||
        newPageData.title.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      const heroSection = createSectionFromTemplate("hero");
      heroSection.content.headline = newPageData.title.trim();

      const newPage: WebsitePage = {
        id: generateId(),
        title: newPageData.title.trim(),
        slug: slug,
        sections: [
          heroSection,
          createSectionFromTemplate("about"),
          createSectionFromTemplate("cta"),
        ],
      };

      setWebsite({ ...website, pages: [...website.pages, newPage] });
      setActivePageId(newPage.id);
      setShowAddPage(false);
      setNewPageData({ title: "", slug: "" });
      toast.success("Page created (Fallback mode)", { id: toastId });
    } finally {
      setIsGeneratingPage(false);
    }
  };

  const removePage = (pageId: string) => {
    if (!website) return;
    const page = website.pages.find((p) => p.id === pageId);
    if (page?.slug === "") {
      toast.error("Cannot delete the home page.");
      return;
    }

    const newPages = website.pages.filter((p) => p.id !== pageId);
    const updatedWebsite = { ...website, pages: newPages };
    setWebsite(updatedWebsite);

    if (activePageId === pageId) {
      setActivePageId(newPages[0].id);
    }

    if (activeElement?.pageId === pageId) {
      setActiveElement(null);
    }

    setPageToDelete(null);

    // Auto-save if not in template mode
    if (!isTemplateMode) {
      handleSave(updatedWebsite);
    } else {
      toast.success("Page removed from template.");
    }
  };

  const handleSyncSeoFromBusiness = async () => {
    let targetBusiness = business;

    if (!targetBusiness && profile?.businessId) {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", profile.businessId)
          .maybeSingle();
        
        if (data) {
          targetBusiness = data;
          setBusiness(data);
        }
      } catch (err) {
        console.error("Failed to fetch business for sync:", err);
      }
    }

    if (!targetBusiness || !website) {
      toast.error("Business data or website configuration missing. Please ensure your profile is complete.");
      return;
    }

    const industry = targetBusiness.industry || "";
    // ... rest of sync logic
    const industryLower = industry.toLowerCase();
    let inferredType = "LocalBusiness";
    if (industryLower.includes("restaurant") || industryLower.includes("food")) inferredType = "Restaurant";
    else if (industryLower.includes("medical") || industryLower.includes("health")) inferredType = "MedicalBusiness";
    else if (industryLower.includes("legal") || industryLower.includes("law")) inferredType = "ProfessionalService";
    else if (industryLower.includes("real estate")) inferredType = "RealEstateAgent";
    else if (industryLower.includes("shop") || industryLower.includes("store")) inferredType = "Store";

    const syncData: Partial<SeoFormData> = {
      title: (targetBusiness.name || website.seo.title || "").substring(0, 70),
      description: (targetBusiness.description || website.seo.description || "").substring(0, 160),
      phone: targetBusiness.phone || website.seo.phone || "",
      address: targetBusiness.address || targetBusiness.location || website.seo.address || "",
      placename: targetBusiness.city || website.seo.placename || "",
      region: targetBusiness.state || website.seo.region || "",
      businessType: inferredType,
      keywords: (getValuesSeo("keywords") || targetBusiness.industry || ""),
    };

    resetSeo({
      ...getValuesSeo(),
      ...syncData,
    });

    const updatedSeo = {
      ...website.seo,
      ...syncData,
      keywords: (syncData.keywords || "").split(",").map(k => k.trim()).filter(k => k !== ""),
    };

    setWebsite({
      ...website,
      seo: updatedSeo as any,
    });
    toast.success("SEO settings synchronized with business profile");
  };

  const addWhyChooseUsSection = async (pageId: string) => {
    if (!website) return;

    const homePage = website.pages.find((p) => p.id === pageId);
    if (homePage?.sections.some((s) => s.content.title === "Why Choose Us?")) {
      toast.error("Features section already exists");
      return;
    }

    const toastId = toast.loading("Generating 'Why Choose Us' section...");
    setIsGeneratingSection(true);

    try {
      const industry =
        business?.industry || (website as any).industry || "Business";
      const location = business?.location || (website as any).location || "";
      const businessNature =
        business?.description || (website as any).description || "";
      const tone = (website as any).tone || "Professional";

      const aiSection = await generateSectionContent(
        "benefits",
        business?.name || website.seo?.title || "My Business",
        industry,
        location,
        tone,
        businessNature,
        businessId,
      );

      const newSection: WebsiteSection = {
        id: generateId(),
        type: "benefits",
        content: aiSection.content,
        isVisible: true,
        settings: {
          backgroundColor: "#f8fafc",
          textColor: "#1e293b",
        },
      };

      const newPages = website.pages.map((page) => {
        if (page.id === pageId) {
          return {
            ...page,
            sections: [...page.sections, newSection],
          };
        }
        return page;
      });

      setWebsite({ ...website, pages: newPages });
      toast.success("Section added with AI content!", { id: toastId });
    } catch (error) {
      console.error("AI Section Generation Error:", error);

      // Fallback
      const newSection: WebsiteSection = {
        id: generateId(),
        type: "benefits",
        content: {
          title: "Why Choose Us?",
          items: [
            {
              title: "Expert Team",
              description:
                "Our professionals are highly trained and experienced in delivering excellence.",
            },
            {
              title: "Quality Service",
              description:
                "We provide top-notch solutions tailored specifically to your business needs.",
            },
            {
              title: "24/7 Support",
              description:
                "Our dedicated support team is always available to help you succeed.",
            },
          ],
        },
        isVisible: true,
        settings: {
          backgroundColor: "#f8fafc",
          textColor: "#1e293b",
        },
      };

      const newPages = website.pages.map((page) => {
        if (page.id === pageId) {
          return {
            ...page,
            sections: [...page.sections, newSection],
          };
        }
        return page;
      });

      setWebsite({ ...website, pages: newPages });
      toast.success("Section added (Fallback mode)", { id: toastId });
    } finally {
      setIsGeneratingSection(false);
    }
  };

  const addSection = async (pageId: string, type: string) => {
    if (!website) return;

    const toastId = toast.loading(`Generating ${type} section...`);
    setIsGeneratingSection(true);

    try {
      const industry =
        business?.industry || (website as any).industry || "Business";
      const location = business?.location || (website as any).location || "";
      const businessNature =
        business?.description || (website as any).description || "";
      const tone = (website as any).tone || "Professional";

      const aiSection = await generateSectionContent(
        type,
        business?.name || website.seo?.title || "My Business",
        industry,
        location,
        tone,
        businessNature,
        businessId,
      );

      const newSection: WebsiteSection = {
        ...createSectionFromTemplate(type),
        id: generateId(),
        content: aiSection.content,
      };

      const newPages = website.pages.map((page) => {
        if (page.id === pageId) {
          return {
            ...page,
            sections: [...page.sections, newSection],
          };
        }
        return page;
      });

      setWebsite({ ...website, pages: newPages });
      setShowAddSection(null);
      toast.success(`${type} section added!`, { id: toastId });
    } catch (error) {
      console.error("AI Section Generation Error:", error);

      try {
        const newSection = createSectionFromTemplate(type);

        const newPages = website.pages.map((page) => {
          if (page.id === pageId) {
            return {
              ...page,
              sections: [...page.sections, newSection],
            };
          }
          return page;
        });

        setWebsite({ ...website, pages: newPages });
        setShowAddSection(null);
        toast.success(`${type} section added (Fallback mode)`, { id: toastId });
      } catch (innerError) {
        toast.error("Failed to add section", { id: toastId });
      }
    } finally {
      setIsGeneratingSection(false);
    }
  };

  const getGoogleFontUrl = () => {
    // Pre-fetch all fonts from the FONTS constant
    const allFontsList = [
      "Inter:wght@100..900",
      "Outfit:wght@100..900",
      "Playfair+Display:ital,wght@0,400..900;1,400..900",
      "JetBrains+Mono:wght@100..800",
      "Public+Sans:ital,wght@0,100..900;1,100..900",
      "Bricolage+Grotesque:opsz,wght@12..96,200..800",
      "Syne:wght@400..800",
      "Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900",
      "Space+Grotesque:wght@300..700",
      "Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800",
      "Roboto+Condensed:wght@100..900",
    ].join("|");

    return `https://fonts.googleapis.com/css2?family=${allFontsList}&display=swap`;
  };

  const renderSidebar = () => {
    if (!activeElement) return null;

    const page = website?.pages.find((p) => p.id === activeElement.pageId);
    if (!page) return null;

    const section =
      activeElement.type === "section"
        ? page.sections.find((s) => s.id === activeElement.sectionId)
        : null;

    return (
      <>
        {/* Mobile Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] animate-in fade-in duration-300 pointer-events-auto"
          onClick={() => setActiveElement(null)}
        />

        <aside className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white border-l border-slate-200 shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] z-[100] flex flex-col animate-in slide-in-from-right duration-500 ease-in-out">
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                {activeElement.type === "page" ? (
                  <FileText className="h-5 w-5" />
                ) : (
                  <Layout className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-lg text-slate-900 leading-tight">
                  {activeElement.type === "page"
                    ? "Page Settings"
                    : "Section Settings"}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-[10px] uppercase h-4 px-1.5 bg-slate-100 text-slate-500 border-none font-black letter-spacing-widest"
                  >
                    {activeElement.type === "page"
                      ? page.slug || "Home"
                      : section?.type}
                  </Badge>
                  <span className="text-slate-300 text-[10px]">•</span>
                  <span className="text-slate-500 text-[10px] font-medium">
                    {activeElement.type === "page"
                      ? page.title
                      : "Content Configuration"}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-slate-100 h-10 w-10 transition-transform hover:scale-110 active:scale-95"
              onClick={() => setActiveElement(null)}
            >
              <X className="h-5 w-5 text-slate-500" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-32 scrollbar-none">
            {activeElement.type === "page" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Core Identity
                  </h4>
                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">
                        Page Name
                      </Label>
                      <Input
                        className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-4 focus:ring-indigo-100"
                        value={page.title}
                        onChange={(e) =>
                          updatePageTitle(page.id, e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">
                        URL path (Slug)
                      </Label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                          /
                        </div>
                        <Input
                          disabled={page.slug === ""}
                          className="h-11 pl-7 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-4 focus:ring-indigo-100 disabled:opacity-50"
                          value={page.slug}
                          onChange={(e) =>
                            updatePageSlug(page.id, e.target.value)
                          }
                          placeholder="home"
                        />
                      </div>
                      {page.slug === "" && (
                        <p className="text-[10px] text-slate-400 italic px-1">
                          Home page slug is permanently set to root.
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="pt-8 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      SEO & Metadata
                    </h4>
                    <Search className="h-4 w-4 text-slate-300" />
                  </div>

                  <Accordion defaultValue={["basic-seo"]} className="space-y-4">
                    <AccordionItem
                      value="basic-seo"
                      className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-indigo-500" />
                          <span className="text-sm font-bold text-slate-900 text-left">
                            Search Visibility
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-6 pt-0 space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">
                              Meta Title Override
                            </Label>
                            <Input
                              className="h-10 text-sm rounded-xl"
                              value={page.seo?.title || ""}
                              placeholder={website.seo.title}
                              onChange={(e) =>
                                updatePageSeo(page.id, {
                                  title: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">
                              Meta Keywords (Comma separated)
                            </Label>
                            <Input
                              className="h-10 text-sm rounded-xl"
                              value={page.seo?.keywords?.join(", ") || ""}
                              placeholder={website.seo.keywords.join(", ")}
                              onChange={(e) =>
                                updatePageSeo(page.id, {
                                  keywords: e.target.value
                                    .split(",")
                                    .map((k) => k.trim())
                                    .filter(Boolean),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">
                              Meta Description
                            </Label>
                            <Textarea
                              className="text-sm min-h-[100px] rounded-xl resize-none"
                              value={page.seo?.description || ""}
                              placeholder={website.seo.description}
                              onChange={(e) =>
                                updatePageSeo(page.id, {
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">
                              Canonical URL Override
                            </Label>
                            <Input
                              className="h-10 text-sm rounded-xl"
                              value={page.seo?.canonicalUrl || ""}
                              placeholder="https://yourdomain.com"
                              onChange={(e) =>
                                updatePageSeo(page.id, {
                                  canonicalUrl: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">
                              Favicon Override (URL)
                            </Label>
                            <Input
                              className="h-10 text-sm rounded-xl"
                              value={page.seo?.favicon || ""}
                              placeholder="https://..."
                              onChange={(e) =>
                                updatePageSeo(page.id, {
                                  favicon: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">
                              Social Image (OG)
                            </Label>
                            <Input
                              className="h-10 text-sm rounded-xl"
                              value={page.seo?.ogImage || ""}
                              placeholder="https://..."
                              onChange={(e) =>
                                updatePageSeo(page.id, {
                                  ogImage: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="local-seo"
                      className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-bold text-slate-900 text-left">
                            Location & Local SEO
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-6 pt-0 space-y-6">
                        <div className="grid gap-5">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">
                              Override Business Type
                            </Label>
                            <Select
                              value={page.seo?.businessType || ""}
                              onValueChange={(val) =>
                                updatePageSeo(page.id, { businessType: val })
                              }
                            >
                              <SelectTrigger className="h-10 rounded-xl">
                                <SelectValue placeholder="Use Global Setting" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LocalBusiness">
                                  Local Business
                                </SelectItem>
                                <SelectItem value="Restaurant">
                                  Restaurant
                                </SelectItem>
                                <SelectItem value="ProfessionalService">
                                  Professional Service
                                </SelectItem>
                                <SelectItem value="HealthAndBeautyBusiness">
                                  Health & Beauty
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">
                              Address Override
                            </Label>
                            <Input
                              className="h-10 rounded-xl"
                              value={page.seo?.address || ""}
                              placeholder={
                                website.seo.address || "123 Business St..."
                              }
                              onChange={(e) =>
                                updatePageSeo(page.id, {
                                  address: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                Latitude
                              </Label>
                              <Input
                                className="h-10 rounded-xl"
                                value={page.seo?.latitude || ""}
                                placeholder={website.seo.latitude}
                                onChange={(e) =>
                                  updatePageSeo(page.id, {
                                    latitude: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                Longitude
                              </Label>
                              <Input
                                className="h-10 rounded-xl"
                                value={page.seo?.longitude || ""}
                                placeholder={website.seo.longitude}
                                onChange={(e) =>
                                  updatePageSeo(page.id, {
                                    longitude: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">
                              Opening Hours Override
                            </Label>
                            <Textarea
                              className="text-xs min-h-[80px] rounded-xl resize-none"
                              placeholder="Mo 09:00-17:00..."
                              value={page.seo?.openingHours?.join("\n") || ""}
                              onChange={(e) =>
                                updatePageSeo(page.id, {
                                  openingHours: e.target.value
                                    .split("\n")
                                    .filter(Boolean),
                                })
                              }
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </section>
              </div>
            )}

            {activeElement.type === "section" && section && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-50 to-white rounded-[2rem] border border-indigo-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-indigo-600 hover:text-white transition-all duration-300"
                      onClick={() => setShowAiEditor(true)}
                      title="AI Magic Generation"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-md",
                        section.isVisible !== false
                          ? "bg-indigo-600"
                          : "bg-slate-400",
                      )}
                    >
                      {section.isVisible !== false ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-black text-slate-900 uppercase tracking-tighter">
                        Visibility
                      </Label>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {section.isVisible !== false
                          ? "Visible on site"
                          : "Hidden from site"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    className="data-[state=checked]:bg-indigo-600"
                    checked={section.isVisible !== false}
                    onCheckedChange={() =>
                      toggleSectionVisibility(page.id, section.id)
                    }
                  />
                </section>

                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="w-full h-12 p-1 rounded-2xl bg-slate-100 mb-8">
                    <TabsTrigger
                      value="content"
                      className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Content
                    </TabsTrigger>
                    <TabsTrigger
                      value="design"
                      className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Design
                    </TabsTrigger>
                    <TabsTrigger
                      value="advanced"
                      className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Advanced
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="content"
                    className="space-y-10 focus-visible:outline-none"
                  >
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Content Configuration
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          onClick={() => setShowAiEditor(true)}
                        >
                          <Sparkles className="h-3 w-3" />
                          Regenerate with AI
                        </Button>
                      </div>

                      <div className="space-y-8">
                        {section.type === "hero" && (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold text-slate-700">
                                Headline
                              </Label>
                              <Input
                                className="h-11 rounded-2xl border-slate-200 bg-slate-50 shadow-sm focus:bg-white transition-all"
                                value={section.content.headline}
                                onChange={(e) =>
                                  updateSectionContent(page.id, section.id, {
                                    headline: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold text-slate-700">
                                Supporting Text
                              </Label>
                              <Textarea
                                className="rounded-3xl min-h-[120px] border-slate-200 bg-slate-50 shadow-sm focus:bg-white transition-all leading-relaxed p-5"
                                value={section.content.subheadline}
                                onChange={(e) =>
                                  updateSectionContent(page.id, section.id, {
                                    subheadline: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="p-6 rounded-3xl border border-indigo-100 bg-indigo-50/30 space-y-4">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                                <Sparkles className="h-3 w-3" /> Call to Action
                              </div>
                              <div className="space-y-3">
                                <Input
                                  className="rounded-xl h-10 border-indigo-200 bg-white"
                                  placeholder="Button Text"
                                  value={section.content.ctaText}
                                  onChange={(e) =>
                                    updateSectionContent(page.id, section.id, {
                                      ctaText: e.target.value,
                                    })
                                  }
                                />
                                <Input
                                  className="rounded-xl h-10 border-indigo-200 bg-white"
                                  placeholder="https://..."
                                  value={section.content.ctaLink || ""}
                                  onChange={(e) =>
                                    updateSectionContent(page.id, section.id, {
                                      ctaLink: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {section.type === "services" && (
                          <div className="space-y-8">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">
                                  Section Header
                                </Label>
                                <Input
                                  className="h-11 rounded-2xl"
                                  value={section.content.title}
                                  onChange={(e) =>
                                    updateSectionContent(page.id, section.id, {
                                      title: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">
                                  Section Description
                                </Label>
                                <Textarea
                                  className="rounded-2xl min-h-[80px]"
                                  value={section.content.description}
                                  onChange={(e) =>
                                    updateSectionContent(page.id, section.id, {
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Describe your services..."
                                />
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  Services List
                                </Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] font-black uppercase rounded-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                  onClick={() => {
                                    const newList = [
                                      ...(section.content.services || []),
                                      {
                                        title: "New Service",
                                        description: "Description of service",
                                      },
                                    ];
                                    updateSectionContent(page.id, section.id, {
                                      services: newList,
                                    });
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Add Service
                                </Button>
                              </div>
                              <div className="grid gap-4">
                                {section.content.services?.map(
                                  (service: any, sIdx: number) => (
                                    <div
                                      key={
                                        service.id || `editor-service-${sIdx}`
                                      }
                                      className="p-5 border border-slate-200 rounded-[2rem] space-y-4 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all relative group"
                                    >
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-4 right-4 h-8 w-8 text-red-500 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                          const newList =
                                            section.content.services.filter(
                                              (_: any, i: number) => i !== sIdx,
                                            );
                                          updateSectionContent(
                                            page.id,
                                            section.id,
                                            { services: newList },
                                          );
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                      <div className="pr-8 space-y-4">
                                        <Input
                                          placeholder="Service Name"
                                          className="h-10 rounded-xl bg-white border-slate-100 shadow-sm"
                                          value={service.title}
                                          onChange={(e) => {
                                            const newList = [
                                              ...section.content.services,
                                            ];
                                            newList[sIdx] = {
                                              ...service,
                                              title: e.target.value,
                                            };
                                            updateSectionContent(
                                              page.id,
                                              section.id,
                                              { services: newList },
                                            );
                                          }}
                                        />
                                        <Textarea
                                          placeholder="Detailed description..."
                                          className="text-xs min-h-[80px] rounded-2xl bg-white border-slate-100 shadow-sm resize-none"
                                          value={service.description}
                                          onChange={(e) => {
                                            const newList = [
                                              ...section.content.services,
                                            ];
                                            newList[sIdx] = {
                                              ...service,
                                              description: e.target.value,
                                            };
                                            updateSectionContent(
                                              page.id,
                                              section.id,
                                              { services: newList },
                                            );
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {section.type === "about" && (
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-slate-700">
                                  Narrative Content
                                </Label>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                  Markdown
                                </span>
                              </div>
                              <Textarea
                                className="min-h-[450px] font-mono text-[11px] rounded-[2rem] border-slate-200 bg-slate-50 focus:bg-white transition-all p-6 leading-relaxed shadow-inner"
                                value={section.content.text}
                                onChange={(e) =>
                                  updateSectionContent(page.id, section.id, {
                                    text: e.target.value,
                                  })
                                }
                                placeholder="Write your story using markdown..."
                              />
                            </div>
                          </div>
                        )}

                        {section.type === "cta" && (
                          <div className="space-y-6">
                            <div className="grid gap-6">
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">
                                  Headline
                                </Label>
                                <Input
                                  className="h-11 rounded-2xl"
                                  value={section.content.title}
                                  onChange={(e) =>
                                    updateSectionContent(page.id, section.id, {
                                      title: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">
                                  Body Copy
                                </Label>
                                <Textarea
                                  className="min-h-[100px] rounded-2xl"
                                  value={section.content.description}
                                  onChange={(e) =>
                                    updateSectionContent(page.id, section.id, {
                                      description: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="p-4 bg-indigo-50/50 rounded-2xl space-y-4 border border-indigo-100">
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold text-slate-700">
                                    Primary Button
                                  </Label>
                                  <Input
                                    className="h-11 rounded-xl bg-white"
                                    placeholder="Label"
                                    value={section.content.buttonText}
                                    onChange={(e) =>
                                      updateSectionContent(
                                        page.id,
                                        section.id,
                                        { buttonText: e.target.value },
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold text-slate-700">
                                    Secondary Button (Optional)
                                  </Label>
                                  <Input
                                    className="h-11 rounded-xl bg-white"
                                    placeholder="Label"
                                    value={
                                      section.content.secondaryButtonText || ""
                                    }
                                    onChange={(e) =>
                                      updateSectionContent(
                                        page.id,
                                        section.id,
                                        { secondaryButtonText: e.target.value },
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {[
                          "pricing",
                          "faq",
                          "testimonials",
                          "features",
                        ].includes(section.type) && (
                          <div className="space-y-8">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold text-slate-700">
                                Section Header
                              </Label>
                              <Input
                                className="h-11 rounded-2xl"
                                value={section.content.title}
                                onChange={(e) =>
                                  updateSectionContent(page.id, section.id, {
                                    title: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center bg-slate-50/50 flex flex-col items-center justify-center">
                              <div className="h-14 w-14 rounded-3xl bg-indigo-50 flex items-center justify-center mb-4 shadow-sm">
                                <Sparkles className="h-6 w-6 text-indigo-500" />
                              </div>
                              <p className="text-sm text-slate-900 font-black uppercase tracking-tight mb-2">
                                Visual Cards Editor
                              </p>
                              <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed mx-auto">
                                Complex list items should be managed using the
                                dedicated cards in the main layout area.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </TabsContent>

                  <TabsContent
                    value="design"
                    className="space-y-10 focus-visible:outline-none"
                  >
                    <section className="space-y-8">
                      {/* Background Settings */}
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Section Aura & Background
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-600">
                              Bg Color
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                className="w-10 h-10 p-1 rounded-xl cursor-pointer"
                                value={section.settings?.bgColor || "#ffffff"}
                                onChange={(e) =>
                                  updateSectionSettings(page.id, section.id, {
                                    bgColor: e.target.value,
                                  })
                                }
                              />
                              <Input
                                className="flex-1 h-10 rounded-xl text-xs font-mono"
                                value={section.settings?.bgColor || "#ffffff"}
                                onChange={(e) =>
                                  updateSectionSettings(page.id, section.id, {
                                    bgColor: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-600">
                              Text Color
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                className="w-10 h-10 p-1 rounded-xl cursor-pointer"
                                value={section.settings?.textColor || "#000000"}
                                onChange={(e) =>
                                  updateSectionSettings(page.id, section.id, {
                                    textColor: e.target.value,
                                  })
                                }
                              />
                              <Input
                                className="flex-1 h-10 rounded-xl text-xs font-mono"
                                value={section.settings?.textColor || "#000000"}
                                onChange={(e) =>
                                  updateSectionSettings(page.id, section.id, {
                                    textColor: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-600">
                            Background Image URL
                          </Label>
                          <Input
                            className="h-11 rounded-2xl bg-white"
                            placeholder="https://..."
                            value={section.settings?.backgroundImage || ""}
                            onChange={(e) =>
                              updateSectionSettings(page.id, section.id, {
                                backgroundImage: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Geometry Settings */}
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Architecture & Spacing
                        </Label>
                        <div className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 space-y-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-bold text-slate-700">
                                Vertical Padding
                              </Label>
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase font-black"
                              >
                                {section.settings?.verticalPadding || "medium"}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              {[
                                "none",
                                "small",
                                "medium",
                                "large",
                                "xlarge",
                              ].map((v) => (
                                <Button
                                  key={v}
                                  variant={
                                    section.settings?.verticalPadding === v
                                      ? "default"
                                      : "outline"
                                  }
                                  className={cn(
                                    "flex-1 h-9 rounded-xl text-[10px] font-black uppercase transition-all",
                                    section.settings?.verticalPadding === v
                                      ? "bg-indigo-600 shadow-md shadow-indigo-200"
                                      : "bg-white hover:bg-slate-50",
                                  )}
                                  onClick={() =>
                                    updateSectionSettings(page.id, section.id, {
                                      verticalPadding: v,
                                    })
                                  }
                                >
                                  {v.charAt(0)}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-bold text-slate-900">
                                Constraint (Max Width)
                              </Label>
                              <p className="text-[10px] text-slate-500">
                                Contain content within central column
                              </p>
                            </div>
                            <Switch
                              checked={section.settings?.isContained !== false}
                              onCheckedChange={(v) =>
                                updateSectionSettings(page.id, section.id, {
                                  isContained: v,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-bold text-slate-700">
                                Text Alignment
                              </Label>
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase font-black"
                              >
                                {section.settings?.textAlign ||
                                  (section.type === "proof" ||
                                  section.type === "problem" ||
                                  section.type === "solution"
                                    ? "center"
                                    : "left")}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              {["left", "center", "right"].map((a) => (
                                <Button
                                  key={a}
                                  variant={
                                    (section.settings?.textAlign ||
                                      (section.type === "proof" ||
                                      section.type === "problem" ||
                                      section.type === "solution"
                                        ? "center"
                                        : "left")) === a
                                      ? "default"
                                      : "outline"
                                  }
                                  className={cn(
                                    "flex-1 h-9 rounded-xl text-[10px] font-black uppercase transition-all",
                                    (section.settings?.textAlign ||
                                      (section.type === "proof" ||
                                      section.type === "problem" ||
                                      section.type === "solution"
                                        ? "center"
                                        : "left")) === a
                                      ? "bg-indigo-600 shadow-md shadow-indigo-200"
                                      : "bg-white hover:bg-slate-50",
                                  )}
                                  onClick={() =>
                                    updateSectionSettings(page.id, section.id, {
                                      textAlign: a as any,
                                    })
                                  }
                                >
                                  {a}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </TabsContent>

                  <TabsContent
                    value="advanced"
                    className="space-y-10 focus-visible:outline-none"
                  >
                    <section className="space-y-8">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Generative Overrides (GEO)
                        </Label>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">
                              Section Specific Brand Voice
                            </Label>
                            <Select
                              value={section.seo?.brandVoice || ""}
                              onValueChange={(v) =>
                                updateSectionSeo(page.id, section.id, {
                                  brandVoice: v,
                                })
                              }
                            >
                              <SelectTrigger className="h-11 rounded-2xl bg-white shadow-sm border-slate-200">
                                <SelectValue placeholder="Inherit from website" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Professional">
                                  Professional & Authoritative
                                </SelectItem>
                                <SelectItem value="Friendly">
                                  Friendly & Personal
                                </SelectItem>
                                <SelectItem value="Luxury">
                                  Luxury & Premium
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">
                              Section Narrative Goal
                            </Label>
                            <Textarea
                              placeholder="Describe what this specific section should achieve for AI interpretation..."
                              className="min-h-[100px] rounded-2xl bg-white resize-none"
                              value={section.seo?.description || ""}
                              onChange={(e) =>
                                updateSectionSeo(page.id, section.id, {
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                          <Smartphone className="h-4 w-4 text-slate-400" />
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Responsiveness & Logic
                          </Label>
                        </div>
                        <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                          <div className="flex items-start gap-3">
                            <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                              Advanced responsive breakpoints and conditional
                              visibility are managed automatically based on the
                              design archetype. Manual control is restricted to
                              super admins.
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-white/95 backdrop-blur-md sticky bottom-0 z-10 flex gap-4">
            <Button
              variant="outline"
              className="flex-1 rounded-[1.25rem] h-12 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all"
              onClick={() => setActiveElement(null)}
            >
              Cancel Changes
            </Button>
            <Button
              className="flex-1 rounded-[1.25rem] h-12 bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 active:scale-95 transition-all"
              onClick={() => {
                toast.success("Settings synchronized successfully");
                setActiveElement(null);
              }}
            >
              Apply Updates
            </Button>
          </div>
        </aside>
      </>
    );
  };

  if (loading && !showGenerator) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-8">
            <Skeleton className="h-[800px] w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (showGenerator) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => setShowGenerator(false)}
          className="gap-2"
        >
          <ArrowRight className="h-4 w-4 rotate-180" /> Back to Editor
        </Button>
        <WebsiteGenerator
          onSuccess={async (newBusinessId?: string) => {
            await fetchData(newBusinessId);
            // Small delay to ensure state is settled before hiding generator
            setTimeout(() => setShowGenerator(false), 500);
          }}
        />
      </div>
    );
  }

  if (!website) {
    return (
      <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
        <Globe className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold">No website found</h3>
        <p className="text-slate-500 mb-6">
          You haven't generated a website for your business yet.
        </p>
        <Button onClick={() => setShowGenerator(true)}>Generate Now</Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 relative overflow-x-hidden">
        {renderSidebar()}

        {isTemplateMode && (
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0 shadow-lg shadow-indigo-500/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 backdrop-blur-md flex items-center justify-center border border-indigo-400/30">
                <Sparkles className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight">
                    Template Studio
                  </h1>
                  <Badge
                    variant="outline"
                    className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[10px] py-0"
                  >
                    PRO EDITOR
                  </Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Editing Master Blueprint:{" "}
                  <span className="text-indigo-300 font-mono italic">
                    {template?.name || "New Template"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Blueprint Tier
                </span>
                <span className="text-xs font-bold text-white uppercase tracking-tight">
                  {template?.is_premium ? "Premium" : "Standard"}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <Button
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl gap-2 h-10 px-4"
                onClick={() => setActiveTab("template")}
              >
                <SettingsIcon className="h-4 w-4" /> Blueprint Configuration
              </Button>
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-50 gap-4",
            isTemplateMode ? "mx-6 mt-4" : "",
          )}
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                {isTemplateMode ? "Template Editor" : "Website Editor"}
              </h1>
              {!isTemplateMode && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge
                    variant={
                      website.status === "published" ? "secondary" : "outline"
                    }
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-none",
                      website.status === "published"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {website.status}
                  </Badge>
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {website.status === "published"
                      ? "Site is Live"
                      : "Not Published"}
                  </p>
                </div>
              )}
              {isTemplateMode && (
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">
                  Template: {template?.name || "Loading..."}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {!isTemplateMode && (
              <>
                <div className="flex flex-wrap items-center gap-2 mr-auto lg:mr-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 gap-2 rounded-xl whitespace-nowrap"
                    onClick={() => setShowGenerator(true)}
                  >
                    <Sparkles className="h-3 w-3" />{" "}
                    <span className="hidden sm:inline">AI Regenerate</span>
                    <span className="sm:hidden">Regen</span>
                  </Button>
                  <div className="hidden sm:block w-[1px] h-4 bg-slate-200" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 gap-2 rounded-xl whitespace-nowrap"
                    onClick={() => {
                      const url = `${window.location.origin}/w/${website.businessId}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Website URL copied to clipboard");
                    }}
                  >
                    <Copy className="h-3 w-3" />{" "}
                    <span className="hidden lg:inline">Copy Link</span>
                  </Button>
                </div>
                <div className="w-[1px] h-8 bg-slate-100 hidden lg:block mx-1" />
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2 h-10 px-4 rounded-xl font-bold whitespace-nowrap transition-all",
                    website.status === "published"
                      ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                      : "border-indigo-200 text-indigo-600 hover:bg-indigo-50",
                  )}
                  onClick={() =>
                    handleUpdateStatus(
                      website.status === "published" ? "draft" : "published",
                    )
                  }
                  isLoading={saving}
                >
                  {website.status === "published" ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  {website.status === "published"
                    ? "Unpublish"
                    : "Publish Site"}
                </Button>
              </>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 h-10 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 whitespace-nowrap px-4 font-bold"
                onClick={() => setShowTemplatePreview(true)}
              >
                <Eye className="h-4 w-4" />{" "}
                <span className="hidden sm:inline">Preview</span>
              </Button>
              {activeTab === "seo" ? (
                <Button
                  onClick={handleSubmitSeo(handleSave)}
                  isLoading={saving}
                  className="gap-2 h-10 rounded-xl whitespace-nowrap px-6 font-bold"
                  disabled={!isSeoDirty}
                >
                  <Save className="h-4 w-4" /> Save SEO
                </Button>
              ) : (
                <Button
                  onClick={() => handleSave()}
                  isLoading={saving}
                  className={cn(
                    "gap-2 h-10 rounded-xl shadow-lg whitespace-nowrap px-6 font-bold transition-all hover:scale-[1.02] active:scale-95",
                    isTemplateMode
                      ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                      : "",
                  )}
                >
                  <Save className="h-4 w-4" />{" "}
                  {isTemplateMode ? "Save Master" : "Save Changes"}
                </Button>
              )}
              {!isTemplateMode && (
                <Button
                  variant="ghost"
                  className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete Website"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Design Style Preview Dialog */}
        <Dialog
          open={!!styleToPreview}
          onOpenChange={(open) => !open && setStyleToPreview(null)}
        >
          <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 overflow-hidden flex flex-col rounded-3xl border-none shadow-2xl">
            <DialogHeader className="p-6 border-b flex flex-row items-center justify-between shrink-0 bg-white">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Paintbrush className="h-6 w-6 text-indigo-600" />
                  Preview Style:{" "}
                  <span className="capitalize text-indigo-600">
                    {styleToPreview}
                  </span>
                </DialogTitle>
                <p className="text-sm text-slate-500">
                  Experience how your content looks with the{" "}
                  <span className="font-bold">{styleToPreview}</span> archetype
                  applied.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl h-12 px-6 font-bold"
                  onClick={() => setStyleToPreview(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-indigo-600 hover:bg-indgio-700 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-indigo-100"
                  onClick={() => {
                    if (styleToPreview && website) {
                      setWebsite({
                        ...website,
                        theme: {
                          ...website.theme,
                          style: styleToPreview as any,
                        },
                      });
                      setStyleToPreview(null);
                      toast.success(
                        `Design style "${styleToPreview}" applied!`,
                      );
                    }
                  }}
                >
                  Apply This Style Now
                </Button>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-auto bg-slate-50 relative p-4">
              {styleToPreview && website && (
                <div className="w-full rounded-2xl border border-slate-200 shadow-inner bg-white origin-top scale-[0.9] lg:scale-[1]">
                  <WebsiteRenderer
                    activePageSlug={
                      website.pages.find((p) => p.id === (activePageId || ""))
                        ?.slug || "home"
                    }
                    initialData={
                      {
                        ...website,
                        theme: {
                          ...website.theme,
                          style: styleToPreview as any,
                        },
                      } as any
                    }
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Website Preview Dialog */}
        <Dialog
          open={showTemplatePreview}
          onOpenChange={setShowTemplatePreview}
        >
          <DialogContent className="sm:max-w-[80vw] max-w-[95vw] w-full sm:w-[80vw] h-[90vh] p-0 overflow-hidden flex flex-col rounded-3xl border-none shadow-2xl">
            <DialogHeader className="p-6 border-b flex flex-row items-center justify-between shrink-0 bg-white">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold">
                  {isTemplateMode ? template?.name : (website as any)?.name}{" "}
                  Preview
                </DialogTitle>
                <p className="text-sm text-slate-500">
                  Previewing current {isTemplateMode ? "template" : "website"}{" "}
                  draft.
                </p>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-auto bg-slate-50 relative">
              {(isTemplateMode ? template : website) && (
                <div className="h-full w-full pointer-events-auto">
                  <WebsiteRenderer
                    activePageSlug={
                      website?.pages.find((p) => p.id === activePageId)?.slug ||
                      website?.pages[0]?.slug ||
                      "home"
                    }
                    initialData={
                      {
                        id:
                          (isTemplateMode ? template?.id : website?.id) ||
                          "preview",
                        businessId:
                          (isTemplateMode ? "template" : website?.businessId) ||
                          "preview",
                        theme: website?.theme,
                        pages: website?.pages,
                        seo: website?.seo,
                        status: "published",
                        updatedAt: Date.now(),
                      } as any
                    }
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Website
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this website? This action is
                permanent and cannot be undone. All your content, pages, and
                settings will be lost.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">
                Deleting this website will immediately take it offline. If you
                have a custom domain connected, it will stop working.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteWebsite}
                isLoading={saving}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Publish Confirmation Modal */}
        {showPublishConfirm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <Globe className="h-5 w-5" />
                  Confirm Site Publication
                </CardTitle>
                <CardDescription>
                  This will make your website live and accessible to the public.
                  Are you sure you're ready to publish?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Site Details:
                  </p>
                  <div className="grid grid-cols-2 text-xs gap-2">
                    <span className="text-slate-500">Business:</span>
                    <span className="text-slate-900 font-medium">
                      {profile?.businessId}
                    </span>
                    <span className="text-slate-500">URL:</span>
                    <span className="text-indigo-600 font-medium">
                      /w/{profile?.businessId}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <input
                    type="checkbox"
                    id="publish-confirm"
                    className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-600 cursor-pointer"
                    checked={!!(window as any)._legalAcknowledged}
                    onChange={(e) => {
                      (window as any)._legalAcknowledged = e.target.checked;
                      // Force re-render if using local state, but here I'll just use a local state for simplicity
                      setLegalAcknowledged(e.target.checked);
                    }}
                  />
                  <label
                    htmlFor="publish-confirm"
                    className="text-[10px] text-amber-800 leading-tight cursor-pointer select-none font-medium"
                  >
                    I acknowledge that I have reviewed all AI-generated content
                    for accuracy and legality. I agree to indemnify Bennie Tay
                    Studio against any claims arising from the content I
                    publish.
                  </label>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowPublishConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-none disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handlePublish}
                  isLoading={saving}
                  disabled={!legalAcknowledged}
                >
                  Yes, Publish Now
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Sidebar Tabs */}
          <div className="col-span-full lg:col-span-3 space-y-2">
            {isTemplateMode && (
              <button
                onClick={() => setActiveTab("template")}
                className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "template"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                <SettingsIcon className="h-5 w-5" />
                Template Setup
              </button>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-2">
              {[
                { id: "content", icon: Layers, label: "Sales Funnel" },
                { id: "seo", icon: Search, label: "Revenue Search (SEO)" },
                { id: "tracking", icon: Activity, label: "ROI Analytics" },
                { id: "advanced", icon: Zap, label: "Growth Automations" },
                { id: "general", icon: SettingsIcon, label: "Branding" },
                { id: "theme", icon: Palette, label: "Visual Style" },
                { id: "footer", icon: PanelBottom, label: "Footer" },
                { id: "gallery", icon: Monitor, label: "Templates" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "gallery") {
                      navigate("/dashboard/templates");
                    } else {
                      if (location.pathname.includes("/templates")) {
                        navigate("/dashboard/website");
                      }
                      setActiveTab(tab.id as any);
                    }
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  <tab.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editor Content */}
          <div className="col-span-full lg:col-span-9 space-y-6">
            {activeTab === "advanced" && (
              <div className="space-y-6">
                <Card className="rounded-[2.5rem] border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Mail className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-2xl font-bold">
                        Email & Notifications
                      </CardTitle>
                    </div>
                    <CardDescription className="text-slate-500">
                      Configure transactional emails and notification settings
                      for your platform.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100">
                      <div className="space-y-1">
                        <h4 className="font-bold text-indigo-900">
                          Transactional Email Test
                        </h4>
                        <p className="text-sm text-indigo-700/70">
                          Send a test email to <strong>{profile?.email}</strong>{" "}
                          to verify connectivity.
                        </p>
                      </div>
                      <Button
                        variant="default"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 gap-2"
                        onClick={async () => {
                          if (!profile?.email) return;
                          toast.promise(
                            emailService.sendEmail({
                              to: profile.email,
                              subject: "Test Transactional Email",
                              html: `
                                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                  <h2 style="color: #4f46e5;">Transactional Email Working!</h2>
                                  <p>This is a test email sent from your website editor to verify that your <strong>Resend</strong> integration is configured correctly.</p>
                                  <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p><strong>Business:</strong> ${business?.name || "Your Business"}</p>
                                    <p><strong>Environment:</strong> Production / Sandbox</p>
                                  </div>
                                  <p>You can now use transactional emails for lead captures, welcome messages, and more.</p>
                                </div>
                              `,
                            }),
                            {
                              loading: "Sending test email...",
                              success: "Test email sent successfully!",
                              error: (err) =>
                                `Failed to send email: ${err.message}`,
                            },
                          );
                        }}
                      >
                        <Zap className="h-4 w-4" /> Send Test Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Zap className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-2xl font-bold">
                        Focus Style Selectors
                      </CardTitle>
                    </div>
                  <CardDescription className="text-slate-500">
                    Inject custom CSS or content into specific elements using
                    CSS selectors.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold">
                        Custom Selectors
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-xl"
                        onClick={() => {
                          const current = website?.theme.customSelectors || [];
                          setWebsite({
                            ...website!,
                            theme: {
                              ...website!.theme,
                              customSelectors: [
                                ...current,
                                {
                                  id: generateId(),
                                  selector: "",
                                  css: "",
                                  content: "",
                                  isEnabled: true,
                                },
                              ],
                            },
                          });
                        }}
                      >
                        <Plus className="h-4 w-4" /> Add Selector
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {!website?.theme.customSelectors ||
                      website.theme.customSelectors.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                          <Code className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm text-slate-500 font-medium">
                            No custom selectors added yet.
                            <br />
                            Target specific IDs or classes for advanced
                            overrides.
                          </p>
                        </div>
                      ) : (
                        website.theme.customSelectors.map((cs, idx) => (
                          <div
                            key={cs.id}
                            className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 relative group"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const filtered =
                                  website.theme.customSelectors!.filter(
                                    (item) => item.id !== cs.id,
                                  );
                                setWebsite({
                                  ...website,
                                  theme: {
                                    ...website.theme,
                                    customSelectors: filtered,
                                  },
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                  CSS Selector
                                </Label>
                                <Input
                                  placeholder=".my-custom-button or #hero-title"
                                  value={cs.selector}
                                  onChange={(e) => {
                                    const updated = [
                                      ...website.theme.customSelectors!,
                                    ];
                                    updated[idx] = {
                                      ...cs,
                                      selector: e.target.value,
                                    };
                                    setWebsite({
                                      ...website,
                                      theme: {
                                        ...website.theme,
                                        customSelectors: updated,
                                      },
                                    });
                                  }}
                                  className="rounded-xl border-slate-200 bg-white font-mono text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-4 pt-6">
                                <Switch
                                  checked={cs.isEnabled}
                                  onCheckedChange={(checked) => {
                                    const updated = [
                                      ...website.theme.customSelectors!,
                                    ];
                                    updated[idx] = {
                                      ...cs,
                                      isEnabled: checked,
                                    };
                                    setWebsite({
                                      ...website,
                                      theme: {
                                        ...website.theme,
                                        customSelectors: updated,
                                      },
                                    });
                                  }}
                                />
                                <Label className="text-xs font-bold text-slate-600">
                                  Active
                                </Label>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                  Custom CSS Rules
                                </Label>
                                <Textarea
                                  placeholder="color: red; font-size: 24px;"
                                  value={cs.css}
                                  onChange={(e) => {
                                    const updated = [
                                      ...website.theme.customSelectors!,
                                    ];
                                    updated[idx] = {
                                      ...cs,
                                      css: e.target.value,
                                    };
                                    setWebsite({
                                      ...website,
                                      theme: {
                                        ...website.theme,
                                        customSelectors: updated,
                                      },
                                    });
                                  }}
                                  className="rounded-xl border-slate-200 bg-white font-mono text-xs h-32"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                  Content Injection (Optional)
                                </Label>
                                <Textarea
                                  placeholder="Replace text or add HTML..."
                                  value={cs.content}
                                  onChange={(e) => {
                                    const updated = [
                                      ...website.theme.customSelectors!,
                                    ];
                                    updated[idx] = {
                                      ...cs,
                                      content: e.target.value,
                                    };
                                    setWebsite({
                                      ...website,
                                      theme: {
                                        ...website.theme,
                                        customSelectors: updated,
                                      },
                                    });
                                  }}
                                  className="rounded-xl border-slate-200 bg-white text-xs h-32"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-8 flex justify-end">
                  <Button
                    onClick={() => handleSave()}
                    disabled={saving}
                    className="gap-2 rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Advanced Styles
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

            {activeTab === "tracking" && (
              <Card className="rounded-[2.5rem] border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-100">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">
                        Tracking & Analytics
                      </CardTitle>
                      <CardDescription>
                        Configure Google Analytics, Meta Pixel, and custom
                        tracking scripts.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <Globe className="h-4 w-4 text-orange-500" />
                        Google Analytics Measurement ID
                      </Label>
                      <Input
                        placeholder="G-XXXXXXXXXX"
                        value={business?.ga_measurement_id || ""}
                        onChange={(e) =>
                          setBusiness({
                            ...business,
                            ga_measurement_id: e.target.value,
                          })
                        }
                        className="h-12 rounded-xl"
                      />
                      <p className="text-[10px] text-slate-500 italic">
                        Example: G-BJF6L9C8D2
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-blue-600" />
                        Meta (Facebook) Pixel ID
                      </Label>
                      <Input
                        placeholder="123456789012345"
                        value={business?.meta_pixel_id || ""}
                        onChange={(e) =>
                          setBusiness({
                            ...business,
                            meta_pixel_id: e.target.value,
                          })
                        }
                        className="h-12 rounded-xl"
                      />
                      <p className="text-[10px] text-slate-500 italic">
                        Example: 789456123012345
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-bold">
                          Custom Scripts
                        </Label>
                        <p className="text-xs text-slate-500">
                          Inject custom HTML, CSS, or JS into your website.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <Code className="h-3 w-3" /> Header Scripts
                        </Label>
                        <Textarea
                          placeholder="<!-- Paste your scripts here for the <head> section -->"
                          className="min-h-[150px] font-mono text-xs rounded-2xl bg-slate-50 border-slate-200"
                          value={business?.tracking_scripts_header || ""}
                          onChange={(e) =>
                            setBusiness({
                              ...business,
                              tracking_scripts_header: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <Code className="h-3 w-3" /> Footer Scripts
                        </Label>
                        <Textarea
                          placeholder="<!-- Paste your scripts here just before the </body> tag -->"
                          className="min-h-[150px] font-mono text-xs rounded-2xl bg-slate-50 border-slate-200"
                          value={business?.tracking_scripts_footer || ""}
                          onChange={(e) =>
                            setBusiness({
                              ...business,
                              tracking_scripts_footer: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "gallery" && (
              <Card className="rounded-[2rem] overflow-hidden border-slate-200">
                <CardContent className="p-8">
                  <TemplateGallery />
                </CardContent>
              </Card>
            )}

            {activeTab === "content" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Sales Funnel Pages
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage the pages that turn visitors into revenue. Every
                      page should have a clear goal.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge
                        variant="secondary"
                        className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold text-[10px]"
                      >
                        {website.pages.length} / {maxPages} Pages Used
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {website.pages.length < maxPages && (
                      <>
                        <Button
                          onClick={() => setShowAddPage(true)}
                          className="rounded-xl gap-2 h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100"
                        >
                          <Plus className="h-4 w-4" /> Custom Page
                        </Button>
                        <div className="w-[1px] h-11 bg-slate-200 mx-2" />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 h-11 px-4 border-slate-200 text-xs"
                            onClick={() => addStandardPage("shop")}
                          >
                            <ShoppingBag className="h-4 w-4 text-emerald-500" />{" "}
                            Shop
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 h-11 px-4 border-slate-200 text-xs"
                            onClick={() => addStandardPage("about")}
                          >
                            <Edit3 className="h-4 w-4" /> About
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 h-11 px-4 border-slate-200 text-xs"
                            onClick={() => addStandardPage("services")}
                          >
                            <Layout className="h-4 w-4" /> Services
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 h-11 px-4 border-slate-200 text-xs"
                            onClick={() => addStandardPage("pricing")}
                          >
                            <CreditCard className="h-4 w-4" /> Pricing
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 h-11 px-4 border-slate-200 text-xs"
                            onClick={() => addStandardPage("blog")}
                          >
                            <FileText className="h-4 w-4" /> Blog
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 h-11 px-4 border-slate-200 text-xs"
                            onClick={() => addStandardPage("contact")}
                          >
                            <Mail className="h-4 w-4" /> Contact
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 h-11 px-4 border-slate-200 text-xs"
                            onClick={() => addStandardPage("faq")}
                          >
                            <HelpCircle className="h-4 w-4" /> FAQ
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 h-11 px-4 border-slate-200 text-xs"
                            onClick={() => addStandardPage("privacy")}
                          >
                            <Shield className="h-4 w-4" /> Privacy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 h-11 px-4 border-slate-200 text-xs"
                            onClick={() => addStandardPage("terms")}
                          >
                            <FileText className="h-4 w-4" /> Terms
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Tabs
                  value={activePageId || ""}
                  onValueChange={setActivePageId}
                  className="w-full"
                >
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-2 mb-6 sticky top-20 z-10 shadow-sm overflow-x-auto scrollbar-hide">
                    <TabsList className="bg-transparent h-auto p-0 flex gap-2 w-max min-w-full">
                      {website.pages.map((p) => (
                        <TabsTrigger
                          key={p.id}
                          value={p.id}
                          className="rounded-xl px-4 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-600 font-bold transition-all data-[state=active]:shadow-md border border-transparent"
                        >
                          <div className="flex items-center gap-2">
                            {p.slug === "" ? (
                              <Globe className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            <span className="max-w-[120px] truncate">
                              {p.title}
                            </span>
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {website.pages.map((page) => {
                    return (
                      <TabsContent
                        key={page.id}
                        value={page.id}
                        className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4"
                      >
                        <div className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col gap-1 bg-slate-50 rounded-xl border border-slate-100 p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-20 hover:bg-white"
                                  onClick={() => movePage(page.id, "up")}
                                  disabled={
                                    website.pages.findIndex(
                                      (p) => p.id === page.id,
                                    ) === 0
                                  }
                                  title="Move Page Up"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-20 hover:bg-white"
                                  onClick={() => movePage(page.id, "down")}
                                  disabled={
                                    website.pages.findIndex(
                                      (p) => p.id === page.id,
                                    ) ===
                                    website.pages.length - 1
                                  }
                                  title="Move Page Down"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                  <Globe className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                  <h2 className="text-xl font-bold text-slate-900">
                                    {page.title} Page Settings
                                  </h2>
                                  <p className="text-xs text-slate-500">
                                    Manage visibility and SEO for this page.
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "gap-2 rounded-xl",
                                  activeElement?.type === "page" &&
                                    activeElement?.pageId === page.id
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "",
                                )}
                                onClick={() =>
                                  setActiveElement({
                                    type: "page",
                                    pageId: page.id,
                                  })
                                }
                              >
                                <SettingsIcon className="h-4 w-4" /> Page
                                Settings
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "gap-2 rounded-xl",
                                  expandedSettings === `page-seo-${page.id}`
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "",
                                )}
                                onClick={() =>
                                  setExpandedSettings(
                                    expandedSettings === `page-seo-${page.id}`
                                      ? null
                                      : `page-seo-${page.id}`,
                                  )
                                }
                              >
                                <Search className="h-4 w-4" /> Page SEO
                              </Button>
                              <Badge
                                variant="secondary"
                                className="px-3 py-1 rounded-full"
                              >
                                {page.slug === "" ? "Home" : `/${page.slug}`}
                              </Badge>
                              {page.slug !== "" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-500 rounded-lg"
                                  onClick={() => setPageToDelete(page.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {expandedSettings === `page-seo-${page.id}` && (
                            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">
                                  Meta Title Tag
                                </Label>
                                <Input
                                  className="h-10 text-sm rounded-xl"
                                  value={page.seo?.title || ""}
                                  placeholder={`${page.title} | ${website.seo.title}`}
                                  onChange={(e) =>
                                    updatePageSeo(page.id, {
                                      title: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">
                                  Meta Keywords
                                </Label>
                                <Input
                                  className="h-10 text-sm rounded-xl"
                                  value={page.seo?.keywords?.join(", ") || ""}
                                  placeholder="keyword1, keyword2"
                                  onChange={(e) =>
                                    updatePageSeo(page.id, {
                                      keywords: e.target.value
                                        .split(",")
                                        .map((k) => k.trim()),
                                    })
                                  }
                                />
                              </div>
                              <div className="col-span-full space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">
                                  Meta Description
                                </Label>
                                <Textarea
                                  className="text-sm min-h-[80px] rounded-xl"
                                  value={page.seo?.description || ""}
                                  placeholder="Briefly describe what this page is about for search engines..."
                                  onChange={(e) =>
                                    updatePageSeo(page.id, {
                                      description: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="col-span-full space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">
                                  Canonical URL Override
                                </Label>
                                <Input
                                  className="h-10 text-sm rounded-xl"
                                  value={page.seo?.canonicalUrl || ""}
                                  placeholder="https://yourdomain.com/page"
                                  onChange={(e) =>
                                    updatePageSeo(page.id, {
                                      canonicalUrl: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">
                                  OG Image URL
                                </Label>
                                <div className="flex gap-3">
                                  <Input
                                    className="h-10 text-sm rounded-xl"
                                    value={page.seo?.ogImage || ""}
                                    placeholder="https://..."
                                    onChange={(e) =>
                                      updatePageSeo(page.id, {
                                        ogImage: e.target.value,
                                      })
                                    }
                                  />
                                  <div className="h-10 w-16 shrink-0 border border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
                                    {page.seo?.ogImage ? (
                                      <img
                                        src={page.seo.ogImage}
                                        alt="Page OG"
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <ImageIcon className="h-5 w-5 text-slate-300" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">
                                  Favicon URL Override
                                </Label>
                                <div className="flex gap-3">
                                  <Input
                                    className="h-10 text-sm rounded-xl"
                                    value={page.seo?.favicon || ""}
                                    placeholder="https://..."
                                    onChange={(e) =>
                                      updatePageSeo(page.id, {
                                        favicon: e.target.value,
                                      })
                                    }
                                  />
                                  <div className="h-10 w-16 shrink-0 border border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
                                    {page.seo?.favicon ? (
                                      <img
                                        src={page.seo.favicon}
                                        alt="Page Favicon"
                                        className="h-5 w-5"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <Globe className="h-5 w-5 text-slate-300" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 pt-2">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-indigo-600" />
                              Sections on this page
                            </h3>
                            {(page.slug === "home" ||
                              page.slug === "" ||
                              page.slug === "about" ||
                              page.slug === "about-us") && (
                              <div className="flex gap-2">
                                {!page.sections.some(
                                  (s) => s.type === "about",
                                ) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                    onClick={() => addSection(page.id, "about")}
                                  >
                                    <Plus className="h-4 w-4" /> Add About
                                  </Button>
                                )}
                                {!page.sections.some(
                                  (s) => s.content.title === "Why Choose Us?",
                                ) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                                    onClick={() =>
                                      addWhyChooseUsSection(page.id)
                                    }
                                  >
                                    <Plus className="h-4 w-4" /> Add Features
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                          <React.Fragment key={`sections-${page.id}`}>
                            {page.sections.map((section, index) => {
                              return (
                                <Card
                                  key={section.id}
                                  className={cn(
                                    section.isVisible === false
                                      ? "opacity-50 grayscale"
                                      : "",
                                    draggingSection?.pageId === page.id &&
                                      draggingSection?.index === index
                                      ? "opacity-20 border-indigo-500 border-2 border-dashed"
                                      : "hover:border-indigo-200 transition-colors",
                                  )}
                                  draggable={true}
                                  onDragStart={() =>
                                    handleDragStart(page.id, index)
                                  }
                                  onDragOver={handleDragOver}
                                  onDrop={() =>
                                    handleDropSection(page.id, index)
                                  }
                                >
                                  <CardHeader className="flex flex-row items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-600 transition-colors p-1"
                                        title="Drag to reorder"
                                      >
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                      <CardTitle className="text-base capitalize flex items-center gap-2">
                                        {section.isVisible === false && (
                                          <EyeOff className="h-4 w-4 text-slate-400" />
                                        )}
                                        {section.type} Section
                                      </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div className="tooltip-trigger">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setActiveElement({
                                              type: "section",
                                              pageId: page.id,
                                              sectionId: section.id,
                                            });
                                            setShowAiEditor(true);
                                          }}
                                          className="text-indigo-600 hover:bg-indigo-50 transition-colors"
                                          aria-label="AI Regenerate"
                                        >
                                          <Sparkles className="h-4 w-4" />
                                        </Button>
                                        <span className="tooltip-content">
                                          AI Regenerate
                                        </span>
                                      </div>
                                      <div className="tooltip-trigger">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className={cn(
                                            activeElement?.type === "section" &&
                                              activeElement?.sectionId ===
                                                section.id
                                              ? "bg-indigo-50 text-indigo-600"
                                              : "",
                                          )}
                                          onClick={() =>
                                            setActiveElement({
                                              type: "section",
                                              pageId: page.id,
                                              sectionId: section.id,
                                            })
                                          }
                                          aria-label="Section settings"
                                        >
                                          <SettingsIcon className="h-4 w-4" />
                                        </Button>
                                        <span className="tooltip-content">
                                          Section Settings
                                        </span>
                                      </div>
                                      <div className="tooltip-trigger">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            moveSection(
                                              page.id,
                                              section.id,
                                              "up",
                                            )
                                          }
                                          disabled={index === 0}
                                          aria-label="Move section up"
                                        >
                                          <ChevronUp className="h-4 w-4" />
                                        </Button>
                                        <span className="tooltip-content">
                                          Move Up
                                        </span>
                                      </div>
                                      <div className="tooltip-trigger">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            moveSection(
                                              page.id,
                                              section.id,
                                              "down",
                                            )
                                          }
                                          disabled={
                                            index === page.sections.length - 1
                                          }
                                          aria-label="Move section down"
                                        >
                                          <ChevronDown className="h-4 w-4" />
                                        </Button>
                                        <span className="tooltip-content">
                                          Move Down
                                        </span>
                                      </div>
                                      <div className="tooltip-trigger">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            duplicateSection(
                                              page.id,
                                              section.id,
                                            )
                                          }
                                          aria-label="Duplicate section"
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                        <span className="tooltip-content">
                                          Duplicate
                                        </span>
                                      </div>
                                      <div className="tooltip-trigger">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            setExpandedSettings(
                                              expandedSettings ===
                                                `seo-${section.id}`
                                                ? null
                                                : `seo-${section.id}`,
                                            )
                                          }
                                          className={
                                            expandedSettings ===
                                            `seo-${section.id}`
                                              ? "text-indigo-600 bg-indigo-50"
                                              : ""
                                          }
                                          aria-label="Section SEO"
                                        >
                                          <Search className="h-4 w-4" />
                                        </Button>
                                        <span className="tooltip-content">
                                          Section SEO
                                        </span>
                                      </div>
                                      <div className="tooltip-trigger">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            toggleSectionVisibility(
                                              page.id,
                                              section.id,
                                            )
                                          }
                                          aria-label={
                                            section.isVisible === false
                                              ? "Show section"
                                              : "Hide section"
                                          }
                                        >
                                          {section.isVisible === false ? (
                                            <Eye className="h-4 w-4" />
                                          ) : (
                                            <EyeOff className="h-4 w-4" />
                                          )}
                                        </Button>
                                        <span className="tooltip-content">
                                          {section.isVisible === false
                                            ? "Show"
                                            : "Hide"}
                                        </span>
                                      </div>
                                      <div className="tooltip-trigger">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                          onClick={() =>
                                            removeSection(page.id, section.id)
                                          }
                                          aria-label="Remove section"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <span className="tooltip-content">
                                          Delete
                                        </span>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  {expandedSettings === `seo-${section.id}` && (
                                    <div className="px-6 pb-6 pt-2 border-b border-slate-100 bg-indigo-50/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                      <div className="flex items-center gap-2 text-sm font-bold text-indigo-700 mb-2">
                                        <Search className="h-4 w-4" /> Section
                                        SEO Optimization
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs">
                                            Meta Title Override
                                          </Label>
                                          <Input
                                            className="h-8 text-xs"
                                            value={section.seo?.title || ""}
                                            placeholder="Leave empty to use page title"
                                            onChange={(e) =>
                                              updateSectionSeo(
                                                page.id,
                                                section.id,
                                                { title: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs">
                                            Meta Keywords
                                          </Label>
                                          <Input
                                            className="h-8 text-xs"
                                            value={
                                              section.seo?.keywords?.join(
                                                ", ",
                                              ) || ""
                                            }
                                            placeholder="keyword1, keyword2"
                                            onChange={(e) =>
                                              updateSectionSeo(
                                                page.id,
                                                section.id,
                                                {
                                                  keywords: e.target.value
                                                    .split(",")
                                                    .map((k) => k.trim()),
                                                },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                          <Label className="text-xs">
                                            Meta Description Override
                                          </Label>
                                          <Textarea
                                            className="text-xs min-h-[60px]"
                                            value={
                                              section.seo?.description || ""
                                            }
                                            placeholder="Leave empty to use page description"
                                            onChange={(e) =>
                                              updateSectionSeo(
                                                page.id,
                                                section.id,
                                                { description: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <CardContent className="space-y-6">
                                    {/* Section Styling - Integrated into Content Tab */}
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <Paintbrush className="h-4 w-4" />{" "}
                                        Section Styling
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs">
                                            Background Color
                                          </Label>
                                          <div className="flex gap-2">
                                            <input
                                              type="color"
                                              className="h-8 w-8 rounded border border-slate-200 cursor-pointer"
                                              value={
                                                section.settings
                                                  ?.backgroundColor || "#ffffff"
                                              }
                                              onChange={(e) =>
                                                updateSectionSettings(
                                                  page.id,
                                                  section.id,
                                                  {
                                                    backgroundColor:
                                                      e.target.value,
                                                  },
                                                )
                                              }
                                            />
                                            <Input
                                              className="h-8 text-xs"
                                              value={
                                                section.settings
                                                  ?.backgroundColor || ""
                                              }
                                              placeholder="#ffffff"
                                              onChange={(e) =>
                                                updateSectionSettings(
                                                  page.id,
                                                  section.id,
                                                  {
                                                    backgroundColor:
                                                      e.target.value,
                                                  },
                                                )
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1.5">
                                            <Label className="text-xs">
                                              Text Color
                                            </Label>
                                            <div className="flex gap-2">
                                              <input
                                                type="color"
                                                className="h-8 w-8 rounded border border-slate-200 cursor-pointer"
                                                value={
                                                  section.settings?.textColor ||
                                                  "#000000"
                                                }
                                                onChange={(e) =>
                                                  updateSectionSettings(
                                                    page.id,
                                                    section.id,
                                                    {
                                                      textColor: e.target.value,
                                                    },
                                                  )
                                                }
                                              />
                                              <Input
                                                className="h-8 text-xs"
                                                value={
                                                  section.settings?.textColor ||
                                                  ""
                                                }
                                                placeholder="#000000"
                                                onChange={(e) =>
                                                  updateSectionSettings(
                                                    page.id,
                                                    section.id,
                                                    {
                                                      textColor: e.target.value,
                                                    },
                                                  )
                                                }
                                              />
                                            </div>
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label className="text-xs">
                                              Background Color
                                            </Label>
                                            <div className="flex gap-2">
                                              <input
                                                type="color"
                                                className="h-8 w-8 rounded border border-slate-200 cursor-pointer"
                                                value={
                                                  section.settings?.bgColor ||
                                                  "#ffffff"
                                                }
                                                onChange={(e) =>
                                                  updateSectionSettings(
                                                    page.id,
                                                    section.id,
                                                    { bgColor: e.target.value },
                                                  )
                                                }
                                              />
                                              <Input
                                                className="h-8 text-xs"
                                                value={
                                                  section.settings?.bgColor ||
                                                  ""
                                                }
                                                placeholder="#ffffff"
                                                onChange={(e) =>
                                                  updateSectionSettings(
                                                    page.id,
                                                    section.id,
                                                    { bgColor: e.target.value },
                                                  )
                                                }
                                              />
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-4 pt-2 border-t border-slate-100">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                              Spacing & Padding
                                            </Label>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] text-slate-400">
                                                Custom
                                              </span>
                                              <Switch
                                                className="scale-75"
                                                checked={
                                                  section.settings
                                                    ?.useCustomPadding || false
                                                }
                                                onCheckedChange={(checked) =>
                                                  updateSectionSettings(
                                                    page.id,
                                                    section.id,
                                                    {
                                                      useCustomPadding: checked,
                                                    },
                                                  )
                                                }
                                              />
                                            </div>
                                          </div>

                                          {section.settings
                                            ?.useCustomPadding ? (
                                            <div className="grid grid-cols-4 gap-2">
                                              <div className="space-y-1">
                                                <Label className="text-[10px] text-slate-400 uppercase">
                                                  Top
                                                </Label>
                                                <Input
                                                  type="number"
                                                  className="h-8 p-1 text-center text-xs"
                                                  value={
                                                    section.settings
                                                      ?.paddingTop ?? 16
                                                  }
                                                  onChange={(e) =>
                                                    updateSectionSettings(
                                                      page.id,
                                                      section.id,
                                                      {
                                                        paddingTop:
                                                          parseInt(
                                                            e.target.value,
                                                          ) || 0,
                                                      },
                                                    )
                                                  }
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-[10px] text-slate-400 uppercase">
                                                  Bottom
                                                </Label>
                                                <Input
                                                  type="number"
                                                  className="h-8 p-1 text-center text-xs"
                                                  value={
                                                    section.settings
                                                      ?.paddingBottom ?? 16
                                                  }
                                                  onChange={(e) =>
                                                    updateSectionSettings(
                                                      page.id,
                                                      section.id,
                                                      {
                                                        paddingBottom:
                                                          parseInt(
                                                            e.target.value,
                                                          ) || 0,
                                                      },
                                                    )
                                                  }
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-[10px] text-slate-400 uppercase">
                                                  Left
                                                </Label>
                                                <Input
                                                  type="number"
                                                  className="h-8 p-1 text-center text-xs"
                                                  value={
                                                    section.settings
                                                      ?.paddingLeft ?? 0
                                                  }
                                                  onChange={(e) =>
                                                    updateSectionSettings(
                                                      page.id,
                                                      section.id,
                                                      {
                                                        paddingLeft:
                                                          parseInt(
                                                            e.target.value,
                                                          ) || 0,
                                                      },
                                                    )
                                                  }
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-[10px] text-slate-400 uppercase">
                                                  Right
                                                </Label>
                                                <Input
                                                  type="number"
                                                  className="h-8 p-1 text-center text-xs"
                                                  value={
                                                    section.settings
                                                      ?.paddingRight ?? 0
                                                  }
                                                  onChange={(e) =>
                                                    updateSectionSettings(
                                                      page.id,
                                                      section.id,
                                                      {
                                                        paddingRight:
                                                          parseInt(
                                                            e.target.value,
                                                          ) || 0,
                                                      },
                                                    )
                                                  }
                                                />
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-400 uppercase">
                                                  Vertical Spacing
                                                </Label>
                                                <Select
                                                  value={
                                                    section.settings
                                                      ?.verticalPadding ||
                                                    "small"
                                                  }
                                                  onValueChange={(value) =>
                                                    updateSectionSettings(
                                                      page.id,
                                                      section.id,
                                                      {
                                                        verticalPadding: value,
                                                      },
                                                    )
                                                  }
                                                >
                                                  <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Vertical" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="none">
                                                      None (0px)
                                                    </SelectItem>
                                                    <SelectItem value="small">
                                                      Tight (16px)
                                                    </SelectItem>
                                                    <SelectItem value="medium">
                                                      Standard (40px)
                                                    </SelectItem>
                                                    <SelectItem value="large">
                                                      Spacious (80px)
                                                    </SelectItem>
                                                    <SelectItem value="xlarge">
                                                      Extra (120px)
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-400 uppercase">
                                                  Horizontal Spacing
                                                </Label>
                                                <Select
                                                  value={
                                                    section.settings
                                                      ?.horizontalPadding ||
                                                    "none"
                                                  }
                                                  onValueChange={(value) =>
                                                    updateSectionSettings(
                                                      page.id,
                                                      section.id,
                                                      {
                                                        horizontalPadding:
                                                          value,
                                                      },
                                                    )
                                                  }
                                                >
                                                  <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Horizontal" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="none">
                                                      Auto Centered
                                                    </SelectItem>
                                                    <SelectItem value="small">
                                                      Small Sides
                                                    </SelectItem>
                                                    <SelectItem value="medium">
                                                      Medium Sides
                                                    </SelectItem>
                                                    <SelectItem value="large">
                                                      Large Sides
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {section.type === "hero" && (
                                      <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                          <div className="space-y-0.5">
                                            <Label className="text-base">
                                              Section Visibility
                                            </Label>
                                            <p className="text-xs text-slate-500">
                                              Show or hide the hero section on
                                              your website.
                                            </p>
                                          </div>
                                          <Switch
                                            checked={
                                              section.isVisible !== false
                                            }
                                            onCheckedChange={() =>
                                              toggleSectionVisibility(
                                                page.id,
                                                section.id,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div className="space-y-4">
                                            <div className="space-y-1.5">
                                              <Label>Headline</Label>
                                              <Input
                                                value={
                                                  section.content.headline || ""
                                                }
                                                onChange={(e) =>
                                                  updateSectionContent(
                                                    page.id,
                                                    section.id,
                                                    {
                                                      headline: e.target.value,
                                                    },
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className="space-y-1.5">
                                              <Label>Subheadline</Label>
                                              <Input
                                                value={
                                                  section.content.subheadline ||
                                                  ""
                                                }
                                                onChange={(e) =>
                                                  updateSectionContent(
                                                    page.id,
                                                    section.id,
                                                    {
                                                      subheadline:
                                                        e.target.value,
                                                    },
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className="space-y-1.5">
                                              <Label>CTA Button Text</Label>
                                              <Input
                                                value={
                                                  section.content.ctaText || ""
                                                }
                                                onChange={(e) =>
                                                  updateSectionContent(
                                                    page.id,
                                                    section.id,
                                                    { ctaText: e.target.value },
                                                  )
                                                }
                                              />
                                            </div>
                                            <ImageUpload
                                              label="Hero Image"
                                              bucket="website-assets"
                                              value={
                                                section.content.imageUrl || ""
                                              }
                                              onUpload={(url) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  { imageUrl: url },
                                                )
                                              }
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                              Image Preview
                                            </label>
                                            <div className="aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                                              <img
                                                src={
                                                  section.content.imageUrl ||
                                                  `https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200`
                                                }
                                                alt="Hero Preview"
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                              />
                                              {!section.content.imageUrl && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <span className="text-white text-xs font-medium">
                                                    Using Placeholder Image
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "about" && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-slate-700">
                                              About Content (Markdown)
                                            </label>
                                            <div className="flex gap-1">
                                              {[
                                                {
                                                  icon: Bold,
                                                  tag: "**",
                                                  label: "Bold",
                                                },
                                                {
                                                  icon: Italic,
                                                  tag: "_",
                                                  label: "Italic",
                                                },
                                                {
                                                  icon: ListIcon,
                                                  tag: "\n- ",
                                                  label: "List",
                                                },
                                              ].map((tool) => (
                                                <Button
                                                  key={tool.label}
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  onClick={() => {
                                                    const text =
                                                      section.content.text ||
                                                      "";
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { text: text + tool.tag },
                                                    );
                                                  }}
                                                >
                                                  <tool.icon className="h-4 w-4" />
                                                </Button>
                                              ))}
                                            </div>
                                          </div>
                                          <textarea
                                            className={`flex min-h-[200px] w-full rounded-md border bg-white px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                              !section.content.text
                                                ? "border-red-500"
                                                : "border-slate-200"
                                            }`}
                                            placeholder="Write your story here... (Markdown supported)"
                                            value={section.content.text || ""}
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { text: e.target.value },
                                              )
                                            }
                                          />
                                          {!section.content.text && (
                                            <p className="text-xs text-red-500">
                                              About text is required
                                            </p>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium text-slate-700">
                                            Live Preview
                                          </label>
                                          <div className="min-h-[200px] p-4 rounded-md border border-slate-200 bg-slate-50 prose prose-sm max-w-none overflow-y-auto">
                                            <ReactMarkdown>
                                              {section.content.text ||
                                                "*No content yet*"}
                                            </ReactMarkdown>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "features" && (
                                      <div className="space-y-4">
                                        <div className="space-y-1.5">
                                          <Label>Section Title</Label>
                                          <Input
                                            value={section.content.title || ""}
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { title: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-3">
                                          <label className="text-sm font-medium">
                                            Features List
                                          </label>
                                          {(section.content.items || []).map(
                                            (item: string, idx: number) => (
                                              <div
                                                key={idx}
                                                className="flex gap-2"
                                              >
                                                <Input
                                                  value={item}
                                                  onChange={(e) => {
                                                    const newItems = [
                                                      ...section.content.items,
                                                    ];
                                                    newItems[idx] =
                                                      e.target.value;
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { items: newItems },
                                                    );
                                                  }}
                                                />
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="text-red-500"
                                                  onClick={() => {
                                                    const newItems =
                                                      section.content.items.filter(
                                                        (_: any, i: number) =>
                                                          i !== idx,
                                                      );
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { items: newItems },
                                                    );
                                                  }}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            ),
                                          )}
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => {
                                              const newItems = [
                                                ...(section.content.items ||
                                                  []),
                                                "New Feature",
                                              ];
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { items: newItems },
                                              );
                                            }}
                                          >
                                            <Plus className="h-4 w-4" /> Add
                                            Feature
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "pricing" && (
                                      <div className="space-y-4">
                                        <div className="space-y-1.5">
                                          <Label>Section Title</Label>
                                          <Input
                                            value={section.content.title || ""}
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { title: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                          {(section.content.plans || []).map(
                                            (plan: any, pi: number) => (
                                              <div
                                                key={pi}
                                                className="p-4 border border-slate-200 rounded-lg space-y-3 relative group"
                                              >
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="absolute top-2 right-2 h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={() => {
                                                    const newPlans =
                                                      section.content.plans.filter(
                                                        (_: any, i: number) =>
                                                          i !== pi,
                                                      );
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { plans: newPlans },
                                                    );
                                                  }}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="space-y-1.5">
                                                  <Label>Plan Name</Label>
                                                  <Input
                                                    value={plan.name}
                                                    onChange={(e) => {
                                                      const newPlans = [
                                                        ...section.content
                                                          .plans,
                                                      ];
                                                      newPlans[pi] = {
                                                        ...plan,
                                                        name: e.target.value,
                                                      };
                                                      updateSectionContent(
                                                        page.id,
                                                        section.id,
                                                        { plans: newPlans },
                                                      );
                                                    }}
                                                  />
                                                </div>
                                                <div className="space-y-1.5">
                                                  <Label>Price</Label>
                                                  <Input
                                                    value={plan.price}
                                                    onChange={(e) => {
                                                      const newPlans = [
                                                        ...section.content
                                                          .plans,
                                                      ];
                                                      newPlans[pi] = {
                                                        ...plan,
                                                        price: e.target.value,
                                                      };
                                                      updateSectionContent(
                                                        page.id,
                                                        section.id,
                                                        { plans: newPlans },
                                                      );
                                                    }}
                                                  />
                                                </div>
                                                <div className="flex items-center justify-between pt-2">
                                                  <Label className="text-xs">
                                                    Most Popular
                                                  </Label>
                                                  <Switch
                                                    checked={
                                                      plan.isPopular || false
                                                    }
                                                    onCheckedChange={(
                                                      checked,
                                                    ) => {
                                                      const newPlans =
                                                        section.content.plans.map(
                                                          (
                                                            p: any,
                                                            i: number,
                                                          ) => ({
                                                            ...p,
                                                            isPopular:
                                                              i === pi
                                                                ? checked
                                                                : checked
                                                                  ? false
                                                                  : p.isPopular,
                                                          }),
                                                        );
                                                      updateSectionContent(
                                                        page.id,
                                                        section.id,
                                                        { plans: newPlans },
                                                      );
                                                    }}
                                                  />
                                                </div>
                                              </div>
                                            ),
                                          )}
                                          <button
                                            onClick={() => {
                                              const newPlans = [
                                                ...(section.content.plans ||
                                                  []),
                                                {
                                                  name: "New Plan",
                                                  price: "99",
                                                },
                                              ];
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { plans: newPlans },
                                              );
                                            }}
                                            className="p-4 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 transition-all"
                                          >
                                            <Plus className="h-6 w-6" />
                                            <span className="text-sm font-bold">
                                              Add Plan
                                            </span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "team" && (
                                      <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div className="space-y-1.5">
                                            <Label>Section Title</Label>
                                            <Input
                                              value={
                                                section.content.title || ""
                                              }
                                              onChange={(e) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  { title: e.target.value },
                                                )
                                              }
                                            />
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label>Section Description</Label>
                                            <Input
                                              value={
                                                section.content.description ||
                                                ""
                                              }
                                              onChange={(e) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  {
                                                    description: e.target.value,
                                                  },
                                                )
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-4">
                                          <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                            Team Members
                                          </label>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {(
                                              section.content.members || []
                                            ).map((member: any, mi: number) => (
                                              <div
                                                key={
                                                  member.id || `member-${mi}`
                                                }
                                                className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3 relative group"
                                              >
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="absolute top-2 right-2 h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={() => {
                                                    const newMembers =
                                                      section.content.members.filter(
                                                        (_: any, i: number) =>
                                                          i !== mi,
                                                      );
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { members: newMembers },
                                                    );
                                                  }}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="flex gap-3">
                                                  <div className="h-16 w-16 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                                                    <img
                                                      src={member.imageUrl}
                                                      alt={member.name}
                                                      className="w-full h-full object-cover"
                                                      referrerPolicy="no-referrer"
                                                    />
                                                  </div>
                                                  <div className="flex-1 space-y-2">
                                                    <Input
                                                      placeholder="Name"
                                                      className="h-8 text-xs"
                                                      value={member.name}
                                                      onChange={(e) => {
                                                        const newMembers = [
                                                          ...section.content
                                                            .members,
                                                        ];
                                                        newMembers[mi] = {
                                                          ...member,
                                                          name: e.target.value,
                                                        };
                                                        updateSectionContent(
                                                          page.id,
                                                          section.id,
                                                          {
                                                            members: newMembers,
                                                          },
                                                        );
                                                      }}
                                                    />
                                                    <Input
                                                      placeholder="Role"
                                                      className="h-8 text-xs"
                                                      value={member.role}
                                                      onChange={(e) => {
                                                        const newMembers = [
                                                          ...section.content
                                                            .members,
                                                        ];
                                                        newMembers[mi] = {
                                                          ...member,
                                                          role: e.target.value,
                                                        };
                                                        updateSectionContent(
                                                          page.id,
                                                          section.id,
                                                          {
                                                            members: newMembers,
                                                          },
                                                        );
                                                      }}
                                                    />
                                                  </div>
                                                </div>
                                                <textarea
                                                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white min-h-[60px]"
                                                  placeholder="Bio..."
                                                  value={member.bio}
                                                  onChange={(e) => {
                                                    const newMembers = [
                                                      ...section.content
                                                        .members,
                                                    ];
                                                    newMembers[mi] = {
                                                      ...member,
                                                      bio: e.target.value,
                                                    };
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { members: newMembers },
                                                    );
                                                  }}
                                                />
                                                <ImageUpload
                                                  label="Member Image"
                                                  description="Square aspect ratio works best."
                                                  value={member.imageUrl || ""}
                                                  onUpload={(url) => {
                                                    const newMembers = [
                                                      ...section.content
                                                        .members,
                                                    ];
                                                    newMembers[mi] = {
                                                      ...member,
                                                      imageUrl: url,
                                                    };
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { members: newMembers },
                                                    );
                                                  }}
                                                />
                                              </div>
                                            ))}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newMembers = [
                                                  ...(section.content.members ||
                                                    []),
                                                  {
                                                    name: "New Member",
                                                    role: "Specialist",
                                                    bio: "Expert bio...",
                                                    imageUrl:
                                                      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
                                                  },
                                                ];
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  { members: newMembers },
                                                );
                                              }}
                                              className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                                            >
                                              <Plus className="h-6 w-6 mb-2" />
                                              <span className="text-xs font-bold uppercase tracking-widest">
                                                Add Member
                                              </span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "services" && (
                                      <div className="space-y-4">
                                        {section.content.items?.map(
                                          (item: any, si: number) => (
                                            <div
                                              key={si}
                                              className="p-4 border border-slate-200 rounded-lg space-y-2"
                                            >
                                              <div className="space-y-1.5">
                                                <Label>Service Title</Label>
                                                <Input
                                                  value={item.title}
                                                  onChange={(e) => {
                                                    const newItems = [
                                                      ...section.content.items,
                                                    ];
                                                    newItems[si] = {
                                                      ...item,
                                                      title: e.target.value,
                                                    };
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { items: newItems },
                                                    );
                                                  }}
                                                />
                                              </div>
                                              <div className="space-y-1.5">
                                                <Label>Description</Label>
                                                <Input
                                                  value={item.description}
                                                  onChange={(e) => {
                                                    const newItems = [
                                                      ...section.content.items,
                                                    ];
                                                    newItems[si] = {
                                                      ...item,
                                                      description:
                                                        e.target.value,
                                                    };
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { items: newItems },
                                                    );
                                                  }}
                                                />
                                              </div>
                                            </div>
                                          ),
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const newItems = [
                                              ...(section.content.items || []),
                                              {
                                                title: "New Service",
                                                description: "Description",
                                              },
                                            ];
                                            updateSectionContent(
                                              page.id,
                                              section.id,
                                              { items: newItems },
                                            );
                                          }}
                                        >
                                          Add Service
                                        </Button>
                                      </div>
                                    )}
                                    {section.type === "testimonials" && (
                                      <div className="space-y-4">
                                        {section.content.items?.map(
                                          (item: any, ti: number) => (
                                            <div
                                              key={ti}
                                              className="p-4 border border-slate-200 rounded-lg space-y-2"
                                            >
                                              <div className="space-y-1.5">
                                                <Label>Name</Label>
                                                <Input
                                                  value={item.name}
                                                  onChange={(e) => {
                                                    const newItems = [
                                                      ...section.content.items,
                                                    ];
                                                    newItems[ti] = {
                                                      ...item,
                                                      name: e.target.value,
                                                    };
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { items: newItems },
                                                    );
                                                  }}
                                                />
                                              </div>
                                              <div className="space-y-1.5">
                                                <Label>Role</Label>
                                                <Input
                                                  value={item.role}
                                                  onChange={(e) => {
                                                    const newItems = [
                                                      ...section.content.items,
                                                    ];
                                                    newItems[ti] = {
                                                      ...item,
                                                      role: e.target.value,
                                                    };
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { items: newItems },
                                                    );
                                                  }}
                                                />
                                              </div>
                                              <textarea
                                                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                                value={item.text}
                                                onChange={(e) => {
                                                  const newItems = [
                                                    ...section.content.items,
                                                  ];
                                                  newItems[ti] = {
                                                    ...item,
                                                    text: e.target.value,
                                                  };
                                                  updateSectionContent(
                                                    page.id,
                                                    section.id,
                                                    { items: newItems },
                                                  );
                                                }}
                                              />
                                            </div>
                                          ),
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const newItems = [
                                              ...(section.content.items || []),
                                              {
                                                name: "New Person",
                                                role: "Role",
                                                text: "Testimonial",
                                              },
                                            ];
                                            updateSectionContent(
                                              page.id,
                                              section.id,
                                              { items: newItems },
                                            );
                                          }}
                                        >
                                          Add Testimonial
                                        </Button>
                                      </div>
                                    )}
                                    {section.type === "faq" && (
                                      <div className="space-y-4">
                                        {section.content.items?.map(
                                          (item: any, fi: number) => (
                                            <div
                                              key={fi}
                                              className="p-4 border border-slate-200 rounded-lg space-y-2"
                                            >
                                              <div className="space-y-1.5">
                                                <Label>Question</Label>
                                                <Input
                                                  value={item.question}
                                                  onChange={(e) => {
                                                    const newItems = [
                                                      ...section.content.items,
                                                    ];
                                                    newItems[fi] = {
                                                      ...item,
                                                      question: e.target.value,
                                                    };
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { items: newItems },
                                                    );
                                                  }}
                                                />
                                              </div>
                                              <textarea
                                                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                                value={item.answer}
                                                onChange={(e) => {
                                                  const newItems = [
                                                    ...section.content.items,
                                                  ];
                                                  newItems[fi] = {
                                                    ...item,
                                                    answer: e.target.value,
                                                  };
                                                  updateSectionContent(
                                                    page.id,
                                                    section.id,
                                                    { items: newItems },
                                                  );
                                                }}
                                              />
                                            </div>
                                          ),
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const newItems = [
                                              ...(section.content.items || []),
                                              {
                                                question: "New Question",
                                                answer: "Answer",
                                              },
                                            ];
                                            updateSectionContent(
                                              page.id,
                                              section.id,
                                              { items: newItems },
                                            );
                                          }}
                                        >
                                          Add FAQ
                                        </Button>
                                      </div>
                                    )}
                                    {section.type === "contact" && (
                                      <div className="space-y-4">
                                        <div className="space-y-1.5">
                                          <Label>Section Title</Label>
                                          <Input
                                            value={section.content.title || ""}
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { title: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <p className="text-xs text-slate-500 italic">
                                          Contact form is automatically
                                          generated. Leads will appear in your
                                          CRM.
                                        </p>
                                      </div>
                                    )}
                                    {section.type === "problem" && (
                                      <div className="space-y-4">
                                        <div className="space-y-1.5">
                                          <Label>Section Title</Label>
                                          <Input
                                            value={section.content.title || ""}
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { title: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label>Description</Label>
                                          <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                            value={
                                              section.content.description || ""
                                            }
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { description: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-3">
                                          <label className="text-sm font-medium">
                                            Pain Points
                                          </label>
                                          {(
                                            section.content.painPoints || []
                                          ).map(
                                            (point: string, idx: number) => (
                                              <div
                                                key={idx}
                                                className="flex gap-2"
                                              >
                                                <Input
                                                  value={point}
                                                  onChange={(e) => {
                                                    const newPoints = [
                                                      ...section.content
                                                        .painPoints,
                                                    ];
                                                    newPoints[idx] =
                                                      e.target.value;
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { painPoints: newPoints },
                                                    );
                                                  }}
                                                />
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="text-red-500"
                                                  onClick={() => {
                                                    const newPoints =
                                                      section.content.painPoints.filter(
                                                        (_: any, i: number) =>
                                                          i !== idx,
                                                      );
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { painPoints: newPoints },
                                                    );
                                                  }}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            ),
                                          )}
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => {
                                              const newPoints = [
                                                ...(section.content
                                                  .painPoints || []),
                                                "New Pain Point",
                                              ];
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { painPoints: newPoints },
                                              );
                                            }}
                                          >
                                            <Plus className="h-4 w-4" /> Add
                                            Pain Point
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "solution" && (
                                      <div className="space-y-4">
                                        <div className="space-y-1.5">
                                          <Label>Section Title</Label>
                                          <Input
                                            value={section.content.title || ""}
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { title: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label>Description</Label>
                                          <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                            value={
                                              section.content.description || ""
                                            }
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { description: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-3">
                                          <label className="text-sm font-medium">
                                            Key Features
                                          </label>
                                          {(section.content.features || []).map(
                                            (feature: string, idx: number) => (
                                              <div
                                                key={idx}
                                                className="flex gap-2"
                                              >
                                                <Input
                                                  value={feature}
                                                  onChange={(e) => {
                                                    const newFeatures = [
                                                      ...section.content
                                                        .features,
                                                    ];
                                                    newFeatures[idx] =
                                                      e.target.value;
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { features: newFeatures },
                                                    );
                                                  }}
                                                />
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="text-red-500"
                                                  onClick={() => {
                                                    const newFeatures =
                                                      section.content.features.filter(
                                                        (_: any, i: number) =>
                                                          i !== idx,
                                                      );
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { features: newFeatures },
                                                    );
                                                  }}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            ),
                                          )}
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => {
                                              const newFeatures = [
                                                ...(section.content.features ||
                                                  []),
                                                "New Feature",
                                              ];
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { features: newFeatures },
                                              );
                                            }}
                                          >
                                            <Plus className="h-4 w-4" /> Add
                                            Feature
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "benefits" && (
                                      <div className="space-y-4">
                                        <div className="space-y-1.5">
                                          <Label>Section Title</Label>
                                          <Input
                                            value={section.content.title || ""}
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { title: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-4">
                                          {(section.content.items || []).map(
                                            (item: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className="p-4 border border-slate-200 rounded-lg space-y-2 relative group"
                                              >
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="absolute top-2 right-2 h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={() => {
                                                    const newItems =
                                                      section.content.items.filter(
                                                        (_: any, i: number) =>
                                                          i !== idx,
                                                      );
                                                    updateSectionContent(
                                                      page.id,
                                                      section.id,
                                                      { items: newItems },
                                                    );
                                                  }}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="space-y-1.5">
                                                  <Label>Benefit Title</Label>
                                                  <Input
                                                    value={item.title}
                                                    onChange={(e) => {
                                                      const newItems = [
                                                        ...section.content
                                                          .items,
                                                      ];
                                                      newItems[idx] = {
                                                        ...item,
                                                        title: e.target.value,
                                                      };
                                                      updateSectionContent(
                                                        page.id,
                                                        section.id,
                                                        { items: newItems },
                                                      );
                                                    }}
                                                  />
                                                </div>
                                                <div className="space-y-1.5">
                                                  <Label>Description</Label>
                                                  <Input
                                                    value={item.description}
                                                    onChange={(e) => {
                                                      const newItems = [
                                                        ...section.content
                                                          .items,
                                                      ];
                                                      newItems[idx] = {
                                                        ...item,
                                                        description:
                                                          e.target.value,
                                                      };
                                                      updateSectionContent(
                                                        page.id,
                                                        section.id,
                                                        { items: newItems },
                                                      );
                                                    }}
                                                  />
                                                </div>
                                              </div>
                                            ),
                                          )}
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => {
                                              const newItems = [
                                                ...(section.content.items ||
                                                  []),
                                                {
                                                  title: "New Benefit",
                                                  description: "Description",
                                                },
                                              ];
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { items: newItems },
                                              );
                                            }}
                                          >
                                            <Plus className="h-4 w-4" /> Add
                                            Benefit
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "proof" && (
                                      <div className="space-y-4">
                                        <div className="space-y-1.5">
                                          <Label>Section Title</Label>
                                          <Input
                                            value={section.content.title || ""}
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { title: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-3">
                                          <Label>Statistics</Label>
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {(section.content.stats || []).map(
                                              (stat: any, idx: number) => (
                                                <div
                                                  key={
                                                    stat.id ||
                                                    `editor-stat-${idx}`
                                                  }
                                                  className="p-4 border border-slate-200 rounded-lg space-y-2 relative group"
                                                >
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                      const newStats =
                                                        section.content.stats.filter(
                                                          (_: any, i: number) =>
                                                            i !== idx,
                                                        );
                                                      updateSectionContent(
                                                        page.id,
                                                        section.id,
                                                        { stats: newStats },
                                                      );
                                                    }}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                  <div className="space-y-1.5">
                                                    <Label>Label</Label>
                                                    <Input
                                                      value={stat.label}
                                                      onChange={(e) => {
                                                        const newStats = [
                                                          ...section.content
                                                            .stats,
                                                        ];
                                                        newStats[idx] = {
                                                          ...stat,
                                                          label: e.target.value,
                                                        };
                                                        updateSectionContent(
                                                          page.id,
                                                          section.id,
                                                          { stats: newStats },
                                                        );
                                                      }}
                                                    />
                                                  </div>
                                                  <div className="space-y-1.5">
                                                    <Label>Value</Label>
                                                    <Input
                                                      value={stat.value}
                                                      onChange={(e) => {
                                                        const newStats = [
                                                          ...section.content
                                                            .stats,
                                                        ];
                                                        newStats[idx] = {
                                                          ...stat,
                                                          value: e.target.value,
                                                        };
                                                        updateSectionContent(
                                                          page.id,
                                                          section.id,
                                                          { stats: newStats },
                                                        );
                                                      }}
                                                    />
                                                  </div>
                                                </div>
                                              ),
                                            )}
                                            <button
                                              onClick={() => {
                                                const newStats = [
                                                  ...(section.content.stats ||
                                                    []),
                                                  {
                                                    label: "New Stat",
                                                    value: "100+",
                                                  },
                                                ];
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  { stats: newStats },
                                                );
                                              }}
                                              className="p-4 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 transition-all"
                                            >
                                              <Plus className="h-6 w-6" />
                                              <span className="text-sm font-bold">
                                                Add Stat
                                              </span>
                                            </button>
                                          </div>
                                        </div>
                                        <div className="space-y-3">
                                          <Label>
                                            Partner Logos (Moving Carousel)
                                          </Label>
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {(section.content.logos || []).map(
                                              (logo: string, idx: number) => (
                                                <div
                                                  key={idx}
                                                  className="relative group aspect-video bg-slate-50 rounded-lg border border-slate-200 overflow-hidden"
                                                >
                                                  <img
                                                    src={logo}
                                                    alt="Logo"
                                                    className="w-full h-full object-contain p-4"
                                                  />
                                                  <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                      const newLogos =
                                                        section.content.logos.filter(
                                                          (_: any, i: number) =>
                                                            i !== idx,
                                                        );
                                                      updateSectionContent(
                                                        page.id,
                                                        section.id,
                                                        { logos: newLogos },
                                                      );
                                                    }}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              ),
                                            )}
                                            <button
                                              onClick={() => {
                                                const url = prompt(
                                                  "Enter Logo Image URL:",
                                                );
                                                if (url) {
                                                  const newLogos = [
                                                    ...(section.content.logos ||
                                                      []),
                                                    url,
                                                  ];
                                                  updateSectionContent(
                                                    page.id,
                                                    section.id,
                                                    { logos: newLogos },
                                                  );
                                                }
                                              }}
                                              className="aspect-video border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 transition-all"
                                            >
                                              <Plus className="h-5 w-5" />
                                              <span className="text-xs font-bold">
                                                Add Logo
                                              </span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "cta" && (
                                      <div className="space-y-4">
                                        <div className="space-y-1.5">
                                          <Label>Title</Label>
                                          <Input
                                            value={section.content.title || ""}
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { title: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label>Description</Label>
                                          <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                            value={
                                              section.content.description || ""
                                            }
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { description: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1.5">
                                            <Label>Primary Button Text</Label>
                                            <Input
                                              value={
                                                section.content.buttonText || ""
                                              }
                                              onChange={(e) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  {
                                                    buttonText: e.target.value,
                                                  },
                                                )
                                              }
                                            />
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label>Secondary Button Text</Label>
                                            <Input
                                              value={
                                                section.content
                                                  .secondaryButtonText || ""
                                              }
                                              onChange={(e) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  {
                                                    secondaryButtonText:
                                                      e.target.value,
                                                  },
                                                )
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "appointment" && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1.5">
                                            <Label>Section Title</Label>
                                            <Input
                                              value={
                                                section.content.title || ""
                                              }
                                              onChange={(e) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  { title: e.target.value },
                                                )
                                              }
                                            />
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label>Button Text</Label>
                                            <Input
                                              value={
                                                section.content.buttonText || ""
                                              }
                                              onChange={(e) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  {
                                                    buttonText: e.target.value,
                                                  },
                                                )
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label>Description</Label>
                                          <Input
                                            value={
                                              section.content.description || ""
                                            }
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { description: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1.5">
                                            <Label>Working Hours</Label>
                                            <Input
                                              value={
                                                section.content.workingHours ||
                                                ""
                                              }
                                              onChange={(e) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  {
                                                    workingHours:
                                                      e.target.value,
                                                  },
                                                )
                                              }
                                            />
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label>Location</Label>
                                            <Input
                                              value={
                                                section.content.location || ""
                                              }
                                              onChange={(e) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  { location: e.target.value },
                                                )
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "blog_list" && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1.5">
                                            <Label>Section Title</Label>
                                            <Input
                                              value={
                                                section.content.title || ""
                                              }
                                              onChange={(e) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  { title: e.target.value },
                                                )
                                              }
                                            />
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label>Posts Per Page</Label>
                                            <Input
                                              type="number"
                                              value={
                                                section.content.postsPerPage ||
                                                6
                                              }
                                              onChange={(e) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  {
                                                    postsPerPage: parseInt(
                                                      e.target.value,
                                                    ),
                                                  },
                                                )
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label>Description</Label>
                                          <Input
                                            value={
                                              section.content.description || ""
                                            }
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { description: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Switch
                                            checked={
                                              section.content.showExcerpts !==
                                              false
                                            }
                                            onCheckedChange={(checked) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { showExcerpts: checked },
                                              )
                                            }
                                          />
                                          <Label>Show Post Excerpts</Label>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "blog_post" && (
                                      <div className="space-y-4">
                                        <p className="text-sm text-slate-500 italic">
                                          This section displays the full content
                                          of a selected blog post.
                                        </p>
                                        <div className="grid grid-cols-3 gap-4">
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={
                                                section.content.showAuthor !==
                                                false
                                              }
                                              onCheckedChange={(checked) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  { showAuthor: checked },
                                                )
                                              }
                                            />
                                            <Label>Show Author</Label>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={
                                                section.content.showDate !==
                                                false
                                              }
                                              onCheckedChange={(checked) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  { showDate: checked },
                                                )
                                              }
                                            />
                                            <Label>Show Date</Label>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={
                                                section.content.showImage !==
                                                false
                                              }
                                              onCheckedChange={(checked) =>
                                                updateSectionContent(
                                                  page.id,
                                                  section.id,
                                                  { showImage: checked },
                                                )
                                              }
                                            />
                                            <Label>Show Image</Label>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {section.type === "text_content" && (
                                      <div className="space-y-4">
                                        <div className="space-y-1.5">
                                          <Label>Title</Label>
                                          <Input
                                            value={section.content.title || ""}
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { title: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label>
                                            Content (Markdown supported)
                                          </Label>
                                          <textarea
                                            className="flex min-h-[300px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                            value={section.content.body || ""}
                                            onChange={(e) =>
                                              updateSectionContent(
                                                page.id,
                                                section.id,
                                                { body: e.target.value },
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </React.Fragment>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full border-dashed py-8 gap-2 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group mt-4 rounded-2xl"
                          onClick={() => setShowAddSection({ pageId: page.id })}
                        >
                          <Plus className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          <span className="font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
                            Add Section to {page.title} Page
                          </span>
                        </Button>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            )}

            {/* Add Section Modal */}
            {showAddSection && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 lg:p-12 overflow-hidden">
                <Card className="max-w-4xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-300 rounded-[2.5rem] border-none bg-white dark:bg-slate-900 overflow-hidden outline-none ring-1 ring-slate-200 dark:ring-slate-800">
                  <CardHeader className="shrink-0 p-8 pb-4 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        Add New Section
                      </CardTitle>
                      <CardDescription className="text-slate-500 font-medium">
                        Choose a conversion-optimized layout to add to your{" "}
                        <span className="text-indigo-600 font-bold">
                          "
                          {
                            website?.pages.find(
                              (p) => p.id === showAddSection.pageId,
                            )?.title
                          }
                          "
                        </span>{" "}
                        page.
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowAddSection(null)}
                      className="h-12 w-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(SECTION_TEMPLATES)
                        .filter(
                          ([_, template]) =>
                            !template.featureId ||
                            isFeatureEnabled(template.featureId),
                        )
                        .map(([type, template]) => {
                          return (
                            <button
                              key={type}
                              onClick={() =>
                                addSection(showAddSection.pageId, type)
                              }
                              className="flex flex-col items-center gap-4 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-center group relative bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 active:scale-[0.98]"
                            >
                              <div
                                className={cn(
                                  "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner",
                                  "bg-slate-50 dark:bg-slate-800 text-slate-400",
                                  "group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-200 dark:group-hover:shadow-none",
                                )}
                              >
                                <Layout className="h-7 w-7" />
                              </div>
                              <div>
                                <span className="text-sm font-black capitalize text-slate-900 dark:text-white block mb-1">
                                  {type.replace(/_/g, " ")}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                  Layout Template
                                </span>
                              </div>
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                <Plus className="h-4 w-4 text-indigo-600 font-black" />
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </CardContent>
                  <CardFooter className="justify-center shrink-0 border-t border-slate-50 dark:border-slate-800 p-8 bg-slate-50/50 dark:bg-slate-800/20">
                    <p className="text-xs text-slate-400 font-medium">
                      Click on a template to automatically generate and append
                      it to your page.
                    </p>
                  </CardFooter>
                </Card>
              </div>
            )}

            {activeTab === "template" && isTemplateMode && (
              <Card className="rounded-[2.5rem] overflow-hidden border-indigo-100 shadow-2xl shadow-indigo-500/5">
                <CardHeader className="bg-gradient-to-br from-indigo-50 to-white border-b border-indigo-100 p-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-14 w-14 rounded-3xl bg-indigo-600 shadow-lg shadow-indigo-300 flex items-center justify-center">
                      <SettingsIcon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black text-slate-900">
                        Template Master Configuration
                      </CardTitle>
                      <CardDescription>
                        Define how this template appears in the global gallery
                        for customers.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                          Template Name
                        </Label>
                        <Input
                          value={template?.name || ""}
                          onChange={(e) =>
                            setTemplate({ ...template, name: e.target.value })
                          }
                          placeholder="e.g. Modern Architecture Pro"
                          className="h-12 rounded-2xl bg-white border-slate-200 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                          Gallery Category
                        </Label>
                        <Select
                          value={template?.category || "General"}
                          onValueChange={(v) =>
                            setTemplate({ ...template, category: v })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-2xl bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="General">
                              General Business
                            </SelectItem>
                            <SelectItem value="Medical/Legal">
                              Medical & Legal
                            </SelectItem>
                            <SelectItem value="Local Services">
                              Local Services
                            </SelectItem>
                            <SelectItem value="Hospitality">
                              Hospitality & Food
                            </SelectItem>
                            <SelectItem value="Personal">
                              Personal & Portfolio
                            </SelectItem>
                            <SelectItem value="E-commerce">
                              E-commerce / Shop
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-bold text-slate-900">
                              Premium Blueprint
                            </Label>
                            <p className="text-xs text-slate-500">
                              Only available on Growth and Pro plans.
                            </p>
                          </div>
                          <Switch
                            checked={!!template?.is_premium}
                            onCheckedChange={(v) =>
                              setTemplate({ ...template, is_premium: v })
                            }
                            className="data-[state=checked]:bg-amber-500"
                          />
                        </div>
                        <div className="h-[1px] bg-slate-200" />
                        <div className="flex items-center justify-between opacity-60">
                          <div className="space-y-0.5">
                            <Label className="text-base font-bold text-slate-900">
                              Featured Placement
                            </Label>
                            <p className="text-xs text-slate-500">
                              Pin to the top of the gallery.
                            </p>
                          </div>
                          <Switch disabled checked={true} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Design Archetype
                          </Label>
                          <Badge
                            variant="outline"
                            className="rounded-full bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px]"
                          >
                            LOCKED TO THEME
                          </Badge>
                        </div>
                        <Select
                          value={website.theme.style || "modern"}
                          onValueChange={(val) =>
                            setWebsite({
                              ...website,
                              theme: { ...website.theme, style: val as any },
                            })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-2xl bg-white border-indigo-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="authority">
                              <div className="flex flex-col text-left">
                                <span className="font-bold text-sm text-indigo-700">
                                  Authority Master (Professional)
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  High-trust, content-rich layout
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="action">
                              <div className="flex flex-col text-left">
                                <span className="font-bold text-sm text-emerald-700">
                                  Lead Multiplier (Lead Gen)
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Aggressive CTAs, high conversion
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="immersive">
                              <div className="flex flex-col text-left">
                                <span className="font-bold text-sm text-amber-700">
                                  Visual Narrative (High-Visual)
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Creative, image-driven flow
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="editorial">
                              <div className="flex flex-col text-left">
                                <span className="font-bold text-sm text-slate-700">
                                  Minimalist Clean (Typography)
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Clean, text-focused readability
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="corporate">
                              Corporate Identity
                            </SelectItem>
                            <SelectItem value="glassmorphic">
                              Midnight Glass (Creative)
                            </SelectItem>
                            <SelectItem value="brutalist">
                              Brutalist Bold (Experimental)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* GEO & Generative Signals */}
                  <div className="p-8 rounded-[2rem] bg-indigo-50/30 border border-indigo-100 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900">
                          Generative AI Blueprint Signals (GEO)
                        </h4>
                        <p className="text-xs text-slate-500">
                          Set the default AI context for websites generated
                          using this blueprint.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                          Default Brand Voice
                        </Label>
                        <Select
                          value={
                            template?.config?.seo?.brandVoice || "Professional"
                          }
                          onValueChange={(v) =>
                            setTemplate({
                              ...template,
                              config: {
                                ...template.config,
                                seo: { ...template.config.seo, brandVoice: v },
                              },
                            })
                          }
                        >
                          <SelectTrigger className="h-11 rounded-xl bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Professional">
                              Professional & Authoritative
                            </SelectItem>
                            <SelectItem value="Friendly">
                              Friendly & Approachable
                            </SelectItem>
                            <SelectItem value="Luxury">
                              Luxury & Sophisticated
                            </SelectItem>
                            <SelectItem value="Bold">
                              Bold & Innovative
                            </SelectItem>
                            <SelectItem value="Technical">
                              Technical & Precise
                            </SelectItem>
                            <SelectItem value="Minimalist">
                              Minimalist & Clean
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                          Target Audience Profile
                        </Label>
                        <Input
                          placeholder="e.g. High-net-worth individuals, Tech startup founders"
                          value={template?.config?.seo?.targetAudience || ""}
                          onChange={(e) =>
                            setTemplate({
                              ...template,
                              config: {
                                ...template.config,
                                seo: {
                                  ...template.config.seo,
                                  targetAudience: e.target.value,
                                },
                              },
                            })
                          }
                          className="h-11 rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Core Value Proposition (For AI Generation)
                      </Label>
                      <Textarea
                        placeholder="Define the primary problem this template solves and the unique benefit..."
                        value={
                          template?.config?.seo?.coreValueProposition || ""
                        }
                        onChange={(e) =>
                          setTemplate({
                            ...template,
                            config: {
                              ...template.config,
                              seo: {
                                ...template.config.seo,
                                coreValueProposition: e.target.value,
                              },
                            },
                          })
                        }
                        className="min-h-[80px] rounded-2xl bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Template Narrative / Description
                    </Label>
                    <Textarea
                      value={template?.description || ""}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          description: e.target.value,
                        })
                      }
                      placeholder="Explain who this template is for and what makes it special..."
                      className="min-h-[120px] rounded-3xl p-6 bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-400">
                      This description appears in the Template Gallery for
                      end-users.
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Blueprint Preview Assets
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50"
                      >
                        Upload Custom Image
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] text-slate-400">
                          Primary Thumbnail URL
                        </Label>
                        <div className="flex gap-3">
                          <Input
                            value={template?.thumbnail || ""}
                            onChange={(e) =>
                              setTemplate({
                                ...template,
                                thumbnail: e.target.value,
                              })
                            }
                            placeholder="https://images.unsplash.com/..."
                            className="h-10 rounded-xl"
                          />
                          <div className="h-10 w-16 border rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                            {template?.thumbnail ? (
                              <img
                                src={template.thumbnail}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-slate-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 p-8 border-t flex justify-end gap-3">
                  <Button
                    variant="ghost"
                    className="rounded-xl font-bold"
                    onClick={() => setActiveTab("content")}
                  >
                    Back to Content Editor
                  </Button>
                  <Button
                    className="bg-indigo-600 px-10 rounded-xl font-bold"
                    onClick={() => handleSave()}
                    isLoading={saving}
                  >
                    Save Blueprint Configuration
                  </Button>
                </CardFooter>
              </Card>
            )}

            {activeTab === "general" && (
              <Card className="rounded-[2.5rem] border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                      <SettingsIcon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      General Settings
                    </CardTitle>
                  </div>
                  <CardDescription className="text-slate-500">
                    Configure your website's core visual identity and
                    typography.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                        <Paintbrush className="h-4 w-4 text-indigo-600" />
                        Primary Brand Color
                      </Label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          className="h-12 w-12 rounded-xl border border-slate-200 cursor-pointer p-0 bg-transparent"
                          value={website.theme.primaryColor}
                          onChange={(e) =>
                            setWebsite({
                              ...website,
                              theme: {
                                ...website.theme,
                                primaryColor: e.target.value,
                              },
                            })
                          }
                        />
                        <Input
                          className="h-12 flex-1 rounded-xl font-mono uppercase"
                          value={website.theme.primaryColor}
                          onChange={(e) =>
                            setWebsite({
                              ...website,
                              theme: {
                                ...website.theme,
                                primaryColor: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                        <Palette className="h-4 w-4 text-slate-400" />
                        Secondary Color
                      </Label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          className="h-12 w-12 rounded-xl border border-slate-200 cursor-pointer p-0 bg-transparent"
                          value={website.theme.secondaryColor}
                          onChange={(e) =>
                            setWebsite({
                              ...website,
                              theme: {
                                ...website.theme,
                                secondaryColor: e.target.value,
                              },
                            })
                          }
                        />
                        <Input
                          className="h-12 flex-1 rounded-xl font-mono uppercase"
                          value={website.theme.secondaryColor}
                          onChange={(e) =>
                            setWebsite({
                              ...website,
                              theme: {
                                ...website.theme,
                                secondaryColor: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <Label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                      <Type className="h-4 w-4 text-indigo-600" />
                      Global Typography
                    </Label>
                    <Select
                      value={website.theme.fontFamily}
                      onValueChange={(val) =>
                        setWebsite({
                          ...website,
                          theme: { ...website.theme, fontFamily: val },
                        })
                      }
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                        {FONTS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>
                              {font.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <Label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                      <Layout className="h-4 w-4 text-indigo-600" />
                      Design Style Archetype
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        "modern",
                        "neumorphic",
                        "glassmorphic",
                        "brutalist",
                        "editorial",
                        "action",
                        "immersive",
                        "authority",
                        "corporate",
                      ]
                        .filter(
                          (style) =>
                            enabledStyles.length === 0 ||
                            enabledStyles.includes(style),
                        )
                        .map((style) => (
                          <button
                            key={style}
                            onClick={() => setStyleToPreview(style)}
                            className={cn(
                              "px-4 py-3 rounded-xl border text-xs font-bold capitalize transition-all",
                              website.theme.style === style
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200",
                            )}
                          >
                            {style}
                          </button>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {activeTab === "theme" && (
              <Card className="rounded-[2.5rem] border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    Branding Tools
                  </CardTitle>
                  <CardDescription>
                    Professional design presets and branding assets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Theme Presets
                      </Label>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Apply Instantly
                      </p>
                    </div>

                    <div className="relative group">
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        {THEME_PRESETS.filter(
                          (preset) =>
                            !preset.premium || isFeatureEnabled("ai_synthesis"),
                        )
                          .filter(
                            (preset) =>
                              enabledThemes.length === 0 ||
                              enabledThemes.includes(preset.name),
                          )
                          .map((preset) => (
                            <button
                              key={preset.name}
                              className={cn(
                                "flex-shrink-0 w-40 p-4 rounded-[1.5rem] border-2 text-left transition-all relative snap-start group/card",
                                website.theme.primaryColor === preset.primary &&
                                  website.theme.fontFamily === preset.font &&
                                  website.theme.style === preset.style
                                  ? "border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100"
                                  : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md",
                              )}
                              onClick={() => {
                                setWebsite({
                                  ...website,
                                  theme: {
                                    ...website.theme,
                                    primaryColor: preset.primary,
                                    secondaryColor: preset.secondary,
                                    fontFamily: preset.font,
                                    style: preset.style as any,
                                  },
                                });
                                toast.success(
                                  `Theme preset "${preset.name}" applied!`,
                                );
                              }}
                            >
                              <div
                                className="h-20 w-full rounded-xl mb-4 p-3 relative overflow-hidden flex flex-col justify-between"
                                style={{ backgroundColor: preset.primary }}
                              >
                                <div className="flex gap-1.5">
                                  <div className="h-3 w-3 rounded-full bg-white/20" />
                                  <div className="h-3 w-8 rounded-full bg-white/20" />
                                </div>
                                <div className="space-y-1">
                                  <div className="h-1.5 w-1/2 rounded-full bg-white/40" />
                                  <div className="h-1.5 w-3/4 rounded-full bg-white/20" />
                                </div>
                                <div className="absolute top-0 right-0 p-2">
                                  <div className="h-6 w-6 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                                    <Palette className="h-3 w-3" />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="text-xs font-bold block text-slate-900">
                                  {preset.name}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                      backgroundColor: preset.secondary,
                                    }}
                                  />
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter truncate">
                                    {preset.style} • {preset.font.split(",")[0]}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold flex items-center gap-2">
                          <Palette className="h-4 w-4 text-indigo-600" />
                          Primary Color
                        </Label>
                        <div
                          className="h-6 w-12 rounded-full border border-slate-200"
                          style={{
                            backgroundColor: website.theme.primaryColor,
                          }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <div className="relative group shrink-0">
                          <input
                            type="color"
                            className="h-12 w-12 rounded-xl border border-slate-200 cursor-pointer overflow-hidden p-0 bg-transparent appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                            value={website.theme.primaryColor}
                            onChange={(e) =>
                              setWebsite({
                                ...website,
                                theme: {
                                  ...website.theme,
                                  primaryColor: e.target.value,
                                },
                              })
                            }
                          />
                          <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-inset ring-black/5" />
                        </div>
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                            #
                          </span>
                          <Input
                            className="h-12 pl-7 font-mono text-sm rounded-xl uppercase"
                            value={website.theme.primaryColor.replace("#", "")}
                            onChange={(e) => {
                              const val = e.target.value.startsWith("#")
                                ? e.target.value
                                : `#${e.target.value}`;
                              if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                setWebsite({
                                  ...website,
                                  theme: {
                                    ...website.theme,
                                    primaryColor: val,
                                  },
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Main brand color for buttons, icons, and highlights.
                      </p>
                    </div>

                    <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold flex items-center gap-2">
                          <Palette className="h-4 w-4 text-slate-400" />
                          Secondary Color
                        </Label>
                        <div
                          className="h-6 w-12 rounded-full border border-slate-200"
                          style={{
                            backgroundColor: website.theme.secondaryColor,
                          }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <div className="relative group shrink-0">
                          <input
                            type="color"
                            className="h-12 w-12 rounded-xl border border-slate-200 cursor-pointer overflow-hidden p-0 bg-transparent appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                            value={website.theme.secondaryColor}
                            onChange={(e) =>
                              setWebsite({
                                ...website,
                                theme: {
                                  ...website.theme,
                                  secondaryColor: e.target.value,
                                },
                              })
                            }
                          />
                          <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-inset ring-black/5" />
                        </div>
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                            #
                          </span>
                          <Input
                            className="h-12 pl-7 font-mono text-sm rounded-xl uppercase"
                            value={website.theme.secondaryColor.replace(
                              "#",
                              "",
                            )}
                            onChange={(e) => {
                              const val = e.target.value.startsWith("#")
                                ? e.target.value
                                : `#${e.target.value}`;
                              if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                setWebsite({
                                  ...website,
                                  theme: {
                                    ...website.theme,
                                    secondaryColor: val,
                                  },
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Accent color for secondary elements and backgrounds.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Layout className="h-4 w-4 text-indigo-600" />
                      <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Design Archetype
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">
                        Layout & Polish Style
                      </Label>
                      <Select
                        value={website.theme.style || "modern"}
                        onValueChange={(val) =>
                          setWebsite({
                            ...website,
                            theme: { ...website.theme, style: val as any },
                          })
                        }
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                          <SelectValue placeholder="Select a style archetype" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {[
                            {
                              value: "corporate",
                              label: "Modern Corporate (Standard Professional)",
                            },
                            {
                              value: "action",
                              label: "Lead Generation (High Conversion Focus)",
                            },
                            {
                              value: "immersive",
                              label: "Visual Immersive (Branding Focus)",
                            },
                            {
                              value: "editorial",
                              label: "Minimalist Clean (Content Focus)",
                            },
                            {
                              value: "authority",
                              label: "Personal Authority (Coach/Speaker Focus)",
                            },
                            {
                              value: "modern",
                              label: "Sleek Modern (Clean & Versatile)",
                            },
                            {
                              value: "neumorphic",
                              label: "Neumorphic (Soft UI Design)",
                            },
                            {
                              value: "glassmorphic",
                              label: "Glassmorphic (Creative Tech UI)",
                            },
                            {
                              value: "brutalist",
                              label: "Brutalist (Bold & Experimental)",
                            },
                          ]
                            .filter(
                              (item) =>
                                enabledStyles.length === 0 ||
                                enabledStyles.includes(item.value),
                            )
                            .map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-500">
                        The archetype controls typography, layout spacing, and
                        visual patterns across all sections.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Type className="h-4 w-4 text-indigo-600" />
                      <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Typography
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">
                        Global Font Family
                      </Label>
                      <Select
                        value={website.theme.fontFamily || "Inter, sans-serif"}
                        onValueChange={(val) =>
                          setWebsite({
                            ...website,
                            theme: { ...website.theme, fontFamily: val },
                          })
                        }
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                          <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          <link href={getGoogleFontUrl()} rel="stylesheet" />
                          {FONTS.map((font) => (
                            <SelectItem
                              key={font.value}
                              value={font.value}
                              className="py-3"
                            >
                              <span
                                style={{ fontFamily: font.value }}
                                className="text-base"
                              >
                                {font.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="p-4 bg-white rounded-xl border border-slate-100 mt-4">
                        <p className="text-xs text-slate-400 mb-2 font-mono uppercase tracking-widest">
                          Font Preview
                        </p>
                        <div
                          style={{ fontFamily: website.theme.fontFamily }}
                          className="space-y-2"
                        >
                          <h4 className="text-xl font-bold">
                            The quick brown fox jumps over the lazy dog
                          </h4>
                          <p className="text-sm text-slate-600">
                            Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Sed do eiusmod tempor incididunt ut labore et
                            dolore magna aliqua.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <Label className="text-base">Logo Settings</Label>
                    <div className="space-y-4">
                      <ImageUpload
                        label="Logo Upload"
                        description="PNG or SVG recommended."
                        value={website.theme.logoUrl || ""}
                        onUpload={(url) =>
                          setWebsite({
                            ...website,
                            theme: { ...website.theme, logoUrl: url },
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "footer" && (
              <Card>
                <CardHeader>
                  <CardTitle>Footer Settings</CardTitle>
                  <CardDescription>
                    Customize what appears at the bottom of your website.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="space-y-0.5">
                        <Label>Show Menu</Label>
                        <p className="text-[10px] text-slate-500">
                          Display page links
                        </p>
                      </div>
                      <Switch
                        checked={website?.theme?.footer?.showMenu}
                        onCheckedChange={(checked) =>
                          setWebsite({
                            ...website!,
                            theme: {
                              ...website!.theme,
                              footer: {
                                ...website!.theme.footer!,
                                showMenu: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="space-y-0.5">
                        <Label>Show Socials</Label>
                        <p className="text-[10px] text-slate-500">
                          Display social icons
                        </p>
                      </div>
                      <Switch
                        checked={website?.theme?.footer?.showSocials}
                        onCheckedChange={(checked) =>
                          setWebsite({
                            ...website!,
                            theme: {
                              ...website!.theme,
                              footer: {
                                ...website!.theme.footer!,
                                showSocials: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="space-y-0.5">
                        <Label>Show Contact</Label>
                        <p className="text-[10px] text-slate-500">
                          Display contact info
                        </p>
                      </div>
                      <Switch
                        checked={website?.theme?.footer?.showContact}
                        onCheckedChange={(checked) =>
                          setWebsite({
                            ...website!,
                            theme: {
                              ...website!.theme,
                              footer: {
                                ...website!.theme.footer!,
                                showContact: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Custom Footer Text</Label>
                    <Input
                      placeholder="e.g. Your tagline or additional info"
                      value={website?.theme?.footer?.customText || ""}
                      onChange={(e) =>
                        setWebsite({
                          ...website!,
                          theme: {
                            ...website!.theme,
                            footer: {
                              ...website!.theme.footer!,
                              customText: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-4 border-t border-slate-100 pt-6">
                    <Label className="text-base">Contact Information</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Contact Email</Label>
                        <Input
                          placeholder="contact@business.com"
                          value={website?.theme?.footer?.contactEmail || ""}
                          onChange={(e) =>
                            setWebsite({
                              ...website!,
                              theme: {
                                ...website!.theme,
                                footer: {
                                  ...website!.theme.footer!,
                                  contactEmail: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Contact Phone</Label>
                        <Input
                          placeholder="+1 (555) 000-0000"
                          value={website?.theme?.footer?.contactPhone || ""}
                          onChange={(e) =>
                            setWebsite({
                              ...website!,
                              theme: {
                                ...website!.theme,
                                footer: {
                                  ...website!.theme.footer!,
                                  contactPhone: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="col-span-full space-y-1.5">
                        <Label>Business Address</Label>
                        <Input
                          placeholder="123 Business St, City, Country"
                          value={website?.theme?.footer?.contactAddress || ""}
                          onChange={(e) =>
                            setWebsite({
                              ...website!,
                              theme: {
                                ...website!.theme,
                                footer: {
                                  ...website!.theme.footer!,
                                  contactAddress: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Social Media Links</Label>
                        <p className="text-[10px] text-slate-500">
                          Add and reorder your social profiles.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-xl"
                        onClick={() => {
                          const newLinks = [
                            ...(website!.theme.footer!.socialLinks || []),
                            { platform: "facebook" as const, url: "" },
                          ];
                          setWebsite({
                            ...website!,
                            theme: {
                              ...website!.theme,
                              footer: {
                                ...website!.theme.footer!,
                                socialLinks: newLinks,
                              },
                            },
                          });
                        }}
                      >
                        <Plus className="h-4 w-4" /> Add Link
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {(website?.theme?.footer?.socialLinks || []).map(
                        (link, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group"
                          >
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-white"
                                disabled={idx === 0}
                                onClick={() => {
                                  const newLinks = [
                                    ...website!.theme.footer!.socialLinks!,
                                  ];
                                  [newLinks[idx - 1], newLinks[idx]] = [
                                    newLinks[idx],
                                    newLinks[idx - 1],
                                  ];
                                  setWebsite({
                                    ...website!,
                                    theme: {
                                      ...website!.theme,
                                      footer: {
                                        ...website!.theme.footer!,
                                        socialLinks: newLinks,
                                      },
                                    },
                                  });
                                }}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-white"
                                disabled={
                                  idx ===
                                  website!.theme.footer!.socialLinks!.length - 1
                                }
                                onClick={() => {
                                  const newLinks = [
                                    ...website!.theme.footer!.socialLinks!,
                                  ];
                                  [newLinks[idx + 1], newLinks[idx]] = [
                                    newLinks[idx],
                                    newLinks[idx + 1],
                                  ];
                                  setWebsite({
                                    ...website!,
                                    theme: {
                                      ...website!.theme,
                                      footer: {
                                        ...website!.theme.footer!,
                                        socialLinks: newLinks,
                                      },
                                    },
                                  });
                                }}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                              <div className="sm:col-span-3 space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-400">
                                  Platform
                                </Label>
                                <select
                                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                  value={link.platform}
                                  onChange={(e) => {
                                    const newLinks = [
                                      ...website!.theme.footer!.socialLinks!,
                                    ];
                                    newLinks[idx] = {
                                      ...link,
                                      platform: e.target.value as any,
                                    };
                                    setWebsite({
                                      ...website!,
                                      theme: {
                                        ...website!.theme,
                                        footer: {
                                          ...website!.theme.footer!,
                                          socialLinks: newLinks,
                                        },
                                      },
                                    });
                                  }}
                                >
                                  <option value="facebook">Facebook</option>
                                  <option value="instagram">Instagram</option>
                                  <option value="twitter">Twitter / X</option>
                                  <option value="linkedin">LinkedIn</option>
                                  <option value="youtube">YouTube</option>
                                  <option value="tiktok">TikTok</option>
                                </select>
                              </div>
                              <div className="sm:col-span-7 space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-400">
                                  URL
                                </Label>
                                <Input
                                  placeholder="https://..."
                                  className="rounded-xl bg-white"
                                  value={link.url}
                                  onChange={(e) => {
                                    const newLinks = [
                                      ...website!.theme.footer!.socialLinks!,
                                    ];
                                    newLinks[idx] = {
                                      ...link,
                                      url: e.target.value,
                                    };
                                    setWebsite({
                                      ...website!,
                                      theme: {
                                        ...website!.theme,
                                        footer: {
                                          ...website!.theme.footer!,
                                          socialLinks: newLinks,
                                        },
                                      },
                                    });
                                  }}
                                />
                              </div>
                              <div className="sm:col-span-2 flex flex-col items-center justify-center space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-400">
                                  Visible
                                </Label>
                                <Switch
                                  checked={link.isVisible !== false}
                                  onCheckedChange={(checked) => {
                                    const newLinks = [
                                      ...website!.theme.footer!.socialLinks!,
                                    ];
                                    newLinks[idx] = {
                                      ...link,
                                      isVisible: checked,
                                    };
                                    setWebsite({
                                      ...website!,
                                      theme: {
                                        ...website!.theme,
                                        footer: {
                                          ...website!.theme.footer!,
                                          socialLinks: newLinks,
                                        },
                                      },
                                    });
                                  }}
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 rounded-xl mt-5"
                              onClick={() => {
                                const newLinks =
                                  website!.theme.footer!.socialLinks!.filter(
                                    (_, i) => i !== idx,
                                  );
                                setWebsite({
                                  ...website!,
                                  theme: {
                                    ...website!.theme,
                                    footer: {
                                      ...website!.theme.footer!,
                                      socialLinks: newLinks,
                                    },
                                  },
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "seo" && (
              <div className="space-y-6">
                <Card className="overflow-hidden border-indigo-100 shadow-sm">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-indigo-600" />
                          Revenue Search (Global SEO)
                        </CardTitle>
                        <CardDescription>
                          Dominate search engines and turn global searchers into
                          paying customers.
                        </CardDescription>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Search className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {/* Search Result Preview */}
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Search Engine Preview
                      </Label>
                      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm max-w-2xl">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                            {website.seo.favicon ? (
                              <img
                                src={website.seo.favicon}
                                alt="Favicon"
                                className="h-4 w-4"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Globe className="h-3 w-3 text-slate-400" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] leading-tight text-slate-900 font-medium">
                              {website.seo.title || "Site Title"}
                            </span>
                            <span className="text-[10px] leading-tight text-slate-500">
                              https://yourdomain.com › {website.businessId}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-[20px] leading-tight text-[#1a0dab] hover:underline cursor-pointer mb-1">
                          {website.seo.title || "Your Business Website Title"}
                        </h3>
                        <p className="text-[14px] leading-normal text-[#4d5156] line-clamp-2">
                          {website.seo.description ||
                            "Add a meta description to see how your site will appear in search results. This description should be between 150-160 characters for optimal visibility."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Site Title</Label>
                        <Input
                          {...registerSeo("title")}
                          placeholder="Business Name | Professional Service"
                        />
                        {seoErrors.title && (
                          <p className="text-xs text-red-500">
                            {seoErrors.title.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Keywords (comma separated)</Label>
                        <Input
                          {...registerSeo("keywords")}
                          placeholder="service, quality, location"
                        />
                        {seoErrors.keywords && (
                          <p className="text-xs text-red-500">
                            {seoErrors.keywords.message}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Meta Description</Label>
                        <Textarea
                          {...registerSeo("description")}
                          className="min-h-[100px]"
                          placeholder="Briefly describe what your business does and why customers should choose you."
                        />
                        {seoErrors.description && (
                          <p className="text-xs text-red-500">
                            {seoErrors.description.message}
                          </p>
                        )}
                      </div>

                      {/* Advanced SEO Fields - Feature Gated */}
                      <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        {!isFeatureEnabled("advanced_seo") && (
                          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-indigo-200 p-6 text-center">
                            <Lock className="h-6 w-6 text-indigo-600 mb-2" />
                            <p className="text-xs font-bold text-slate-900 mb-1">
                              Advanced SEO Features Locked
                            </p>
                            <p className="text-[10px] text-slate-500 mb-3">
                              Upgrade to Growth to unlock Favicons, Social
                              Images, and Page-Specific SEO.
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] rounded-lg border-indigo-200 text-indigo-600"
                              onClick={() => navigate("/dashboard/billing")}
                            >
                              Upgrade Now
                            </Button>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Favicon URL</Label>
                          <div className="flex gap-2">
                            <Input
                              {...registerSeo("favicon")}
                              placeholder="https://..."
                              disabled={!isFeatureEnabled("advanced_seo")}
                            />
                            <div className="h-10 w-10 shrink-0 border border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                              {website.seo.favicon ? (
                                <img
                                  src={website.seo.favicon}
                                  alt="Favicon"
                                  className="h-6 w-6"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-slate-300" />
                              )}
                            </div>
                          </div>
                          {seoErrors.favicon && (
                            <p className="text-xs text-red-500">
                              {seoErrors.favicon.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>OG Image URL (Social Sharing)</Label>
                          <div className="flex gap-2">
                            <Input
                              {...registerSeo("ogImage")}
                              placeholder="https://..."
                              disabled={!isFeatureEnabled("advanced_seo")}
                            />
                            <div className="h-10 w-10 shrink-0 border border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                              {website.seo.ogImage ? (
                                <img
                                  src={website.seo.ogImage}
                                  alt="OG"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-slate-300" />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-full space-y-2">
                          <Label>Canonical URL</Label>
                          <Input
                            {...registerSeo("canonicalUrl")}
                            placeholder="https://yourdomain.com"
                            disabled={!isFeatureEnabled("advanced_seo")}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-indigo-100 shadow-sm relative">
                  {!isFeatureEnabled("local_seo_geo") && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center p-8 text-center">
                      <div className="h-16 w-16 rounded-3xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-amber-600" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Local SEO & GEO Data Locked
                      </h4>
                      <p className="text-sm text-slate-500 max-w-xs mb-6">
                        Upgrade to Premium to unlock Rich Snippets, GEO Tags,
                        and Google Maps integration.
                      </p>
                      <Button
                        onClick={() => navigate("/dashboard/billing")}
                        className="rounded-xl bg-amber-600 hover:bg-amber-700 h-12 px-8"
                      >
                        Upgrade Now
                      </Button>
                    </div>
                  )}
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-indigo-600" />
                      GEO & Local SEO
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSyncSeoFromBusiness}
                        className="h-8 text-xs gap-2 rounded-lg"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Sync from Profile
                      </Button>
                      <CardDescription>
                        Enhance local ranking by providing location and business
                        details.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Business Type</Label>
                        <Select
                          value={
                            watchSeo("businessType") ||
                            website.seo.businessType ||
                            "LocalBusiness"
                          }
                          onValueChange={(val) => {
                            setSeoValue("businessType", val, {
                              shouldDirty: true,
                            });
                            setWebsite({
                              ...website,
                              seo: { ...website.seo, businessType: val },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LocalBusiness">
                              Local Business
                            </SelectItem>
                            <SelectItem value="Restaurant">
                              Restaurant
                            </SelectItem>
                            <SelectItem value="ProfessionalService">
                              Professional Service
                            </SelectItem>
                            <SelectItem value="HealthAndBeautyBusiness">
                              Health & Beauty
                            </SelectItem>
                            <SelectItem value="RealEstateAgent">
                              Real Estate Agent
                            </SelectItem>
                            <SelectItem value="MedicalBusiness">
                              Medical Business
                            </SelectItem>
                            <SelectItem value="Store">
                              Store / Retail
                            </SelectItem>
                            <SelectItem value="Hotel">
                              Hotel / Lodging
                            </SelectItem>
                            <SelectItem value="AutomotiveBusiness">
                              Automotive
                            </SelectItem>
                            <SelectItem value="FinancialService">
                              Financial Service
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                          {...registerSeo("phone")}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Full Address</Label>
                        <Input
                          {...registerSeo("address")}
                          placeholder="123 Main St, City, State, ZIP"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Region / State</Label>
                        <Input
                          {...registerSeo("region")}
                          placeholder="California"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Place Name / City</Label>
                        <Input
                          {...registerSeo("placename")}
                          placeholder="San Francisco"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Latitude</Label>
                        <Input
                          {...registerSeo("latitude")}
                          placeholder="37.7749"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Longitude</Label>
                        <Input
                          {...registerSeo("longitude")}
                          placeholder="-122.4194"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Opening Hours</Label>
                        <Textarea
                          placeholder="Mon 09:00-17:00, Tue 09:00-17:00..."
                          className="min-h-[80px]"
                          value={website.seo.openingHours?.join("\n") || ""}
                          onChange={(e) => {
                            setWebsite({
                              ...website,
                              seo: {
                                ...website.seo,
                                openingHours: e.target.value
                                  .split("\n")
                                  .filter(Boolean),
                              },
                            });
                          }}
                        />
                        <p className="text-[10px] text-slate-500 italic">
                          One day/hours pair per line.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Price Range</Label>
                        <Select
                          value={
                            watchSeo("priceRange") ||
                            website.seo.priceRange ||
                            "$$"
                          }
                          onValueChange={(val) => {
                            setSeoValue("priceRange", val, {
                              shouldDirty: true,
                            });
                            setWebsite({
                              ...website,
                              seo: { ...website.seo, priceRange: val },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select price range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="$">$ (Inexpensive)</SelectItem>
                            <SelectItem value="$$">$$ (Moderate)</SelectItem>
                            <SelectItem value="$$$">$$$ (Expensive)</SelectItem>
                            <SelectItem value="$$$$">$$$$ (Luxury)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-indigo-100 shadow-sm relative">
                  <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-white border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                      Generative Engine Optimization (GEO)
                    </CardTitle>
                    <CardDescription>
                      Optimize your website for AI search engines like Gemini,
                      Claude, and Perplexity.
                    </CardDescription>
                  </CardHeader>
                  <div className="absolute top-6 right-6 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2 font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      onClick={async () => {
                        try {
                          toast.loading(
                            "Generating AI-optimized GEO content...",
                          );
                          const { generateGeoContent } =
                            await import("../lib/gemini");
                          let bId = business?.id || website?.businessId || businessId;
                          let targetBusiness = business;

                          // Fallback to profile business if possible
                          if (!targetBusiness && profile?.businessId) {
                            try {
                              const { data } = await supabase.from("businesses").select("*").eq("id", profile.businessId).maybeSingle();
                              if (data) {
                                targetBusiness = data;
                                // Optionally update state if it helps
                                // setBusiness(data); 
                              }
                            } catch (e) {}
                          }

                          if (!bId && !targetBusiness)
                            throw new Error("No business context found. Please complete your profile first.");
                          if (!targetBusiness && bId && bId !== "template") {
                            try {
                              const { data: bData } = await supabase
                                .from("businesses")
                                .select("*")
                                .eq("id", bId)
                                .maybeSingle();
                              targetBusiness = bData;
                            } catch (err) {
                              console.error("Error fetching business:", err);
                            }
                          }

                          // If still no targetBusiness, create a fallback from website/seo data
                          if (!targetBusiness) {
                            if (bId === "template") {
                              throw new Error(
                                "Cannot generate GEO content for templates without a business context.",
                              );
                            }
                            
                            // Last resort fallback using SEO data
                            targetBusiness = {
                              name: website?.seo?.title || "Local Business",
                              industry: website?.seo?.keywords?.[0] || "General Industry",
                              location: website?.seo?.placename || "Local Area",
                              business_nature: website?.seo?.description || "A professional local business.",
                            };
                          }

                          const geoContent = await generateGeoContent(
                            targetBusiness.name,
                            targetBusiness.industry,
                            targetBusiness.location,
                            targetBusiness.business_nature || "",
                            bId !== "template" ? bId : undefined,
                          );

                          // Update current state and form
                          const updatedSeo = {
                            ...website.seo,
                            coreValueProposition:
                              geoContent.coreValueProposition,
                            knowledgeBaseSummary:
                              geoContent.knowledgeBaseSummary,
                            targetAudience: geoContent.targetAudience,
                            keywords: geoContent.keywords,
                            businessType: geoContent.businessType,
                          };

                          setSeoValue(
                            "coreValueProposition",
                            geoContent.coreValueProposition,
                            { shouldDirty: true },
                          );
                          setSeoValue(
                            "knowledgeBaseSummary",
                            geoContent.knowledgeBaseSummary,
                            { shouldDirty: true },
                          );
                          setSeoValue(
                            "targetAudience",
                            geoContent.targetAudience,
                            { shouldDirty: true },
                          );
                          setSeoValue("keywords", geoContent.keywords, {
                            shouldDirty: true,
                          });
                          setSeoValue("businessType", geoContent.businessType, {
                            shouldDirty: true,
                          });

                          setWebsite({
                            ...website,
                            seo: updatedSeo,
                          });

                          toast.dismiss();
                          toast.success("AI-optimized GEO content generated!");
                        } catch (err: any) {
                          toast.dismiss();
                          toast.error(
                            "Failed to generate GEO content: " + err.message,
                          );
                        }
                      }}
                    >
                      <Sparkles className="h-4 w-4" /> AI Regenerate GEO
                    </Button>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          Core Value Proposition
                          <Badge variant="outline" className="text-[8px] h-4">
                            CRITICAL FOR AI
                          </Badge>
                        </Label>
                        <Input
                          {...registerSeo("coreValueProposition")}
                          placeholder="e.g. The premier aesthetic clinic in Tokyo offering non-surgical facial rejuvenation."
                          onChange={(e) => {
                            registerSeo("coreValueProposition").onChange(e);
                            setWebsite({
                              ...website,
                              seo: {
                                ...website.seo,
                                coreValueProposition: e.target.value,
                              },
                            });
                          }}
                        />
                        <p className="text-[10px] text-slate-500 italic">
                          This helps AI engines summarize your business in one
                          clear sentence.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Brand Voice & Personality</Label>
                        <Select
                          value={
                            watchSeo("brandVoice") ||
                            website.seo.brandVoice ||
                            "Professional"
                          }
                          onValueChange={(val) => {
                            setSeoValue("brandVoice", val, {
                              shouldDirty: true,
                            });
                            setWebsite({
                              ...website,
                              seo: { ...website.seo, brandVoice: val },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand voice" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Professional">
                              Professional & Authoritative
                            </SelectItem>
                            <SelectItem value="Warm">
                              Warm & Compassionate
                            </SelectItem>
                            <SelectItem value="Bold">Bold & Direct</SelectItem>
                            <SelectItem value="Minimal">
                              Minimal & Clean
                            </SelectItem>
                            <SelectItem value="Whimsical">
                              Whimsical & Playful
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Knowledge Base Summary</Label>
                        <Textarea
                          placeholder="Provide a factual overview of your business history, milestones, and core expertise..."
                          className="min-h-[120px]"
                          {...registerSeo("knowledgeBaseSummary")}
                          onChange={(e) => {
                            registerSeo("knowledgeBaseSummary").onChange(e);
                            setWebsite({
                              ...website,
                              seo: {
                                ...website.seo,
                                knowledgeBaseSummary: e.target.value,
                              },
                            });
                          }}
                        />
                        <p className="text-[10px] text-slate-500 italic">
                          Detailed context increases the accuracy of
                          AI-generated answers about your brand.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Target Audience Profile</Label>
                        <Input
                          {...registerSeo("targetAudience")}
                          placeholder="e.g. High-net-worth individuals aged 35-60 interested in skincare."
                          onChange={(e) => {
                            registerSeo("targetAudience").onChange(e);
                            setWebsite({
                              ...website,
                              seo: {
                                ...website.seo,
                                targetAudience: e.target.value,
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-indigo-100 shadow-sm relative">
                  {!isFeatureEnabled("advanced_seo") && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center p-8 text-center">
                      <div className="h-16 w-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-indigo-600" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Page-Specific SEO Locked
                      </h4>
                      <p className="text-sm text-slate-500 max-w-xs mb-6">
                        Upgrade to Growth to customize SEO settings for every
                        single page individually.
                      </p>
                      <Button
                        onClick={() => navigate("/dashboard/billing")}
                        className="rounded-xl bg-indigo-600 h-12 px-8"
                      >
                        Upgrade Now
                      </Button>
                    </div>
                  )}
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2">
                      <Layout className="h-5 w-5 text-indigo-600" />
                      Page-Specific SEO
                    </CardTitle>
                    <CardDescription>
                      Customize SEO settings for individual pages.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {website.pages.map((page) => (
                      <div
                        key={page.id}
                        className="p-5 border border-slate-200 rounded-2xl space-y-6 bg-white shadow-sm hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-indigo-600" />
                            </div>
                            <h4 className="font-bold text-slate-900">
                              {page.title}
                            </h4>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-600 border-none"
                          >
                            {page.slug}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                              Page Title Tag
                            </Label>
                            <Input
                              className="h-9 text-sm"
                              value={page.seo?.title || ""}
                              placeholder={`${page.title} | ${website.seo.title}`}
                              onChange={(e) => {
                                updatePageSeo(page.id, {
                                  title: e.target.value,
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                              Page Keywords
                            </Label>
                            <Input
                              className="h-9 text-sm"
                              value={page.seo?.keywords?.join(", ") || ""}
                              placeholder="keyword1, keyword2"
                              onChange={(e) =>
                                updatePageSeo(page.id, {
                                  keywords: e.target.value
                                    .split(",")
                                    .map((k) => k.trim()),
                                })
                              }
                            />
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                              Page Meta Description
                            </Label>
                            <Textarea
                              className="text-sm min-h-[80px]"
                              value={page.seo?.description || ""}
                              placeholder="Specific description for this page..."
                              onChange={(e) =>
                                updatePageSeo(page.id, {
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                              Page Canonical URL
                            </Label>
                            <Input
                              className="h-9 text-sm"
                              value={page.seo?.canonicalUrl || ""}
                              placeholder="https://yourdomain.com/page"
                              onChange={(e) =>
                                updatePageSeo(page.id, {
                                  canonicalUrl: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                              Page OG Image URL
                            </Label>
                            <div className="flex gap-3">
                              <Input
                                className="h-9 text-sm"
                                value={page.seo?.ogImage || ""}
                                placeholder="https://..."
                                onChange={(e) =>
                                  updatePageSeo(page.id, {
                                    ogImage: e.target.value,
                                  })
                                }
                              />
                              <div className="h-9 w-16 shrink-0 border border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                                {page.seo?.ogImage ? (
                                  <img
                                    src={page.seo.ogImage}
                                    alt="Page OG"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <ImageIcon className="h-4 w-4 text-slate-300" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                              Page Favicon URL
                            </Label>
                            <div className="flex gap-3">
                              <Input
                                className="h-9 text-sm"
                                value={page.seo?.favicon || ""}
                                placeholder="https://..."
                                onChange={(e) =>
                                  updatePageSeo(page.id, {
                                    favicon: e.target.value,
                                  })
                                }
                              />
                              <div className="h-9 w-16 shrink-0 border border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                                {page.seo?.favicon ? (
                                  <img
                                    src={page.seo.favicon}
                                    alt="Page Favicon"
                                    className="h-4 w-4"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Globe className="h-4 w-4 text-slate-300" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Page-Specific Local SEO */}
                          <div className="col-span-2 pt-4 border-t border-slate-100">
                            <Accordion className="w-full">
                              <AccordionItem
                                value="local-seo"
                                className="border-none"
                              >
                                <AccordionTrigger className="py-2 hover:no-underline">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    <MapPin className="h-4 w-4" /> Local SEO &
                                    GEO Overrides
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">
                                        Business Type
                                      </Label>
                                      <Select
                                        value={page.seo?.businessType || ""}
                                        onValueChange={(val) =>
                                          updatePageSeo(page.id, {
                                            businessType: val,
                                          })
                                        }
                                      >
                                        <SelectTrigger className="h-9 text-xs">
                                          <SelectValue placeholder="Use Global" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="LocalBusiness">
                                            Local Business
                                          </SelectItem>
                                          <SelectItem value="Restaurant">
                                            Restaurant
                                          </SelectItem>
                                          <SelectItem value="ProfessionalService">
                                            Professional Service
                                          </SelectItem>
                                          <SelectItem value="HealthAndBeautyBusiness">
                                            Health & Beauty
                                          </SelectItem>
                                          <SelectItem value="RealEstateAgent">
                                            Real Estate Agent
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">
                                        Phone Number
                                      </Label>
                                      <Input
                                        className="h-9 text-xs"
                                        value={page.seo?.phone || ""}
                                        placeholder={website.seo.phone}
                                        onChange={(e) =>
                                          updatePageSeo(page.id, {
                                            phone: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                      <Label className="text-xs">
                                        Full Address
                                      </Label>
                                      <Input
                                        className="h-9 text-xs"
                                        value={page.seo?.address || ""}
                                        placeholder={website.seo.address}
                                        onChange={(e) =>
                                          updatePageSeo(page.id, {
                                            address: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">
                                        Region / State
                                      </Label>
                                      <Input
                                        className="h-9 text-xs"
                                        value={page.seo?.region || ""}
                                        placeholder={website.seo.region}
                                        onChange={(e) =>
                                          updatePageSeo(page.id, {
                                            region: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">
                                        City / Placename
                                      </Label>
                                      <Input
                                        className="h-9 text-xs"
                                        value={page.seo?.placename || ""}
                                        placeholder={website.seo.placename}
                                        onChange={(e) =>
                                          updatePageSeo(page.id, {
                                            placename: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">
                                        Opening Hours (Overrride)
                                      </Label>
                                      <Textarea
                                        className="text-xs min-h-[60px]"
                                        value={
                                          page.seo?.openingHours?.join("\n") ||
                                          ""
                                        }
                                        placeholder="Use global opening hours..."
                                        onChange={(e) =>
                                          updatePageSeo(page.id, {
                                            openingHours: e.target.value
                                              .split("\n")
                                              .filter(Boolean),
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">
                                        Price Range
                                      </Label>
                                      <Select
                                        value={page.seo?.priceRange || ""}
                                        onValueChange={(val) =>
                                          updatePageSeo(page.id, {
                                            priceRange: val,
                                          })
                                        }
                                      >
                                        <SelectTrigger className="h-9 text-xs">
                                          <SelectValue placeholder="Use Global" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="$">$</SelectItem>
                                          <SelectItem value="$$">$$</SelectItem>
                                          <SelectItem value="$$$">
                                            $$$
                                          </SelectItem>
                                          <SelectItem value="$$$$">
                                            $$$$
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* AI SEO Health Auditor */}
                <Card className="overflow-hidden border-rose-100 shadow-sm relative">
                  <CardHeader className="bg-rose-50/30 border-b border-rose-100">
                    <CardTitle className="flex items-center gap-2 text-rose-900">
                      <Shield className="h-5 w-5 text-rose-600" />
                      AI SEO Health Auditor
                    </CardTitle>
                    <CardDescription>
                      Let AI scan your website configuration and provide
                      critical fixes for optimal search ranking.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {!seoAudit ? (
                      <div className="text-center py-12 space-y-4 border-2 border-dashed border-rose-100 rounded-[2rem] bg-rose-50/10">
                        <div className="h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                          <Search className="h-8 w-8 text-rose-600" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900">
                            No Recent Audit Found
                          </h4>
                          <p className="text-sm text-slate-500 max-w-xs mx-auto">
                            Run a comprehensive scan to identify missing
                            metadata, keyword gaps, and technical SEO issues.
                          </p>
                        </div>
                        <Button
                          onClick={async () => {
                            try {
                              setIsAuditing(true);
                              toast.loading(
                                "Analyzing website SEO structure...",
                              );
                              const { generateMarketingContent } =
                                await import("../lib/gemini");
                              const result = await generateMarketingContent(
                                "seo_audit",
                                {
                                  name: business?.name,
                                  industry: business?.industry,
                                  description: website?.seo.description,
                                  location: business?.location,
                                  targetAudience: website?.seo.targetAudience,
                                  currentSeo: website?.seo,
                                },
                              );
                              setSeoAudit(result);
                              toast.success("SEO Audit Complete!");
                            } catch (err) {
                              toast.error("Failed to run SEO audit");
                            } finally {
                              setIsAuditing(false);
                            }
                          }}
                          disabled={isAuditing}
                          className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 px-8 shadow-lg shadow-rose-100"
                        >
                          {isAuditing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Zap className="h-4 w-4 mr-2" />
                          )}
                          Run SEO Scan Now
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner",
                                seoAudit.score >= 80
                                  ? "bg-emerald-100 text-emerald-700"
                                  : seoAudit.score >= 50
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-rose-100 text-rose-700",
                              )}
                            >
                              {seoAudit.score}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">
                                Overall SEO Score
                              </h4>
                              <p className="text-xs text-slate-500">
                                Based on competitive industry benchmarks
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                setIsAuditing(true);
                                const { generateMarketingContent } =
                                  await import("../lib/gemini");
                                const result = await generateMarketingContent(
                                  "seo_audit",
                                  {
                                    name: business?.name,
                                    industry: business?.industry,
                                    description: website?.seo.description,
                                    location: business?.location,
                                    targetAudience: website?.seo.targetAudience,
                                    currentSeo: website?.seo,
                                  },
                                );
                                setSeoAudit(result);
                                toast.success("Audit Refreshed");
                              } catch (err) {
                                toast.error("Audit failed");
                              } finally {
                                setIsAuditing(false);
                              }
                            }}
                            disabled={isAuditing}
                            className="rounded-lg h-9 text-xs border-slate-200"
                          >
                            {isAuditing ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            ) : (
                              <RefreshCw className="h-3 w-3 mr-2" />
                            )}
                            Rescan
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Critical Issues & Auto-Fixes
                          </Label>
                          <div className="space-y-2">
                            {seoAudit.criticalIssues.map(
                              (issue: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-4 bg-white border border-slate-100 rounded-2xl flex items-start gap-4 shadow-sm hover:border-rose-200 transition-colors"
                                >
                                  <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-1">
                                    <AlertCircle className="h-4 w-4 text-rose-600" />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <p className="text-sm font-bold text-slate-900">
                                      {issue.issue}
                                    </p>
                                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                                      " {issue.solution} "
                                    </p>
                                  </div>
                                  {issue.isFixable && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-xs gap-1.5"
                                      onClick={() => {
                                        if (issue.fixType === "title")
                                          setSeoValue("title", issue.solution, {
                                            shouldDirty: true,
                                          });
                                        if (issue.fixType === "description")
                                          setSeoValue(
                                            "description",
                                            issue.solution,
                                            { shouldDirty: true },
                                          );
                                        if (issue.fixType === "keywords")
                                          setSeoValue(
                                            "keywords",
                                            issue.solution,
                                            { shouldDirty: true },
                                          );
                                        toast.success("Optimization Applied!");
                                      }}
                                    >
                                      <Zap className="h-3.5 w-3.5" /> Apply
                                    </Button>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-5 bg-indigo-50/30 rounded-[2rem] border border-indigo-100 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-2">
                              <Sparkles className="h-4 w-4" /> Opportunities
                            </div>
                            <ul className="space-y-2">
                              {seoAudit.opportunities.map(
                                (opt: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="flex gap-2 items-start text-xs text-slate-600"
                                  >
                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                    {opt}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                          <div className="p-5 bg-emerald-50/30 rounded-[2rem] border border-emerald-100 space-y-3">
                            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-2">
                              <TrendingUp className="h-4 w-4" /> Recommended
                              Keywords
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {seoAudit.recommendedKeywords.map(
                                (kw: string, idx: number) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="bg-white border-emerald-100 text-emerald-700 text-[10px]"
                                  >
                                    {kw}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-900 rounded-2xl text-white text-xs leading-relaxed">
                          <p className="font-bold mb-1 opacity-60 uppercase tracking-widest text-[10px]">
                            Audit Summary
                          </p>
                          {seoAudit.summary}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={!!pageToDelete}
        onOpenChange={(open) => !open && setPageToDelete(null)}
      >
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Delete Page?
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Are you sure you want to delete the{" "}
              <strong>
                {website.pages.find((p) => p.id === pageToDelete)?.title}
              </strong>{" "}
              page? This action cannot be undone and all sections on this page
              will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="ghost"
              onClick={() => setPageToDelete(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => pageToDelete && removePage(pageToDelete)}
              className="rounded-xl px-8 font-bold bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPage} onOpenChange={setShowAddPage}>
        <DialogContent className="rounded-3xl sm:max-w-md max-h-[95vh] flex flex-col overflow-hidden p-0 dark:bg-slate-900 border-none shadow-2xl">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="text-2xl font-bold">
              Add New Page
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Create a additional page for your website. (Limit: {maxPages}{" "}
              pages total)
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Page Title
              </Label>
              <Input
                placeholder="e.g., Services, About Us, Contact"
                className="rounded-2xl h-12 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                value={newPageData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setNewPageData({
                    ...newPageData,
                    title: title,
                    slug: title.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Page URL (Slug)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  /
                </span>
                <Input
                  placeholder="slug"
                  className="rounded-2xl h-12 pl-7 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  value={newPageData.slug}
                  onChange={(e) =>
                    setNewPageData({
                      ...newPageData,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                The relative path for this page (e.g., /services).
              </p>
            </div>

            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
                New pages will automatically be added to your website's
                navigation header and footer for a seamless experience.
              </p>
            </div>
          </div>
          <DialogFooter className="p-6 pt-2 border-t shrink-0 dark:border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setShowAddPage(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPage}
              disabled={isGeneratingPage}
              className="rounded-xl px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 dark:shadow-none border-none"
            >
              {isGeneratingPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Create Page"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAiEditor} onOpenChange={setShowAiEditor}>
        <DialogContent className="rounded-3xl sm:max-w-md bg-white dark:bg-slate-900 border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-600">
                <Sparkles className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  AI Synthesis Engine
                </span>
              </div>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Regenerate Section
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 font-medium">
                Our AI will rewrite this section based on your business profile,
                industry, and brand voice.
              </DialogDescription>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  Custom Refinement (Optional)
                </Label>
                <Textarea
                  placeholder="e.g. Focus more on our eco-friendly materials, or keep sentences short and punchy..."
                  className="min-h-[120px] rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all resize-none p-4 text-sm"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
                <p className="text-[9px] text-slate-400 font-medium pl-1 italic">
                  Tip: Be specific about what you want the AI to highlight or
                  change.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl h-12 font-bold text-slate-600 border-slate-200"
                onClick={() => setShowAiEditor(false)}
                disabled={isGeneratingSection}
              >
                Cancel
              </Button>
              <Button
                className="flex-[2] rounded-2xl h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50 transition-all border-none"
                disabled={isGeneratingSection}
                onClick={() => {
                  if (activeElement?.pageId && activeElement?.sectionId) {
                    const page = website?.pages.find(
                      (p) => p.id === activeElement.pageId,
                    );
                    const section = page?.sections.find(
                      (s) => s.id === activeElement.sectionId,
                    );
                    if (section) {
                      generateAISectionContent(
                        activeElement.pageId,
                        activeElement.sectionId,
                        section.type,
                      );
                    }
                  }
                }}
              >
                {isGeneratingSection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
