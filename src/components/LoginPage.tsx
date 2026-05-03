import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { Globe, ArrowRight, X, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

export default function LoginPage({
  initialSignUp = false,
}: {
  initialSignUp?: boolean;
}) {
  const {
    signInWithEmail,
    signUpWithEmail,
    user,
    error,
    clearError,
    isSigningIn,
  } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = React.useState(initialSignUp);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      if (!agreedToTerms) {
        toast.error("Please agree to the Terms of Service and Privacy Policy");
        return;
      }

      // Handle Platform Referral
      const refCode = localStorage.getItem("ref_platform");
      if (refCode) {
        // We'll pass this through cookies or session or just handle it post-signup in a hook
      }

      await signUpWithEmail(email, password);
    } else {
      await signInWithEmail(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 p-10 space-y-8"
      >
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200">
              <Globe className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-slate-500">
              {isSignUp
                ? "Start your 14-day free trial today."
                : "Sign in to manage your business empire."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {user && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mb-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-widest">
                <AlertTriangle className="h-4 w-4" /> Session Detected
              </div>
              <p className="text-xs text-amber-700">
                You are currently signed in as{" "}
                <span className="font-bold">{user.email}</span>. Resetting the
                system allows you to log in with a different account.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full bg-white border-amber-200 text-amber-700 hover:bg-amber-100 h-9 rounded-xl font-bold"
                onClick={async () => {
                  const { error } = await supabase.auth.signOut();
                  if (!error) {
                    window.location.reload();
                  }
                }}
              >
                Sign Out & Reset System
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white"
            />
          </div>

          {isSignUp && (
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:border-indigo-100">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
              />
              <label
                htmlFor="terms"
                className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none"
              >
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => navigate("/terms")}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => navigate("/privacy")}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Privacy Policy
                </button>
                . I understand that AI-generated content requires human review.
              </label>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-100"
            isLoading={isSigningIn}
          >
            {isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <div className="space-y-4">
          <p className="text-center text-sm text-slate-500">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-600 font-bold hover:underline"
            >
              {isSignUp ? "Sign In" : "Create One"}
            </button>
          </p>

          {!isSignUp && (
            <p className="text-center text-xs text-slate-400 leading-relaxed">
              By signing in, you agree to our{" "}
              <button
                onClick={() => navigate("/terms")}
                className="text-indigo-600 font-bold hover:underline"
              >
                Terms
              </button>{" "}
              and{" "}
              <button
                onClick={() => navigate("/privacy")}
                className="text-indigo-600 font-bold hover:underline"
              >
                Privacy Policy
              </button>
              .
            </p>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center justify-between gap-3"
            >
              <div className="flex flex-col gap-1">
                <span className="text-left">{error}</span>
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
                className="shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-4 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
