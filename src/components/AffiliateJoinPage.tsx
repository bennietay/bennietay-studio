/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Gift,
  TrendingUp,
  Zap,
  Globe,
  Lock,
  Mail,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { generateId } from "@/src/lib/utils";
import { motion } from "motion/react";

export default function AffiliateJoinPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<any>(null);
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    fetchProgramDetails();
  }, [businessId]);

  const fetchProgramDetails = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data: bizData } = await supabase
        .from("businesses")
        .select("name, id")
        .eq("id", businessId)
        .single();

      setBusiness(bizData);

      const { data: progData } = await supabase
        .from("affiliate_programs")
        .select("*")
        .eq("business_id", businessId)
        .single();

      setProgram(progData);

      if (bizData && user) {
        // Check if already an affiliate
        const { data: existing } = await supabase
          .from("affiliates")
          .select("*")
          .eq("uid", user.id)
          .eq("business_id", businessId)
          .maybeSingle();

        if (existing) {
          toast.info("You are already an affiliate for this business.");
          navigate("/dashboard/profile"); // Redirect to profile or some affiliate section
        }
      }
    } catch (err) {
      console.error("Error fetching affiliate program details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(
        "Please login or create an account to join the affiliate program.",
      );
      navigate("/affiliate/signup", {
        state: {
          redirectTo: window.location.pathname,
          cookieDuration: program?.cookieDurationDays,
        },
      });
      return;
    }

    if (!program?.isEnabled) {
      toast.error("This affiliate program is currently inactive.");
      return;
    }

    setJoining(true);
    try {
      const newAffiliate = {
        id: generateId(),
        uid: user.id,
        businessId: businessId,
        referralCode:
          referralCode || `AFF-${generateId().slice(0, 8).toUpperCase()}`,
        status: "active", // or 'pending' if manual approval is needed
        totalEarnings: 0,
        unpaidEarnings: 0,
        totalReferrals: 0,
        createdAt: Date.now(),
      };

      const { error } = await supabase.from("affiliates").insert(newAffiliate);

      if (error) throw error;

      toast.success("Successfully joined the affiliate program!");
      navigate("/dashboard/profile"); // TODO: Redirect to affiliate dashboard when built
    } catch (err) {
      console.error("Error joining affiliate program:", err);
      toast.error(
        "Failed to join program. The referral code might already be taken.",
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <Zap className="h-10 w-10 text-indigo-600 animate-pulse" />
          <p className="text-muted-foreground animate-pulse">
            Loading program details...
          </p>
        </div>
      </div>
    );
  }

  if (!business || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full text-center p-8 space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">Program Not Available</CardTitle>
            <CardDescription>
              We couldn't find an active affiliate program for this business. It
              may have been discontinued or the link is invalid.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            className="w-full rounded-full"
            onClick={() => navigate("/")}
          >
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
      >
        <div className="space-y-8">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="bg-indigo-50 text-indigo-700 border-indigo-200 px-4 py-1 rounded-full text-sm font-semibold"
            >
              Partner with {business.name}
            </Badge>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Earn{" "}
              <span className="text-indigo-600">
                {(program.baseCommissionRate * 100).toFixed(0)}%
              </span>{" "}
              for every successful referral
            </h1>
            <p className="text-xl text-slate-600">
              Join our affiliate network and start earning commissions by
              sharing {business.name} with your audience.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <Gift className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  High Commission Rates
                </h3>
                <p className="text-slate-600">
                  Competitive payouts with tiered bonuses for top performers.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Real-time Tracking</h3>
                <p className="text-slate-600">
                  Monitor your clicks, conversions, and earnings in real-time.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <ShieldCheck className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  30-Day Cookie Period
                </h3>
                <p className="text-slate-600">
                  Get credit for sales that happen within{" "}
                  {program.cookieDurationDays} days of the first click.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="text-2xl">Become an Affiliate</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your details below to activate your partner account.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {!user ? (
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex flex-col items-center text-center space-y-4">
                <UserPlus className="h-10 w-10 text-indigo-600" />
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900">Account Required</h4>
                  <p className="text-sm text-slate-600">
                    You need to be logged in to join our affiliate program.
                  </p>
                </div>
                <Button
                  className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
                  onClick={() =>
                    navigate("/affiliate/signup", {
                      state: {
                        redirectTo: window.location.pathname,
                        cookieDuration: program?.cookieDurationDays,
                      },
                    })
                  }
                >
                  Login / Sign Up to Continue
                </Button>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Display Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={user.email}
                      disabled
                      className="pl-10 h-12 bg-slate-50 border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Custom Referral Code (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. SURPRISE20"
                    value={referralCode}
                    onChange={(e) =>
                      setReferralCode(
                        e.target.value.toUpperCase().replace(/\s/g, ""),
                      )
                    }
                    className="h-12 border-slate-200 focus:ring-indigo-600"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This will be used in your referral links: ?ref=
                    {referralCode || "AUTO"}
                  </p>
                </div>

                <div className="pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-5 rounded border border-slate-300 flex items-center justify-center bg-indigo-600 border-indigo-600">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs text-slate-600">
                      I agree to the Affiliate Terms & Conditions
                    </span>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-600/20"
                    disabled={joining}
                  >
                    {joining ? "Processing..." : "Join Affiliate Program"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="bg-slate-50 p-6 flex items-center justify-center border-t border-slate-100">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
              <Globe className="h-3 w-3" />
              <span>Trusted by affiliates worldwide</span>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
