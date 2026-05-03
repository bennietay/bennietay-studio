import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
  Zap,
  BrainCircuit,
  TrendingUp,
  Cpu,
  Activity,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import { format } from "date-fns";

interface UsageLog {
  id: string;
  use_case: string;
  model_id: string;
  amount: number;
  estimated_cost: number;
  created_at: string;
}

export const AIPerformanceAnalytics = ({
  businessId,
}: {
  businessId: string;
}) => {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  useEffect(() => {
    if (!businessId) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("ai_usage_logs")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching AI analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [businessId]);

  // Data processing for charts
  const getUsageByDay = () => {
    const days: {
      [key: string]: { date: string; credits: number; cost: number };
    } = {};

    logs.forEach((log) => {
      const day = format(new Date(log.created_at), "MMM dd");
      if (!days[day]) {
        days[day] = { date: day, credits: 0, cost: 0 };
      }
      days[day].credits += log.amount;
      days[day].cost += log.estimated_cost;
    });

    return Object.values(days);
  };

  const getUsageByUseCase = () => {
    const cases: { [key: string]: { name: string; value: number } } = {};
    logs.forEach((log) => {
      if (!cases[log.use_case]) {
        cases[log.use_case] = { name: log.use_case.toUpperCase(), value: 0 };
      }
      cases[log.use_case].value += log.amount;
    });
    return Object.values(cases);
  };

  const getUsageByModel = () => {
    const models: {
      [key: string]: { name: string; credits: number; generations: number };
    } = {};
    logs.forEach((log) => {
      if (!models[log.model_id]) {
        models[log.model_id] = {
          name: log.model_id,
          credits: 0,
          generations: 0,
        };
      }
      models[log.model_id].credits += log.amount;
      models[log.model_id].generations += 1;
    });
    return Object.values(models);
  };

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl"
          />
        ))}
      </div>
    );
  }

  const dailyData = getUsageByDay();
  const caseData = getUsageByUseCase();
  const modelData = getUsageByModel();
  const totalCredits = logs.reduce((acc, log) => acc + log.amount, 0);
  const totalCost = logs.reduce((acc, log) => acc + log.estimated_cost, 0);
  const avgCostPerGen =
    logs.length > 0 ? (totalCost / logs.length).toFixed(4) : 0;

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Energy Consumed",
            value: totalCredits,
            icon: Zap,
            color: "text-indigo-600",
          },
          {
            label: "Estimated AI Value",
            value: `$${totalCost.toFixed(2)}`,
            icon: Activity,
            color: "text-emerald-600",
          },
          {
            label: "Total Generations",
            value: logs.length,
            icon: BrainCircuit,
            color: "text-amber-600",
          },
          {
            label: "Avg Efficiency",
            value: `${avgCostPerGen}/gen`,
            icon: Cpu,
            color: "text-indigo-600",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 ${stat.color}`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Usage Chart */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-100 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Efficiency Trends
                </CardTitle>
                <CardDescription>
                  AI resource consumption across the current billing cycle.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="rounded-full border-slate-100 px-4 py-1"
              >
                Active Monitoring
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient
                      id="colorCredits"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      padding: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="credits"
                    stroke="#6366f1"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorCredits)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* UseCase Distribution */}
        <Card className="lg:col-span-1 border-none shadow-xl shadow-slate-100 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800/50">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Strategic Load
            </CardTitle>
            <CardDescription>
              Volume distribution per feature set.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={caseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {caseData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-3">
              {caseData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {Math.round((item.value / totalCredits) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Model Performance */}
        <Card className="lg:col-span-3 border-none shadow-xl shadow-slate-100 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  Orchestration Performance
                </CardTitle>
                <CardDescription>
                  Resources allocated per AI Model node.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="credits"
                    fill="#6366f1"
                    radius={[10, 10, 10, 10]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Zap className="h-64 w-64" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-tighter">
              Real-time Telemetry
            </span>
          </div>
          <h3 className="text-2xl font-black max-w-md leading-tight">
            Advanced Adaptive Models are optimizing your credit usage in
            real-time.
          </h3>
          <p className="text-slate-400 text-sm max-w-sm">
            Our orchestration logic automatically routes simple tasks to smaller
            models to preserve your premium credit balance.
          </p>
        </div>
      </div>
    </div>
  );
};
