/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Shield,
  Scale,
  ArrowLeft,
  Globe,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import ReactMarkdown from "react-markdown";
import { DEFAULT_POLICIES } from "../constants/defaultPolicies";

interface PolicyPageProps {
  type: "privacy" | "terms";
}

interface PolicyData {
  title: string;
  content: string;
  updatedAt?: string | number;
}

export function PolicyPage({ type }: PolicyPageProps) {
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const slug = type === "privacy" ? "privacy-policy" : "terms-of-service";

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("settings")
          .select("content")
          .eq("id", "platform_policies")
          .maybeSingle();

        if (fetchError) throw fetchError;

        let foundPolicy: PolicyData | undefined;

        if (data?.content?.policies) {
          foundPolicy = data.content.policies.find((p: any) => p.slug === slug);
        }

        if (!foundPolicy) {
          // Fallback to defaults
          const defaultPolicy = DEFAULT_POLICIES.find((p) => p.slug === slug);
          if (defaultPolicy) {
            foundPolicy = {
              title: defaultPolicy.title,
              content: defaultPolicy.content,
              updatedAt: new Date().toLocaleDateString(),
            };
          }
        }

        if (foundPolicy) {
          setPolicy(foundPolicy);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching policy:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [slug]);

  const Icon = type === "privacy" ? Shield : Scale;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Policy Not Found
        </h2>
        <p className="text-slate-600 mb-6">
          We couldn't load the requested legal document.
        </p>
        <Button onClick={() => navigate("/")}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8 gap-2 text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100"
        >
          <div className="bg-indigo-600 p-12 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:20px_20px]" />
            <Icon className="h-16 w-16 mx-auto mb-6 relative z-10" />
            <h1 className="text-4xl font-black mb-2 relative z-10 text-white">
              {policy.title}
            </h1>
            <p className="text-white relative z-10">
              Reliable Compliance Infrastructure Powered by Bennie Tay Studio
            </p>
          </div>

          <div className="p-12 md:p-16">
            <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-black prose-p:text-black prose-p:leading-relaxed prose-li:text-black prose-strong:text-black prose-strong:font-bold prose-h2:border-b prose-h2:pb-4 prose-h2:mt-12">
              <ReactMarkdown>{policy.content}</ReactMarkdown>
            </div>

            <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col items-center gap-6">
              <div className="flex items-center gap-2 font-bold text-indigo-600">
                <Globe className="h-5 w-5" />
                <span>Bennie Tay Studio</span>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-slate-400">
                  Legal Department & Platform Compliance
                </p>
                <p className="text-xs text-slate-300">
                  © {new Date().getFullYear()} Bennie Tay Studio. All rights
                  reserved.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
