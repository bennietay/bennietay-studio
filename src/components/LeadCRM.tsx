/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/contexts/AuthContext";
import { supabase } from "@/src/lib/supabase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Users,
  Mail,
  Phone,
  Calendar,
  Trash2,
  MessageSquare,
  Search,
  Filter,
  Plus,
  X,
  Loader2,
  Globe,
} from "lucide-react";
import { Lead } from "../types";
import { formatDate, generateId, cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Skeleton } from "./ui/skeleton";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export function LeadCRM() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.businessId) {
      setLoading(false);
      return;
    }

    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .eq("business_id", profile.businessId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setLeads(data.map(mapLead));
      } catch (err) {
        console.error("Error fetching leads:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();

    const channel = supabase
      .channel("lead-crm-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `business_id=eq.${profile.businessId}`,
        },
        () => fetchLeads(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.businessId]);

  const mapLead = (dbLead: any): Lead => ({
    id: dbLead.id,
    businessId: dbLead.business_id,
    name: dbLead.name,
    email: dbLead.email,
    phone: dbLead.phone,
    message: dbLead.message,
    status: dbLead.status,
    createdAt: new Date(dbLead.created_at).getTime(),
  });

  const updateStatus = async (leadId: string, newStatus: Lead["status"]) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);
      if (error) throw error;

      if (newStatus === "closed") {
        await handleAffiliateConversion(leadId);
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleAffiliateConversion = async (leadId: string) => {
    try {
      // 1. Find if there's a referral for this lead
      const { data: referral } = await supabase
        .from("affiliate_referrals")
        .select("*, affiliates(*)")
        .eq("lead_id", leadId)
        .eq("status", "pending")
        .maybeSingle();

      if (!referral) return;

      const affiliate = referral.affiliates;
      const businessId = affiliate.business_id;

      // 2. Fetch program settings
      const { data: program } = await supabase
        .from("affiliate_programs")
        .select("*")
        .eq("business_id", businessId)
        .single();

      if (!program || !program.is_enabled) return;

      // 3. Fetch tiers
      const { data: tiers } = await supabase
        .from("commission_tiers")
        .select("*")
        .eq("program_id", program.id)
        .order("requirement_value", { ascending: false });

      // 4. Calculate commission
      let commissionRate = program.base_commission_rate;

      // Check for applicable tier based on total sales/referrals
      if (tiers && tiers.length > 0) {
        for (const tier of tiers) {
          let meetsRequirement = false;
          if (
            tier.requirement_type === "referral_count" &&
            affiliate.total_referrals >= tier.requirement_value
          ) {
            meetsRequirement = true;
          } else if (
            tier.requirement_type === "revenue_generated" &&
            affiliate.total_earnings >= tier.requirement_value
          ) {
            meetsRequirement = true;
          }

          if (meetsRequirement) {
            commissionRate = tier.commission_rate;
            break; // Found highest applicable tier due to ordering
          }
        }
      }

      // 5. Update referral and affiliate stats
      const saleAmount = 100; // Placeholder: In a real app, this would be the actual transaction value
      const commissionAmount = saleAmount * commissionRate;

      await supabase
        .from("affiliate_referrals")
        .update({
          status: "converted",
          sale_amount: saleAmount,
          commission_amount: commissionAmount,
        })
        .eq("id", referral.id);

      await supabase
        .from("affiliates")
        .update({
          total_earnings: affiliate.total_earnings + commissionAmount,
          unpaid_earnings: affiliate.unpaid_earnings + commissionAmount,
          total_referrals: affiliate.total_referrals + 1,
        })
        .eq("id", affiliate.id);
    } catch (err) {
      console.error("Affiliate conversion processing failed:", err);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const { error } = await supabase.from("leads").delete().eq("id", leadId);
      if (error) throw error;
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleAddLead = async () => {
    if (!profile?.businessId || !newLead.name || !newLead.email) return;
    setSaving(true);
    try {
      const leadData = {
        ...newLead,
        business_id: profile.businessId,
        status: "new",
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("leads").insert([leadData]);
      if (error) throw error;
      setShowAddModal(false);
      setNewLead({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Add lead failed:", error);
    } finally {
      setSaving(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Lead CRM
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage and track your business prospects with precision.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
          <Button
            onClick={() => setShowAddModal(true)}
            className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
          >
            <Plus className="h-4 w-4" /> Add Lead
          </Button>
        </div>
      </div>

      <motion.div
        variants={fadeInUp}
        className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">
                  Lead
                </th>
                <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">
                  Contact Info
                </th>
                <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">
                  Status
                </th>
                <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">
                  Date
                </th>
                <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-lg shadow-inner">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div
                        className="cursor-pointer min-w-0"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                          {lead.name}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                          {lead.message || "No message"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />{" "}
                        {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />{" "}
                          {lead.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <Badge
                      variant={
                        lead.status === "new"
                          ? "warning"
                          : lead.status === "contacted"
                            ? "default"
                            : "success"
                      }
                      className={cn(
                        "rounded-full px-3 py-0.5 text-[10px] uppercase tracking-widest",
                        lead.status === "new"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : lead.status === "contacted"
                            ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                      )}
                    >
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />{" "}
                      {formatDate(lead.createdAt)}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        className="text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={lead.status}
                        onChange={(e) =>
                          updateStatus(lead.id, e.target.value as any)
                        }
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLead(lead.id)}
                        className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-300 dark:text-slate-700">
                        <Users className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          No leads found
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Try adjusting your search or filters.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* View Lead Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold">Lead Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLead(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
                    {selectedLead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {selectedLead.name}
                    </h2>
                    <Badge
                      variant={
                        selectedLead.status === "new"
                          ? "warning"
                          : selectedLead.status === "contacted"
                            ? "default"
                            : "success"
                      }
                    >
                      {selectedLead.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Email
                    </p>
                    <p className="text-slate-900 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />{" "}
                      {selectedLead.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Phone
                    </p>
                    <p className="text-slate-900 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />{" "}
                      {selectedLead.phone || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Received On
                    </p>
                    <p className="text-slate-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />{" "}
                      {formatDate(selectedLead.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Message
                  </p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                    {selectedLead.message || "No message provided."}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = `mailto:${selectedLead.email}`;
                    updateStatus(selectedLead.id, "contacted");
                  }}
                >
                  Reply via Email
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold">Add New Lead</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    value={newLead.name}
                    onChange={(e) =>
                      setNewLead({ ...newLead, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={newLead.email}
                    onChange={(e) =>
                      setNewLead({ ...newLead, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input
                    value={newLead.phone}
                    onChange={(e) =>
                      setNewLead({ ...newLead, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Message / Notes</Label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    value={newLead.message}
                    onChange={(e) =>
                      setNewLead({ ...newLead, message: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddLead} isLoading={saving}>
                  Create Lead
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
