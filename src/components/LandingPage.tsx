/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import {
  Globe,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Users,
  Star,
  HelpCircle,
  Loader2,
  X,
  Sparkles,
  Check,
  TrendingUp,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Helmet } from "react-helmet-async";
import { cn } from "@/src/lib/utils";
import { Pricing } from "./Pricing";
import { DEFAULT_LANDING_CONTENT } from "../constants/landingPageContent";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  const { user, error, clearError } = useAuth();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [content, setContent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [platformPolicies, setPlatformPolicies] = React.useState<any[]>([]);
  const [blogPosts, setBlogPosts] = React.useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = React.useState<any>(null);

  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -200]);
  const y3 = useTransform(scrollY, [0, 1000], [0, 100]);

  React.useEffect(() => {
    const fetchPlatformSettings = async () => {
      const { data } = await supabase
        .from("settings")
        .select("content")
        .eq("id", "platform")
        .maybeSingle();

      if (data) setPlatformSettings(data.content);
    };
    fetchPlatformSettings();

    const fetchPolicies = async () => {
      const { data } = await supabase
        .from("settings")
        .select("content")
        .eq("id", "platform_policies")
        .single();

      if (data?.content?.policies) {
        setPlatformPolicies(
          data.content.policies.filter((p: any) => p.status === "published"),
        );
      }
    };
    fetchPolicies();

    const fetchBlogPosts = async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("business_id", "platform")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);

      if (data) setBlogPosts(data);
    };
    fetchBlogPosts();
  }, []);

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: landingData } = await supabase
          .from("settings")
          .select("content")
          .eq("id", "landing_page")
          .single();

        if (landingData) setContent(landingData.content);
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    const channel = supabase
      .channel("public:settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        (payload) => {
          if (payload.new && (payload.new as any).id === "landing_page") {
            setContent((payload.new as any).content);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const c = content || DEFAULT_LANDING_CONTENT;

  const IconComponent = ({
    name,
    className,
  }: {
    name: string;
    className?: string;
  }) => {
    const icons: any = {
      Globe,
      Zap,
      Shield,
      BarChart3,
      Users,
      Star,
      HelpCircle,
      ArrowRight,
      X,
    };
    const Icon = icons[name] || Zap;
    return <Icon className={className} />;
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Helmet>
        <title>{c.hero.headline} | Bennie Tay Studio</title>
        <meta name="description" content={c.hero.subheadline} />

        {/* Platform GA4 */}
        {platformSettings?.gaMeasurementId && (
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${platformSettings.gaMeasurementId}`}
          />
        )}
        {platformSettings?.gaMeasurementId && (
          <script>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${platformSettings.gaMeasurementId}');
            `}
          </script>
        )}

        {/* Platform Meta Pixel */}
        {platformSettings?.metaPixelId && (
          <script>
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${platformSettings.metaPixelId}');
              fbq('track', 'PageView');
            `}
          </script>
        )}

        {/* Global Platform Header Scripts */}
        {platformSettings?.trackingScriptsHeader && (
          <script
            dangerouslySetInnerHTML={{
              __html: platformSettings.trackingScriptsHeader,
            }}
          />
        )}
      </Helmet>
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 max-w-7xl mx-auto sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100/50"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 font-bold text-indigo-600 text-xl sm:text-2xl cursor-pointer"
          onClick={() => navigate("/")}
        >
          <Globe className="h-6 w-6 sm:h-8 w-8" />
          <span className="truncate max-w-[150px] sm:max-w-none">
            Bennie Tay Studio
          </span>
        </motion.div>
        <div className="hidden md:flex gap-8 items-center">
          {["Features", "Process", "Pricing", "FAQ"].map((item) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              whileHover={{ y: -2 }}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              {item}
            </motion.a>
          ))}
          {user ? (
            <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
          ) : (
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          )}
        </div>
        <div className="md:hidden">
          {user ? (
            <Button size="sm" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          )}
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative px-4 sm:px-8 py-16 lg:py-24 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <motion.div
            style={{ y: y1 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full"
          />
          <motion.div
            style={{ y: y2 }}
            className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full"
          />
          <motion.div
            style={{ y: y3 }}
            className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="relative z-10 text-center lg:text-left"
          >
            <motion.div variants={fadeInUp}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-8 shadow-sm">
                <Zap className="h-4 w-4 text-indigo-600 animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold text-indigo-600 tracking-wide uppercase">
                  {c.hero.badge}
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.05]"
            >
              Scale your revenue with intelligent digital sales tools.
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-2xl text-slate-700 mb-12 max-w-3xl lg:mx-0 mx-auto leading-relaxed font-semibold"
            >
              {c.hero.subheadline}
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 sm:gap-6 mb-12 relative z-20"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  onClick={() => navigate("/signup")}
                  className="gap-3 h-14 sm:h-16 px-10 sm:px-12 text-lg sm:text-xl shadow-2xl shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 transition-all w-full sm:w-auto rounded-2xl"
                >
                  {c.hero.ctaPrimary} <ArrowRight className="h-6 w-6" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="h-14 sm:h-16 px-10 sm:px-12 text-lg sm:text-xl w-full sm:w-auto rounded-2xl border-2 hover:bg-slate-50 transition-all shadow-lg shadow-slate-200/50 bg-white"
                >
                  {c.hero.ctaSecondary}
                </Button>
              </motion.div>
            </motion.div>

            {/* Social Proof & Featured In */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center lg:items-start gap-12 mt-16"
            >
              <div className="flex flex-col items-center lg:items-start gap-4">
                <div className="flex -space-x-4">
                  {(c.hero?.socialProof?.avatars || []).map(
                    (avatar: string, i: number) => (
                      <div
                        key={i}
                        className="h-10 w-10 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm"
                      >
                        <img
                          src={avatar}
                          alt={`User ${i}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ),
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
                  {c.hero?.socialProof?.text}
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="hidden lg:block relative group"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-30 transition duration-1000" />
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 p-2">
              <div className="rounded-[2rem] overflow-hidden bg-slate-100 aspect-video lg:aspect-square xl:aspect-video flex items-center justify-center relative">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200"
                  alt="Dashboard Preview"
                  className="w-full h-full object-cover transform group-hover:scale-[1.05] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent mix-blend-overlay" />
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3 z-20"
            >
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-none mb-1">
                  99.9% Uptime
                </div>
                <div className="text-[10px] text-slate-500">
                  Global Infrastructure
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute -bottom-6 -right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3 z-20"
            >
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-none mb-1">
                  AI Growth
                </div>
                <div className="text-[10px] text-slate-500">
                  Auto-scaling Content
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section
        id="features"
        className="bg-white py-16 sm:py-24 px-8 relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-24"
          >
            <h2 className="text-3xl sm:text-5xl sm:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              {c.features?.title}
            </h2>
            <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto font-semibold">
              {c.features?.subtitle}
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-6 gap-6 md:auto-rows-[minmax(10rem,_auto)] lg:auto-rows-[minmax(12rem,_auto)]"
          >
            {(c.features?.items || []).map((item: any, i: number) => {
              const isLarge = item.span === "4" || item.span === "6";
              // Hide secondary small features on mobile to reduce scroll length
              const hideOnMobile = !isLarge && i > 3;

              return (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className={cn(
                    "rounded-[3rem] p-10 shadow-sm border flex flex-col justify-between overflow-hidden relative group transition-all duration-500 hover:shadow-xl",
                    hideOnMobile && "hidden md:flex",
                    item.span === "2"
                      ? "md:col-span-2 md:row-span-2"
                      : item.span === "3"
                        ? "md:col-span-3 md:row-span-2"
                        : item.span === "4"
                          ? "md:col-span-4 md:row-span-3"
                          : item.span === "6"
                            ? "md:col-span-6 md:row-span-4"
                            : "md:col-span-2 md:row-span-2",
                    isLarge
                      ? "bg-slate-900 text-white border-none"
                      : "bg-white text-slate-900 border-slate-100",
                    item.color === "indigo"
                      ? "bg-indigo-50 border-indigo-100"
                      : item.color === "emerald"
                        ? "bg-emerald-50 border-emerald-100"
                        : "",
                  )}
                >
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm",
                        isLarge
                          ? "bg-indigo-500 text-white"
                          : "bg-indigo-50 text-indigo-600",
                      )}
                    >
                      <IconComponent name={item.icon} className="h-7 w-7" />
                    </motion.div>
                    <h3
                      className={cn(
                        "font-bold mb-4 leading-tight",
                        isLarge ? "text-4xl text-white" : "text-2xl text-slate-900",
                      )}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={cn(
                        "leading-relaxed",
                        isLarge
                          ? "text-slate-300 text-xl max-w-lg font-medium"
                          : "text-slate-700 text-base font-medium",
                      )}
                    >
                      {item.description}
                    </p>
                  </div>

                  {isLarge && (
                    <div className="mt-12 relative z-10">
                      <Button
                        onClick={() =>
                          document
                            .getElementById("process")
                            ?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl px-8 h-12 border-none font-bold shadow-lg shadow-black/5"
                      >
                        Learn More <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <IconComponent
                      name={item.icon}
                      className={cn(isLarge ? "h-96 w-96" : "h-40 w-40")}
                    />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      {c.benefits && (
        <section className="py-16 sm:py-24 px-8 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-24"
            >
              <h2 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                {c.benefits.title}
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
                {c.benefits.subtitle}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-12">
              {c.benefits.items.slice(0, 6).map((benefit: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500",
                    i > 2 && "hidden md:block", // Hide extra benefits on mobile
                  )}
                >
                  <div className="h-16 w-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-200">
                    <IconComponent name={benefit.icon} className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Process Section */}
      <section id="process" className="py-16 sm:py-24 px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-24"
          >
            <h2 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              {c.process?.title}
            </h2>
            <p className="text-xl text-slate-600 font-medium">
              {c.process?.subtitle}
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-16 relative"
          >
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent -z-10"></div>

            {(c.process?.items || []).map((p: any, i: number) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white p-10 text-center relative rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="h-20 w-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 text-2xl font-bold shadow-2xl shadow-indigo-200 relative z-10"
                >
                  <IconComponent name={p.icon} className="h-8 w-8" />
                  <div className="absolute -top-3 -right-3 h-8 w-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold border-4 border-white">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                </motion.div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">
                  {p.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {p.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mid-page CTA */}
      {c.cta && (
        <section className="py-24 px-8 bg-slate-950 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -z-10" />
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-8"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                {c.cta.headline}
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium">
                {c.cta.subheadline}
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/signup")}
                className="h-16 px-10 text-xl bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/20"
              >
                {c.cta.buttonText} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section
        id="pricing"
        className="bg-slate-900 py-40 px-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-24"
          >
            <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6 tracking-tight">
              {c.pricing?.title || "Simple, Transparent Pricing"}
            </h2>
            <p className="text-slate-300 text-xl font-semibold">
              {c.pricing?.subtitle ||
                "Choose the plan that fits your business stage."}
            </p>
          </motion.div>

          <Pricing onSelectPlan={() => navigate("/signup")} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-40 px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              {c.testimonials?.title}
            </h2>
            <p className="text-xl text-slate-600 font-medium">
              {c.testimonials?.subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {(c.testimonials?.items || [])
              .slice(0, 6)
              .map((t: any, i: number) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className={cn(
                    "p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 relative group transition-all duration-500",
                    i > 2 && "hidden md:block", // Limit testimonials on mobile
                  )}
                >
                  <div className="flex gap-1 mb-6 text-amber-400">
                    {[...Array(5)].map((_, star) => (
                      <Star key={star} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-lg italic mb-10 leading-relaxed">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-white shadow-md">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">
                        {t.name}
                      </h4>
                      <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* Success Story Section */}
      {c.successStory && (
        <section className="py-20 sm:py-40 px-6 sm:px-8 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] sm:w-[800px] h-[300px] sm:h-[600px] bg-indigo-500/10 blur-[60px] sm:blur-[120px] rounded-full -z-10" />
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="order-2 lg:order-1"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 sm:mb-8">
                  <Star className="h-4 w-4 text-indigo-400" />
                  <span className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    Success Story
                  </span>
                </div>
                <h2 className="text-3xl sm:text-6xl font-bold text-white mb-6 sm:mb-8 tracking-tight leading-tight">
                  {c.successStory.title}
                </h2>
                <p className="text-lg sm:text-xl text-slate-300 mb-8 sm:mb-10 leading-relaxed">
                  {c.successStory.content}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
                  {c.successStory.stats.map((stat: any, i: number) => (
                    <div key={i}>
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-widest">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  size="lg"
                  onClick={() => navigate("/signup")}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-8 font-bold"
                >
                  Start Your Story <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative order-1 lg:order-2"
              >
                <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full" />
                <div className="relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                  <img
                    src={c.successStory.image}
                    alt="Success Story"
                    className="w-full h-auto aspect-video sm:aspect-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Blog Section */}
      {blogPosts.length > 0 && (
        <section id="blog" className="py-16 sm:py-24 px-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-6xl font-black mb-6 tracking-tight text-slate-900"
              >
                {c.blog?.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl text-slate-600 max-w-2xl mx-auto font-medium"
              >
                {c.blog?.subtitle}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
                >
                  <div className="aspect-video overflow-hidden relative">
                    <img
                      src={
                        post.image_url ||
                        `https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800`
                      }
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                        Article
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 mb-8 line-clamp-3 text-sm leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto text-indigo-600 font-bold hover:bg-transparent hover:text-indigo-700 group/btn"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                      >
                        Read Article{" "}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section id="faq" className="py-40 px-8 bg-slate-50 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight flex items-center justify-center gap-4">
              <HelpCircle className="h-12 w-12 text-indigo-600" />
              {c.faq?.title}
            </h2>
            <p className="text-xl text-slate-600 font-medium">
              {c.faq?.subtitle}
            </p>
          </div>
          <div className="space-y-6">
            {(c.faq?.items || []).map((faq: any, i: number) => (
              <motion.div
                key={i}
                initial={false}
                className={cn(
                  "bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300",
                  i > 4 && "hidden md:block", // Hide extra FAQs on mobile
                )}
              >
                <h4 className="font-bold text-xl text-slate-900 mb-4">
                  {faq.q}
                </h4>
                <p className="text-slate-600 text-lg leading-relaxed">
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        id="contact"
        className="py-40 px-8 relative overflow-hidden bg-indigo-600"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-purple-500/30 blur-[150px] rounded-full -z-10" />

        <div className="max-w-5xl mx-auto text-center text-white relative z-10 font-bold">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-5xl sm:text-7xl font-black text-white mb-8 tracking-tighter leading-tight">
              {c.cta?.headline}
            </h2>
            <p className="text-xl sm:text-2xl text-indigo-100 mb-12 max-w-2xl mx-auto font-semibold">
              {c.cta?.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <Button
                size="lg"
                onClick={() => navigate("/signup")}
                className="h-20 px-12 text-2xl font-bold bg-white text-indigo-600 hover:bg-slate-100 rounded-[2rem] shadow-2xl shadow-indigo-900/20 w-full sm:w-auto"
              >
                {c.cta?.buttonText}
              </Button>
              {c.cta?.secondaryButtonText && (
                <Button
                  size="lg"
                  onClick={() => {
                    const pricing = document.getElementById("pricing");
                    pricing?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="h-20 px-12 text-2xl font-bold border-2 border-white text-white bg-transparent hover:bg-white hover:text-indigo-600 transition-all rounded-[2rem] w-full sm:w-auto"
                >
                  {c.cta.secondaryButtonText}
                </Button>
              )}
            </div>
            {c.cta?.trustText && (
              <p className="mt-12 text-sm font-bold text-indigo-200 uppercase tracking-widest">
                {c.cta.trustText}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-20 px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-white text-2xl mb-6">
                <Globe className="h-8 w-8 text-indigo-400" />
                <span>Bennie Tay Studio</span>
              </div>
              <p className="max-w-sm leading-relaxed text-white font-medium">{c.footer?.tagline}</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Platform</h4>
              <ul className="space-y-4 text-sm text-slate-300 font-semibold">
                <li>
                  <a
                    href="#features"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#process"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Process
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Connect</h4>
              <ul className="space-y-4 text-sm text-slate-300 font-semibold">
                {(c.footer?.socials || []).map((social: any, i: number) => (
                  <li key={i}>
                    <a
                      href={social.url}
                      className="hover:text-indigo-400 transition-colors"
                    >
                      {social.platform}
                    </a>
                  </li>
                ))}
                {c.footer?.email && (
                  <li>
                    <a
                      href={`mailto:${c.footer.email}`}
                      className="hover:text-indigo-400 transition-colors"
                    >
                      Email Us
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-white font-bold">
            <p>© 2026 Bennie Tay Studio. All rights reserved.</p>
            <div className="flex flex-wrap justify-center md:justify-end gap-8">
              {platformPolicies.length > 0 ? (
                platformPolicies.map((policy) => (
                  <button
                    key={policy.id}
                    onClick={() => navigate(`/${policy.slug}`)}
                    className="hover:text-white transition-colors"
                  >
                    {policy.title}
                  </button>
                ))
              ) : (
                <>
                  <button
                    onClick={() => navigate("/privacy")}
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={() => navigate("/terms")}
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
      {platformSettings?.trackingScriptsFooter && (
        <div
          dangerouslySetInnerHTML={{
            __html: platformSettings.trackingScriptsFooter,
          }}
        />
      )}
    </div>
  );
}
