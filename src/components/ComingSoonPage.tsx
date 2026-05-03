/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Zap, Clock, Bell, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

export default function ComingSoonPage({ settings }: { settings?: any }) {
  const [email, setEmail] = React.useState("");

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("We'll notify you when we're back online!");
    setEmail("");
  };

  const title = settings?.maintenanceTitle || "Coming Soon";
  const message =
    settings?.maintenanceMessage ||
    "We're currently performing some scheduled maintenance to bring you an even better experience. We'll be back shortly!";
  const downtime = settings?.estimatedDowntime || "Approximately 2 hours";
  const supportEmail = settings?.supportEmail || "support@bennietay.com";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-2xl w-full text-center space-y-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex justify-center"
        >
          <div className="h-24 w-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 relative">
            <Zap className="h-12 w-12 text-white" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-8px] border-2 border-dashed border-indigo-600/30 rounded-[2.5rem]"
            />
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight">
              {title.split(" ").map((word, i) => (
                <React.Fragment key={i}>
                  {i === title.split(" ").length - 1 ? (
                    <span className="text-indigo-600">{word}</span>
                  ) : (
                    word + " "
                  )}
                </React.Fragment>
              ))}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed"
          >
            {message}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full">
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-slate-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Estimated Downtime
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {downtime}
              </p>
            </div>
          </div>

          <form onSubmit={handleNotify} className="w-full max-w-md space-y-4">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Get notified when we're back
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
              <Button
                type="submit"
                className="rounded-xl h-12 bg-indigo-600 hover:bg-indigo-700 px-6"
              >
                <Bell className="h-4 w-4 mr-2" /> Notify Me
              </Button>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="pt-12 flex justify-center gap-8"
        >
          <div className="flex items-center gap-2 text-slate-400">
            <Mail className="h-4 w-4" />
            <span className="text-xs font-medium">{supportEmail}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
