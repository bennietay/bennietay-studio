/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "../lib/utils";

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Map path segments to readable labels
  const breadcrumbMap: Record<string, string> = {
    dashboard: "Dashboard",
    admin: "Admin",
    leads: "CRM & Leads",
    appointments: "Appointments",
    products: "Products & Store",
    chatbot: "AI Chatbot",
    reviews: "Reviews",
    analytics: "Analytics",
    website: "Website Editor",
    templates: "Templates",
    blog: "Blog CMS",
    policies: "Policies",
    billing: "Subscription",
    settings: "Settings",
    support: "Support",
    profile: "My Profile",
    businesses: "Businesses",
    users: "User Directory",
  };

  return (
    <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
      <Link
        to="/"
        className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const label =
          breadcrumbMap[value] ||
          value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-700" />
            {last ? (
              <span className="text-slate-900 dark:text-white font-bold">
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
