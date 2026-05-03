/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  ArrowRight,
  X,
  Gift,
  TrendingUp,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Lock,
  UserPlus,
  LogIn,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export default function AffiliateAuthPage() {
  const {
    signInWithEmail,
    signUpWithEmail,
    user,
    error,
    clearError,
    isSigningIn,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(
    location.pathname.includes("signup"),
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // If already logged in, redirect to wherever they were going or dashboard
  React.useEffect(() => {
    if (user) {
      const from = (location.state as any)?.redirectTo || "/dashboard";
      navigate(from);
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      if (!agreedToTerms) {
        toast.error("Please agree to the Affiliate Partners Terms of Service");
        return;
      }
      await signUpWithEmail(email, password, "affiliate");
    } else {
      await signInWithEmail(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Side: Branding & Info */}
      <div className="lg:w-5/12 bg-slate-900 p-12 lg:p-20 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 space-y-12">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter">
              Partner Portal
            </span>
          </Link>

          <div className="space-y-6">
            <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              Grow your audience, <br />
              <span className="text-indigo-400">Grow your income.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md">
              Join the official affiliate program and earn top-tier commissions
              for every customer you refer.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="font-bold text-slate-100">Tiered Commissions</p>
                <p className="text-sm text-slate-400">
                  The more you refer, the more you earn per sale.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                <Zap className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-slate-100">Instant Activation</p>
                <p className="text-sm text-slate-400">
                  Start promoting within minutes of signing up.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-slate-100">Transparent Tracking</p>
                <p className="text-sm text-slate-400">
                  Real-time stats and monthly payouts guaranteed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-12 border-t border-white/10">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Partner Network. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="lg:w-7/12 flex items-center justify-center p-8 lg:p-20 bg-white dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-100 dark:border-indigo-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            >
              {isSignUp ? "New Partner" : "Existing Partner"}
            </Badge>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              {isSignUp ? "Create Partner Account" : "Partner Sign In"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {isSignUp
                ? "Start your journey as an official partner today."
                : "Manage your referrals and view your latest earnings."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Password
                  </Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <input
                      type="checkbox"
                      id="agreed"
                      required
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                    <Label
                      htmlFor="agreed"
                      className="text-xs text-slate-500 leading-relaxed cursor-pointer no-select"
                    >
                      I agree to the{" "}
                      <span className="text-indigo-600 font-bold underline">
                        Partner Terms & Conditions
                      </span>
                      . I understand commissions are paid monthly after a{" "}
                      {location.state?.cookieDuration || 30}-day clearance
                      period.
                    </Label>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-1 active:scale-[0.98]"
              disabled={isSigningIn}
            >
              {isSigningIn ? (
                <>
                  <Zap className="mr-2 h-5 w-5 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  {isSignUp ? (
                    <UserPlus className="mr-2 h-5 w-5" />
                  ) : (
                    <LogIn className="mr-2 h-5 w-5" />
                  )}
                  {isSignUp
                    ? "Launch My Partnership"
                    : "Access Partner Dashboard"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              {isSignUp
                ? "Already have a partner account?"
                : "Want to join our network?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-600 font-black hover:underline ml-1"
              >
                {isSignUp ? "Sign In" : "Create Account"}
              </button>
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center justify-between gap-3"
              >
                <div className="flex flex-col gap-1">
                  <span>{error}</span>
                  {error.toLowerCase().includes("already registered") &&
                    isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(false);
                          clearError();
                        }}
                        className="text-[10px] font-bold underline text-left uppercase tracking-widest"
                      >
                        Sign In Now →
                      </button>
                    )}
                </div>
                <button
                  onClick={clearError}
                  className="shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
