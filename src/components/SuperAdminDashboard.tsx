/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Users,
  Globe,
  BarChart3,
  Settings,
  Plus,
  Search,
  MoreVertical,
  ExternalLink,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  Zap,
  Loader2,
  RefreshCw,
  X,
  Save,
  CreditCard,
  Shield,
  FileText,
  Gift,
  Award,
  CircleDollarSign,
  Layout,
  Cpu,
  BrainCircuit,
  Microchip,
  XCircle,
  Megaphone,
  Palette,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { AdminSupport } from "./AdminSupport";
import { TemplateGallery } from "./TemplateGallery";
import { BlogCMS } from "./BlogCMS";
import { PoliciesCMS } from "./PoliciesCMS";
import LandingPageEditor from "./LandingPageEditor";
import PlanEditor from "./PlanEditor";
import { RevenueDashboard } from "./RevenueDashboard";
import { TemplateManager } from "./SuperAdmin/TemplateManager";
import { WebsiteEditor } from "./WebsiteEditor";
import {
  DEFAULT_MODEL_CONFIG,
  AI_MODELS,
  AIUseCase,
  USE_CASE_LABELS,
} from "../constants/aiModels";
import { ArrowLeft } from "lucide-react";
import { SuperAdminAffiliates } from "./SuperAdminAffiliates";
import { SuperAdminAffiliatePartners } from "./SuperAdminAffiliatePartners";
import { GeoPricingEditor } from "./GeoPricingEditor";
import { ArchetypeThemeManager } from "./SuperAdmin/ArchetypeThemeManager";

export default function SuperAdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = () => {
    const parts = location.pathname.split("/");
    const last = parts.pop();
    const secondLast = parts.pop();

    if (secondLast === "templates" && last === "edit") return "templates"; // Placeholder for edit
    if (last === "admin") return "businesses";
    return last || "businesses";
  };

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [affiliatePrograms, setAffiliatePrograms] = useState<any[]>([]);
  const [allPayouts, setAllPayouts] = useState<any[]>([]);
  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [trafficMetrics, setTrafficMetrics] = useState<{
    aggregate: {
      totalViews: number;
      uniqueVisitors: number;
      avgViewsPerVisitor: number;
    };
    topPages: { path: string; count: number }[];
    trend: { date: string; views: number; uniques: number }[];
    loading: boolean;
  }>({
    aggregate: { totalViews: 0, uniqueVisitors: 0, avgViewsPerVisitor: 0 },
    topPages: [],
    trend: [],
    loading: true,
  });
  const [globalAffiliateStats, setGlobalAffiliateStats] = useState({
    totalPrograms: 0,
    totalAffiliates: 0,
    totalReferrals: 0,
    totalEarnings: 0,
  });
  const [aiUsage, setAiUsage] = useState<{
    totalGenerations: number;
    estimatedCost: number;
    monthly?: { [key: string]: { generations: number; cost: number } };
    recentLogs: any[];
    topSpenders: any[];
  }>({
    totalGenerations: 0,
    estimatedCost: 0,
    monthly: {},
    recentLogs: [],
    topSpenders: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  const [platformSettings, setPlatformSettings] = useState({
    name: "Bennie Tay Studio",
    supportEmail: "support@bennietay.com",
    maintenanceMode: false,
    maintenanceTitle: "Coming Soon",
    maintenanceMessage:
      "We're currently performing some scheduled maintenance to bring you an even better experience. We'll be back shortly!",
    estimatedDowntime: "Approximately 2 hours",
    defaultTrialDays: 14,
    maxMonthlyAiBudget: 100,
    stripeSecretKey: "",
    stripePublishableKey: "",
    stripeWebhookSecret: "",
    stripeConnectClientId: "",
    gaMeasurementId: "",
    metaPixelId: "",
    trackingScriptsHeader: "",
    trackingScriptsFooter: "",
    aiModelConfig: DEFAULT_MODEL_CONFIG,
    marketingFeatures: {
      seoAudit: "coming_soon" as "enabled" | "disabled" | "coming_soon",
      adGenerator: "coming_soon" as "enabled" | "disabled" | "coming_soon",
    },
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [terminatingUser, setTerminatingUser] = useState<any>(null);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Sync editingTemplateId from URL if possible, or just keep it purely state-based for now
  // For better UX with back/forward, we should use URL params, but let's stick to state for simplicity
  // and handle the "new" case properly.

  const handleEditTemplate = (id: string) => {
    setEditingTemplateId(id);
    setActiveTab("templates");
    navigate("/admin/templates"); // Ensure we stay on the templates tab base path
  };

  useEffect(() => {
    const tab = getTabFromPath();
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (activeTab === "traffic") {
      fetchTrafficMetrics();
    }
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "businesses") {
      navigate("/admin");
    } else {
      navigate(`/admin/${value}`);
    }
  };

  const deleteBusiness = async (bizId: string) => {
    try {
      const { error } = await supabase
        .from("businesses")
        .delete()
        .eq("id", bizId);
      if (error) throw error;
      setBusinesses((prev) => prev.filter((b) => b.id !== bizId));
      toast.success("Business deleted successfully");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete business");
    }
  };

  const suspendUser = async (userId: string) => {
    if (profile?.role !== "super_admin") {
      toast.error("Only Super Admins can suspend users");
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "suspended" })
        .eq("id", userId);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "suspended" } : u)),
      );
      toast.success("User suspended successfully");
    } catch (err) {
      console.error("Suspend failed:", err);
      toast.error("Failed to suspend user");
    }
  };

  const terminateUser = async (userId: string) => {
    if (profile?.role !== "super_admin") {
      toast.error("Only Super Admins can terminate users");
      return;
    }
    try {
      // First, find the business associated with this user before we null it
      const { data: profileData } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", userId)
        .single();
      const associatedBusinessId = profileData?.business_id;

      // Termination sets status to terminated and clears business ID to free it up
      // and prevent further associated actions
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "terminated",
          business_id: null,
        })
        .eq("id", userId);

      if (error) throw error;

      // Also potentially de-activate their business if any
      if (associatedBusinessId) {
        await supabase
          .from("businesses")
          .update({ status: "inactive" })
          .eq("id", associatedBusinessId);
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: "terminated", business_id: null }
            : u,
        ),
      );
      toast.success("User terminated and business disassociated");
      setIsTerminateDialogOpen(false);
      setTerminatingUser(null);
    } catch (err: any) {
      console.error("Termination failed:", err);
      toast.error(`Termination failed: ${err.message || "Unknown error"}`);
    }
  };

  const deleteUserRecord = async (userId: string) => {
    if (profile?.role !== "super_admin") {
      toast.error("Only Super Admins can delete users");
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (error) throw error;
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User record deleted from platform");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete user record");
    }
  };

  const handleBulkSuspend = async () => {
    if (selectedUsers.length === 0) return;
    setIsBulkLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "suspended" })
        .in("id", selectedUsers);

      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) =>
          selectedUsers.includes(u.id) ? { ...u, status: "suspended" } : u,
        ),
      );
      toast.success(`Suspended ${selectedUsers.length} users`);
      setSelectedUsers([]);
    } catch (err) {
      console.error("Bulk suspend failed:", err);
      toast.error("Bulk operation failed");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (profile?.role !== "super_admin") {
      toast.error("Only Super Admins can change user roles");
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      console.error("Update role failed:", err);
      toast.error("Failed to update user role");
    }
  };

  const fetchTrafficMetrics = async (days = 30) => {
    try {
      setTrafficMetrics((prev) => ({ ...prev, loading: true }));
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `/api/platform/traffic-metrics?days=${days}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const result = await response.json();
      if (result.success) {
        setTrafficMetrics({
          aggregate: result.aggregate,
          topPages: result.topPages,
          trend: result.trend,
          loading: false,
        });
      }
    } catch (err) {
      console.error("Error fetching traffic metrics:", err);
      setTrafficMetrics((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        const [
          bizRes,
          userRes,
          apptRes,
          settingsRes,
          affiliateProgsRes,
          allAffiliatesRes,
          allReferralsRes,
          allPayoutsRes,
          partnersRes,
          aiUsageRes,
        ] = await Promise.all([
          supabase
            .from("businesses")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("appointments")
            .select("*")
            .gte("date", new Date().toISOString().split("T")[0])
            .order("date", { ascending: true }),
          supabase
            .from("settings")
            .select("*")
            .eq("id", "platform")
            .maybeSingle(),
          supabase.from("affiliate_programs").select("*, businesses(name)"),
          supabase.from("affiliates").select("*"),
          supabase
            .from("affiliate_referrals")
            .select("commission_amount, status"),
          supabase
            .from("affiliate_payouts")
            .select("*, affiliates(uid, referral_code), businesses(name)")
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("*")
            .eq("role", "affiliate")
            .order("created_at", { ascending: false }),
          fetch("/api/platform/ai-usage", {
            headers: { Authorization: `Bearer ${token}` },
          }).then(async (r) => {
            if (!r.ok) {
              const text = await r.text();
              throw new Error(
                `Server returned ${r.status}: ${text.slice(0, 100)}`,
              );
            }
            return r.json();
          }),
        ]);

        if (bizRes.data) setBusinesses(bizRes.data);
        if (userRes.data) setUsers(userRes.data);
        if (apptRes.data) setAppointments(apptRes.data);
        if (settingsRes.data) {
          setPlatformSettings((prev) => ({
            ...prev,
            ...settingsRes.data.content,
            marketingFeatures: {
              ...prev.marketingFeatures,
              ...(settingsRes.data.content?.marketingFeatures || {}),
            },
          }));
        }
        if (affiliateProgsRes.data)
          setAffiliatePrograms(affiliateProgsRes.data);
        if (allPayoutsRes.data) setAllPayouts(allPayoutsRes.data);
        if (partnersRes.data) setAllPartners(partnersRes.data);

        // Fetch AI Usage Insights (Scaling focused)
        let logsRes = { data: [] as any[] };
        let topRes = { data: [] as any[] };

        try {
          const [lRes, tRes] = await Promise.all([
            supabase
              .from("ai_usage_logs")
              .select("*, businesses(name)")
              .order("created_at", { ascending: false })
              .limit(20),
            supabase
              .from("businesses")
              .select("id, name, ai_credits, ai_credits_used")
              .order("ai_credits_used", { ascending: false })
              .limit(5),
          ]);
          logsRes = lRes;
          topRes = tRes;

          if (tRes.error && tRes.error.code === "42703") {
            // Fallback if ai_credits_used is missing
            const { data } = await supabase
              .from("businesses")
              .select("id, name, ai_credits")
              .limit(5);
            topRes.data = data || [];
          }
        } catch (err) {
          console.warn("Detailed AI usage fetch failed:", err);
        }

        if (aiUsageRes?.success) {
          setAiUsage({
            ...aiUsageRes.data,
            recentLogs: logsRes.data || [],
            topSpenders: topRes.data || [],
          });
        }

        // Calculate global stats
        if (
          affiliateProgsRes.data &&
          allAffiliatesRes.data &&
          allReferralsRes.data
        ) {
          const totalEarnings = allReferralsRes.data
            .filter((r) => r.status === "converted")
            .reduce((sum, r) => sum + (r.commission_amount || 0), 0);

          setGlobalAffiliateStats({
            totalPrograms: affiliateProgsRes.data.length,
            totalAffiliates: allAffiliatesRes.data.length,
            totalReferrals: allReferralsRes.data.length,
            totalEarnings,
          });
        }
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      console.log("Saving Platform Settings:", platformSettings);

      // 1. Save full platform settings (including sensitive ones)
      const platformPromise = supabase.from("settings").upsert({
        id: "platform",
        content: platformSettings,
        updated_at: new Date().toISOString(),
      });

      // 2. Save public marketing config to a separate record accessible by all businesses
      const marketingPromise = supabase.from("settings").upsert({
        id: "marketing_hub_config",
        content: {
          marketingFeatures: platformSettings.marketingFeatures,
        },
        updated_at: new Date().toISOString(),
      });

      const [platformRes, marketingRes] = await Promise.all([
        platformPromise,
        marketingPromise,
      ]);

      if (platformRes.error) throw platformRes.error;
      if (marketingRes.error) throw marketingRes.error;

      toast.success("Platform settings and marketing configuration updated");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestStripe = async () => {
    setTestingStripe(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/platform/test-stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          secretKey: platformSettings.stripeSecretKey,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Stripe connection successful!");
      } else {
        toast.error(data.error || "Stripe connection failed");
      }
    } catch (error: any) {
      toast.error("Failed to test Stripe connection");
    } finally {
      setTestingStripe(false);
    }
  };

  const handleClearAllData = async () => {
    setLoading(true);
    try {
      // In a real environment with cascades, this is simple.
      // Here we might need to delete from multiple tables if cascades aren't fully set up.

      const tables = [
        "affiliate_referrals",
        "affiliate_payouts",
        "affiliates",
        "affiliate_programs",
        "analytic_events",
        "appointments",
        "blog_posts",
        "leads",
        "websites",
        "user_profiles",
        "businesses",
      ];

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete everything
        if (error) console.warn(`Error clearing ${table}:`, error);
      }

      toast.success("Platform data cleared successfully. Please refresh.");
      window.location.reload();
    } catch (error: any) {
      toast.error("Failed to clear data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBusiness = async () => {
    if (!editingBusiness) return;
    setSavingBusiness(true);
    try {
      const isTrialExtension = editingBusiness.status === "trial";

      const updatePayload: any = {
        name: editingBusiness.name,
        industry: editingBusiness.industry,
        plan: editingBusiness.plan,
        status: isTrialExtension ? "active" : editingBusiness.status,
      };

      if (isTrialExtension) {
        const newTrialEnd = new Date();
        newTrialEnd.setDate(newTrialEnd.getDate() + 14);
        updatePayload.subscription_status = "trialing";
        updatePayload.trial_ends_at = newTrialEnd.toISOString();
      }

      let { error } = await supabase
        .from("businesses")
        .update(updatePayload)
        .eq("id", editingBusiness.id);

      // If subscription_status or trial_ends_at is missing from schema cache, try a fallback update
      if (
        error &&
        (error.message.includes("subscription_status") ||
          error.message.includes("trial_ends_at"))
      ) {
        console.warn(
          "Schema mismatch detected, falling back to basic update:",
          error.message,
        );
        const fallbackPayload = {
          name: editingBusiness.name,
          industry: editingBusiness.industry,
          plan: editingBusiness.plan,
          status: isTrialExtension ? "active" : editingBusiness.status,
        };
        const { error: fallbackError } = await supabase
          .from("businesses")
          .update(fallbackPayload)
          .eq("id", editingBusiness.id);
        error = fallbackError;

        if (!error) {
          toast.warning(
            "Update succeeded but trial extension skipped because your database schema is outdated. Please check your Supabase SQL editor.",
          );
        }
      }

      if (error) throw error;

      // Fetch fresh data to ensure we have the correct subscription_status and trial dates
      const { data: freshBiz } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", editingBusiness.id)
        .single();

      if (freshBiz) {
        setBusinesses((prev) =>
          prev.map((b) => (b.id === editingBusiness.id ? freshBiz : b)),
        );
      }

      setIsEditDialogOpen(false);
      toast.success(
        isTrialExtension
          ? "Trial extended for 14 days"
          : "Business updated successfully",
      );
    } catch (err: any) {
      console.error("Update failed:", err);
      toast.error(err.message || "Failed to update business");
    } finally {
      setSavingBusiness(false);
    }
  };

  const getNextAppointment = (businessId: string) => {
    const businessAppts = appointments.filter(
      (a) => a.business_id === businessId && a.status !== "cancelled",
    );
    if (businessAppts.length === 0) return "No upcoming appointments";
    const next = businessAppts[0];
    return `${next.date} at ${next.time}`;
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Super Admin Control
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Platform-wide management and oversight.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            View Profile functionality is now live!
          </span>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <div className="overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
          <TabsList className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-nowrap h-auto w-max min-w-full gap-1.5 shadow-sm mb-2">
            <TabsTrigger
              value="businesses"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <Globe className="h-4 w-4" /> Businesses
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger
              value="revenue"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <CircleDollarSign className="h-4 w-4" /> Revenue & Analytics
            </TabsTrigger>
            <TabsTrigger
              value="affiliates"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <Gift className="h-4 w-4" /> Affiliates
            </TabsTrigger>
            <TabsTrigger
              value="partners"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <Users className="h-4 w-4" /> Partners
            </TabsTrigger>
            <TabsTrigger
              value="payouts"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <CreditCard className="h-4 w-4" /> Payouts
            </TabsTrigger>
            <TabsTrigger
              value="geo"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <Globe className="h-4 w-4" /> Geo-Pricing
            </TabsTrigger>
            <TabsTrigger
              value="landing"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <Layout className="h-4 w-4" /> Landing
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <Layout className="h-4 w-4" /> Templates
            </TabsTrigger>
            <TabsTrigger
              value="plans"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <CreditCard className="h-4 w-4" /> Subscription Plans
            </TabsTrigger>
            <TabsTrigger
              value="blog"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <FileText className="h-4 w-4" /> Blog
            </TabsTrigger>
            <TabsTrigger
              value="archetypes"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <Palette className="h-4 w-4" /> Archetypes
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <Shield className="h-4 w-4" /> Support
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap"
            >
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="businesses">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="rounded-3xl border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center mb-1">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Total Businesses
                  </CardTitle>
                  <Globe className="h-4 w-4 text-indigo-500" />
                </div>
                <CardDescription className="text-3xl font-bold text-slate-900 dark:text-white">
                  {businesses.length}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-3xl border-none ring-1 ring-emerald-200 bg-emerald-50/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center mb-1">
                  <CardTitle className="text-sm font-medium text-emerald-600 uppercase tracking-wider">
                    Active Trials
                  </CardTitle>
                  <Zap className="h-4 w-4 text-emerald-500" />
                </div>
                <CardDescription className="text-3xl font-bold text-emerald-700">
                  {
                    businesses.filter(
                      (b) => b.subscription_status === "trialing",
                    ).length
                  }
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-3xl border-none ring-1 ring-indigo-200 bg-indigo-50/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center mb-1">
                  <CardTitle className="text-sm font-medium text-indigo-600 uppercase tracking-wider">
                    AI Generations
                  </CardTitle>
                  <Cpu className="h-4 w-4 text-indigo-500" />
                </div>
                <CardDescription className="text-3xl font-bold text-indigo-700">
                  {aiUsage.totalGenerations.toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-3xl border-none ring-1 ring-amber-200 bg-amber-50/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center mb-1">
                  <CardTitle className="text-sm font-medium text-amber-600 uppercase tracking-wider">
                    Est. AI Cost
                  </CardTitle>
                  <CircleDollarSign className="h-4 w-4 text-amber-500" />
                </div>
                <CardDescription className="text-3xl font-bold text-amber-700">
                  ${aiUsage.estimatedCost.toFixed(4)}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Card className="rounded-[2.5rem] border-red-100 bg-red-50/10 overflow-hidden ring-1 ring-red-500/10">
              <CardHeader className="pb-3 border-b border-red-100/50 bg-white/50">
                <CardTitle className="flex items-center gap-2 text-red-900 text-sm font-black uppercase tracking-widest">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Critical Credit Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[200px]">
                  <div className="p-4 space-y-4">
                    {businesses.filter(
                      (b) => b.ai_credits - (b.ai_credits_used || 0) < 10,
                    ).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400">
                        <CheckCircle2 className="h-8 w-8 mb-2 text-emerald-400 opacity-50" />
                        <p className="text-xs font-bold uppercase tracking-widest">
                          All businesses healthy
                        </p>
                      </div>
                    ) : (
                      businesses
                        .filter(
                          (b) => b.ai_credits - (b.ai_credits_used || 0) < 10,
                        )
                        .map((biz) => (
                          <div
                            key={biz.id}
                            className="flex items-center justify-between p-3 rounded-2xl bg-white border border-red-100 shadow-sm"
                          >
                            <div>
                              <p className="font-bold text-slate-900 text-sm">
                                {biz.name}
                              </p>
                              <p className="text-[10px] text-red-500 font-bold uppercase">
                                {(biz.ai_credits || 0) -
                                  (biz.ai_credits_used || 0)}{" "}
                                credits remaining
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-4 rounded-xl border-red-200 text-red-600 font-bold text-[10px] uppercase"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Credits
                            </Button>
                          </div>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-indigo-100 bg-indigo-50/10 overflow-hidden ring-1 ring-indigo-500/10">
              <CardHeader className="pb-3 border-b border-indigo-100/50 bg-white/50">
                <CardTitle className="flex items-center gap-2 text-indigo-900 text-sm font-black uppercase tracking-widest">
                  <Zap className="h-4 w-4 text-indigo-600" />
                  Live AI Usage Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[200px]">
                  <div className="p-4 space-y-3">
                    {aiUsage.recentLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/80 border border-slate-100 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl ${
                              log.use_case === "synthesis"
                                ? "bg-indigo-100 text-indigo-600"
                                : log.use_case === "seo"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Microchip className="h-3 w-3" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-[11px] leading-tight">
                              {log.businesses?.name || "Unknown Business"}
                            </p>
                            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              <span>{log.use_case}</span>
                              <span className="opacity-30">•</span>
                              <span>{log.model_id}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-900 text-xs">
                            +{log.amount}
                          </p>
                          <p className="text-[9px] text-slate-400 uppercase">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Active Businesses</CardTitle>
                  <CardDescription>
                    Manage all businesses on the platform.
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search businesses..."
                      className="pl-10 w-64 rounded-xl"
                      value={businessSearchQuery}
                      onChange={(e) => setBusinessSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead className="pl-8">Business Name</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Next Appointment</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="pr-8 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses
                      .filter(
                        (biz) =>
                          biz.name
                            .toLowerCase()
                            .includes(businessSearchQuery.toLowerCase()) ||
                          biz.industry
                            .toLowerCase()
                            .includes(businessSearchQuery.toLowerCase()) ||
                          biz.id
                            .toLowerCase()
                            .includes(businessSearchQuery.toLowerCase()),
                      )
                      .map((biz) => (
                        <TableRow
                          key={biz.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          <TableCell className="pl-8 font-bold text-slate-900 dark:text-white">
                            {biz.name}
                          </TableCell>
                          <TableCell>{biz.industry}</TableCell>
                          <TableCell className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {getNextAppointment(biz.id)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {biz.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge
                                className={
                                  biz.subscription_status === "trialing"
                                    ? "bg-amber-500 hover:bg-amber-600 border-none"
                                    : biz.status === "active"
                                      ? "bg-emerald-500 hover:bg-emerald-600 border-none"
                                      : "bg-slate-500 hover:bg-slate-600 border-none"
                                }
                              >
                                {biz.subscription_status === "trialing"
                                  ? "Trial"
                                  : biz.status}
                              </Badge>
                              {biz.subscription_status === "trialing" &&
                                biz.trial_ends_at && (
                                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                    Ends{" "}
                                    {new Date(
                                      biz.trial_ends_at,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {new Date(biz.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={(props) => (
                                  <Button variant="ghost" size="sm" {...props}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                )}
                              />
                              <DropdownMenuContent
                                align="end"
                                className="rounded-xl"
                              >
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(`/w/${biz.id}`, "_blank")
                                  }
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" /> View
                                  Site
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingBusiness(biz);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                  Business
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => deleteBusiness(biz.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Directory</CardTitle>
                  <CardDescription>
                    Manage platform users and permissions.
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-4">
                  <div className="flex gap-2">
                    {selectedUsers.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkSuspend}
                        disabled={isBulkLoading}
                        className="rounded-xl h-8 text-[10px] uppercase font-bold"
                      >
                        {isBulkLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="h-3 w-3 mr-2" />
                        )}
                        Suspend Selected ({selectedUsers.length})
                      </Button>
                    )}
                    <Badge
                      variant={userRoleFilter === "all" ? "default" : "outline"}
                      className="cursor-pointer rounded-lg text-[10px] py-1 px-3"
                      onClick={() => setUserRoleFilter("all")}
                    >
                      All
                    </Badge>
                    <Badge
                      variant={
                        userRoleFilter === "super_admin" ? "default" : "outline"
                      }
                      className="cursor-pointer rounded-lg text-[10px] py-1 px-3"
                      onClick={() => setUserRoleFilter("super_admin")}
                    >
                      Admins
                    </Badge>
                    <Badge
                      variant={
                        userRoleFilter === "business_admin"
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer rounded-lg text-[10px] py-1 px-3"
                      onClick={() => setUserRoleFilter("business_admin")}
                    >
                      Businesses
                    </Badge>
                    <Badge
                      variant={
                        userRoleFilter === "affiliate" ? "default" : "outline"
                      }
                      className="cursor-pointer rounded-lg text-[10px] py-1 px-3"
                      onClick={() => setUserRoleFilter("affiliate")}
                    >
                      Affiliates
                    </Badge>
                    <Badge
                      variant={
                        userRoleFilter === "client" ? "default" : "outline"
                      }
                      className="cursor-pointer rounded-lg text-[10px] py-1 px-3"
                      onClick={() => setUserRoleFilter("client")}
                    >
                      Customers
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-white dark:bg-slate-950">
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead className="w-12 pl-8">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(
                                users
                                  .filter(
                                    (u) =>
                                      userRoleFilter === "all" ||
                                      u.role === userRoleFilter,
                                  )
                                  .map((u) => u.id),
                              );
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          checked={
                            selectedUsers.length > 0 &&
                            selectedUsers.length ===
                              users.filter(
                                (u) =>
                                  userRoleFilter === "all" ||
                                  u.role === userRoleFilter,
                              ).length
                          }
                        />
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Business ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Onboarding</TableHead>
                      <TableHead className="pr-8 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter(
                        (user) =>
                          userRoleFilter === "all" ||
                          user.role === userRoleFilter,
                      )
                      .map((user) => (
                        <TableRow
                          key={user.id}
                          className={
                            user.status === "terminated"
                              ? "opacity-50 grayscale"
                              : ""
                          }
                        >
                          <TableCell className="w-12 pl-8">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                  setSelectedUsers(
                                    selectedUsers.filter(
                                      (id) => id !== user.id,
                                    ),
                                  );
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) =>
                                updateUserRole(user.id, value)
                              }
                            >
                              <SelectTrigger className="h-8 w-40 rounded-xl text-xs font-bold uppercase tracking-tighter">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="super_admin">
                                  Super Admin
                                </SelectItem>
                                <SelectItem value="business_admin">
                                  Business Admin
                                </SelectItem>
                                <SelectItem value="affiliate">
                                  Affiliate Partner
                                </SelectItem>
                                <SelectItem value="client">
                                  Client / Customer
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {user.business_id || "None"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                user.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : user.status === "suspended"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                              }
                            >
                              {user.status || "active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.onboarding_completed ? (
                              <Badge className="bg-emerald-500 rounded-full text-[10px] px-2 py-0">
                                Done
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="rounded-full text-[10px] px-2 py-0"
                              >
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={(props) => (
                                  <Button variant="ghost" size="sm" {...props}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                )}
                              />
                              <DropdownMenuContent
                                align="end"
                                className="rounded-xl"
                              >
                                <DropdownMenuItem
                                  onClick={() => {
                                    setViewingUser(user);
                                    setIsViewUserDialogOpen(true);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View Profile
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Edit className="mr-2 h-4 w-4" /> Change
                                    Role
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="rounded-xl">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          updateUserRole(user.id, "super_admin")
                                        }
                                      >
                                        <Shield className="mr-2 h-4 w-4 text-indigo-600" />{" "}
                                        Super Admin
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          updateUserRole(
                                            user.id,
                                            "business_admin",
                                          )
                                        }
                                      >
                                        <Zap className="mr-2 h-4 w-4 text-amber-500" />{" "}
                                        Business Admin
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          updateUserRole(user.id, "affiliate")
                                        }
                                      >
                                        <Gift className="mr-2 h-4 w-4 text-indigo-500" />{" "}
                                        Affiliate Partner
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          updateUserRole(user.id, "client")
                                        }
                                      >
                                        <Users className="mr-2 h-4 w-4 text-emerald-600" />{" "}
                                        Client
                                      </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                  </DropdownMenuPortal>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                {user.status !== "active" && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      supabase
                                        .from("profiles")
                                        .update({ status: "active" })
                                        .eq("id", user.id)
                                        .then(() => {
                                          setUsers((prev) =>
                                            prev.map((u) =>
                                              u.id === user.id
                                                ? { ...u, status: "active" }
                                                : u,
                                            ),
                                          );
                                          toast.success("User reactivated");
                                        });
                                    }}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />{" "}
                                    Reactivate User
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-amber-600"
                                  onClick={() => suspendUser(user.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Suspend
                                  User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onClick={() => {
                                    setTerminatingUser(user);
                                    setIsTerminateDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Terminate
                                  User
                                </DropdownMenuItem>
                                {user.status === "terminated" && (
                                  <DropdownMenuItem
                                    className="text-red-900 font-bold"
                                    onClick={() => deleteUserRecord(user.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    Permanently
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landing">
          <LandingPageEditor />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-end gap-3 mb-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              onClick={async () => {
                try {
                  const { NICHE_TEMPLATES } =
                    await import("../constants/nicheTemplates");
                  const entries = Object.values(NICHE_TEMPLATES);

                  for (const template of entries) {
                    const { error } = await supabase.from("templates").upsert({
                      id: template.id,
                      name: template.name,
                      description: template.description,
                      category:
                        template.category ||
                        template.seo?.businessType ||
                        "General",
                      thumbnail:
                        template.thumbnail ||
                        `https://picsum.photos/seed/${template.id}/800/600`,
                      config: {
                        pages: template.pages,
                        theme: {
                          ...template.theme,
                          defaultStyle:
                            template.theme?.defaultStyle ||
                            template.theme?.style ||
                            "modern",
                        },
                        seo: template.seo,
                      },
                      is_premium: true,
                      is_visible: true,
                      updated_at: new Date().toISOString(),
                    });
                    if (error) throw error;
                  }
                  toast.success(
                    "Niche templates synced to database successfully!",
                  );
                  window.location.reload(); // Refresh to show new templates
                } catch (err: any) {
                  toast.error("Failed to sync templates: " + err.message);
                }
              }}
            >
              <RefreshCw className="h-4 w-4" /> Sync Archetype Templates
            </Button>
          </div>
          {editingTemplateId ? (
            <div className="space-y-6">
              <Button
                variant="ghost"
                onClick={() => setEditingTemplateId(null)}
                className="gap-2 rounded-xl mb-4"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Templates
              </Button>
              <WebsiteEditor templateIdOverride={editingTemplateId} />
            </div>
          ) : (
            <TemplateManager onEdit={(id) => setEditingTemplateId(id)} />
          )}
        </TabsContent>

        <TabsContent value="plans">
          <PlanEditor />
        </TabsContent>

        <TabsContent value="blog">
          <BlogCMS isPlatform={true} />
        </TabsContent>

        <TabsContent value="affiliates">
          <SuperAdminAffiliates />
        </TabsContent>

        <TabsContent value="partners">
          <SuperAdminAffiliatePartners
            onViewProfile={(user) => {
              setViewingUser(user);
              setIsViewUserDialogOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="payouts">
          <SuperAdminAffiliates />
        </TabsContent>

        <TabsContent value="policies">
          <PoliciesCMS />
        </TabsContent>

        <TabsContent value="geo">
          <GeoPricingEditor />
        </TabsContent>

        <TabsContent value="archetypes">
          <ArchetypeThemeManager />
        </TabsContent>

        <TabsContent value="support">
          <AdminSupport />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueDashboard />
        </TabsContent>

        <TabsContent value="traffic">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Traffic Analytics
                  </h2>
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  Monitor real-time visitor behavior across the entire platform
                  ecosystem.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select
                  defaultValue="30"
                  onValueChange={(val) => fetchTrafficMetrics(parseInt(val))}
                >
                  <SelectTrigger className="w-full md:w-[180px] rounded-xl border-slate-200 h-11 bg-slate-50/50">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                    <SelectItem value="365">Last 365 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-xl border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95"
                  onClick={() => fetchTrafficMetrics()}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${trafficMetrics.loading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900/50 overflow-hidden group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                    {trafficMetrics.aggregate.totalViews.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full w-fit">
                    <TrendingUp className="h-3 w-3" />
                    <span>Real-time Velocity</span>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </Card>

              <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900/50 overflow-hidden group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Unique Visitors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                    {trafficMetrics.aggregate.uniqueVisitors.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-full w-fit">
                    <Users className="h-3 w-3" />
                    <span>Total Reach</span>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </Card>

              <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900/50 overflow-hidden group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Avg. Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                    {trafficMetrics.aggregate.avgViewsPerVisitor.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full w-fit">
                    <BarChart3 className="h-3 w-3" />
                    <span>Views Per User</span>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 pb-6">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Growth Trajectory
                  </CardTitle>
                  <CardDescription className="font-medium">
                    Daily visualization of views and unique audience scaling.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] p-0 pr-6">
                  {trafficMetrics.loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-10 w-10 animate-spin text-indigo-600/20" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trafficMetrics.trend}>
                        <defs>
                          <linearGradient
                            id="colorViews"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#4f46e5"
                              stopOpacity={0.15}
                            />
                            <stop
                              offset="95%"
                              stopColor="#4f46e5"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorUniques"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.15}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 10,
                            fill: "#94a3b8",
                            fontWeight: 600,
                          }}
                          tickFormatter={(val) => {
                            const d = new Date(val);
                            return d.toLocaleDateString("default", {
                              month: "short",
                              day: "numeric",
                            });
                          }}
                          minTickGap={40}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 10,
                            fill: "#94a3b8",
                            fontWeight: 600,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "16px",
                            border: "none",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                            padding: "12px",
                          }}
                          itemStyle={{
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#4f46e5"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorViews)"
                          name="Total Views"
                        />
                        <Area
                          type="monotone"
                          dataKey="uniques"
                          stroke="#10b981"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorUniques)"
                          name="Unique Visitors"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Globe className="h-5 w-5 text-indigo-600" />
                    Heatmap: Most Visited Paths
                  </CardTitle>
                  <CardDescription className="font-medium">
                    Pinpoint exactly where your platform engagement is
                    concentrated.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trafficMetrics.loading ? (
                      <div className="flex flex-col gap-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="h-14 rounded-2xl bg-slate-50 animate-pulse"
                          />
                        ))}
                      </div>
                    ) : trafficMetrics.topPages.length > 0 ? (
                      trafficMetrics.topPages.map((page, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:bg-white dark:hover:bg-slate-800 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-slate-900 font-black text-xs text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                              {idx + 1}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-[300px]">
                                {page.path}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">
                                Page Endpoint
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className="rounded-lg bg-indigo-600 text-white border-none font-black px-3 py-1 text-xs shadow-md shadow-indigo-100 dark:shadow-none">
                              {page.count.toLocaleString()}
                            </Badge>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Views
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                        <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                          <Globe className="h-8 w-8 opacity-20" />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest opacity-50">
                          Observation Node Offline
                        </p>
                        <p className="text-xs mt-1">
                          Collecting telemetry data from platform edge...
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>
                    Configure global platform parameters.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Platform Name
                    </Label>
                    <Input
                      value={platformSettings.name}
                      onChange={(e) =>
                        setPlatformSettings({
                          ...platformSettings,
                          name: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Support Email
                    </Label>
                    <Input
                      value={platformSettings.supportEmail}
                      onChange={(e) =>
                        setPlatformSettings({
                          ...platformSettings,
                          supportEmail: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Default Trial Days
                    </Label>
                    <Input
                      type="number"
                      value={platformSettings.defaultTrialDays}
                      onChange={(e) =>
                        setPlatformSettings({
                          ...platformSettings,
                          defaultTrialDays: parseInt(e.target.value) || 14,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Tracking & Analytics (Platform)
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            GA4 Measurement ID
                          </Label>
                          <Input
                            value={platformSettings.gaMeasurementId || ""}
                            onChange={(e) =>
                              setPlatformSettings({
                                ...platformSettings,
                                gaMeasurementId: e.target.value,
                              })
                            }
                            placeholder="G-XXXXXXXXXX"
                            className="rounded-xl border-slate-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            Meta Pixel ID
                          </Label>
                          <Input
                            value={platformSettings.metaPixelId || ""}
                            onChange={(e) =>
                              setPlatformSettings({
                                ...platformSettings,
                                metaPixelId: e.target.value,
                              })
                            }
                            placeholder="1234567890"
                            className="rounded-xl border-slate-200"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                          Platform Header Scripts
                        </Label>
                        <Textarea
                          value={platformSettings.trackingScriptsHeader || ""}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              trackingScriptsHeader: e.target.value,
                            })
                          }
                          placeholder="<!-- Global <head> scripts -->"
                          className="rounded-xl font-mono text-xs min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                          Platform Footer Scripts
                        </Label>
                        <Textarea
                          value={platformSettings.trackingScriptsFooter || ""}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              trackingScriptsFooter: e.target.value,
                            })
                          }
                          placeholder="<!-- Global <body> scripts -->"
                          className="rounded-xl font-mono text-xs min-h-[80px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Global AI Orchestration
                        </h3>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Set the fallback models for use cases when a business
                        has no specific override.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {(Object.keys(USE_CASE_LABELS) as AIUseCase[]).map(
                          (useCase) => (
                            <div key={useCase} className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {USE_CASE_LABELS[useCase]}
                              </Label>
                              <Select
                                value={
                                  platformSettings.aiModelConfig?.[useCase] ||
                                  DEFAULT_MODEL_CONFIG[useCase]
                                }
                                onValueChange={(val) =>
                                  setPlatformSettings({
                                    ...platformSettings,
                                    aiModelConfig: {
                                      ...platformSettings.aiModelConfig,
                                      [useCase]: val,
                                    },
                                  })
                                }
                              >
                                <SelectTrigger className="rounded-xl h-10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {AI_MODELS.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                      {m.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          AI Budget Control
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Monthly Budget ($ USD)
                          </Label>
                          <Input
                            type="number"
                            placeholder="e.g., 100"
                            value={platformSettings.maxMonthlyAiBudget || ""}
                            onChange={(e) =>
                              setPlatformSettings({
                                ...platformSettings,
                                maxMonthlyAiBudget:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                            className="rounded-xl"
                          />
                          <p className="text-[10px] text-slate-500 italic">
                            Set to 0 for unlimited (not recommended in
                            production).
                          </p>
                        </div>
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              Current Month Status
                            </span>
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none">
                              {new Date().toLocaleString("default", {
                                month: "long",
                              })}
                            </Badge>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                              $
                              {(
                                aiUsage.monthly?.[
                                  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
                                ]?.cost || 0
                              ).toFixed(4)}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              / ${platformSettings.maxMonthlyAiBudget || "∞"}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                (aiUsage.monthly?.[
                                  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
                                ]?.cost || 0) /
                                  (platformSettings.maxMonthlyAiBudget || 1) >
                                0.9
                                  ? "bg-red-500"
                                  : "bg-indigo-500"
                              }`}
                              style={{
                                width: `${Math.min(100, ((aiUsage.monthly?.[`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`]?.cost || 0) / (platformSettings.maxMonthlyAiBudget || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        Maintenance Mode
                      </p>
                      <p className="text-xs text-slate-500">
                        Disable platform access for all users.
                      </p>
                    </div>
                    <Switch
                      checked={!!platformSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setPlatformSettings({
                          ...platformSettings,
                          maintenanceMode: checked,
                        })
                      }
                    />
                  </div>
                  {platformSettings.maintenanceMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4 p-4 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl bg-indigo-50/30 dark:bg-indigo-900/10"
                    >
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Maintenance Title
                        </Label>
                        <Input
                          value={platformSettings.maintenanceTitle}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              maintenanceTitle: e.target.value,
                            })
                          }
                          className="rounded-xl bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Maintenance Message
                        </Label>
                        <Textarea
                          value={platformSettings.maintenanceMessage}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              maintenanceMessage: e.target.value,
                            })
                          }
                          className="rounded-xl bg-white dark:bg-slate-900 min-h-[100px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Estimated Downtime
                        </Label>
                        <Input
                          value={platformSettings.estimatedDowntime}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              estimatedDowntime: e.target.value,
                            })
                          }
                          className="rounded-xl bg-white dark:bg-slate-900"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                      <CardHeader className="p-8 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                              <CreditCard className="h-6 w-6" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">
                                Stripe Infrastructure
                              </CardTitle>
                              <CardDescription>
                                Connect your business to the global payment
                                economy.
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Primary Gateway
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="p-6 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100/50 dark:border-indigo-900/20 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Shield className="h-12 w-12 text-indigo-600" />
                              </div>
                              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">
                                Core API Credentials
                              </h4>

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                    Secret Key (sk_...)
                                  </Label>
                                  <Input
                                    type="password"
                                    value={
                                      platformSettings.stripeSecretKey || ""
                                    }
                                    onChange={(e) =>
                                      setPlatformSettings({
                                        ...platformSettings,
                                        stripeSecretKey: e.target.value,
                                      })
                                    }
                                    placeholder="sk_test_..."
                                    className="rounded-2xl h-12 bg-white dark:bg-slate-900 border-slate-200"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                    Publishable Key (pk_...)
                                  </Label>
                                  <Input
                                    value={
                                      platformSettings.stripePublishableKey ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      setPlatformSettings({
                                        ...platformSettings,
                                        stripePublishableKey: e.target.value,
                                      })
                                    }
                                    placeholder="pk_test_..."
                                    className="rounded-2xl h-12 bg-white dark:bg-slate-900 border-slate-200"
                                  />
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              className="w-full rounded-2xl h-14 border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-bold tracking-tight transition-all"
                              onClick={handleTestStripe}
                              disabled={testingStripe}
                            >
                              {testingStripe ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Verifying Keys...
                                </>
                              ) : (
                                <>
                                  <Zap className="mr-2 h-4 w-4 fill-current" />
                                  Test Connection Now
                                </>
                              )}
                            </Button>
                          </div>

                          <div className="space-y-6">
                            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative group">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                                Relational Integration
                              </h4>

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                    Webhook Secret (whsec_...)
                                  </Label>
                                  <Input
                                    type="password"
                                    value={
                                      platformSettings.stripeWebhookSecret || ""
                                    }
                                    onChange={(e) =>
                                      setPlatformSettings({
                                        ...platformSettings,
                                        stripeWebhookSecret: e.target.value,
                                      })
                                    }
                                    placeholder="whsec_..."
                                    className="rounded-2xl h-12 bg-white dark:bg-slate-900 border-slate-200"
                                  />
                                  <p className="text-[9px] text-slate-400 pl-1">
                                    Required for real-time payment
                                    notifications.
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                    Connect Client ID (ca_...)
                                  </Label>
                                  <Input
                                    value={
                                      platformSettings.stripeConnectClientId ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      setPlatformSettings({
                                        ...platformSettings,
                                        stripeConnectClientId: e.target.value,
                                      })
                                    }
                                    placeholder="ca_..."
                                    className="rounded-2xl h-12 bg-white dark:bg-slate-900 border-slate-200"
                                  />
                                  <p className="text-[9px] text-slate-400 pl-1">
                                    Required for automated merchant onboarding.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="p-6 bg-amber-50/30 dark:bg-amber-900/10 rounded-[2rem] border border-amber-100/50 dark:border-amber-900/20">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                  <h5 className="text-[11px] font-black text-amber-700 uppercase tracking-wider mb-1">
                                    Configuration Helper
                                  </h5>
                                  <p className="text-[10px] text-amber-600/80 leading-relaxed">
                                    Ensure your Stripe webhook is pointing to:
                                    <br />
                                    <code className="bg-amber-50 px-1 py-0.5 rounded font-mono text-[9px] select-all">
                                      {window.location.origin}/api/webhook
                                    </code>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-indigo-600" />
                          <CardTitle className="text-sm">
                            Marketing Automations
                          </CardTitle>
                        </div>
                        <CardDescription className="text-[10px]">
                          Configure availability of marketing features.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-xs">SEO Audit Tool</Label>
                            <p className="text-[10px] text-slate-500">
                              Enable website SEO analysis feature.
                            </p>
                          </div>
                          <Select
                            value={
                              platformSettings.marketingFeatures?.seoAudit ||
                              "coming_soon"
                            }
                            onValueChange={(val: any) =>
                              setPlatformSettings((prev) => ({
                                ...prev,
                                marketingFeatures: {
                                  ...(prev.marketingFeatures || {
                                    seoAudit: "coming_soon",
                                    adGenerator: "coming_soon",
                                  }),
                                  seoAudit: val,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="w-[120px] h-8 rounded-lg text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="enabled">Enabled</SelectItem>
                              <SelectItem value="disabled">Disabled</SelectItem>
                              <SelectItem value="coming_soon">
                                Coming Soon
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-xs">Ad Generator</Label>
                            <p className="text-[10px] text-slate-500">
                              Enable AI-powered ad copy generation.
                            </p>
                          </div>
                          <Select
                            value={
                              platformSettings.marketingFeatures?.adGenerator ||
                              "coming_soon"
                            }
                            onValueChange={(val: any) =>
                              setPlatformSettings((prev) => ({
                                ...prev,
                                marketingFeatures: {
                                  ...(prev.marketingFeatures || {
                                    seoAudit: "coming_soon",
                                    adGenerator: "coming_soon",
                                  }),
                                  adGenerator: val,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="w-[120px] h-8 rounded-lg text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="enabled">Enabled</SelectItem>
                              <SelectItem value="disabled">Disabled</SelectItem>
                              <SelectItem value="coming_soon">
                                Coming Soon
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="w-full rounded-xl h-12 bg-indigo-600"
                  >
                    {savingSettings ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Platform Settings
                  </Button>

                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider">
                          Danger Zone
                        </h3>
                      </div>
                      <Card className="rounded-2xl border-red-100 dark:border-red-900/30 bg-red-50/20 dark:bg-red-900/5 shadow-none overflow-hidden">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-red-700 dark:text-red-400">
                            Reset Platform Data
                          </CardTitle>
                          <CardDescription className="text-[10px] text-red-600/70">
                            Irreversibly delete all business and user data. This
                            is intended for development cleanup only.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            variant="destructive"
                            className="w-full rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-200 dark:shadow-none"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you absolutely sure you want to clear ALL business and user data? This action is irreversible and will delete all businesses, users, websites, and related records.",
                                )
                              ) {
                                handleClearAllData();
                              }
                            }}
                          >
                            Clear All Platform Data
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Business</DialogTitle>
            <DialogDescription>
              Update business details and subscription plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input
                value={editingBusiness?.name || ""}
                onChange={(e) =>
                  setEditingBusiness({
                    ...editingBusiness,
                    name: e.target.value,
                  })
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input
                value={editingBusiness?.industry || ""}
                onChange={(e) =>
                  setEditingBusiness({
                    ...editingBusiness,
                    industry: e.target.value,
                  })
                }
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={editingBusiness?.plan || "starter"}
                  onValueChange={(value) =>
                    setEditingBusiness({ ...editingBusiness, plan: value })
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="premium">Pro / Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingBusiness?.status || "active"}
                  onValueChange={(value) =>
                    setEditingBusiness({ ...editingBusiness, status: value })
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">
                      Extend Trial (14 Days)
                    </SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateBusiness}
              disabled={savingBusiness}
              className="rounded-xl bg-indigo-600"
            >
              {savingBusiness && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isViewUserDialogOpen}
        onOpenChange={setIsViewUserDialogOpen}
      >
        <DialogContent className="rounded-[2.5rem] max-w-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-indigo-600 p-8 text-white relative">
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsViewUserDialogOpen(false)}
                className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                <Users className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">User Profile</h2>
                <p className="text-indigo-100 opacity-80">
                  Platform User Details
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 bg-white dark:bg-slate-950">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Email Address
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {viewingUser?.email}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  User Role
                </p>
                <Badge
                  variant="outline"
                  className="capitalize bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-100 dark:border-indigo-800"
                >
                  {viewingUser?.role?.replace("_", " ")}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Business ID
                </p>
                <p
                  className="text-xs font-mono text-slate-500 truncate"
                  title={viewingUser?.business_id}
                >
                  {viewingUser?.business_id || "Not Affiliated"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Onboarding
                </p>
                <Badge
                  className={
                    viewingUser?.onboarding_completed
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }
                >
                  {viewingUser?.onboarding_completed ? "Completed" : "Pending"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Account Status
                </p>
                <Badge variant="secondary" className="capitalize">
                  {viewingUser?.status || "Active"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Joined Date
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {viewingUser?.created_at
                    ? new Date(viewingUser.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Security & Access
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  This user has{" "}
                  {viewingUser?.role === "super_admin"
                    ? "full administrative"
                    : "standard"}{" "}
                  access to the platform.
                  {viewingUser?.business_id
                    ? ` They are currently managing business ${viewingUser.business_id.substring(0, 8)}...`
                    : " They are not currently assigned to any business."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              onClick={() => setIsViewUserDialogOpen(false)}
              className="rounded-xl bg-indigo-600 px-8"
            >
              Close Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTerminateDialogOpen}
        onOpenChange={setIsTerminateDialogOpen}
      >
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Terminate User Account
            </DialogTitle>
            <DialogDescription>
              This is a standard workflow for offboarding or removing harmful
              users.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 text-red-700 text-xs leading-relaxed">
              <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Warning: Irreversible Action</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    User will immediately lose all access to the platform.
                  </li>
                  <li>Account status will be marked as "Terminated".</li>
                  <li>Associated business ownership remains but is locked.</li>
                  <li>You can manually delete the record after termination.</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Are you sure you want to terminate{" "}
              <strong>{terminatingUser?.email}</strong>?
            </p>
          </div>
          <DialogFooter className="bg-slate-50 p-6 -mx-6 -mb-6 rounded-b-3xl">
            <Button
              variant="ghost"
              onClick={() => setIsTerminateDialogOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => terminateUser(terminatingUser?.id)}
              className="rounded-xl px-8"
            >
              Confirm Termination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
