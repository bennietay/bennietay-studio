import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { MessageSquare, Sparkles, Save, Zap, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

export function ChatbotSettings() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [botName, setBotName] = useState("AI Assistant");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hi! How can I help you today?",
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Chatbot settings saved successfully!");
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            AI Chatbot
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Configure your website's intelligent assistant.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-800">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">
            Powered by Gemini
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                  </div>
                  <CardTitle>General Configuration</CardTitle>
                </div>
                <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Bot Display Name</Label>
                <Input
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g. AI Assistant"
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Input
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="e.g. Hi! How can I help you today?"
                  className="rounded-xl h-12"
                />
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  The AI uses your business profile and website content to
                  answer visitor questions. Make sure your business information
                  is up to date in Settings.
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Advanced Training</CardTitle>
              <CardDescription>
                Provide extra context or specific instructions for the AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Custom Instructions (System Prompt)</Label>
                <textarea
                  className="w-full min-h-[150px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. Always be polite, mention our current 20% discount on first bookings..."
                />
              </div>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl gap-2"
              >
                <Zap className="h-4 w-4 text-indigo-600" />
                Auto-generate from Website Content
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="sticky top-8">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 px-2 uppercase tracking-widest">
              Live Preview
            </h4>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[450px]">
              <div className="p-4 bg-indigo-600 text-white flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="font-bold text-xs">{botName}</span>
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none text-[11px] shadow-sm border border-slate-100 dark:border-slate-800 max-w-[85%]">
                    {welcomeMessage}
                  </div>
                </div>
              </div>
              <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg py-2 px-3 text-[10px] text-slate-400">
                    Type a message...
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-slate-500 text-center px-4">
              This is how the chatbot will appear to your website visitors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
