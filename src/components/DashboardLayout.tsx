/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { UserRole } from "../types";
import {
  Menu,
  X,
  Sun,
  Moon,
  Settings,
  AlertTriangle,
  Loader2,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { TrialReminder } from "./TrialReminder";
import { Business } from "../types";
import { NotificationCenter } from "./NotificationCenter";
import { Helmet } from "react-helmet-async";

interface DashboardLayoutProps {
  role: UserRole;
  children: React.ReactNode;
  onLogout: () => void;
}

export function DashboardLayout({
  role,
  children,
  onLogout,
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("settings")
        .select("content")
        .eq("id", "platform")
        .maybeSingle();
      if (data?.content) {
        setPlatformSettings(data.content);
        setMaintenanceMode(data.content.maintenanceMode);
      }
    };
    fetchSettings();

    const fetchBusiness = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (profileData?.business_id) {
        const { data: bizData } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", profileData.business_id)
          .single();

        if (bizData) {
          setBusiness({
            id: bizData.id,
            name: bizData.name,
            ownerId: bizData.owner_id,
            plan: bizData.plan,
            status: bizData.status,
            aiCredits: bizData.ai_credits || 0,
            aiCreditsUsed: bizData.ai_credits_used || 0,
            trialEndsAt: new Date(bizData.trial_ends_at).getTime(),
            subscriptionStatus: bizData.subscription_status,
            createdAt: new Date(bizData.created_at).getTime(),
          } as Business);
        }
      }
    };
    fetchBusiness();

    const channel = supabase
      .channel("platform_settings_layout")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settings",
          filter: "id=eq.platform",
        },
        (payload: any) => {
          if (payload.new?.content)
            setMaintenanceMode(payload.new.content.maintenanceMode);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleSettingsClick = () => {
    if (role === "super_admin") {
      navigate("/admin/settings");
    } else {
      navigate("/dashboard/settings");
    }
  };

  if (!role) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden transition-colors duration-300 flex-col">
      <Helmet>
        {/* Platform GA4 */}
        {platformSettings?.gaMeasurementId && (
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${platformSettings.gaMeasurementId}`}
          />
        )}
        {platformSettings?.gaMeasurementId && (
          <script>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${platformSettings.gaMeasurementId}');
            `}
          </script>
        )}

        {/* Platform Meta Pixel */}
        {platformSettings?.metaPixelId && (
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
              fbq('init', '${platformSettings.metaPixelId}');
              fbq('track', 'PageView');
            `}
          </script>
        )}

        {/* Global Platform Header Scripts */}
        {platformSettings?.trackingScriptsHeader && (
          <script
            dangerouslySetInnerHTML={{
              __html: platformSettings.trackingScriptsHeader,
            }}
          />
        )}
      </Helmet>
      {business && <TrialReminder business={business} />}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Container */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 transform transition-all duration-500 ease-in-out lg:relative lg:translate-x-0 flex-shrink-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
            isCollapsed ? "w-20" : "w-72",
          )}
        >
          <Sidebar
            role={role as any}
            onLogout={onLogout}
            onClose={() => setIsSidebarOpen(false)}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 sm:px-10 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <Menu className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </Button>
              <div className="hidden lg:flex flex-col">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                  {(role || "").replace("_", " ")} Panel
                </h2>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Enterprise Management
                </p>
              </div>
              {maintenanceMode && role === "super_admin" && (
                <Badge
                  variant="outline"
                  className="ml-4 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 animate-pulse"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" /> Maintenance Mode
                  Active
                </Badge>
              )}
              {role === "business_admin" && business && (
                <Badge
                  variant="outline"
                  className="ml-4 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800 flex gap-2 py-1 px-3"
                >
                  <Sparkles className="h-3 w-3" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">
                    {business.aiCredits || 0} AI Credits Remaining
                  </span>
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    theme === "light"
                      ? "bg-white text-amber-500 shadow-sm"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    theme === "dark"
                      ? "bg-slate-700 text-indigo-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-300",
                  )}
                >
                  <Moon className="h-4 w-4" />
                </button>
              </div>

              <NotificationCenter />

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="flex gap-2 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 group"
              >
                <LogOut className="h-4 w-4 text-slate-500 group-hover:text-red-500" />
                <span className="hidden sm:inline text-xs font-bold">
                  Sign Out
                </span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSettingsClick}
                className="hidden sm:flex gap-2 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold">Settings</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 sm:p-10 transition-colors duration-300">
            <div className="mx-auto max-w-7xl">
              <Breadcrumbs />
              {children}
            </div>
          </main>
        </div>
        {platformSettings?.trackingScriptsFooter && (
          <div
            dangerouslySetInnerHTML={{
              __html: platformSettings.trackingScriptsFooter,
            }}
          />
        )}
      </div>
    </div>
  );
}
