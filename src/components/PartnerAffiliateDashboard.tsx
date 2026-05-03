/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/card";
import {
  Gift,
  Users,
  CreditCard,
  Copy,
  Share2,
  DollarSign,
  TrendingUp,
  Link as LinkIcon,
  ExternalLink,
  QrCode,
  Mail,
  Twitter,
  Linkedin,
  Facebook,
  Loader2,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Affiliate, AffiliateReferral, AffiliateProgram } from "../types";
import { cn } from "../lib/utils";

export function PartnerAffiliateDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<
    (AffiliateReferral & { leads: any })[]
  >([]);
  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [businessName, setBusinessName] = useState("");

  useEffect(() => {
    if (profile?.uid) {
      fetchAffiliateData();
    }
  }, [profile?.uid]);

  const fetchAffiliateData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Affiliate Record
      const { data: aff, error: affError } = await supabase
        .from("affiliates")
        .select(
          `
          *,
          businesses (name)
        `,
        )
        .eq("uid", profile?.uid)
        .maybeSingle();

      if (aff) {
        setAffiliate({
          id: aff.id,
          uid: aff.uid,
          businessId: aff.business_id,
          referralCode: aff.referral_code,
          status: aff.status,
          totalEarnings: aff.total_earnings,
          unpaidEarnings: aff.unpaid_earnings,
          totalReferrals: aff.total_referrals,
          createdAt: new Date(aff.created_at).getTime(),
        });
        setBusinessName((aff.businesses as any)?.name || "the platform");

        // 2. Fetch Program Rules
        const { data: prog } = await supabase
          .from("affiliate_programs")
          .select("*")
          .eq("business_id", aff.business_id)
          .single();

        if (prog) {
          setProgram({
            id: prog.id,
            businessId: prog.business_id,
            isEnabled: prog.is_enabled,
            baseCommissionRate: prog.base_commission_rate,
            payoutMinimum: prog.payout_minimum,
            cookieDurationDays: prog.cookie_duration_days,
            termsAndConditions: prog.terms_and_conditions,
            createdAt: new Date(prog.created_at).getTime(),
          });
        }

        // 3. Fetch Referrals
        const { data: refs } = await supabase
          .from("affiliate_referrals")
          .select("*, leads(*)")
          .eq("affiliate_id", aff.id)
          .order("created_at", { ascending: false });

        if (refs) setReferrals(refs as any);
      }
    } catch (error) {
      console.error("Error fetching affiliate dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!affiliate) return;
    const link = `${window.location.origin}/site/${affiliate.businessId}?ref=${affiliate.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied to clipboard!");
  };

  const handleRequestPayout = async () => {
    if (!affiliate) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch("/api/affiliate/request-payout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Payout requested: $${data.amount.toFixed(2)}`);
        fetchAffiliateData();
      } else {
        toast.error(data.error || "Failed to request payout");
      }
    } catch (error: any) {
      toast.error("Payout request failed: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Gift className="h-10 w-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Partner Program
        </h2>
        <p className="text-slate-500 mb-8">
          You are not currently enrolled in the affiliate program. Please
          contact the business owner to join.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Partner Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Earning commissions with{" "}
            <span className="font-bold text-indigo-600">{businessName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {affiliate.status === "active" ? (
            <Badge className="bg-emerald-500 flex gap-1 items-center px-3 py-1">
              <CheckCircle2 className="h-3 w-3" /> Active Partner
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="flex gap-1 items-center px-3 py-1 border-amber-200 bg-amber-50 text-amber-700"
            >
              <AlertCircle className="h-3 w-3" /> {affiliate.status}
            </Badge>
          )}
        </div>
      </div>

      {/* Referral Link Card */}
      <Card className="rounded-2xl border-none bg-indigo-600 text-white shadow-xl shadow-indigo-100 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Gift className="h-40 w-40 rotate-12" />
        </div>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <LinkIcon className="h-5 w-5" /> Your Referral Asset
          </CardTitle>
          <CardDescription className="text-indigo-100">
            Share this link to earn {program?.baseCommissionRate || 10}%
            commission on every sale.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
            <div className="flex-1 px-4 py-3 truncate font-mono text-sm">
              {window.location.origin}/site/{affiliate.businessId}?ref=
              {affiliate.referralCode}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={copyReferralLink}
                variant="secondary"
                className="flex-1 sm:flex-none rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-6"
              >
                <Copy className="h-4 w-4 mr-2" /> Copy Link
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-white/30 text-white hover:bg-white/10"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full bg-white/5 hover:bg-white/10 text-xs px-4"
            >
              <Twitter className="h-3 w-3 mr-2" /> Tweet it
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full bg-white/5 hover:bg-white/10 text-xs px-4"
            >
              <Linkedin className="h-3 w-3 mr-2" /> Professional
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full bg-white/5 hover:bg-white/10 text-xs px-4"
            >
              <Facebook className="h-3 w-3 mr-2" /> Community
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full bg-white/5 hover:bg-white/10 text-xs px-4"
            >
              <Mail className="h-3 w-3 mr-2" /> Email List
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Total Earned</CardDescription>
            <CardTitle className="text-2xl font-black">
              ${affiliate.totalEarnings.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Unpaid Balance</CardDescription>
            <CardTitle className="text-2xl font-black text-indigo-600">
              ${affiliate.unpaidEarnings.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Conversions</CardDescription>
            <CardTitle className="text-2xl font-black">
              {referrals.filter((r) => r.status === "converted").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Cookie Clicks</CardDescription>
            <CardTitle className="text-2xl font-black">
              {affiliate.totalReferrals}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-slate-200 overflow-hidden">
            <CardHeader className="border-b border-slate-100 uppercase tracking-widest text-[10px] font-bold text-slate-400 py-3 bg-slate-50">
              <CardTitle className="text-xs">Recent Activity</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-slate-100">
                  {referrals.length === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-center text-slate-400 italic">
                        No activity yet. Share your link to get started!
                      </td>
                    </tr>
                  ) : (
                    referrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center",
                                ref.status === "converted"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-slate-100 text-slate-400",
                              )}
                            >
                              {ref.status === "converted" ? (
                                <CreditCard className="h-4 w-4" />
                              ) : (
                                <Users className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">
                                {ref.leads?.name || "Anonymous Visitor"}
                              </div>
                              <div className="text-[10px] text-slate-400 uppercase tracking-tighter">
                                {ref.status === "converted"
                                  ? "Sale Closed"
                                  : "Lead Captured"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(ref.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {ref.status === "converted" ? (
                            <div className="font-black text-indigo-600">
                              +${ref.commissionAmount.toFixed(2)}
                            </div>
                          ) : (
                            <div className="text-slate-300 font-medium">
                              $0.00
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge
                            variant={
                              ref.status === "converted" ? "default" : "outline"
                            }
                            className={
                              ref.status === "converted" ? "bg-emerald-500" : ""
                            }
                          >
                            {ref.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Program Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Commission Rate</span>
                <span className="font-black text-indigo-600">
                  {program?.baseCommissionRate || 10}%
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Cookie Duration</span>
                <span className="font-bold">
                  {program?.cookieDurationDays || 30} Days
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Payout Minimum</span>
                <span className="font-bold">
                  ${program?.payoutMinimum || 50}
                </span>
              </div>

              <div className="pt-4">
                <Button className="w-full rounded-xl" variant="outline">
                  View Terms & Conditions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-emerald-50 border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-emerald-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Ready for Payout?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-emerald-600 leading-relaxed mb-4">
                Your unpaid balance is{" "}
                <strong>${affiliate.unpaidEarnings.toFixed(2)}</strong>.
                {affiliate.unpaidEarnings >= (program?.payoutMinimum || 50)
                  ? " You've reached the minimum balance! Request a payout below."
                  : ` You need $${((program?.payoutMinimum || 50) - affiliate.unpaidEarnings).toFixed(2)} more to request a payout.`}
              </p>
              <Button
                onClick={handleRequestPayout}
                disabled={
                  affiliate.unpaidEarnings < (program?.payoutMinimum || 50)
                }
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
              >
                Request Payout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
