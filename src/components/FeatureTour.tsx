/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Zap,
  Layout,
  Users,
  Star,
  Globe,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface TourStep {
  title: string;
  description: string;
  icon: React.ElementType;
  target?: string; // CSS selector for highlighting (optional for this simple version)
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Bennie Tay Studio!",
    description:
      "Let's take a quick tour of your new AI-powered business ecosystem. We've built everything you need to scale your digital presence.",
    icon: Zap,
  },
  {
    title: "AI Website Builder",
    description:
      "Use our state-of-the-art AI to generate high-conversion websites in seconds. Customize every section with our intuitive editor.",
    icon: Globe,
  },
  {
    title: "Lead CRM & Management",
    description:
      "Track every prospect and customer interaction in real-time. Never miss a lead with our integrated CRM system.",
    icon: Users,
  },
  {
    title: "Automated Appointments",
    description:
      "Let your customers book services directly. Our booking system handles the scheduling so you can focus on your craft.",
    icon: Layout,
  },
  {
    title: "Reviews & Reputation",
    description:
      "Manage your online reputation by showcasing customer testimonials and managing reviews across platforms.",
    icon: Star,
  },
];

export function FeatureTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenTour");
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenTour", "true");
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/20"
          >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 h-1.5 w-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                className="h-full bg-indigo-600"
                initial={{ width: "0%" }}
                animate={{
                  width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-8 pt-12">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-inner">
                <Icon className="h-8 w-8" />
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-10 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === currentStep
                          ? "w-6 bg-indigo-600"
                          : "w-1.5 bg-slate-200 dark:bg-slate-800",
                      )}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <Button
                      variant="ghost"
                      onClick={handlePrev}
                      className="rounded-xl px-4 h-11"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    className="rounded-xl px-6 h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                  >
                    {currentStep === TOUR_STEPS.length - 1
                      ? "Get Started"
                      : "Next"}
                    {currentStep < TOUR_STEPS.length - 1 && (
                      <ChevronRight className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
