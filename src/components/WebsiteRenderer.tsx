/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { Website, WebsiteSection, BlogPost } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  CheckCircle2,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Send,
  Twitter,
  X,
  Zap,
  ArrowLeft,
  ArrowRight,
  Calendar,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Youtube,
  MessageSquare,
  Sparkles,
  Star,
  Quote,
  ShoppingBag,
  Tag,
  CreditCard,
  Layers,
  Shield,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { generateChatResponse } from "@/src/lib/gemini";
import { cn, formatDate, generateId, formatStatValue } from "@/src/lib/utils";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { toast } from "sonner";
import { useFeatures } from "../hooks/useFeatures";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function WebsiteRenderer({
  initialData,
  activePageSlug: propActivePageSlug,
}: {
  initialData?: Website;
  activePageSlug?: string;
}) {
  const { businessId: businessIdFromParams } = useParams<{
    businessId: string;
  }>();
  const businessId = initialData?.businessId || businessIdFromParams;
  const location = useLocation();
  const { isFeatureEnabled } = useFeatures();
  const [website, setWebsite] = useState<Website | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      setWebsite(initialData);
    }
  }, [initialData]);

  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [formSuccess, setFormSuccess] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [activePageSlug, setActivePageSlug] = useState(
    propActivePageSlug || "home",
  );

  useEffect(() => {
    if (propActivePageSlug !== undefined) {
      setActivePageSlug(propActivePageSlug);
      setSelectedPost(null);
    }
  }, [propActivePageSlug]);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "ai"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Appointment states
  const [bookingDate, setBookingDate] = useState<Date | null>(new Date());
  const [bookingTime, setBookingTime] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    service: "",
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (initialData) return;
    const fetchWebsite = async () => {
      if (!businessId) return;
      try {
        const { data, error } = await supabase
          .from("websites")
          .select("*")
          .eq("business_id", businessId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          const theme = { ...data.theme };
          if (!theme.footer) {
            theme.footer = {
              showMenu: true,
              showSocials: true,
              showContact: true,
              customText: "",
              contactEmail: "contact@business.com",
              contactPhone: "+1 (555) 000-0000",
              contactAddress: "123 Business St, City, Country",
              socialLinks: [
                { platform: "facebook", url: "", isVisible: true },
                { platform: "instagram", url: "", isVisible: true },
                { platform: "twitter", url: "", isVisible: true },
                { platform: "linkedin", url: "", isVisible: true },
                { platform: "youtube", url: "", isVisible: true },
              ],
            };
          }

          const mappedWebsite: Website = {
            id: data.id,
            businessId: data.business_id,
            theme: theme,
            pages: data.pages,
            seo: data.seo,
            status: data.status,
            updatedAt: new Date(data.updated_at).getTime(),
          };
          setWebsite(mappedWebsite);
        }
      } catch (error) {
        console.error("Fetch website failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWebsite();
  }, [businessId]);

  useEffect(() => {
    // We're using Helmet now, so we don't need manual title updates
  }, [activePageSlug, website]);

  useEffect(() => {
    const hasBlogList = website?.pages.some((p) =>
      p.sections.some((s) => s.type === "blog_list"),
    );
    if (
      (activePageSlug === "blog" || hasBlogList) &&
      businessId &&
      businessId !== "preview"
    ) {
      const fetchPosts = async () => {
        const { data } = await supabase
          .from("posts")
          .select("*")
          .eq("business_id", businessId)
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (data) {
          setPosts(
            data.map((p: any) => ({
              id: p.id,
              businessId: p.business_id,
              title: p.title,
              content: p.content,
              excerpt: p.excerpt,
              author: p.author,
              status: p.status,
              createdAt: new Date(p.created_at).getTime(),
              updatedAt: new Date(p.updated_at).getTime(),
              imageUrl: p.image_url,
              slug: p.slug,
            })),
          );
        }
      };
      fetchPosts();

      const channel = supabase
        .channel(`public:posts:${businessId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "posts",
            filter: `business_id=eq.${businessId}`,
          },
          () => fetchPosts(),
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activePageSlug, businessId, website]);

  useEffect(() => {
    if (businessId) {
      const fetchPolicies = async () => {
        const { data } = await supabase
          .from("settings")
          .select("content")
          .eq("id", `business_policies_${businessId}`)
          .single();

        if (data?.content?.policies) {
          setPolicies(
            data.content.policies.filter((p: any) => p.status === "published"),
          );
        }
      };
      fetchPolicies();
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) {
      const fetchBusiness = async () => {
        const { data } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single();
        if (data) setBusinessInfo(data);
      };
      fetchBusiness();
    }

    const searchParams = new URLSearchParams(location.search);
    const refCode = searchParams.get("ref");
    if (refCode && businessId) {
      localStorage.setItem(`ref_${businessId}`, refCode);
    }
  }, [businessId, location.search]);

  useEffect(() => {
    if (businessId && businessId !== "preview") {
      const fetchProducts = async () => {
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("business_id", businessId)
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (data) setProducts(data);
      };
      fetchProducts();

      const channel = supabase
        .channel(`public:products:${businessId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "products",
            filter: `business_id=eq.${businessId}`,
          },
          () => fetchProducts(),
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [businessId]);

  const handleCheckout = async (product: any) => {
    if (!product || !businessId) return;
    setCheckoutLoading(product.id);
    try {
      const response = await fetch("/api/create-product-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          businessId,
          quantity: 1,
          customerEmail: "", // User can enter during Stripe flow
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to initiate checkout");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(
        error.message || "Payment initiation failed. Please try again.",
      );
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const context = `
        You are an AI assistant for a business named "${businessInfo?.name || "this business"}".
        Industry: ${businessInfo?.industry || "Unknown"}
        Nature: ${businessInfo?.business_nature || "Unknown"}
        Location: ${businessInfo?.location || "Unknown"}
        
        Website Content Summary:
        ${website?.pages.map((p) => `Page: ${p.title}\nSections: ${p.sections.map((s) => s.type).join(", ")}`).join("\n")}
        
        Answer visitor questions accurately and professionally. If you don't know something, ask them to leave a message via the contact form.
        Keep responses concise and helpful.
      `;

      const text = await generateChatResponse(
        chatMessages.map((m) => ({ role: m.role, content: m.content })),
        context,
        website?.businessId,
      );

      setChatMessages((prev) => [...prev, { role: "ai", content: text }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "I'm sorry, I'm having trouble connecting right now. Please try again later or use our contact form.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!website) return;
    setFormLoading(true);
    try {
      const refCode = localStorage.getItem(`ref_${website.businessId}`);
      let affiliateId = null;

      if (refCode) {
        const { data: aff } = await supabase
          .from("affiliates")
          .select("id")
          .eq("referral_code", refCode)
          .eq("business_id", website.businessId)
          .maybeSingle();
        if (aff) affiliateId = aff.id;
      }

      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert([
          {
            business_id: website.businessId,
            ...leadForm,
            status: "new",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (leadError) throw leadError;

      if (affiliateId && leadData) {
        await supabase.from("affiliate_referrals").insert({
          id: crypto.randomUUID(),
          affiliate_id: affiliateId,
          lead_id: leadData.id,
          status: "pending",
          commission_amount: 0,
          sale_amount: 0,
          created_at: new Date().toISOString(),
        });
      }

      setFormSuccess(true);
      setLeadForm({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Lead submission failed:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!website || website.id === "preview") {
      if (website?.id === "preview")
        toast.info("Booking is simulated in preview mode");
      return;
    }
    if (
      !bookingDate ||
      !bookingTime ||
      !bookingForm.name ||
      !bookingForm.email
    ) {
      toast.error("Please fill in all booking details");
      return;
    }
    setBookingLoading(true);
    try {
      const { error } = await supabase.from("appointments").insert([
        {
          id: generateId(),
          business_id: website.businessId,
          customer_name: bookingForm.name,
          customer_email: bookingForm.email,
          service: bookingForm.service || "General Inquiry",
          date: bookingDate.toISOString().split("T")[0],
          time: bookingTime,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      setBookingSuccess(true);
      toast.success("Appointment booked successfully!");
    } catch (error: any) {
      console.error("Booking failed:", error);
      toast.error("Failed to book appointment: " + error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    if (website?.theme?.customSelectors) {
      const activeSelectors = website.theme.customSelectors.filter(
        (cs) => cs.isEnabled && cs.content,
      );
      if (activeSelectors.length > 0) {
        // Use a small timeout to ensure DOM is ready after React render
        const timer = setTimeout(() => {
          activeSelectors.forEach((cs) => {
            try {
              const elements = document.querySelectorAll(cs.selector);
              elements.forEach((el) => {
                if (cs.content) {
                  // If it looks like HTML, use innerHTML, otherwise textContent
                  if (cs.content.trim().startsWith("<")) {
                    el.innerHTML = cs.content;
                  } else {
                    el.textContent = cs.content;
                  }
                }
              });
            } catch (e) {
              console.warn("Custom selector injection failed:", cs.selector, e);
            }
          });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [activePageSlug, website]);

  if (loading)
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium animate-pulse text-sm uppercase tracking-widest">
          Crafting Experience...
        </p>
      </div>
    );

  if (!website)
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white p-6 text-center">
        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Globe className="h-10 w-10 text-slate-300" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Website Not Found
        </h1>
        <p className="text-slate-500 max-w-md mb-8">
          The website you are looking for doesn't exist or hasn't been published
          yet.
        </p>
        <Button
          onClick={() => (window.location.href = "/")}
          variant="outline"
          className="rounded-xl"
        >
          Back to Bennie Tay Studio
        </Button>
      </div>
    );

  const theme: Website["theme"] = {
    primaryColor: website?.theme?.primaryColor || "#4f46e5",
    secondaryColor: website?.theme?.secondaryColor || "#10b981",
    fontFamily: website?.theme?.fontFamily || "Inter, sans-serif",
    style: (website?.theme?.style || "modern") as any, // Use any briefly or the full union
    logoUrl: website?.theme?.logoUrl,
    footer: {
      showMenu: website?.theme?.footer?.showMenu ?? true,
      showSocials: website?.theme?.footer?.showSocials ?? true,
      showContact: website?.theme?.footer?.showContact ?? true,
      customText: website?.theme?.footer?.customText || "",
      contactEmail: website?.theme?.footer?.contactEmail || "",
      contactPhone: website?.theme?.footer?.contactPhone || "",
      contactAddress: website?.theme?.footer?.contactAddress || "",
      socialLinks: website?.theme?.footer?.socialLinks || [],
    },
  };
  const pages = website?.pages || [];

  if (pages.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="h-20 w-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
          <Layers className="h-10 w-10 text-indigo-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          No Content Available
        </h2>
        <p className="text-slate-500 max-w-sm mb-8 italic">
          "The architecture is currently undergoing synthesis. Please check back
          shortly for the full deployment."
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="rounded-xl border-slate-200"
        >
          Sync Ecosystem
        </Button>
      </div>
    );
  }

  useEffect(() => {
    if (!theme?.style) return;
    const isDark =
      theme.style === "luxury_dark" ||
      theme.style === "immersive" ||
      theme.style === "glassmorphic";
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme?.style]);

  const activePage =
    pages?.find((p) => p.slug === activePageSlug) ||
    pages?.find(
      (p) =>
        (p.slug === "" || p.slug === "home") &&
        (activePageSlug === "" || activePageSlug === "home"),
    ) ||
    pages?.find((p) => p.slug === "home" && activePageSlug === "") ||
    pages?.find((p) => p.title.toLowerCase() === "home") ||
    pages?.[0];

  const homePage =
    pages?.find((p) => p.slug === "home" || p.slug === "") || pages?.[0];

  const mergeSeo = (base: any, override: any) => {
    const result = { ...base };
    if (override?.title) result.title = override.title;
    if (override?.description) result.description = override.description;
    if (override?.ogImage) result.ogImage = override.ogImage;
    if (override?.favicon) result.favicon = override.favicon;
    if (
      override?.keywords &&
      override.keywords.length > 0 &&
      override.keywords[0] !== ""
    ) {
      result.keywords = override.keywords;
    }
    return result;
  };

  const pageSeo = mergeSeo(website.seo, activePage?.seo);
  const currentPageSeo = mergeSeo(
    pageSeo,
    activePage?.sections?.find(
      (s) =>
        s.isVisible !== false &&
        s.seo &&
        (s.seo.title ||
          s.seo.description ||
          (s.seo.keywords && s.seo.keywords.length > 0)),
    )?.seo,
  );

  // Auto-generate defaults for missing SEO
  const displayTitle = selectedPost
    ? `${selectedPost.title} | ${website.seo.title}`
    : currentPageSeo.title ||
      (activePageSlug === "home"
        ? website.seo.title
        : `${activePage?.title} | ${website.seo.title}`);

  const displayDescription = selectedPost
    ? selectedPost.excerpt ||
      (selectedPost.content
        ? selectedPost.content.substring(0, 160).replace(/[#*`]/g, "").trim() +
          "..."
        : website.seo.description)
    : currentPageSeo.description || website.seo.description;
  const displayKeywords =
    currentPageSeo.keywords && currentPageSeo.keywords.length > 0
      ? currentPageSeo.keywords
      : website.seo.keywords;

  const currentUrl = window.location.href.split("?")[0];
  const canonicalUrl = website.seo.canonicalUrl || currentUrl;

  const generateJsonLd = () => {
    if (!website) return null;
    const { seo } = website;
    const schema: any = {
      "@context": "https://schema.org",
      "@type": seo.businessType || "LocalBusiness",
      name: seo.title,
      description: seo.description,
      url: window.location.href,
    };

    if (seo.address)
      schema.address = { "@type": "PostalAddress", streetAddress: seo.address };
    if (seo.phone) schema.telephone = seo.phone;
    if (seo.latitude && seo.longitude) {
      schema.geo = {
        "@type": "GeoCoordinates",
        latitude: seo.latitude,
        longitude: seo.longitude,
      };
    }
    if (seo.priceRange) schema.priceRange = seo.priceRange;
    if (seo.ratingValue) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: seo.ratingValue,
        reviewCount: seo.reviewCount || 1,
      };
    }

    // GEO Enhancements
    if (seo.coreValueProposition) schema.slogan = seo.coreValueProposition;
    if (seo.brandVoice)
      schema.keywords = `${seo.keywords?.join(", ")}, ${seo.brandVoice}`;
    if (seo.knowledgeBaseSummary) schema.abstract = seo.knowledgeBaseSummary;

    return JSON.stringify(schema);
  };

  const getSectionStyles = (section: WebsiteSection) => {
    const styles: React.CSSProperties = {};
    const settings = section.settings || {};

    if (settings.backgroundColor) {
      styles.backgroundColor = settings.backgroundColor;
    } else if (settings.bgColor) {
      // Support both naming variants
      styles.backgroundColor = settings.bgColor;
    }

    if (settings.textColor) {
      styles.color = settings.textColor;
    }

    if (settings.backgroundImage) {
      styles.backgroundImage = `url(${settings.backgroundImage})`;
      styles.backgroundSize = "cover";
      styles.backgroundPosition = "center";
    }

    // Apply custom padding if enabled
    if (settings.useCustomPadding) {
      styles.paddingTop = `${settings.paddingTop ?? 16}px`;
      styles.paddingBottom = `${settings.paddingBottom ?? 16}px`;
      styles.paddingLeft = `${settings.paddingLeft ?? 0}px`;
      styles.paddingRight = `${settings.paddingRight ?? 0}px`;
    }

    return styles;
  };

  const getPaddingClass = (section: WebsiteSection) => {
    const settings = section.settings || {};

    // If using custom padding, style overrides handled in getSectionStyles
    if (settings.useCustomPadding) return "";

    const vPadding = settings.verticalPadding || "small";
    const hPadding = settings.horizontalPadding || "none";

    let classes = "";

    switch (vPadding) {
      case "none":
        classes += "py-0 ";
        break;
      case "small":
        classes += "py-4 sm:py-8 ";
        break;
      case "medium":
        classes += "py-10 sm:py-16 ";
        break;
      case "large":
        classes += "py-16 sm:py-24 ";
        break;
      case "xlarge":
        classes += "py-24 sm:py-40 ";
        break;
      default:
        classes += "py-4 sm:py-8 ";
    }

    switch (hPadding) {
      case "none":
        classes += "px-4 sm:px-6 ";
        break;
      case "small":
        classes += "px-8 sm:px-12 ";
        break;
      case "medium":
        classes += "px-12 sm:px-24 ";
        break;
      case "large":
        classes += "px-16 sm:px-40 ";
        break;
    }

    return classes;
  };

  const getAlignmentClass = (section: WebsiteSection) => {
    const alignment = section.settings?.textAlign;
    if (!alignment) {
      if (
        section.type === "proof" ||
        section.type === "problem" ||
        section.type === "solution"
      )
        return "text-center";
      return "text-center md:text-left"; // Default for most sections
    }

    switch (alignment) {
      case "left":
        return "text-left";
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "";
    }
  };

  const getGoogleFontUrl = (fontFamily: string) => {
    const fontName = fontFamily
      .split(",")[0]
      .replace(/'/g, "")
      .replace(/"/g, "")
      .trim();
    // Pre-fetch all fonts from the FONTS constant to ensure they are visible
    const allFonts = [
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

    return `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@400;500;600;700;800&family=${allFonts}&display=swap`;
  };

  return (
    <HelmetProvider>
      <div
        style={{ fontFamily: theme.fontFamily || "Inter, sans-serif" }}
        className={cn(
          "min-h-screen flex flex-col transition-colors duration-500",
          theme.style === "glassmorphic" || theme.style === "immersive"
            ? "bg-slate-950 text-white"
            : "bg-white text-slate-900",
          theme.style === "prestige" ? "bg-[#fcfcfc] text-neutral-900" : "",
          theme.style === "luxury_dark" ? "bg-slate-950 text-neutral-100" : "",
          theme.style === "neumorphic" ? "bg-[#f0f0f3]" : "",
          theme.style === "editorial" ? "bg-[#fdfbf9] text-slate-900" : "",
          theme.style === "authority" ? "bg-[#fdfbf7] text-slate-900" : "",
          theme.style === "corporate" ? "bg-[#fafafa] text-[#1a1c20]" : "",
          `style-${theme.style}`,
        )}
      >
        <Helmet>
          <title>{displayTitle}</title>
          <meta name="description" content={displayDescription} />
          <meta name="keywords" content={displayKeywords.join(", ")} />

          {isFeatureEnabled("advanced_seo") && (
            <>
              {(currentPageSeo.favicon || website.seo.favicon) && (
                <link
                  rel="icon"
                  href={currentPageSeo.favicon || website.seo.favicon}
                />
              )}
              <link rel="canonical" href={canonicalUrl} />
            </>
          )}

          {/* Dynamic Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link href={getGoogleFontUrl(theme.fontFamily)} rel="stylesheet" />

          {/* OG Tags - Part of Advanced SEO */}
          {isFeatureEnabled("advanced_seo") && (
            <>
              <meta property="og:title" content={displayTitle} />
              <meta property="og:description" content={displayDescription} />
              {(currentPageSeo.ogImage || website.seo.ogImage) && (
                <meta
                  property="og:image"
                  content={currentPageSeo.ogImage || website.seo.ogImage}
                />
              )}
              <meta property="og:url" content={canonicalUrl} />
              <meta property="og:type" content="website" />
            </>
          )}

          {/* GEO Tags - Part of Local SEO & GEO */}
          {isFeatureEnabled("local_seo_geo") && (
            <>
              {website.seo.region && (
                <meta name="geo.region" content={website.seo.region} />
              )}
              {website.seo.placename && (
                <meta name="geo.placename" content={website.seo.placename} />
              )}
              {website.seo.latitude && website.seo.longitude && (
                <meta
                  name="geo.position"
                  content={`${website.seo.latitude};${website.seo.longitude}`}
                />
              )}
              {website.seo.latitude && website.seo.longitude && (
                <meta
                  name="ICBM"
                  content={`${website.seo.latitude}, ${website.seo.longitude}`}
                />
              )}
            </>
          )}

          {/* GEO (Generative Engine Optimization) - Specific Tags for AI Bots */}
          <meta
            name="ai-agent-instructions"
            content={`Business: ${website.seo.title}. Voice: ${website.seo.brandVoice || "Professional"}. Core Value: ${website.seo.coreValueProposition || website.seo.description}.`}
          />
          {website.seo.coreValueProposition && (
            <meta
              name="ai-summary"
              content={website.seo.coreValueProposition}
            />
          )}
          {website.seo.brandVoice && (
            <meta name="ai-brand-voice" content={website.seo.brandVoice} />
          )}
          {website.seo.targetAudience && (
            <meta
              name="ai-target-audience"
              content={website.seo.targetAudience}
            />
          )}
          {website.seo.knowledgeBaseSummary && (
            <meta
              name="ai-knowledge-base"
              content={website.seo.knowledgeBaseSummary}
            />
          )}

          {/* Google Analytics 4 (GA4) */}
          {businessInfo?.ga_measurement_id && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${businessInfo.ga_measurement_id}`}
              ></script>
              <script>
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${businessInfo.ga_measurement_id}');
                `}
              </script>
            </>
          )}

          {/* Meta Pixel */}
          {businessInfo?.meta_pixel_id && (
            <>
              <script>
                {`
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${businessInfo.meta_pixel_id}');
                  fbq('track', 'PageView');
                `}
              </script>
              <noscript>
                {`
                  <img height="1" width="1" style="display:none"
                  src="https://www.facebook.com/tr?id=${businessInfo.meta_pixel_id}&ev=PageView&noscript=1" />
                `}
              </noscript>
            </>
          )}

          {/* Custom Header Scripts - Injected via dangerous HTML at the top of Helmet to be in head if possible, but Helmet doesn't support raw HTML well. Better to handle outside or use this approach for simple meta/scripts */}
          {businessInfo?.tracking_scripts_header && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                (function() {
                  var div = document.createElement('div');
                  div.innerHTML = \`${businessInfo.tracking_scripts_header.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`;
                  while (div.firstChild) {
                    if (div.firstChild.tagName === 'SCRIPT') {
                      var script = document.createElement('script');
                      if (div.firstChild.src) script.src = div.firstChild.src;
                      script.textContent = div.firstChild.textContent;
                      document.head.appendChild(script);
                    } else {
                      document.head.appendChild(div.firstChild);
                    }
                  }
                })();
              `,
              }}
            />
          )}

          {/* JSON-LD - Enhanced logic for schema */}
          <script type="application/ld+json">
            {isFeatureEnabled("local_seo_geo")
              ? generateJsonLd()
              : JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  name: website.seo.title,
                  description: website.seo.description,
                  url: window.location.href,
                })}
          </script>
        </Helmet>
        {/* Dynamic Styles */}
        <style>{`
        :root {
          --primary: ${theme.primaryColor};
          --secondary: ${theme.secondaryColor};
          --font-serif: 'Playfair Display', serif;
          --font-display: 'Space Grotesk', sans-serif;
          --font-romantic: 'Fraunces', serif;
        }
        
        .btn-primary { 
          background-color: var(--primary); 
          color: white; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .text-gradient {
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        /* Archetype: Editorial Clean */
        .style-editorial { background-color: #fcfaf7; color: #1a1a1a; }
        .style-editorial h1, .style-editorial h2, .style-editorial h3 { font-family: var(--font-serif); letter-spacing: -0.01em; color: #0f172a; }
        .style-editorial .section-container { max-width: 1100px; margin: 0 auto; }
        .style-editorial .btn-primary { border-radius: 0; padding: 1.5rem 3rem; text-transform: uppercase; letter-spacing: 0.2em; background-color: #0f172a; color: white; border: none; font-weight: 700; }
        .style-editorial .btn-primary:hover { background-color: #334155; }

        /* Archetype: Action/Urgency */
        .style-action { background-color: #ffffff; }
        .style-action h1, .style-action h2, .style-action h3 { font-family: var(--font-display); font-weight: 900; text-transform: uppercase; line-height: 1; letter-spacing: -0.02em; }
        .style-action .btn-primary { border-radius: 12px; font-weight: 900; font-size: 1.25rem; padding: 1.5rem 2.5rem; border: none; box-shadow: 0 15px 30px -10px var(--primary); }
        .style-action .btn-primary:hover { transform: translateY(-4px) scale(1.02); }

        /* Archetype: Immersive */
        .style-immersive { background-color: #0c0a09; color: #fafaf9; }
        .style-immersive h1, .style-immersive h2 { font-family: var(--font-romantic); font-weight: 200; letter-spacing: -0.02em; }
        .style-immersive p { color: #d6d3d1; }
        .style-immersive .hero-overlay { background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)); }
        .style-immersive .btn-primary { background: transparent; border: 1px solid #fafaf9; border-radius: 100px; padding: 1rem 2.5rem; text-transform: uppercase; font-weight: 500; letter-spacing: 0.1em; color: #fafaf9; }
        .style-immersive .btn-primary:hover { background: #fafaf9; color: #0c0a09; }

        /* Archetype: Authority */
        .style-authority { background-color: #fcfaf8; color: #1c1917; }
        .style-authority h1, .style-authority h2 { font-family: var(--font-serif); font-weight: 800; color: #1c1917; }
        .style-authority p { color: #44403c; }
        .style-authority .btn-primary { border-radius: 12px; font-weight: 700; background-color: #1c1917; color: #fcfaf8; }

        /* Archetype: Modern Corporate */
        .style-corporate { background-color: #ffffff; color: #0f172a; }
        .style-corporate h1, .style-corporate h2, .style-corporate h3 { font-family: var(--font-sans); font-weight: 800; letter-spacing: -0.02em; }
        .style-corporate .btn-primary { border-radius: 8px; font-weight: 600; background-color: var(--primary); }

        /* Archetype: Modern (Default) */
        .style-modern h1, .style-modern h2 { font-family: var(--font-display); font-weight: 800; letter-spacing: -0.04em; }
        .style-modern .btn-primary { border-radius: 9999px; font-weight: 700; }

        /* Archetype: Neumorphic */
        .style-neumorphic { background-color: #f0f2f5; color: #334155; }
        .style-neumorphic .section-container { background: #f0f2f5; box-shadow: 20px 20px 60px #d1d9e6, -20px -20px 60px #ffffff; border-radius: 40px; padding: 4rem; margin-bottom: 4rem; }
        .style-neumorphic .btn-primary { background: #f0f2f5; box-shadow: 8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff; color: var(--primary); border: none; border-radius: 16px; font-weight: 700; }
        .style-neumorphic .btn-primary:hover { box-shadow: inset 8px 8px 16px #d1d9e6, inset -8px -8px 16px #ffffff; transform: scale(0.98); }

        /* Archetype: Brutalist */
        .style-brutalist { background-color: #fff; color: #000; }
        .style-brutalist h1, .style-brutalist h2 { text-transform: uppercase; font-weight: 900; font-size: 4.5rem; line-height: 0.85; letter-spacing: -0.04em; border-bottom: 12px solid #000; padding-bottom: 2rem; margin-bottom: 2.5rem; }
        .style-brutalist .btn-primary { border-radius: 0; border: 4px solid #000; background: #fff; color: #000; font-weight: 900; font-size: 1.25rem; box-shadow: 10px 10px 0px #000; padding: 1.25rem 2.5rem; }
        .style-brutalist .btn-primary:hover { box-shadow: 4px 4px 0px #000; transform: translate(6px, 6px); }

        /* Archetype: Glassmorphic */
        .style-glassmorphic { background: #0f172a; color: #f8fafc; }
        .style-glassmorphic .glass-nav { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        .style-glassmorphic .btn-primary { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); color: white; font-weight: 600; }
        .style-glassmorphic .btn-primary:hover { background: rgba(255, 255, 255, 0.2); }

        /* Archetype: Prestige / Luxury */
        .style-prestige { background-color: #fcfcfc; color: #1a1a1a; }
        .style-prestige h1, .style-prestige h2, .style-prestige h3 { font-family: var(--font-serif); font-weight: 400; letter-spacing: -0.01em; color: #000; }
        .style-prestige p { color: #404040; font-weight: 500; line-height: 1.8; }
        .style-prestige .section-container { max-width: 1200px; margin: 0 auto; }
        .style-prestige .btn-primary { border: 1px solid #1a1a1a; background: transparent; color: #1a1a1a; border-radius: 9999px; padding: 1.25rem 3.5rem; text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.7rem; font-weight: 700; transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1); }
        .style-prestige .btn-primary:hover { background: #1a1a1a; color: #fff; letter-spacing: 0.3em; transform: translateY(-2px); }
        .style-prestige .card-premium { border: 1px solid rgba(0,0,0,0.05); background: white; border-radius: 0; padding: 3rem; transition: all 0.4s ease; }
        .style-prestige .card-premium:hover { border-color: #000; }

        /* Archetype: Luxury Dark / Midnight */
        .style-luxury_dark { background-color: #020617; color: #f1f5f9; }
        .style-luxury_dark h1, .style-luxury_dark h2, .style-luxury_dark h3 { font-family: var(--font-display); font-weight: 800; color: #ffffff; text-shadow: 0 0 20px rgba(255,255,255,0.05); }
        .style-luxury_dark p { color: #94a3b8; font-weight: 500; }
        .style-luxury_dark .glass-panel { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.1); }
        .style-luxury_dark .btn-primary { background: #ffffff; color: #020617; border-radius: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 0 30px rgba(255,255,255,0.2); }
        .style-luxury_dark .btn-primary:hover { background: #f8fafc; transform: scale(1.05) translateY(-2px); box-shadow: 0 0 50px rgba(255,255,255,0.5); }
        .style-luxury_dark .text-gradient { background: linear-gradient(to bottom right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
        }

        .floating {
          animation: floating 3s ease-in-out infinite;
        }

        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }

        .gradient-blur {
          position: absolute;
          width: 50vw;
          height: 50vw;
          filter: blur(100px);
          opacity: 0.15;
          z-index: -1;
          border-radius: 50%;
        }
        {/* Custom Selectors CSS Injection */}
        ${website?.theme?.customSelectors
          ?.filter((cs: any) => cs.isEnabled && cs.css)
          .map(
            (cs: any) => `
          ${cs.selector} { ${cs.css} }
        `,
          )
          .join("\n")}
      `}</style>

        {/* Navigation */}
        <nav
          role="navigation"
          aria-label="Main Navigation"
          className={cn(
            "sticky top-0 z-50 transition-all duration-300",
            theme.style === "glassmorphic"
              ? "glass-nav"
              : theme.style === "luxury_dark" || theme.style === "immersive"
                ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50"
                : "bg-white/80 backdrop-blur-xl border-b border-slate-100",
          )}
        >
          <div className="max-w-7xl mx-auto px-6 h-20 sm:h-24 flex items-center justify-between">
            <button
              onClick={() => {
                setActivePageSlug("home");
                setSelectedPost(null);
                window.scrollTo(0, 0);
              }}
              className="group flex items-center gap-3 focus:outline-none"
            >
              <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                {theme.logoUrl ? (
                  <img
                    src={theme.logoUrl}
                    alt="Logo"
                    className="h-8 w-8 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Globe className="h-6 w-6" />
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-xl font-bold tracking-tight group-hover:text-primary transition-colors text-slate-900",
                    (theme.style === "luxury_dark" ||
                      theme.style === "immersive") &&
                      "text-white",
                  )}
                >
                  {website.seo.title.split("|")[0].trim()}
                </span>
                <span className="text-xs uppercase font-black tracking-[0.2em] text-slate-400">
                  Strategic Performance
                </span>
              </div>
            </button>

            <div className="hidden md:flex items-center gap-10">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => {
                    setActivePageSlug(page.slug);
                    setSelectedPost(null);
                    window.scrollTo(0, 0);
                  }}
                  className={cn(
                    "text-sm font-bold uppercase tracking-widest transition-all relative py-2 group",
                    activePageSlug === page.slug
                      ? "text-primary"
                      : theme.style === "luxury_dark" ||
                          theme.style === "immersive" ||
                          theme.style === "glassmorphic"
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-500 hover:text-slate-900",
                  )}
                >
                  {page.title}
                  <span
                    className={cn(
                      "absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-all duration-300",
                      activePageSlug === page.slug
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </button>
              ))}
              <Button className="btn-primary rounded-full px-8 h-12 font-bold uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/30">
                Get Started
              </Button>
            </div>

            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl h-12 w-12 hover:bg-slate-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">
                  {isMobileMenuOpen ? "Close Menu" : "Open Menu"}
                </span>
                <div className="space-y-1.5 w-6 flex flex-col items-end">
                  <motion.div
                    animate={
                      isMobileMenuOpen
                        ? { rotate: 45, y: 7, width: 24 }
                        : { rotate: 0, y: 0, width: 24 }
                    }
                    className={cn(
                      "h-0.5 rounded-full origin-center",
                      theme.style === "luxury_dark" ||
                        theme.style === "immersive" ||
                        theme.style === "glassmorphic"
                        ? "bg-white"
                        : "bg-slate-900",
                    )}
                  />
                  <motion.div
                    animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                    className={cn(
                      "h-0.5 w-4 rounded-full",
                      theme.style === "luxury_dark" ||
                        theme.style === "immersive" ||
                        theme.style === "glassmorphic"
                        ? "bg-white"
                        : "bg-slate-900",
                    )}
                  />
                  <motion.div
                    animate={
                      isMobileMenuOpen
                        ? { rotate: -45, y: -7, width: 24 }
                        : { rotate: 0, y: 0, width: 16 }
                    }
                    className={cn(
                      "h-0.5 rounded-full origin-center",
                      theme.style === "luxury_dark" ||
                        theme.style === "immersive" ||
                        theme.style === "glassmorphic"
                        ? "bg-white"
                        : "bg-slate-900",
                    )}
                  />
                </div>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "md:hidden border-t overflow-hidden shadow-2xl",
                  theme.style === "luxury_dark" ||
                    theme.style === "immersive" ||
                    theme.style === "glassmorphic"
                    ? "bg-slate-900 border-white/10"
                    : "bg-white border-slate-100",
                )}
              >
                <div className="p-6 space-y-4">
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setActivePageSlug(page.slug);
                        setSelectedPost(null);
                        setIsMobileMenuOpen(false);
                        window.scrollTo(0, 0);
                      }}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl text-lg font-black uppercase tracking-widest flex items-center justify-between group",
                        activePageSlug === page.slug
                          ? "bg-primary text-white"
                          : theme.style === "luxury_dark" ||
                              theme.style === "immersive" ||
                              theme.style === "glassmorphic"
                            ? "text-slate-400 hover:bg-white/5"
                            : "text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {page.title}
                      <ArrowRight
                        className={cn(
                          "h-5 w-5 transition-transform",
                          activePageSlug === page.slug
                            ? "translate-x-0"
                            : "-translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                        )}
                      />
                    </button>
                  ))}
                  <div className="pt-4">
                    <Button className="w-full h-16 btn-primary rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20">
                      Get Started Now
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          {activePage?.sections
            ?.filter((s: WebsiteSection) => s.isVisible !== false)
            .map((section: WebsiteSection, idx: number) => {
              const sectionId = section.type;
              switch (section.type) {
                case "problem":
                  return (
                    <section
                      id={sectionId}
                      key={section.id || `problem-${idx}`}
                      className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden"
                    >
                      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                            The Conflict
                          </span>
                          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight dark:text-white">
                            {section.content.title || "Challenges Faced"}
                          </h2>
                          <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
                            {section.content.description}
                          </p>
                          <div className="space-y-4">
                            {(section.content.painPoints || []).map(
                              (point: string, pIdx: number) => (
                                <div
                                  key={pIdx}
                                  className="flex gap-4 p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 shadow-sm transition-all hover:translate-x-2"
                                >
                                  <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                    <X className="h-4 w-4" />
                                  </div>
                                  <span className="text-slate-700 dark:text-slate-200 font-bold">
                                    {point}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
                          <div className="relative aspect-square bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl flex items-center justify-center p-12">
                            <div className="text-center space-y-4">
                              <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto opacity-20" />
                              <p className="text-primary text-xl font-black uppercase tracking-[0.2em]">
                                Diagnostic Phase Active
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                case "solution":
                  return (
                    <section
                      id={sectionId}
                      key={section.id || `solution-${idx}`}
                      className="py-24 sm:py-32 bg-white dark:bg-slate-950 relative"
                    >
                      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center space-y-16">
                        <div className="space-y-6 max-w-3xl">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                            The Resolution
                          </span>
                          <h2 className="text-4xl sm:text-7xl font-bold tracking-tight leading-[0.9] dark:text-white">
                            {section.content.title || "Engineering Success"}
                          </h2>
                          <p className="text-xl text-slate-500 leading-relaxed">
                            {section.content.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full">
                          {(section.content.features || []).map(
                            (feature: string, fIdx: number) => (
                              <div key={fIdx} className="space-y-8 group">
                                <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                  <CheckCircle2 className="h-12 w-12" />
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                  {feature}
                                </h3>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </section>
                  );
                case "proof":
                  return (
                    <section
                      id={sectionId}
                      key={section.id || `proof-${idx}`}
                      className="py-24 sm:py-40 bg-slate-950 text-white relative overflow-hidden"
                    >
                      <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.12),transparent)]" />
                        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_100%,rgba(99,102,241,0.08),transparent)]" />
                      </div>
                      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                        {section.content.title && (
                          <div className="mb-20 space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                              Quantifiable Excellence
                            </span>
                            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight">
                              {section.content.title}
                            </h2>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                          {(section.content.stats || []).map(
                            (stat: any, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="relative group p-8 sm:p-10 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 overflow-hidden"
                              >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                                <div className="space-y-4">
                                  <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter tabular-nums break-words">
                                    {formatStatValue(stat.value)}
                                  </div>
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="h-0.5 w-8 bg-primary rounded-full group-hover:w-16 transition-all duration-500" />
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                                      {stat.label}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </section>
                  );
                case "hero":
                  // Premium Default Hero
                  return (
                    <section
                      id={sectionId}
                      key={section.id || `hero-${idx}`}
                      className="relative pt-20 pb-32 sm:pt-32 sm:pb-48 overflow-hidden min-h-[90vh] flex items-center"
                    >
                      {/* Decorative Background Elements */}
                      <div className="gradient-blur bg-primary -top-[10%] -left-[10%]" />
                      <div className="gradient-blur bg-secondary -bottom-[10%] -right-[10%] opacity-10" />

                      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-16 items-center relative z-10">
                        <div className="lg:col-span-12 xl:col-span-7 space-y-10">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                          >
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                              Trusted by Global Leaders
                            </span>
                          </motion.div>

                          <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-6xl sm:text-7xl lg:text-9xl font-bold tracking-tight leading-[0.9]"
                          >
                            {(
                              section.content.headline ||
                              website.seo.title.split("|")[0]
                            )
                              .split(" ")
                              .map((word: string, i: number, arr: string[]) => (
                                <span
                                  key={i}
                                  className={
                                    i === arr.length - 1 ? "text-gradient" : ""
                                  }
                                >
                                  {word}{" "}
                                </span>
                              ))}
                          </motion.h1>

                          <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-xl sm:text-2xl text-slate-500 max-w-2xl leading-relaxed font-medium"
                          >
                            {section.content.subheadline}
                          </motion.p>

                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="flex flex-col sm:flex-row gap-6 pt-6"
                          >
                            <Button
                              size="lg"
                              className="btn-primary rounded-2xl h-18 px-12 text-lg font-bold shadow-2xl shadow-primary/30 group"
                            >
                              {section.content.ctaText}
                              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-2 transition-transform" />
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              className="rounded-2xl h-18 px-10 text-lg font-bold border-slate-200 hover:bg-slate-50"
                            >
                              Learn More
                            </Button>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center gap-8 pt-12 border-t border-slate-100"
                          >
                            <div className="flex -space-x-4">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-lg"
                                >
                                  <img
                                    src={`https://i.pravatar.cc/100?u=${i}`}
                                    alt="user"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <Star
                                    key={i}
                                    className="h-3 w-3 fill-amber-400 text-amber-400"
                                  />
                                ))}
                                <span className="text-sm font-black ml-2">
                                  4.9/5
                                </span>
                              </div>
                              <span className="text-[10px] uppercase font-bold tracking-[0.1em] text-slate-400">
                                Based on 2,500+ Reviews
                              </span>
                            </div>
                          </motion.div>
                        </div>

                        <div className="lg:col-span-12 xl:col-span-5 relative">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 1.2, ease: "circOut" }}
                            className="relative z-10 aspect-[4/5] rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-8 border-white group"
                          >
                            <img
                              src={
                                section.content.imageUrl ||
                                `https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200`
                              }
                              alt="Hero Image"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                          </motion.div>

                          {/* Floating Cards */}
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                            className="absolute -right-8 top-1/2 -translate-y-1/2 z-20 glass-panel p-6 rounded-3xl floating hidden xl:block"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                                  98%
                                </p>
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                  Success Rate
                                </p>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="absolute -bottom-10 -left-10 z-20 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-3xl border border-slate-50 dark:border-white/5 hidden xl:block max-w-[280px]"
                          >
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                              "Working with this team has been a complete game
                              changer for our operations."
                            </p>
                            <div className="flex items-center gap-3 mt-4">
                              <div className="h-8 w-8 rounded-full bg-slate-900" />
                              <span className="text-xs font-bold">
                                Sarah J. - CEO at Flow
                              </span>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </section>
                  );
                case "services":
                  return (
                    <section
                      id={sectionId}
                      key={section.id || `services-${idx}`}
                      className="py-24 sm:py-32 relative overflow-hidden section-container dark:bg-slate-950"
                    >
                      <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                          <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                              Execution Strategy
                            </span>
                            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight dark:text-white">
                              {section.content.title || "Our Services"}
                            </h2>
                          </div>
                          <p className="text-lg text-slate-500 max-w-md">
                            {section.content.description ||
                              "We deliver specialized solutions tailored to your unique market challenges."}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(section.content.items || []).map(
                            (item: any, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="group p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-white/5 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)]"
                              >
                                <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-primary shadow-sm mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                  <Zap className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 dark:text-white">
                                  {item.title}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                                  {item.description}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                  <span className="text-sm font-black text-primary uppercase tracking-widest">
                                    {item.price || "Consulting"}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full group-hover:bg-primary group-hover:text-white transition-colors"
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </section>
                  );
                case "features":
                  return (
                    <section
                      key={section.id || `features-${idx}`}
                      className="py-24 sm:py-32 bg-slate-950 text-white overflow-hidden relative"
                    >
                      <div className="gradient-blur bg-primary -top-[20%] -right-[20%] opacity-20" />

                      <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
                          <span className="text-xs font-black uppercase tracking-[0.4em] text-primary">
                            Core Advantages
                          </span>
                          <h2 className="text-4xl sm:text-7xl font-bold tracking-tight leading-tight">
                            {section.content.title || "The Advantage"}
                          </h2>
                          <p className="text-xl text-slate-400">
                            {section.content.description ||
                              "Our platform is engineered for scale, security, and absolute performance."}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[250px]">
                          {(section.content.items || [])
                            .slice(0, 4)
                            .map((feature: any, fIdx: number) => (
                              <div
                                key={fIdx}
                                className={cn(
                                  "glass-panel rounded-[2.5rem] p-10 flex flex-col justify-end group cursor-default transition-all duration-700",
                                  fIdx === 0
                                    ? "md:col-span-8"
                                    : "md:col-span-4",
                                  fIdx === 1 ? "md:col-span-4" : "",
                                  fIdx === 2 ? "md:col-span-4" : "",
                                  fIdx === 3 ? "md:col-span-8" : "",
                                  "bg-white/5 border-white/10 hover:bg-white/10",
                                )}
                              >
                                <div className="space-y-4">
                                  <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Sparkles className="h-6 w-6" />
                                  </div>
                                  <h3 className="text-2xl font-bold text-white">
                                    {typeof feature === "string"
                                      ? feature
                                      : feature.title}
                                  </h3>
                                  <p className="text-slate-400 text-sm leading-relaxed max-w-md opacity-0 group-hover:opacity-100 transition-opacity">
                                    {typeof feature === "object"
                                      ? feature.description
                                      : "High-intensity performance engineering combined with intuitive design paradigms."}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </section>
                  );
                case "contact":
                  return (
                    <section
                      id={sectionId}
                      key={section.id || `contact-${idx}`}
                      className="py-24 sm:py-32 relative overflow-hidden section-container"
                    >
                      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-12">
                          <div className="space-y-6">
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">
                              Get In Touch
                            </span>
                            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight dark:text-white">
                              {section.content.title || "Let's Connect"}
                            </h2>
                            <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
                              {section.content.description ||
                                "Have a question or ready to get started? We're here to help you navigate your next steps."}
                            </p>
                          </div>

                          <div className="space-y-6">
                            <div className="flex gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-sm transition-all hover:translate-x-2">
                              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                <Mail className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-1">
                                  Email Us
                                </p>
                                <p className="text-slate-900 dark:text-white font-bold text-lg">
                                  {theme.footer.contactEmail ||
                                    "contact@business.com"}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-sm transition-all hover:translate-x-2">
                              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                <Phone className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-1">
                                  Call Us
                                </p>
                                <p className="text-slate-900 dark:text-white font-bold text-lg">
                                  {theme.footer.contactPhone ||
                                    "+1 (555) 000-0000"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-950 p-8 sm:p-12 rounded-[3rem] shadow-2xl shadow-indigo-900/5 border border-slate-100 dark:border-white/5 relative">
                          <div className="absolute -top-6 -right-6 h-20 w-20 bg-primary/10 rounded-full blur-2xl" />
                          {formSuccess ? (
                            <div className="space-y-6 text-center py-10">
                              <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="h-10 w-10" />
                              </div>
                              <h3 className="text-2xl font-black uppercase tracking-tighter">
                                Synthesis Successful
                              </h3>
                              <p className="text-slate-500 font-medium">
                                Your request has been integrated into our queue.
                                A strategist will contact you shortly.
                              </p>
                              <Button
                                variant="outline"
                                className="rounded-2xl h-14"
                                onClick={() => setFormSuccess(false)}
                              >
                                Send Another Message
                              </Button>
                            </div>
                          ) : (
                            <form
                              onSubmit={handleLeadSubmit}
                              className="space-y-6"
                            >
                              <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 dark:text-slate-500">
                                    Full Name
                                  </label>
                                  <Input
                                    required
                                    value={leadForm.name}
                                    onChange={(e) =>
                                      setLeadForm({
                                        ...leadForm,
                                        name: e.target.value,
                                      })
                                    }
                                    placeholder="John Doe"
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-primary/20 transition-all font-bold"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 dark:text-slate-500">
                                    Email Address
                                  </label>
                                  <Input
                                    required
                                    type="email"
                                    value={leadForm.email}
                                    onChange={(e) =>
                                      setLeadForm({
                                        ...leadForm,
                                        email: e.target.value,
                                      })
                                    }
                                    placeholder="john@example.com"
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-primary/20 transition-all font-bold"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 dark:text-slate-500">
                                  Project Brief
                                </label>
                                <textarea
                                  required
                                  value={leadForm.message}
                                  onChange={(e) =>
                                    setLeadForm({
                                      ...leadForm,
                                      message: e.target.value,
                                    })
                                  }
                                  className="flex min-h-[150px] w-full rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white px-4 py-4 text-base font-medium focus-visible:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                  placeholder="Define your requirements..."
                                ></textarea>
                              </div>
                              <Button
                                type="submit"
                                isLoading={formLoading}
                                className="w-full h-16 btn-primary rounded-2xl text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30"
                              >
                                Initialize Connection
                              </Button>
                            </form>
                          )}
                        </div>
                      </div>
                    </section>
                  );
                case "pricing":
                  return (
                    <section
                      id={sectionId}
                      key={section.id || `pricing-${idx}`}
                      className="py-24 sm:py-48 bg-[#fdfcfb] dark:bg-slate-950 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                      <div className="max-w-7xl mx-auto px-6 relative">
                        <div className="text-center max-w-2xl mx-auto mb-24 space-y-6">
                          <span className="text-xs font-black uppercase tracking-[0.4em] text-primary">
                            Strategic Investment
                          </span>
                          <h2 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[0.9] dark:text-white">
                            {section.content.title || "Choose Your Path"}
                          </h2>
                          <p className="text-xl text-slate-500 leading-relaxed">
                            {section.content.description ||
                              "Transparent tiers designed for elite scalability and long-term institutional success."}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
                          {(section.content.plans || []).map(
                            (plan: any, pIdx: number) => (
                              <div
                                key={pIdx}
                                className={cn(
                                  "relative flex flex-col p-12 rounded-[3.5rem] transition-all duration-700 group",
                                  plan.isPopular
                                    ? "bg-slate-950 text-white shadow-[0_50px_100px_-20px_rgba(15,23,42,0.4)] scale-105 z-10"
                                    : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 hover:shadow-2xl hover:border-primary/20",
                                )}
                              >
                                {plan.isPopular && (
                                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl">
                                    Market Priority
                                  </div>
                                )}
                                <div className="mb-10">
                                  <h3
                                    className={cn(
                                      "text-sm font-black uppercase tracking-[0.2em] mb-4",
                                      plan.isPopular
                                        ? "text-primary"
                                        : "text-slate-400",
                                    )}
                                  >
                                    {plan.name}
                                  </h3>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-6xl font-black tracking-tighter">
                                      ${formatStatValue(plan.price)}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-xs font-bold uppercase tracking-widest opacity-40",
                                      )}
                                    >
                                      / cycle
                                    </span>
                                  </div>
                                </div>

                                <ul className="space-y-6 mb-12 flex-1 pt-10 border-t border-slate-100/10">
                                  {(
                                    plan.features || [
                                      "Premium Support",
                                      "High Bandwidth",
                                      "Expert Consultation",
                                    ]
                                  ).map((f: string, fi: number) => (
                                    <li
                                      key={fi}
                                      className="flex gap-4 text-sm font-bold items-start leading-tight"
                                    >
                                      <CheckCircle2
                                        className={cn(
                                          "h-5 w-5 shrink-0",
                                          plan.isPopular
                                            ? "text-primary"
                                            : "text-primary",
                                        )}
                                      />
                                      <span
                                        className={cn(
                                          plan.isPopular
                                            ? "text-slate-300"
                                            : "text-slate-600 dark:text-slate-400",
                                        )}
                                      >
                                        {f}
                                      </span>
                                    </li>
                                  ))}
                                </ul>

                                <Button
                                  className={cn(
                                    "w-full h-16 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all duration-500",
                                    plan.isPopular
                                      ? "bg-primary hover:bg-white hover:text-slate-950 text-white shadow-xl shadow-primary/20"
                                      : "bg-slate-950 hover:bg-primary text-white",
                                  )}
                                >
                                  Initiate Partner
                                </Button>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </section>
                  );
                case "testimonials":
                  return (
                    <section
                      id={sectionId}
                      key={section.id || `testimonials-${idx}`}
                      className="py-24 sm:py-48 relative section-container"
                    >
                      <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-12">
                          <div className="space-y-6">
                            <span className="text-xs font-black uppercase tracking-[0.4em] text-primary">
                              Voices of Success
                            </span>
                            <h2 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[0.9] dark:text-white">
                              Global Impact.
                            </h2>
                          </div>
                          <div className="max-w-md">
                            <p className="text-xl text-slate-500 leading-relaxed italic font-serif">
                              "The difference between mediocrity and excellence
                              is found in the details of the partnership."
                            </p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {(section.content.items || []).map(
                            (item: any, tIdx: number) => (
                              <div
                                key={item.id || `testi-${tIdx}`}
                                className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 group"
                              >
                                <Quote className="h-10 w-10 text-primary/20 mb-8 group-hover:text-primary transition-colors" />
                                <p className="text-xl text-slate-900 dark:text-slate-200 font-medium leading-relaxed mb-10">
                                  {item.text}
                                </p>
                                <div className="flex items-center gap-5 pt-8 border-t border-slate-50 dark:border-white/5">
                                  <div className="h-14 w-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center font-black text-primary text-xl">
                                    {item.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">
                                      {item.name}
                                    </p>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                      {item.role}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </section>
                  );
                case "cta":
                  return (
                    <section
                      id={sectionId}
                      key={section.id || `cta-${idx}`}
                      className="py-24 sm:py-48 relative overflow-hidden bg-slate-950"
                    >
                      <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent)]" />
                      </div>

                      <div className="max-w-5xl mx-auto px-6 relative z-10 text-center space-y-12">
                        <span className="text-xs font-black uppercase tracking-[0.5em] text-primary">
                          Strategic Initiative
                        </span>
                        <h2 className="text-6xl sm:text-9xl font-bold tracking-tight text-white leading-[0.85]">
                          Ready to <br />
                          <span className="text-gradient">Lead?</span>
                        </h2>
                        <p className="text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                          {section.content.description ||
                            "Secure your position at the forefront of industrial innovation with our elite solutions."}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                          <Button
                            size="lg"
                            className="h-20 px-12 text-lg font-black uppercase tracking-widest bg-white text-slate-950 hover:bg-primary hover:text-white rounded-none transition-all duration-500 shadow-2xl"
                          >
                            {section.content.buttonText || "Begin Consultation"}
                          </Button>
                        </div>
                      </div>
                    </section>
                  );
                case "faq":
                  return (
                    <section
                      id={sectionId}
                      key={section.id || `faq-${idx}`}
                      className="py-24 sm:py-48 relative overflow-hidden section-container"
                    >
                      <div className="max-w-4xl mx-auto px-6">
                        <div className="text-center mb-24 space-y-6">
                          <span className="text-xs font-black uppercase tracking-[0.4em] text-primary">
                            The Knowledge Base
                          </span>
                          <h2 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[0.9] dark:text-white">
                            Operational Clarity.
                          </h2>
                        </div>

                        <div className="space-y-6">
                          {(section.content.items || []).map(
                            (item: any, fIdx: number) => (
                              <div
                                key={item.id || `renderer-faq-${fIdx}`}
                                className="group bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-primary/20"
                              >
                                <details className="w-full">
                                  <summary className="flex items-center justify-between p-10 cursor-pointer list-none outline-none">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white pr-12 leading-tight">
                                      {item.question}
                                    </h3>
                                    <div className="h-14 w-14 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 text-slate-400 group-hover:border-primary group-hover:text-primary rounded-2xl flex items-center justify-center transition-all shrink-0">
                                      <ChevronRight className="h-6 w-6 transition-transform duration-500 group-open:rotate-90" />
                                    </div>
                                  </summary>
                                  <div className="px-10 pb-10 text-slate-600 dark:text-slate-400 leading-relaxed text-xl max-w-3xl">
                                    {item.answer}
                                  </div>
                                </details>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </section>
                  );
                case "team":
                  return (
                    <section
                      key={section.id || `team-${idx}`}
                      className="py-24 sm:py-48 section-container"
                    >
                      <div className="max-w-7xl mx-auto px-6 text-center">
                        <div className="max-w-3xl mx-auto mb-24 space-y-6">
                          <span className="text-xs font-black uppercase tracking-[0.4em] text-primary">
                            The Architects
                          </span>
                          <h2 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[0.9] dark:text-white">
                            Elite Leadership.
                          </h2>
                          <p className="text-xl text-slate-500 leading-relaxed">
                            {section.content.description ||
                              "Our team is comprised of world-class experts dedicated to redefining industry standards."}
                          </p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                          {(section.content.members || []).map(
                            (member: any, idx: number) => (
                              <div
                                key={idx}
                                className="group bg-white dark:bg-slate-900/50 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all duration-700"
                              >
                                <div className="aspect-[4/5] rounded-[2rem] overflow-hidden mb-8 relative">
                                  <img
                                    src={
                                      member.imageUrl ||
                                      `https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600`
                                    }
                                    alt={member.name}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="space-y-2">
                                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                    {member.name}
                                  </h3>
                                  <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">
                                    {member.role}
                                  </p>
                                  <p className="text-sm text-slate-500 pt-4 leading-relaxed line-clamp-3">
                                    {member.bio}
                                  </p>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </section>
                  );
                case "appointment":
                  return (
                    <section
                      id={sectionId}
                      key={section.id || `appointment-${idx}`}
                      className="py-24 sm:py-48 relative overflow-hidden section-container"
                    >
                      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-12">
                          <div className="space-y-6">
                            <span className="text-xs font-black uppercase tracking-[0.4em] text-primary">
                              Strategic Session
                            </span>
                            <h2 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[0.9] dark:text-white">
                              {section.content.title || "Reserve Your Time."}
                            </h2>
                            <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
                              {section.content.description ||
                                "Schedule a dedicated consultation with our lead strategists to chart your path forward."}
                            </p>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary mb-4">
                                <Calendar className="h-5 w-5" />
                              </div>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                Available Hours
                              </p>
                              <p className="text-slate-900 dark:text-white font-bold">
                                {section.content.workingHours ||
                                  "09:00 AM - 06:00 PM"}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary mb-4">
                                <MapPin className="h-5 w-5" />
                              </div>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                Location
                              </p>
                              <p className="text-slate-900 dark:text-white font-bold">
                                {section.content.location ||
                                  "Virtual / On-site"}
                              </p>
                            </div>
                          </div>

                          {bookingSuccess ? (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-12 bg-slate-950 rounded-[3rem] text-white shadow-3xl relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 h-32 w-32 bg-primary/20 blur-3xl" />
                              <CheckCircle2 className="h-16 w-16 text-primary mb-8" />
                              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">
                                Confirmed.
                              </h3>
                              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                Your strategic session has been reserved. A
                                brief containing the next steps will be
                                delivered to your inbox.
                              </p>
                              <Button
                                variant="outline"
                                className="h-14 px-8 border-white/20 text-white hover:bg-white hover:text-slate-950 rounded-2xl transition-all font-bold"
                                onClick={() => setBookingSuccess(false)}
                              >
                                Book Another
                              </Button>
                            </motion.div>
                          ) : (
                            <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-white/5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                                    Full Name
                                  </label>
                                  <Input
                                    placeholder="Enter your name"
                                    className="h-14 rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-primary/20"
                                    value={bookingForm.name}
                                    onChange={(e) =>
                                      setBookingForm({
                                        ...bookingForm,
                                        name: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                                    Email Domain
                                  </label>
                                  <Input
                                    placeholder="Enter your email"
                                    type="email"
                                    className="h-14 rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-primary/20"
                                    value={bookingForm.email}
                                    onChange={(e) =>
                                      setBookingForm({
                                        ...bookingForm,
                                        email: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                                  Consultation Depth
                                </label>
                                <Select
                                  value={bookingForm.service}
                                  onValueChange={(val) =>
                                    setBookingForm({
                                      ...bookingForm,
                                      service: val,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-14 rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                    <SelectValue placeholder="Select Service Tier" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(
                                      section.content.services || [
                                        "Foundational Audit",
                                        "Operational Scale",
                                        "Enterprise Transformation",
                                      ]
                                    ).map((s: string) => (
                                      <SelectItem key={s} value={s}>
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                size="lg"
                                className="btn-primary h-16 w-full rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30"
                                onClick={handleBookingSubmit}
                                isLoading={bookingLoading}
                                disabled={
                                  !bookingTime ||
                                  !bookingForm.name ||
                                  !bookingForm.email
                                }
                              >
                                Reserve Strategic Window
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <div className="absolute -inset-4 bg-primary/5 rounded-[4rem] blur-2xl" />
                          <div className="p-10 sm:p-12 rounded-[3.5rem] border border-slate-100 bg-white shadow-3xl relative z-10">
                            <div className="mb-10 flex items-center justify-between">
                              <h3 className="font-black text-2xl tracking-tighter uppercase">
                                {section.content.calendarTitle || "Select Date"}
                              </h3>
                              <div className="flex gap-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-primary hover:text-white transition-all"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-primary hover:text-white transition-all"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-7 gap-4 mb-8">
                              {[
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat",
                              ].map((day, idx) => (
                                <div
                                  key={idx}
                                  className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest"
                                >
                                  {day}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-4">
                              {Array.from({ length: 35 }).map((_, i) => {
                                const day = i - 3; // Mock offset
                                const isToday = day === 15;
                                const isBefore = day < 1;
                                const isAfter = day > 31;
                                const isSelected =
                                  bookingDate?.getDate() === day;

                                return (
                                  <button
                                    key={i}
                                    disabled={isBefore || isAfter}
                                    onClick={() => {
                                      const d = new Date();
                                      d.setDate(day);
                                      setBookingDate(d);
                                    }}
                                    className={cn(
                                      "aspect-square rounded-2xl flex items-center justify-center text-sm font-black transition-all",
                                      isSelected
                                        ? "bg-slate-950 text-white shadow-2xl"
                                        : isToday
                                          ? "text-primary bg-primary/10"
                                          : isBefore || isAfter
                                            ? "text-slate-100 cursor-not-allowed"
                                            : "hover:bg-slate-50 text-slate-800",
                                    )}
                                  >
                                    {day > 0 && day <= 31 ? day : ""}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="mt-12 pt-10 border-t border-slate-50">
                              <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] mb-6 text-center">
                                Available Intervals
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                  "09:00",
                                  "10:30",
                                  "12:00",
                                  "13:30",
                                  "15:00",
                                  "16:30",
                                  "18:00",
                                  "19:30",
                                ].map((time) => (
                                  <button
                                    key={time}
                                    onClick={() => setBookingTime(time)}
                                    className={cn(
                                      "py-3 rounded-xl border-2 text-[10px] font-black tracking-widest transition-all uppercase",
                                      bookingTime === time
                                        ? "border-slate-950 bg-slate-950 text-white shadow-xl"
                                        : "border-slate-50 hover:border-primary hover:text-primary",
                                    )}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                case "blog_list":
                  return (
                    <section
                      key={section.id || `blog-${idx}`}
                      style={getSectionStyles(section)}
                      className={cn("px-4 sm:px-6", getPaddingClass(section))}
                    >
                      <div className="max-w-7xl mx-auto space-y-12">
                        <div
                          className={cn(
                            "space-y-4",
                            getAlignmentClass(section),
                          )}
                        >
                          <h2 className="text-3xl sm:text-4xl font-bold">
                            {section.content.title}
                          </h2>
                          <p className="text-xl text-slate-600">
                            {section.content.description}
                          </p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                          {(posts || [])
                            .slice(0, section.content.postsPerPage || 6)
                            .map((post) => (
                              <div
                                key={post.id}
                                className="group cursor-pointer"
                                onClick={() => {
                                  setSelectedPost(post);
                                  window.scrollTo(0, 0);
                                }}
                              >
                                <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden mb-6">
                                  {post.imageUrl ? (
                                    <img
                                      src={post.imageUrl}
                                      alt={post.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                      <Globe className="h-12 w-12" />
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                                    <Calendar className="h-3 w-3" />{" "}
                                    {formatDate(post.createdAt)}
                                  </div>
                                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                                    {post.title}
                                  </h3>
                                  {section.content.showExcerpts && (
                                    <p className="text-slate-600 line-clamp-2 text-sm leading-relaxed">
                                      {post.excerpt}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </section>
                  );
                case "blog_post":
                  if (!selectedPost) return null;
                  return (
                    <section
                      key={section.id || `post-${idx}`}
                      style={getSectionStyles(section)}
                      className={cn("px-4 sm:px-6", getPaddingClass(section))}
                    >
                      <div className="max-w-3xl mx-auto space-y-8">
                        <div className="space-y-4">
                          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
                            {selectedPost.title}
                          </h1>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            {section.content.showAuthor && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />{" "}
                                {selectedPost.author}
                              </div>
                            )}
                            {section.content.showDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />{" "}
                                {formatDate(selectedPost.createdAt)}
                              </div>
                            )}
                          </div>
                        </div>
                        {section.content.showImage && selectedPost.imageUrl && (
                          <img
                            src={selectedPost.imageUrl}
                            alt={selectedPost.title}
                            className="w-full aspect-video object-cover rounded-2xl shadow-lg"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="prose prose-slate max-w-none">
                          <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
                        </div>
                      </div>
                    </section>
                  );
                case "text_content":
                  return (
                    <section
                      key={section.id || `text-${idx}`}
                      style={getSectionStyles(section)}
                      className={cn("px-4 sm:px-6", getPaddingClass(section))}
                    >
                      <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-8">
                          {section.content.title}
                        </h2>
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                          <ReactMarkdown>{section.content.body}</ReactMarkdown>
                        </div>
                      </div>
                    </section>
                  );
                case "product_list":
                  return (
                    <section
                      key={section.id || `products-${idx}`}
                      style={getSectionStyles(section)}
                      className={cn("px-4 sm:px-6", getPaddingClass(section))}
                    >
                      <div className="max-w-7xl mx-auto space-y-12">
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                          <Badge
                            variant="outline"
                            className="bg-primary/5 text-primary border-primary/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]"
                          >
                            Curated Selection
                          </Badge>
                          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
                            {section.content.title || "Our Boutique"}
                          </h2>
                          <p className="text-xl text-slate-500 font-medium">
                            {section.content.description ||
                              "Discover our exclusive range of premium products and services."}
                          </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
                          {(products.length > 0
                            ? products
                            : section.content.items || []
                          ).map((product: any, pIdx: number) => (
                            <motion.div
                              key={product.id || pIdx}
                              whileHover={{ y: -8 }}
                              className="group bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-8 space-y-6 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col h-full"
                            >
                              <div className="aspect-square bg-slate-50 rounded-[1.5rem] overflow-hidden relative group-hover:shadow-inner transition-all shrink-0">
                                {product.image_url || product.imageUrl ? (
                                  <img
                                    src={product.image_url || product.imageUrl}
                                    alt={product.name || product.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                                    <ShoppingBag className="h-20 w-20" />
                                  </div>
                                )}
                                <div className="absolute top-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                  <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none px-4 py-2 rounded-xl font-black text-[10px] tracking-widest shadow-xl">
                                    NEW ARRIVAL
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-4 flex-1">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 mr-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">
                                      {product.category || "Premium"}
                                    </p>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                      {product.name || product.title}
                                    </h3>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-2xl font-black tracking-tighter text-slate-950 dark:text-white">
                                      {typeof product.price === "number"
                                        ? `$${product.price}`
                                        : product.price}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                                  {product.description}
                                </p>
                              </div>

                              <div className="pt-6 border-t border-slate-50 flex items-center justify-between gap-4">
                                <Button
                                  variant="ghost"
                                  className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-xs hover:bg-slate-50"
                                  onClick={() => setSelectedProduct(product)}
                                >
                                  View Details
                                </Button>
                                <Button
                                  className="flex-1 h-14 bg-slate-950 hover:bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all gap-2 group/btn"
                                  onClick={() => handleCheckout(product)}
                                  disabled={checkoutLoading === product.id}
                                >
                                  {checkoutLoading === product.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      Buy Now
                                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                  )}
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {products.length === 0 &&
                          (!section.content.items ||
                            section.content.items.length === 0) && (
                            <div className="text-center py-24 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                              <div className="h-20 w-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6">
                                <ShoppingBag className="h-10 w-10 text-slate-300" />
                              </div>
                              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                                Collection is being curated
                              </p>
                            </div>
                          )}
                      </div>
                    </section>
                  );
                default:
                  return null;
              }
            })}

          {activePageSlug === "blog" && (
            <div className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
              {selectedPost ? (
                <div className="max-w-3xl mx-auto space-y-8">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedPost(null)}
                    className="gap-2 text-slate-500 hover:text-primary"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Blog
                  </Button>

                  <div className="space-y-4">
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
                      {selectedPost.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" /> {selectedPost.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />{" "}
                        {formatDate(selectedPost.createdAt)}
                      </div>
                    </div>
                  </div>

                  {selectedPost.imageUrl && (
                    <img
                      src={selectedPost.imageUrl}
                      alt={selectedPost.title}
                      className="w-full aspect-video object-cover rounded-2xl shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="text-center space-y-4">
                    <h1 className="text-4xl sm:text-5xl font-bold">Our Blog</h1>
                    <p className="text-xl text-slate-600">
                      Latest news, insights, and stories from our team.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="group cursor-pointer"
                        onClick={() => {
                          setSelectedPost(post);
                          window.scrollTo(0, 0);
                        }}
                      >
                        <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden mb-6">
                          {post.imageUrl ? (
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Globe className="h-12 w-12" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-slate-600 line-clamp-3 text-sm leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {posts.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                      <p className="text-slate-500 font-medium">
                        No blog posts published yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {policies?.find((p) => p.slug === activePageSlug) && (
            <div className="mb-24">
              <div className="bg-slate-950 py-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                  <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase text-white mb-4">
                    {policies?.find((p) => p.slug === activePageSlug)?.title}
                  </h1>
                  <p className="text-white font-medium opacity-80">
                    Reliable Compliance Infrastructure Powered by Bennie Tay Studio
                  </p>
                </div>
              </div>
              <div className="py-24 px-6 max-w-4xl mx-auto">
                <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-black prose-p:text-black prose-p:leading-relaxed prose-li:text-black prose-strong:text-black prose-strong:font-bold prose-h2:border-b prose-h2:pb-4 prose-h2:mt-12">
                  <ReactMarkdown>
                    {policies?.find((p) => p.slug === activePageSlug)?.content ||
                      ""}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer
          className={cn(
            "py-32 px-6 border-t relative overflow-hidden",
            theme.style === "luxury_dark" ||
              theme.style === "immersive" ||
              theme.style === "glassmorphic"
              ? "bg-slate-950 border-white/5 text-white"
              : theme.style === "prestige"
                ? "bg-[#fafafa] border-black/5 text-[#1a1a1a]"
                : "bg-white border-slate-100 text-slate-900",
          )}
        >
          <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
              <div className="md:col-span-4 space-y-10">
                <button
                  onClick={() => {
                    setActivePageSlug("home");
                    setSelectedPost(null);
                    window.scrollTo(0, 0);
                  }}
                  className="flex items-center gap-4 group text-left"
                >
                  <div className="relative">
                    <div className="h-16 w-16 bg-slate-950 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all duration-500">
                      <Globe className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-primary rounded-lg border-2 border-white" />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-2xl font-black tracking-tighter uppercase group-hover:text-primary transition-colors",
                        theme.style === "luxury_dark" ||
                          theme.style === "immersive" ||
                          theme.style === "glassmorphic"
                          ? "text-white"
                          : "text-slate-900",
                      )}
                    >
                      {website.seo.title.split("|")[0].trim()}
                    </span>
                    <span className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase">
                      Strategic Edge
                    </span>
                  </div>
                </button>
                {theme.footer.customText ? (
                  <p className="text-slate-500 text-lg leading-relaxed max-w-sm font-medium">
                    {theme.footer.customText}
                  </p>
                ) : (
                  <p className="text-slate-500 text-lg leading-relaxed max-w-sm font-medium">
                    Defining the future through absolute precision and elite
                    strategic partnerships.
                  </p>
                )}
                {theme.footer.showSocials && (
                  <div className="flex gap-4">
                    {(theme.footer.socialLinks || [])
                      .filter((l) => l.url && l.isVisible !== false)
                      .map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-950 hover:text-white transition-all shadow-sm"
                        >
                          {link.platform === "facebook" && (
                            <Facebook className="h-5 w-5" />
                          )}
                          {link.platform === "instagram" && (
                            <Instagram className="h-5 w-5" />
                          )}
                          {link.platform === "twitter" && (
                            <Twitter className="h-5 w-5" />
                          )}
                          {link.platform === "linkedin" && (
                            <Linkedin className="h-5 w-5" />
                          )}
                          {link.platform === "youtube" && (
                            <Youtube className="h-5 w-5" />
                          )}
                        </a>
                      ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-10">
                <h4 className="font-black uppercase tracking-[0.3em] text-xs text-slate-950">
                  Sitemap
                </h4>
                <ul className="space-y-6">
                  {(pages || []).map((page) => (
                    <li key={page.id}>
                      <button
                        onClick={() => {
                          setActivePageSlug(page.slug);
                          window.scrollTo(0, 0);
                        }}
                        className={cn(
                          "text-lg font-bold transition-all hover:translate-x-2 flex items-center gap-4 group",
                          activePageSlug === page.slug
                            ? "text-primary"
                            : "text-slate-500 hover:text-slate-950",
                        )}
                      >
                        <div className="h-0.5 w-0 bg-primary group-hover:w-4 transition-all" />
                        {page.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-3 space-y-10">
                <h4 className="font-black uppercase tracking-[0.3em] text-xs text-slate-950">
                  Corporate Presence
                </h4>
                <ul className="space-y-8">
                  {theme.footer?.contactEmail && (
                    <li className="flex gap-5 group">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase font-black tracking-widest text-slate-400">
                          Electronic Mail
                        </p>
                        <p className="text-slate-950 font-bold">
                          {theme.footer.contactEmail}
                        </p>
                      </div>
                    </li>
                  )}
                  {theme.footer?.contactPhone && (
                    <li className="flex gap-5 group">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase font-black tracking-widest text-slate-400">
                          Direct Line
                        </p>
                        <p className="text-slate-950 font-bold">
                          {theme.footer.contactPhone}
                        </p>
                      </div>
                    </li>
                  )}
                  {theme.footer?.contactAddress && (
                    <li className="flex gap-5 group">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase font-black tracking-widest text-slate-400">
                          Headquarters
                        </p>
                        <p className="text-slate-950 font-bold leading-relaxed">
                          {theme.footer.contactAddress}
                        </p>
                      </div>
                    </li>
                  )}
                </ul>
              </div>

              <div className="md:col-span-3 space-y-10">
                <h4 className="font-black uppercase tracking-[0.3em] text-xs text-slate-950">
                  Legal Protocol
                </h4>
                <ul className="space-y-6">
                  {(policies || []).map((policy) => (
                    <li key={policy.id}>
                      <button
                        onClick={() => {
                          setActivePageSlug(policy.slug);
                          window.scrollTo(0, 0);
                        }}
                        className="text-slate-500 hover:text-slate-950 font-bold text-lg hover:translate-x-2 transition-all block"
                      >
                        {policy.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                &copy; {new Date().getFullYear()}{" "}
                {website.seo.title.split("|")[0].trim()}. Absolute Excellence
                Indicated.
              </p>
            </div>
          </div>
        </footer>

        {/* Product Detail Modal */}
        <AnimatePresence>
          {selectedProduct && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProduct(null)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-5xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
              >
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-6 right-6 z-10 h-10 w-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 hover:bg-slate-950 hover:text-white transition-all shadow-lg"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="md:w-1/2 bg-slate-50 flex items-center justify-center p-8 overflow-hidden">
                  <div className="relative group w-full aspect-square">
                    {selectedProduct.image_url || selectedProduct.imageUrl ? (
                      <img
                        src={
                          selectedProduct.image_url || selectedProduct.imageUrl
                        }
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover rounded-[2rem] shadow-2xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-white rounded-[2rem] flex items-center justify-center text-slate-200">
                        <ShoppingBag className="h-40 w-40" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:w-1/2 p-8 sm:p-12 overflow-y-auto space-y-8">
                  <div className="space-y-4">
                    <Badge
                      variant="outline"
                      className="bg-primary/5 text-primary border-primary/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                      {selectedProduct.category || "Exclusive Release"}
                    </Badge>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase text-slate-950 leading-tight">
                      {selectedProduct.name || selectedProduct.title}
                    </h2>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-black tracking-tighter text-slate-950">
                        {typeof selectedProduct.price === "number"
                          ? `$${selectedProduct.price}`
                          : selectedProduct.price}
                      </span>
                      <Badge className="bg-emerald-500 text-white border-none rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                        In Stock
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Specifications
                    </h4>
                    <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm">
                      <p>{selectedProduct.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                        <Tag className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                          Authenticity
                        </p>
                        <p className="text-xs font-bold text-slate-700">
                          Verified
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                          Inventory
                        </p>
                        <p className="text-xs font-bold text-slate-700">
                          Limited
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
                    <Button
                      className="w-full h-16 bg-slate-950 hover:bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all gap-3 shadow-xl group"
                      onClick={() => handleCheckout(selectedProduct)}
                      disabled={checkoutLoading === selectedProduct.id}
                    >
                      {checkoutLoading === selectedProduct.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Secure Checkout
                          <CreditCard className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                        </>
                      )}
                    </Button>
                    <div className="flex items-center justify-center gap-6 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3 w-3" /> Secure SSL
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3" /> Instant Access
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* AI Chatbot Widget */}
        <div className="fixed bottom-6 right-6 z-[100]">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
              >
                <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">AI Assistant</h4>
                      <p className="text-[10px] text-indigo-100 uppercase tracking-widest">
                        Powered by Gemini
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="hover:rotate-90 transition-transform duration-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-slate-50/50 dark:bg-slate-900/50">
                  {chatMessages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12 space-y-4"
                    >
                      <div className="h-20 w-20 rounded-[2rem] bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto shadow-inner">
                        <MessageSquare className="h-10 w-10 text-indigo-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 dark:text-white">
                          How can I help?
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Ask me anything about our services.
                        </p>
                      </div>
                    </motion.div>
                  )}
                  <AnimatePresence mode="popLayout">
                    {chatMessages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{
                          opacity: 0,
                          x: msg.role === "user" ? 20 : -20,
                          scale: 0.9,
                        }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                          type: "spring",
                          damping: 20,
                          stiffness: 300,
                        }}
                        className={cn(
                          "flex",
                          msg.role === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm",
                            msg.role === "user"
                              ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-100 dark:shadow-none"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700",
                          )}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isChatLoading && (
                    <motion.div
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex gap-1">
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="h-1.5 w-1.5 rounded-full bg-indigo-600"
                        />
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0.2,
                          }}
                          className="h-1.5 w-1.5 rounded-full bg-indigo-600"
                        />
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0.4,
                          }}
                          className="h-1.5 w-1.5 rounded-full bg-indigo-600"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                >
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ask a question..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isChatLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="h-16 w-16 bg-indigo-600 text-white rounded-3xl shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all duration-300 group relative"
          >
            {isChatOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <MessageSquare className="h-6 w-6" />
            )}
            {!isChatOpen && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
            )}
          </motion.button>
        </div>

        {/* Back to Top */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="fixed bottom-28 right-6 h-12 w-12 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all z-[90]"
            >
              <ArrowRight className="h-5 w-5 -rotate-90" />
            </motion.button>
          )}
          {/* Custom Footer Scripts */}
          {businessInfo?.tracking_scripts_footer && (
            <div
              dangerouslySetInnerHTML={{
                __html: businessInfo.tracking_scripts_footer,
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </HelmetProvider>
  );
}
