import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Zap,
  Target,
  Users,
  Layout,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { askAI } from "../lib/gemini";
import { toast } from "sonner";

interface AIDataAnalystProps {
  stats: {
    leads: number;
    websites: number;
    appointments: number;
  };
  businessName: string;
  industry: string;
}

export function AIDataAnalyst({
  stats,
  businessName,
  industry,
}: AIDataAnalystProps) {
  const [analyzing, setAnalyzing] = React.useState(false);
  const [insight, setInsight] = React.useState<any | null>(null);

  const performAnalysis = async () => {
    setAnalyzing(true);
    try {
      const prompt = `Perform a high-level strategic data analysis for "${businessName}" in the "${industry}" industry.
      
      Current Metrics:
      - Total Leads: ${stats.leads}
      - Active Websites: ${stats.websites}
      - Scheduled Appointments: ${stats.appointments}
      
      Provide a strategic assessment in JSON format with:
      1. status: "optimal", "scaling", or "attention_required"
      2. primaryInsight: A strong, data-driven observation.
      3. quickWin: One immediate action to improve numbers.
      4. longTermStrategy: A 3-month growth suggestion.
      5. confidenceScore: 0-100.
      `;

      const response = await askAI("marketing", prompt, { isJson: true });
      setInsight(response);
      toast.success("AI Analysis complete.");
    } catch (error) {
      console.error(error);
      toast.error("AI Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 group">
      <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Neural Growth Analyst
              </CardTitle>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                Real-time Strategic Intelligence
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={performAnalysis}
            disabled={analyzing}
            className="rounded-xl h-10 px-6 border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 font-bold"
          >
            {analyzing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" /> Analyze Data
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <AnimatePresence mode="wait">
          {!insight && !analyzing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center text-center space-y-4"
            >
              <div className="h-20 w-20 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 animate-pulse">
                <BrainCircuit className="h-10 w-10" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Awaiting Neurological Input
                </p>
                <p className="text-xs text-slate-500 max-w-[240px] mt-1 mx-auto leading-relaxed">
                  The growth engine is ready to process your current business
                  telemetry.
                </p>
              </div>
            </motion.div>
          ) : analyzing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center space-y-6"
            >
              <div className="relative">
                <div className="h-20 w-20 rounded-[2rem] bg-indigo-600/10 flex items-center justify-center">
                  <BrainCircuit className="h-10 w-10 text-indigo-600 animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-[2rem] border-2 border-indigo-600/20 animate-ping" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-sm font-bold text-slate-900 dark:text-white animate-pulse">
                  Running Multi-Agent Simulation...
                </p>
                <div className="flex gap-1 justify-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      className="h-1.5 w-1.5 rounded-full bg-indigo-600"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <Badge
                  className={cn(
                    "rounded-full px-4 py-1 text-[10px] uppercase font-black tracking-[0.2em] border-0",
                    insight.status === "optimal"
                      ? "bg-emerald-500 text-white"
                      : insight.status === "scaling"
                        ? "bg-indigo-600 text-white"
                        : "bg-amber-500 text-white",
                  )}
                >
                  Status: {insight.status.replace("_", " ")}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    Confidence
                  </span>
                  <span className="text-xs font-bold text-indigo-600">
                    {insight.confidenceScore}%
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Primary Insight
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                  {insight.primaryInsight}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700/70">
                      Quick Win
                    </span>
                  </div>
                  <p className="text-xs font-bold text-emerald-900">
                    {insight.quickWin}
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700/70">
                      Macro Strategy
                    </span>
                  </div>
                  <p className="text-xs font-bold text-indigo-900">
                    {insight.longTermStrategy}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                className="w-full h-12 rounded-xl group/btn hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() =>
                  toast.info(
                    "Detailed AI Strategy report generated in your automations hub!",
                  )
                }
              >
                <span className="text-xs font-bold text-slate-600">
                  Explore Full Strategic Breakdown
                </span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
