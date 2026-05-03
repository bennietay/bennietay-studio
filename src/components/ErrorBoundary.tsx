/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Shield, Home } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong during the synthesis process.";
      let errorSubMessage =
        "An unexpected error occurred. Our engineers have been notified.";

      try {
        // Check if it's a Firestore error JSON (kept for backward compatibility with existing pattern)
        const parsedError = JSON.parse(this.state.error?.message || "");
        if (parsedError.error) {
          errorMessage = "Critical Operation Failure";
          errorSubMessage = parsedError.error;
        }
      } catch (e) {
        // Not a JSON error, use the raw error message if it exists
        if (this.state.error?.message) {
          errorSubMessage = this.state.error.message;
        }
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center antialiased">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.1),transparent_70%)] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="mb-8 relative inline-block">
              <div className="h-24 w-24 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-10 w-10 text-red-500 animate-pulse" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-red-400" />
              </div>
            </div>

            <h1 className="mb-4 text-4xl font-black text-white uppercase tracking-tighter leading-none">
              System Interrupt
            </h1>

            <div className="mb-8 p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl">
              <p className="text-lg font-bold text-slate-200 mb-2">
                {errorMessage}
              </p>
              <p className="text-sm text-slate-400 font-medium">
                {errorSubMessage}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => window.location.reload()}
                className="h-14 px-8 rounded-2xl bg-white text-slate-950 hover:bg-indigo-600 hover:text-white font-black uppercase tracking-widest text-xs transition-all w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Initialize Recovery
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="h-14 px-8 rounded-2xl border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest text-xs w-full sm:w-auto"
              >
                Return to Core
              </Button>
            </div>

            <p className="mt-12 text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
              Bennie Tay Studio Security Protocol v4.0.2
            </p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
