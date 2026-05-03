import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFeatures } from "../hooks/useFeatures";
import { supabase } from "@/src/lib/supabase";
import { motion } from "motion/react";
import {
  Users,
  Globe,
  BarChart3,
  Zap,
  Calendar,
  MessageSquare,
  ShoppingBag,
  Star,
  Layout,
  FileText,
  ArrowRight,
  ExternalLink,
  Plus,
  AlertCircle,
  Lock,
  Check,
  Sparkles,
  BrainCircuit,
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
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { cn } from "@/src/lib/utils";
import { WebsiteGenerator } from "./WebsiteGenerator";
import { LegalDisclaimer } from "./LegalDisclaimer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AIPerformanceAnalytics } from "./AIPerformanceAnalytics";
import { AIDataAnalyst } from "./AIDataAnalyst";

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

export default function DashboardOverview() {
  const { profile } = useAuth();
  const { isFeatureEnabled } = useFeatures();
  const navigate = useNavigate();
  const [showGenerator, setShowGenerator] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    leads: 0,
    websites: 0,
    appointments: 0,
  });
  const [recentLeads, setRecentLeads] = React.useState<any[]>([]);
  const [recentAppointments, setRecentAppointments] = React.useState<any[]>([]);
  const [business, setBusiness] = React.useState<any>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [activeMainTab, setActiveMainTab] = React.useState("overview");

  const analyticsData = [];

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  React.useEffect(() => {
    if (!profile?.businessId) {
      setLoading(false);
      return;
    }

    const fetchData = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `/api/dashboard/summary/${profile.businessId}`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Dashboard fetch failed (${response.status}):`, errorText);
          throw new Error(`Failed to fetch dashboard summary: ${response.status}`);
        }

        const data = await response.json();

        setStats(data.stats);
        setRecentLeads(data.recentLeads);
        setRecentAppointments(data.recentAppointments);
        setBusiness(data.business);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchData(true);

    const leadsChannel = supabase
      .channel(`dashboard-leads-${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `business_id=eq.${profile.businessId}`,
        },
        () => fetchData(false),
      )
      .subscribe();
    const websitesChannel = supabase
      .channel(`dashboard-websites-${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "websites",
          filter: `business_id=eq.${profile.businessId}`,
        },
        () => fetchData(false),
      )
      .subscribe();
    const apptsChannel = supabase
      .channel(`dashboard-appointments-${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `business_id=eq.${profile.businessId}`,
        },
        () => fetchData(false),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(websitesChannel);
      supabase.removeChannel(apptsChannel);
    };
  }, [profile?.businessId]);

  if (showGenerator) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setShowGenerator(false)}
            className="gap-2 rounded-xl"
          >
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to Overview
          </Button>
        </div>
        <WebsiteGenerator />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Leads",
      value: stats.leads.toString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: stats.leads > 0 ? "+12%" : "0%",
      data: [
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: stats.leads },
      ],
      featureId: "lead_crm",
    },
    {
      label: "Active Sites",
      value: stats.websites.toString(),
      icon: Globe,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      trend: stats.websites > 0 ? "+1" : "0",
      data: [
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: stats.websites },
      ],
      featureId: "ai_synthesis",
    },
    {
      label: "Analytics",
      value: stats.leads > 0 ? "12.5%" : "0%",
      icon: BarChart3,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: "0%",
      data: [
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
      ],
      featureId: "analytics",
    },
    {
      label: "Appointments",
      value: stats.appointments.toString(),
      icon: Calendar,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: "0%",
      data: [
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: stats.appointments },
      ],
      featureId: "booking",
    },
    {
      label: "Chat Activity",
      value: "0",
      icon: MessageSquare,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      trend: "0%",
      data: [
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
      ],
      featureId: "ai_chatbot",
    },
    {
      label: "Store Sales",
      value: "$0",
      icon: ShoppingBag,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: "0%",
      data: [
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
      ],
      featureId: "ecommerce",
    },
    {
      label: "Reviews",
      value: "0",
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: "0",
      data: [
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
        { v: 0 },
      ],
      featureId: "review_management",
    },
  ];

  if (loading && !stats.websites && !recentLeads.length) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
        <p className="text-slate-500 font-medium animate-pulse text-sm">
          Synchronizing your business data...
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <motion.div variants={fadeInUp} className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
            Control Interface v4.0
          </span>
          <h1 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
            Operational.
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
            Monitoring the digital infrastructure for{" "}
            <span className="text-slate-900 dark:text-white font-black">
              {business?.name || "Your Business"}
            </span>
            .
          </p>
        </motion.div>

        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl h-14 w-full lg:w-auto">
          <TabsTrigger
            value="overview"
            className="rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="ai_insights"
            className="rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm flex gap-2"
          >
            <Zap className="h-4 w-4" /> AI Insights
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-12 mt-0">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="space-y-12"
        >
          <motion.div
            variants={fadeInUp}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8"
          >
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <Button
                variant="outline"
                className="flex-1 lg:flex-none h-16 px-8 gap-3 rounded-2xl border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-100"
                onClick={() =>
                  window.open(`/w/${profile?.businessId}`, "_blank")
                }
              >
                <ExternalLink className="h-5 w-5" /> View Live
              </Button>

              <Button
                variant="outline"
                className="flex-1 lg:flex-none h-16 px-8 gap-3 rounded-2xl border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-100"
                onClick={() => navigate("/dashboard/website")}
              >
                <Layout className="h-5 w-5 text-indigo-600" /> Architect
              </Button>

              {profile?.role === "super_admin" && (
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-16 px-8 gap-3 rounded-2xl border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-100"
                  onClick={() => navigate("/dashboard/settings")}
                >
                  <BrainCircuit className="h-5 w-5 text-indigo-600" /> Model
                  Config
                </Button>
              )}

              <Button
                className="w-full lg:w-auto h-16 px-10 gap-3 rounded-2xl bg-slate-950 hover:bg-slate-800 shadow-2xl shadow-slate-200 dark:shadow-none text-white font-black transition-all text-xs uppercase tracking-[0.2em]"
                onClick={() => navigate("/dashboard/website/regenerate")}
              >
                <Sparkles className="h-5 w-5 text-primary" /> Synthesis
              </Button>
            </div>
          </motion.div>

          {/* Setup Progress Widget */}
          {stats.websites === 0 && (
            <motion.div
              variants={fadeInUp}
              className="bg-slate-950 rounded-[3rem] p-10 sm:p-16 text-white relative overflow-hidden group shadow-2xl shadow-indigo-900/20"
            >
              <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
              <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/20 rounded-full border border-primary/30">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">
                      Mission Critical
                    </span>
                  </div>
                  <h2 className="text-5xl sm:text-7xl font-black leading-[0.9] tracking-tighter uppercase">
                    Initialize Your <br />
                    <span className="text-gradient">Empire.</span>
                  </h2>
                  <p className="text-indigo-100/60 text-xl leading-relaxed max-w-lg font-medium">
                    Your business infrastructure is currently offline.
                    Activating your digital presence will immediately unlock
                    global visibility and lead acquisition protocols.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-center gap-5 p-5 rounded-[2rem] bg-white/5 border border-white/10">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <Check className="h-5 w-5 text-emerald-500" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                        Identity Secure
                      </span>
                    </div>
                    <div className="flex items-center gap-5 p-5 rounded-[2rem] bg-white/5 border border-white/20">
                      <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                        <div className="h-3 w-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(79,70,229,1)]" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-primary">
                        Pending Synthesis
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate("/dashboard/website/regenerate")}
                    className="h-20 px-12 rounded-[1.5rem] bg-white text-slate-950 hover:bg-primary hover:text-white font-black text-xl uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all active:scale-95 flex gap-4"
                  >
                    Synthesize Now <ArrowRight className="h-6 w-6" />
                  </Button>
                </div>
                <div className="relative hidden lg:block">
                  <div className="absolute -inset-20 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                  <div className="relative border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl bg-slate-900 p-3 transform hover:rotate-2 transition-transform duration-700">
                    <img
                      src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
                      alt="Setup"
                      className="w-full h-auto rounded-[2rem] opacity-40 grayscale hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    <div className="absolute bottom-10 left-10 right-10">
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "35%" }}
                          className="h-full bg-primary"
                        />
                      </div>
                      <p className="mt-4 text-[10px] uppercase font-black tracking-[0.4em] text-slate-400">
                        Architectural Progress: 35%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {business?.trial_ends_at && stats.websites > 0 && (
            <motion.div variants={fadeInUp}>
              {(() => {
                const trialDaysLeft = Math.ceil(
                  (new Date(business.trial_ends_at).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                );
                const hasStripeSubscription = !!business.stripe_subscription_id;

                if (hasStripeSubscription && trialDaysLeft > 0) {
                  return (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-3xl p-6 flex flex-col sm:flex-row items-center sm:items-center gap-6 text-center sm:text-left">
                      <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200 dark:shadow-none">
                        <Check className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-lg">
                          Subscription Confirmed
                        </h3>
                        <p className="text-emerald-700 dark:text-emerald-300">
                          You've successfully committed to the{" "}
                          <span className="font-bold">{business.plan}</span>{" "}
                          plan. Your billing cycle will begin on{" "}
                          <span className="font-bold">
                            {new Date(
                              business.trial_ends_at,
                            ).toLocaleDateString()}
                          </span>
                          .
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto bg-white dark:bg-emerald-900 text-emerald-600 dark:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-800 border border-emerald-200 dark:border-emerald-800 px-6 py-6 rounded-2xl font-bold"
                        onClick={() => navigate("/dashboard/billing")}
                      >
                        View Billing
                      </Button>
                    </div>
                  );
                }

                if (trialDaysLeft > 0) {
                  return (
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-3xl p-6 flex flex-col sm:flex-row items-center sm:items-center gap-6 text-center sm:text-left">
                      <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200 dark:shadow-none">
                        <Calendar className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-indigo-900 dark:text-indigo-100 text-lg">
                          Free Trial Active
                        </h3>
                        <p className="text-indigo-700 dark:text-indigo-300">
                          Your 14-day free trial ends in{" "}
                          <span className="font-bold">
                            {trialDaysLeft} days
                          </span>
                          . Upgrade now to keep your site live after the trial.
                        </p>
                      </div>
                      <Button
                        className="w-full sm:w-auto bg-white dark:bg-indigo-900 text-indigo-600 dark:text-indigo-100 hover:bg-indigo-100 dark:hover:bg-indigo-800 border border-indigo-200 dark:border-indigo-800 px-6 py-6 rounded-2xl font-bold"
                        onClick={() => navigate("/dashboard/billing")}
                      >
                        Upgrade Plan
                      </Button>
                    </div>
                  );
                } else if (!business.subscription_status) {
                  return (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-3xl p-6 flex flex-col sm:flex-row items-center sm:items-center gap-6 text-center sm:text-left">
                      <div className="h-14 w-14 rounded-2xl bg-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-200 dark:shadow-none">
                        <AlertCircle className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-red-900 dark:text-red-100 text-lg">
                          Trial Expired
                        </h3>
                        <p className="text-red-700 dark:text-red-300">
                          Your free trial has ended. Please upgrade your plan to
                          continue using Bennie Tay Studio.
                        </p>
                      </div>
                      <Button
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-6 rounded-2xl font-bold shadow-lg shadow-red-200 dark:shadow-none"
                        onClick={() => navigate("/dashboard/billing")}
                      >
                        Upgrade Now
                      </Button>
                    </div>
                  );
                }
                return null;
              })()}
            </motion.div>
          )}

          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {statCards
              .filter(
                (stat) =>
                  !stat.featureId || isFeatureEnabled(stat.featureId as any),
              )
              .slice(0, isMobile ? 4 : undefined)
              .map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  variants={fadeInUp}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={cn(
                    "bg-white dark:bg-slate-900 px-8 py-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 group relative overflow-hidden",
                    idx > 3 && "hidden sm:block",
                  )}
                >
                  <div className="flex justify-between items-start mb-10">
                    <div
                      className={cn(
                        "p-4 rounded-2xl transition-all group-hover:rotate-12",
                        stat.bg,
                        "dark:bg-slate-800 shadow-lg shadow-black/5",
                        stat.color,
                      )}
                    >
                      <stat.icon className="h-7 w-7" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full uppercase tracking-widest">
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] truncate mb-2">
                      {stat.label}
                    </p>
                    <h3 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">
                      {stat.value}
                    </h3>
                  </div>
                  <div className="absolute -bottom-6 -right-6 h-32 w-32 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity group-hover:scale-125 duration-700">
                    <stat.icon className="h-full w-full" />
                  </div>
                </motion.div>
              ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              variants={fadeInUp}
              className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300 relative overflow-hidden"
            >
              {!isFeatureEnabled("analytics") && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center p-8 text-center">
                  <div className="h-16 w-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Advanced Analytics Locked
                  </h4>
                  <p className="text-sm text-slate-500 max-w-xs mb-6">
                    Upgrade to Growth or Pro to unlock detailed visitor insights
                    and conversion tracking.
                  </p>
                  <Button
                    onClick={() => navigate("/dashboard/billing")}
                    className="rounded-xl bg-indigo-600 px-8"
                  >
                    Upgrade Now
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Growth Analytics
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your website performance over the last week.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-indigo-600" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Visits
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Leads
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-[350px] w-full">
                {analyticsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData}>
                      <defs>
                        <linearGradient
                          id="colorVisits"
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
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                        className="stroke-slate-200 dark:stroke-slate-800"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        dy={15}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      />
                      <Tooltip
                        cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          backdropFilter: "blur(8px)",
                          borderRadius: "16px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          padding: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="visits"
                        stroke="#4f46e5"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorVisits)"
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center grayscale opacity-50 px-4">
                    <BarChart3 className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium max-w-[250px] mx-auto leading-relaxed">
                      No analytics data available yet.
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                      Statistics will appear here once your site starts
                      receiving traffic.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Recent Leads
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your latest business opportunities.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-indigo-600 hover:text-indigo-700 font-bold rounded-xl"
                  onClick={() => navigate("/dashboard/leads")}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-5 flex-1">
                {recentLeads.length > 0 ? (
                  recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300"
                    >
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-all duration-300 shadow-inner">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                          {lead.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {lead.email}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge
                          variant={
                            lead.status === "new" ? "warning" : "default"
                          }
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest",
                            lead.status === "new"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
                          )}
                        >
                          {lead.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="h-16 w-16 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4">
                      <Users className="h-8 w-8" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                      No leads yet.
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Upcoming Appointments
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 h-7 text-[10px] font-bold"
                    onClick={() => navigate("/dashboard/appointments")}
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-3">
                  {recentAppointments.length > 0 ? (
                    recentAppointments.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                      >
                        <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-600 shadow-sm">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">
                            {app.customer_name}
                          </p>
                          <p className="text-[8px] text-slate-500">
                            {app.date} at {app.time.substring(0, 5)}
                          </p>
                        </div>
                        <Badge className="text-[8px] px-1.5 h-4">
                          {app.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-500 text-center py-2">
                      No appointments scheduled.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 hidden sm:block">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                      Quick Tip
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-indigo-700 dark:text-indigo-400 font-medium">
                    Websites with active blogs generate 67% more leads. Start
                    your first post today!
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Marketing Hub
                    </h3>
                    <p className="text-sm text-slate-500">
                      Accelerate your business growth with these tools.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      title: "AI Copywriter",
                      desc: "Optimize your sales message.",
                      icon: Sparkles,
                      color: "text-indigo-600",
                      bg: "bg-indigo-50",
                      link: "/dashboard/ai-hub",
                    },
                    {
                      title: "Blog Automation",
                      desc: "Schedule weekly SEO articles.",
                      icon: FileText,
                      color: "text-emerald-600",
                      bg: "bg-emerald-50",
                      link: "/dashboard/blog",
                    },
                    {
                      title: "Email Seeding",
                      desc: "Connect with your lead list.",
                      icon: MessageSquare,
                      color: "text-blue-600",
                      bg: "bg-blue-50",
                      link: "/dashboard/leads",
                    },
                    {
                      title: "Review Booster",
                      desc: "Automate customer feedback.",
                      icon: Star,
                      color: "text-amber-600",
                      bg: "bg-amber-50",
                      link: "/dashboard/reviews",
                    },
                  ].map((tool) => (
                    <div
                      key={tool.title}
                      onClick={() => navigate(tool.link)}
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-600 transition-all cursor-pointer group flex items-center gap-4"
                    >
                      <div
                        className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
                          tool.bg,
                          "dark:bg-slate-800",
                          tool.color,
                        )}
                      >
                        <tool.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {tool.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
                          {tool.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <AIDataAnalyst
                stats={stats}
                businessName={business?.name || "Your Business"}
                industry={business?.industry || "Unknown Industry"}
              />
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Edit Website",
                desc: "Customize your layout and content.",
                icon: Layout,
                color: "text-indigo-600",
                link: "/dashboard/website",
              },
              {
                title: "Manage Leads",
                desc: "View and export your customer data.",
                icon: Users,
                color: "text-blue-600",
                link: "/dashboard/leads",
              },
              {
                title: "Write Blog",
                desc: "Share updates and boost your SEO.",
                icon: FileText,
                color: "text-emerald-600",
                link: "/dashboard/blog",
              },
            ].map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.link)}
                className="flex items-center gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-600 dark:hover:border-indigo-500 transition-all duration-300 text-left group"
              >
                <div
                  className={`h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 ${action.color} flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all`}
                >
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {action.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {action.desc}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>

          <motion.div variants={fadeInUp}>
            <LegalDisclaimer />
          </motion.div>
        </motion.div>
      </TabsContent>

      <TabsContent value="ai_insights" className="mt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
              AI Neural Performance
            </h2>
            <p className="text-slate-500 font-medium">
              Real-time telemetry from your business's AI orchestrator.
            </p>
          </div>

          <AIPerformanceAnalytics businessId={profile?.businessId || ""} />
        </motion.div>
      </TabsContent>
    </Tabs>
  );
}
