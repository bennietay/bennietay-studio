/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
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
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

export function SuperAdminAffiliates() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    pendingPayouts: 0,
    totalPaid: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      const { count: affCount } = await supabase
        .from("affiliates")
        .select("*", { count: "exact", head: true });

      const { data: unpaidSum } = await supabase.rpc("sum_unpaid_earnings");
      const { data: paidSum } = await supabase
        .from("affiliate_payouts")
        .select("amount")
        .eq("status", "processed");

      setStats({
        totalAffiliates: affCount || 0,
        pendingPayouts: unpaidSum || 0,
        totalPaid: paidSum?.reduce((acc, p) => acc + p.amount, 0) || 0,
      });

      // 2. Fetch Pending Payouts
      const { data: pendingPayouts } = await supabase
        .from("affiliate_payouts")
        .select(
          `
          *,
          affiliates (
            referral_code,
            profiles (email)
          )
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingPayouts) setPayouts(pendingPayouts);
    } catch (error) {
      console.error("Error fetching admin affiliate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processPayout = async (payoutId: string) => {
    try {
      const { error } = await supabase
        .from("affiliate_payouts")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", payoutId);

      if (error) throw error;
      toast.success("Payout marked as processed");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to process payout: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-600 mr-2" />
        <span className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">
          Loading Network Data...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Financial & Partners
          </h1>
          <p className="text-slate-500 mt-1">
            Global affiliate management and payout processing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold">
              <Users className="h-4 w-4 text-indigo-500" /> Active Affiliates
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              {stats.totalAffiliates}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold">
              <Clock className="h-4 w-4 text-amber-500" /> Pending Obligations
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              ${stats.pendingPayouts.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Global Paid
              Out
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              ${stats.totalPaid.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold">
              Pending Payout Requests
            </CardTitle>
            <CardDescription className="text-xs">
              Process requested withdrawals from affiliate partners.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-lg h-8">
              <Filter className="h-3 w-3 mr-2" /> Filter
            </Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-6 py-4">Affiliate</th>
                <th className="px-6 py-4">Request Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    No pending payout requests at this time.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">
                          {p.affiliates?.referral_code}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {(p.affiliates?.profiles as any)?.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-black">
                      ${p.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px]">
                        {p.payment_method || "Standard"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200"
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => processPayout(p.id)}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 h-8 text-xs px-4"
                      >
                        Approve & Mark Paid
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
