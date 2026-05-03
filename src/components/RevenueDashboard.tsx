import React from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CreditCard,
  Loader2,
  AlertCircle,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { supabase } from "../lib/supabase";

interface MRRMetrics {
  mrr: number;
  activeCustomers: number;
  averageRevenuePerUser: number;
  growthRate: number;
  isLive: boolean;
  chartData: Array<{
    name: string;
    mrr: number;
    subscriptions: number;
  }>;
}

export function RevenueDashboard() {
  const [metrics, setMetrics] = React.useState<MRRMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/platform/mrr-metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Server returned ${response.status}: ${text.slice(0, 100)}`,
        );
      }

      const result = await response.json();
      if (result.success) {
        setMetrics(result.data);
      } else {
        setError(result.error || "Failed to fetch metrics");
      }
    } catch (err) {
      setError("An error occurred while fetching metrics");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-medium animate-pulse">
          Calculating MRR metrics...
        </p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-red-100 bg-red-50/20 rounded-[2rem]">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-900">
              Metrics Unvailable
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
              {error ||
                "We encountered an error while trying to fetch your Stripe revenue data."}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchMetrics}
            className="rounded-xl"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Status Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Revenue Analytics
            {metrics.isLive ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
                Live Stripe Data
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-slate-100 text-slate-600 border-slate-200"
              >
                Simulated Data
              </Badge>
            )}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Real-time overview of your platform revenue and growth.
          </p>
        </div>
        <Button
          onClick={fetchMetrics}
          variant="outline"
          size="sm"
          className="rounded-xl border-indigo-100 text-indigo-600"
        >
          Refresh Metrics
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="h-12 w-12 text-indigo-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              MRR
              <Activity className="h-3 w-3 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              ${metrics.mrr.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
              <ArrowUpRight className="h-3 w-3" />
              {metrics.growthRate}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="h-12 w-12 text-purple-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {metrics.activeCustomers}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
              <ArrowUpRight className="h-3 w-3" />
              +12 this week
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-12 w-12 text-emerald-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              ARPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              ${metrics.averageRevenuePerUser}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Average Revenue Per User
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CreditCard className="h-12 w-12 text-amber-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              2.4%
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
              <ArrowDownRight className="h-3 w-3" />
              -0.5% improvement
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-lg shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>MRR Growth Trend</CardTitle>
                <CardDescription>
                  Monthly recurring revenue over the last 6 months.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full h-8 text-[10px] uppercase tracking-widest font-bold"
                >
                  MRR
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full h-8 text-[10px] uppercase tracking-widest font-bold text-slate-400"
                >
                  Subscribers
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chartData}>
                  <defs>
                    <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
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
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      backgroundColor: "white",
                    }}
                    cursor={{
                      stroke: "#4f46e5",
                      strokeWidth: 2,
                      strokeDasharray: "4 4",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    stroke="#4f46e5"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorMRR)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-lg shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800">
            <CardTitle>Customer Growth</CardTitle>
            <CardDescription>Monthly expansion volume.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.chartData}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      backgroundColor: "white",
                    }}
                  />
                  <Bar
                    dataKey="subscriptions"
                    fill="#8b5cf6"
                    radius={[10, 10, 10, 10]}
                    barSize={20}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advice Card */}
      {!metrics.isLive && (
        <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-indigo-600/20">
          <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 flex-shrink-0">
            <Zap className="h-10 w-10 text-white fill-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold mb-2">
              Connect to Stripe for Real Insights
            </h3>
            <p className="text-indigo-100 opacity-80 text-sm leading-relaxed max-w-2xl">
              You're currently seeing simulated data. To track actual MRR,
              churn, and subscription growth, enter your Stripe API keys in the
              platform settings. This dashboard will automatically switch to
              your live financial data.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button
              variant="secondary"
              className="rounded-xl h-12 px-8 font-bold"
              onClick={() => {
                const settingsTab = document.querySelector(
                  '[value="settings"]',
                ) as HTMLElement;
                settingsTab?.click();
              }}
            >
              Configure Stripe Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
