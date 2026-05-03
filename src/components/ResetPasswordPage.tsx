import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Shield, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const { updatePassword, isSigningIn, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    await updatePassword(password);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 p-10 space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            New Password
          </h1>
          <p className="text-slate-500">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              New Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-100"
            isLoading={isSigningIn}
          >
            Update Password
          </Button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center justify-between gap-3"
            >
              <span className="text-left">{error}</span>
              <button
                onClick={clearError}
                className="shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
