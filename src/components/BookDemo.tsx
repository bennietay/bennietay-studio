import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Globe,
  ArrowLeft,
  Send,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Mail,
  Building,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

export default function BookDemo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
    preferredDate: "",
    preferredTime: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save as a lead for the platform
      const { error } = await supabase.from("leads").insert([
        {
          business_id: "platform", // Platform level lead
          name: formData.name,
          email: formData.email,
          phone: "", // Optional in DB usually
          message: `Company: ${formData.company}\nPreferred Date: ${formData.preferredDate}\nPreferred Time: ${formData.preferredTime}\n\nMessage: ${formData.message}`,
          status: "new",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setSubmitted(true);
      toast.success("Demo request submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting demo request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] p-12 text-center shadow-xl border border-slate-100"
        >
          <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Request Received!
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Thank you for your interest in Bennie Tay Studio. Our team will
            review your request and reach out within 24 hours to schedule your
            personalized demo.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-bold"
          >
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2 text-slate-600 hover:text-indigo-600 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="space-y-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
                <Globe className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  Book a Demo
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
                See the future of{" "}
                <span className="text-indigo-600">digital growth</span> in
                action.
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Discover how Bennie Tay Studio can help you synthesize a
                high-converting digital empire with AI. Get a personalized
                walkthrough of our ecosystem.
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: CheckCircle2,
                  text: "Personalized walkthrough of the AI Growth Engine",
                },
                {
                  icon: CheckCircle2,
                  text: "Custom growth strategy for your business niche",
                },
                {
                  icon: CheckCircle2,
                  text: "Overview of enterprise-grade security & infrastructure",
                },
                {
                  icon: CheckCircle2,
                  text: "Q&A with our digital architecture experts",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-slate-700 font-medium">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-200">
              <p className="text-lg italic mb-6">
                "The demo was a game-changer. Seeing the AI synthesize a full
                site in seconds convinced us immediately."
              </p>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 border border-white/30" />
                <div>
                  <p className="font-bold">David Miller</p>
                  <p className="text-xs text-indigo-100 uppercase tracking-widest">
                    CTO, Nexus Digital
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-xl border border-slate-100"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-bold">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      required
                      placeholder="John Doe"
                      className="pl-10 rounded-xl h-12 border-slate-200 focus:ring-indigo-500"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-bold">
                    Work Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="john@company.com"
                      className="pl-10 rounded-xl h-12 border-slate-200 focus:ring-indigo-500"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-slate-700 font-bold">
                  Company Name
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="company"
                    required
                    placeholder="Acme Corp"
                    className="pl-10 rounded-xl h-12 border-slate-200 focus:ring-indigo-500"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-slate-700 font-bold">
                    Preferred Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="date"
                      type="date"
                      className="pl-10 rounded-xl h-12 border-slate-200 focus:ring-indigo-500"
                      value={formData.preferredDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferredDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-slate-700 font-bold">
                    Preferred Time
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="time"
                      type="time"
                      className="pl-10 rounded-xl h-12 border-slate-200 focus:ring-indigo-500"
                      value={formData.preferredTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferredTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-700 font-bold">
                  Anything specific you'd like to see?
                </Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-4 h-4 w-4 text-slate-400" />
                  <Textarea
                    id="message"
                    placeholder="Tell us about your goals..."
                    className="pl-10 rounded-xl min-h-[120px] border-slate-200 focus:ring-indigo-500"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-bold shadow-lg shadow-indigo-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Request Demo <Send className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-slate-400 font-medium">
                By submitting, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
