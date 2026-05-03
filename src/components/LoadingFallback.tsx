/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Zap, Rocket } from "lucide-react";
import { motion } from "motion/react";

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = "Initializing infrastructure...",
}) => {
  return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-950 text-white p-6 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] h-64 w-64 bg-indigo-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] h-64 w-64 bg-emerald-500 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative mb-12">
          {/* Outer Spinners */}
          <div className="h-32 w-32 rounded-full border-4 border-white/5 border-t-indigo-600 animate-[spin_2s_linear_infinite]" />
          <div className="absolute inset-2 h-28 w-28 rounded-full border-2 border-white/5 border-b-emerald-400 animate-[spin_3s_linear_infinite_reverse]" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 bg-slate-900 rounded-[1.5rem] border border-white/10 flex items-center justify-center shadow-2xl">
              <Zap className="h-8 w-8 text-indigo-500 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">
              Synthesizing{" "}
              <span className="text-indigo-500 italic">Ecosystem</span>
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">
              {message}
            </p>
          </motion.div>

          <div className="h-1 w-48 bg-white/5 rounded-full overflow-hidden mx-auto">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-600 to-emerald-400"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Decorative Brand Text */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3 opacity-20">
          <Rocket className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            Bennie Tay Studio v4
          </span>
        </div>
      </div>
    </div>
  );
};
