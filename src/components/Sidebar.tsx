/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useFeatures, FeatureId } from "../hooks/useFeatures";
import { UserRole } from "../types";
import {
  LayoutDashboard,
  Layout,
  Globe,
  Users,
  FileText,
  Settings,
  BarChart3,
  PlusCircle,
  LogOut,
  CreditCard,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Lock,
  ShoppingBag,
  MessageSquare,
  Star,
  Zap,
  Headphones,
  Sparkles,
  Gift,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  role,
  onLogout,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { profile } = useAuth();
  const { isFeatureEnabled } = useFeatures();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAffiliate, setIsAffiliate] = React.useState(false);

  React.useEffect(() => {
    const checkAffiliate = async () => {
      const { data } = await supabase
        .from("affiliates")
        .select("id")
        .eq("uid", profile?.uid)
        .maybeSingle();
      if (data) setIsAffiliate(true);
    };
    if (profile?.uid) checkAffiliate();
  }, [profile?.uid]);

  const superAdminLinks = [
    {
      to: "/admin",
      icon: LayoutDashboard,
      label: "Platform Overview",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/admin/businesses",
      icon: Globe,
      label: "Businesses",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/admin/users",
      icon: Users,
      label: "User Directory",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/admin/landing",
      icon: Layout,
      label: "Landing CMS",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/admin/plans",
      icon: Zap,
      label: "Plans",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/admin/templates",
      icon: Layout,
      label: "Templates",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/admin/support",
      icon: Headphones,
      label: "Support Tickets",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/admin/policies",
      icon: FileText,
      label: "Platform Policies",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/admin/blog",
      icon: FileText,
      label: "Platform Blog",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/admin/affiliates",
      icon: Gift,
      label: "Affiliates",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/admin/analytics",
      icon: BarChart3,
      label: "Growth Analytics",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/profile",
      icon: Users,
      label: "My Profile",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/admin/settings",
      icon: Settings,
      label: "Platform Settings",
      featureId: undefined as FeatureId | undefined,
    },
  ];

  const businessAdminLinks = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/website/regenerate",
      icon: Sparkles,
      label: "AI Website Builder",
      featureId: "ai_synthesis" as FeatureId | undefined,
    },
    {
      to: "/dashboard/website",
      icon: Globe,
      label: "Website Editor",
      featureId: "ai_synthesis" as FeatureId | undefined,
    },
    {
      to: "/dashboard/templates",
      icon: Layout,
      label: "Website Templates",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/leads",
      icon: Users,
      label: "CRM & Leads",
      featureId: "lead_crm" as FeatureId | undefined,
    },
    {
      to: "/dashboard/appointments",
      icon: CalendarIcon,
      label: "Appointments",
      featureId: "booking" as FeatureId | undefined,
    },
    {
      to: "/dashboard/products",
      icon: ShoppingBag,
      label: "Products & Store",
      featureId: "ecommerce" as FeatureId | undefined,
    },
    {
      to: "/dashboard/chatbot",
      icon: MessageSquare,
      label: "AI Chatbot",
      featureId: "ai_chatbot" as FeatureId | undefined,
    },
    {
      to: "/dashboard/reviews",
      icon: Star,
      label: "Reviews",
      featureId: "review_management" as FeatureId | undefined,
    },
    {
      to: "/dashboard/team",
      icon: Users,
      label: "Team Management",
      roles: ["business_admin"],
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/affiliates",
      icon: Gift,
      label: "Affiliate Program",
      featureId: "affiliate_system" as FeatureId | undefined,
    },
    {
      to: "/dashboard/automations",
      icon: Zap,
      label: "Automations",
      featureId: "automation" as FeatureId | undefined,
    },
    {
      to: "/dashboard/blog",
      icon: FileText,
      label: "Blog CMS",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/policies",
      icon: FileText,
      label: "Policies",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/analytics",
      icon: BarChart3,
      label: "Business Stats",
      featureId: "analytics" as FeatureId | undefined,
    },
    {
      to: "/dashboard/support",
      icon: Headphones,
      label: "Help & Support",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/billing",
      icon: CreditCard,
      label: "Subscription",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/profile",
      icon: Users,
      label: "My Profile",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/settings",
      icon: Settings,
      label: "Settings",
      featureId: undefined as FeatureId | undefined,
    },
  ];

  const clientLinks = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Overview",
      featureId: undefined as FeatureId | undefined,
    },
    isAffiliate
      ? {
          to: "/dashboard/affiliate/dashboard",
          icon: Gift,
          label: "Affiliate Dashboard",
          featureId: undefined as FeatureId | undefined,
        }
      : null,
    {
      to: "/dashboard/leads",
      icon: Users,
      label: "CRM & Leads",
      featureId: "lead_crm" as FeatureId | undefined,
    },
    {
      to: "/dashboard/appointments",
      icon: CalendarIcon,
      label: "Appointments",
      featureId: "booking" as FeatureId | undefined,
    },
    {
      to: "/dashboard/profile",
      icon: Users,
      label: "My Profile",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/support",
      icon: Headphones,
      label: "Help & Support",
      featureId: undefined as FeatureId | undefined,
    },
  ];

  const affiliateLinks = [
    {
      to: "/dashboard/affiliate/dashboard",
      icon: LayoutDashboard,
      label: "Affiliate Overview",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/profile",
      icon: Users,
      label: "My Partner Profile",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/support",
      icon: Headphones,
      label: "Partner Support",
      featureId: undefined as FeatureId | undefined,
    },
    {
      to: "/dashboard/settings",
      icon: Settings,
      label: "Account Settings",
      featureId: undefined as FeatureId | undefined,
    },
  ];

  const links = (() => {
    let baseLinks = [];
    if (role === "super_admin") baseLinks = superAdminLinks;
    else if (role === "business_admin" || role === "staff") {
      baseLinks = [
        { label: "Core Builder", type: "header" },
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        {
          to: "/dashboard/website/regenerate",
          icon: Sparkles,
          label: "AI Website Builder",
          featureId: "ai_synthesis",
        },
        {
          to: "/dashboard/website",
          icon: Globe,
          label: "Website Editor",
          featureId: "ai_synthesis",
        },
        {
          to: "/dashboard/templates",
          icon: Layout,
          label: "Website Templates",
        },

        { label: "Growth Ecosystem", type: "header" },
        {
          to: "/dashboard/ai-hub",
          icon: Sparkles,
          label: "AI Content Hub",
          featureId: "marketing",
        },
        {
          to: "/dashboard/leads",
          icon: Users,
          label: "CRM & Leads",
          featureId: "lead_crm",
        },
        {
          to: "/dashboard/appointments",
          icon: CalendarIcon,
          label: "Appointments",
          featureId: "booking",
        },
        {
          to: "/dashboard/products",
          icon: ShoppingBag,
          label: "Products & Store",
          featureId: "ecommerce",
        },
        {
          to: "/dashboard/chatbot",
          icon: MessageSquare,
          label: "AI Chatbot",
          featureId: "ai_chatbot",
        },
        {
          to: "/dashboard/reviews",
          icon: Star,
          label: "Reviews",
          featureId: "review_management",
        },
        {
          to: "/dashboard/affiliates",
          icon: Gift,
          label: "Affiliates",
          featureId: "affiliate_system",
        },
        {
          to: "/dashboard/automations",
          icon: Zap,
          label: "Automations",
          featureId: "automation",
        },

        { label: "Content & Trust", type: "header" },
        { to: "/dashboard/blog", icon: FileText, label: "Blog CMS" },
        { to: "/dashboard/policies", icon: FileText, label: "Policies" },

        { label: "Management", type: "header" },
        {
          to: "/dashboard/analytics",
          icon: BarChart3,
          label: "Analytics",
          featureId: "analytics",
        },
        {
          to: "/dashboard/team",
          icon: Users,
          label: "Team",
          roles: ["business_admin"],
        },
        { to: "/dashboard/billing", icon: CreditCard, label: "Subscription" },
        { to: "/dashboard/support", icon: Headphones, label: "Help Center" },
        { to: "/dashboard/settings", icon: Settings, label: "Settings" },

        isAffiliate
          ? {
              to: "/dashboard/affiliate/dashboard",
              icon: Gift,
              label: "Partner Earnings",
            }
          : null,
      ];
    } else if (role === "affiliate") baseLinks = affiliateLinks;
    else baseLinks = clientLinks;

    return baseLinks.filter((link) => {
      if (!link) return false;
      if (link.type === "header") return true;
      if (link.featureId && !isFeatureEnabled(link.featureId)) return false;
      if (link.roles && !link.roles.includes(role)) return false;
      return true;
    });
  })() as any[];

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-500 ease-in-out relative",
        isCollapsed ? "w-20" : "w-72",
      )}
    >
      {/* Collapse Toggle Button (Desktop) */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute -right-3 top-24 h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-indigo-600 shadow-sm z-50 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-3 font-bold text-slate-900 dark:text-white overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
            <Globe className="h-6 w-6" />
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col whitespace-nowrap"
              >
                <span className="text-lg leading-none tracking-tight">
                  Studio Pro
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Control Center
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        <nav className="space-y-1.5">
          {links.map((link, idx) => {
            if (link.type === "header") {
              if (isCollapsed)
                return (
                  <div
                    key={idx}
                    className="h-px bg-slate-100 dark:bg-slate-800 my-4 mx-2"
                  />
                );
              return (
                <div key={idx} className="mt-8 mb-4 px-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {link.label}
                  </span>
                </div>
              );
            }

            const isActive =
              location.pathname === link.to ||
              (link.to !== "/admin" &&
                link.to !== "/dashboard" &&
                location.pathname.startsWith(link.to));
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={cn(
                  "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100",
                )}
              >
                {isActive && (
                  <>
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl -z-10 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.1)]"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  </>
                )}
                <link.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-all duration-300",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300",
                    isCollapsed ? "mx-auto" : "mr-3",
                  )}
                />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="whitespace-nowrap flex-1"
                  >
                    {link.label}
                  </motion.span>
                )}

                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {link.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-200 dark:border-slate-800 p-4">
        <div
          className={cn(
            "mb-4 flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 transition-all duration-300",
            isCollapsed ? "justify-center" : "",
          )}
        >
          <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shadow-inner">
            {profile?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              className="flex flex-col min-w-0"
            >
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {profile?.email?.split("@")[0]}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate uppercase tracking-tighter">
                {(profile?.role || "").replace("_", " ")}
              </span>
            </motion.div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={cn(
            "flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 transition-all duration-200",
            isCollapsed ? "justify-center" : "",
          )}
        >
          <LogOut
            className={cn("h-5 w-5 transition-all", isCollapsed ? "" : "mr-3")}
          />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
