/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  ExternalLink,
  Copy,
  Calendar,
  ArrowUpRight,
  MousePointer2,
  ShoppingCart,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";

export function AffiliateDashboard() {
  const { user } = useAuth();
  const [partnerships, setPartnerships] = useState<any[]>([]);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchAffiliateData();
    }
  }, [user]);

  const fetchAffiliateData = async () => {
    setLoading(true);
    try {
      const { data: affData, error: affError } = await supabase
        .from("affiliates")
        .select("*, businesses(name, id)")
        .eq("uid", user?.id);

      if (affData && affData.length > 0) {
        setPartnerships(affData);
        // Default to first if none selected, or keep current if valid
        const currentId = affiliate?.id;
        const active = currentId
          ? affData.find((a) => a.id === currentId) || affData[0]
          : affData[0];

        setAffiliate(active);
        setBusiness(active.businesses);

        // Fetch referrals, payouts and program settings
        const [refs, pays, prog] = await Promise.all([
          supabase
            .from("affiliate_referrals")
            .select("*")
            .eq("affiliate_id", active.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("affiliate_payouts")
            .select("*")
            .eq("affiliate_id", active.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("affiliate_programs")
            .select("*")
            .eq("business_id", active.business_id)
            .single(),
        ]);

        setReferrals(refs.data || []);
        setPayouts(pays.data || []);
        setProgram(prog.data);
      }
    } catch (err) {
      console.error("Error fetching affiliate data:", err);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const switchPartnership = async (partnership: any) => {
    setAffiliate(partnership);
    setBusiness(partnership.businesses);
    setLoading(true);

    try {
      const [refs, pays, prog] = await Promise.all([
        supabase
          .from("affiliate_referrals")
          .select("*")
          .eq("affiliate_id", partnership.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("affiliate_payouts")
          .select("*")
          .eq("affiliate_id", partnership.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("affiliate_programs")
          .select("*")
          .eq("business_id", partnership.business_id)
          .single(),
      ]);

      setReferrals(refs.data || []);
      setPayouts(pays.data || []);
      setProgram(prog.data);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!affiliate || !program) return;

    if (affiliate.unpaid_earnings < (program.payout_minimum || 50)) {
      toast.error(`Minimum payout is $${program.payout_minimum || 50}`);
      return;
    }

    setRequestingPayout(true);
    try {
      const { error } = await supabase.from("affiliate_payouts").insert({
        affiliate_id: affiliate.id,
        amount: affiliate.unpaid_earnings,
        status: "pending",
      });

      if (error) throw error;

      // Update local unpaid balance (optimistically or refetch)
      // Since reward_affiliate increments it, we might need a way to clear it or wait for admin approval
      // Usually, unpaid_earnings should stay until payout is PROCESSED.

      toast.success("Payout request submitted!");
      fetchAffiliateData();
    } catch (err) {
      console.error("Payout request failed:", err);
      toast.error("Failed to request payout");
    } finally {
      setRequestingPayout(false);
    }
  };

  const copyRefLink = () => {
    if (!affiliate || !business) return;
    const link = `${window.location.origin}/w/${business.id}?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">Loading...</div>
    );
  }

  if (!affiliate) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-bold">No Affiliate Account Found</h2>
        <p className="text-muted-foreground max-w-sm">
          You haven't joined any affiliate programs yet. Browse our marketplace
          or use an invite link to get started.
        </p>
      </div>
    );
  }

  // Group referrals by date for the performance chart
  const performanceData = React.useMemo(() => {
    const last7Days = [...Array(7)]
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      })
      .reverse();

    return last7Days.map((date) => {
      const dayRefs = referrals.filter((r) => r.created_at.startsWith(date));
      return {
        name: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
        conversions: dayRefs.filter((r) => r.status === "converted").length,
        pending: dayRefs.filter((r) => r.status === "pending").length,
      };
    });
  }, [referrals]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Partner Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground">Promoting:</span>
            {partnerships.length > 1 ? (
              <select
                className="bg-transparent border-none font-bold text-indigo-600 focus:ring-0 cursor-pointer p-0 h-auto"
                value={affiliate.id}
                onChange={(e) => {
                  const p = partnerships.find((a) => a.id === e.target.value);
                  if (p) switchPartnership(p);
                }}
              >
                {partnerships.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.businesses.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold text-indigo-600">
                {business.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 px-4 py-1"
          >
            Status: {affiliate.status.toUpperCase()}
          </Badge>
          <Button
            variant="outline"
            className="rounded-full h-11"
            onClick={fetchAffiliateData}
          >
            <Clock className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              Unpaid Earnings
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-indigo-600">
              ${affiliate.unpaid_earnings.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="text-[11px] text-muted-foreground flex items-center">
                <Wallet className="w-3 h-3 mr-1" /> Ready for next payout
              </div>
              <Button
                size="sm"
                className="w-full rounded-xl"
                disabled={
                  requestingPayout ||
                  !affiliate.unpaid_earnings ||
                  affiliate.unpaid_earnings < (program?.payout_minimum || 50)
                }
                onClick={handleRequestPayout}
              >
                {requestingPayout ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Request Payout"
                )}
              </Button>
              {program && (
                <p className="text-[10px] text-center text-slate-400">
                  Min. payout: ${program.payout_minimum}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              Total Referrals
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold">
              {affiliate.total_referrals}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[11px] text-muted-foreground flex items-center">
              <Users className="w-3 h-3 mr-1" /> Lifetime customers referred
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              Total Earnings
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold">
              ${affiliate.total_earnings.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[11px] text-muted-foreground flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> Lifetime partner income
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-indigo-600 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-indigo-100">
              Conversion Rate
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold">4.2%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[11px] text-indigo-200 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Above average
              performance
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Performance Traffic</CardTitle>
              <CardDescription>
                Clicks vs conversions over the last 7 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient
                      id="colorConversions"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorPending"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorConversions)"
                    strokeWidth={3}
                    name="Conversions"
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    stroke="#94a3b8"
                    fillOpacity={1}
                    fill="url(#colorPending)"
                    strokeWidth={3}
                    name="Pending"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg">Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-6 font-bold">ID</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right px-6 font-bold">
                      Commission
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No referrals recorded yet. Share your link to get
                        started!
                      </TableCell>
                    </TableRow>
                  ) : (
                    referrals.map((ref: any) => (
                      <TableRow key={ref.id}>
                        <TableCell className="px-6 font-mono text-xs">
                          {ref.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(ref.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ref.status === "converted"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              ref.status === "converted"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none"
                                : ""
                            }
                          >
                            {ref.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6 font-bold">
                          ${ref.commission_amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden mt-8">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg">Payout History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-6 font-bold">Date</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-32 text-center text-muted-foreground text-xs italic"
                      >
                        No payout history yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payouts.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="px-6 text-xs">
                          {new Date(p.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs font-bold">
                          ${parseFloat(p.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === "processed"
                                ? "default"
                                : p.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-[10px]"
                          >
                            {p.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
            <CardHeader>
              <CardTitle className="text-xl">Your Referral Link</CardTitle>
              <CardDescription className="text-indigo-100">
                Share this link to earn commissions on every lead or sale.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="bg-white/10 p-4 rounded-xl border border-white/20 select-all cursor-copy break-all text-xs font-mono font-bold"
                onClick={copyRefLink}
              >
                {window.location.origin}/w/{business.id}?ref=
                {affiliate.referral_code}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-full border-none h-12"
                  onClick={copyRefLink}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy Link
                </Button>
                <a
                  href={`${window.location.origin}/w/${business.id}?ref=${affiliate.referral_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full border-white/30 bg-white/10 hover:bg-white/20 text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center space-y-2">
              <MousePointer2 className="w-5 h-5 mx-auto text-indigo-500" />
              <div className="text-xl font-bold">128</div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold">
                Clicks
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center space-y-2">
              <ShoppingCart className="w-5 h-5 mx-auto text-indigo-500" />
              <div className="text-xl font-bold">12</div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold">
                Sales
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center space-y-2">
              <Calendar className="w-5 h-5 mx-auto text-indigo-500" />
              <div className="text-xl font-bold">30d</div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold">
                Cookie
              </div>
            </div>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3 group">
                <div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] flex items-center justify-center font-bold mt-0.5 group-hover:scale-110 transition-transform">
                  1
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Share your link on social media with a personal
                  recommendation.
                </p>
              </div>
              <div className="flex items-start space-x-3 group">
                <div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] flex items-center justify-center font-bold mt-0.5 group-hover:scale-110 transition-transform">
                  2
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Create a blog post or video review showing how you use the
                  product.
                </p>
              </div>
              <div className="flex items-start space-x-3 group">
                <div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] flex items-center justify-center font-bold mt-0.5 group-hover:scale-110 transition-transform">
                  3
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Embed your referral link in relevant newsletters or emails.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
