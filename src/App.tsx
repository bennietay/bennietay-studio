/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import { FeatureTour } from "./components/FeatureTour";
import { useAuth } from "./contexts/AuthContext";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import {
  Globe,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Users,
  Check,
  Star,
  MessageSquare,
  HelpCircle,
  PlusCircle,
  RefreshCw,
  Plus,
  Trash2,
  X,
  Loader2,
  Save,
  Layout,
  TrendingUp,
  Calendar,
  Settings,
  FileText,
  Search,
  MoreVertical,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Copy,
  Edit,
  Eye,
  Download,
  Upload,
  Filter,
  ChevronRight,
  Code,
  Scale,
  Lock,
  ShoppingBag,
  Palette,
  Headphones,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { formatDate, generateId, cn } from "@/src/lib/utils";
import { supabase } from "@/src/lib/supabase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { ScrollArea } from "./components/ui/scroll-area";
import { Separator } from "./components/ui/separator";
import { Switch } from "./components/ui/switch";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingFallback } from "./components/LoadingFallback";

// --- Lazy Loaded Components ---
const LandingPage = lazy(() => import("./components/LandingPage"));
const BookDemo = lazy(() => import("./components/BookDemo"));
const LoginPage = lazy(() => import("./components/LoginPage"));
const ForgotPasswordPage = lazy(
  () => import("./components/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(() => import("./components/ResetPasswordPage"));
const DashboardOverview = lazy(() => import("./components/DashboardOverview"));
const ComingSoonPage = lazy(() => import("./components/ComingSoonPage"));
const SuperAdminDashboard = lazy(
  () => import("./components/SuperAdminDashboard"),
);

const LeadCRM = lazy(() =>
  import("./components/LeadCRM").then((m) => ({ default: m.LeadCRM })),
);
const Appointments = lazy(() =>
  import("./components/Appointments").then((m) => ({
    default: m.Appointments,
  })),
);
const WebsiteEditor = lazy(() =>
  import("./components/WebsiteEditor").then((m) => ({
    default: m.WebsiteEditor,
  })),
);
const TemplateGallery = lazy(() =>
  import("./components/TemplateGallery").then((m) => ({
    default: m.TemplateGallery,
  })),
);
const BlogCMS = lazy(() =>
  import("./components/BlogCMS").then((m) => ({ default: m.BlogCMS })),
);
const PoliciesCMS = lazy(() =>
  import("./components/PoliciesCMS").then((m) => ({ default: m.PoliciesCMS })),
);
const Billing = lazy(() =>
  import("./components/Billing").then((m) => ({ default: m.Billing })),
);
const BusinessSettings = lazy(() =>
  import("./components/BusinessSettings").then((m) => ({
    default: m.BusinessSettings,
  })),
);
const Profile = lazy(() =>
  import("./components/Profile").then((m) => ({ default: m.Profile })),
);
const Support = lazy(() =>
  import("./components/Support").then((m) => ({ default: m.Support })),
);
const ChatbotSettings = lazy(() =>
  import("./components/ChatbotSettings").then((m) => ({
    default: m.ChatbotSettings,
  })),
);
const ProductManagement = lazy(() =>
  import("./components/ProductManagement").then((m) => ({
    default: m.ProductManagement,
  })),
);
const ReviewManagement = lazy(() =>
  import("./components/ReviewManagement").then((m) => ({
    default: m.ReviewManagement,
  })),
);
const MarketingHub = lazy(() =>
  import("./components/MarketingHub").then((m) => ({
    default: m.MarketingHub,
  })),
);
const AIContentHub = lazy(() => import("./components/AIContentHub"));
const TeamManagement = lazy(() => import("./components/TeamManagement"));
const PlanEditor = lazy(() => import("./components/PlanEditor"));
const LandingPageEditor = lazy(() => import("./components/LandingPageEditor"));
const AffiliateProgram = lazy(() =>
  import("./components/AffiliateProgram").then((m) => ({
    default: m.AffiliateProgram,
  })),
);
const AffiliateDashboard = lazy(() =>
  import("./components/AffiliateDashboard").then((m) => ({
    default: m.AffiliateDashboard,
  })),
);
const AffiliateJoinPage = lazy(() => import("./components/AffiliateJoinPage"));
const AffiliateAuthPage = lazy(() => import("./components/AffiliateAuthPage"));

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

// --- Dashboard Pages ---
import { WebsiteGenerator } from "./components/WebsiteGenerator";
import { PolicyPage } from "./components/Policies";
import { Pricing } from "./components/Pricing";
import { WebsiteRenderer } from "./components/WebsiteRenderer";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { FeatureGate } from "./components/FeatureGate";
import { useFeatures } from "./hooks/useFeatures";
import { NICHE_TEMPLATES } from "./constants/nicheTemplates";
import { AdminSupport } from "./components/AdminSupport";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BusinessDashboard } from "./components/BusinessDashboard";

// --- Protected Route Wrapper ---

// --- Business Dashboard Wrapper ---

// --- Login Page ---

// --- Forgot Password Page ---

// --- Reset Password Page ---

import { useTrafficTracker } from "./hooks/useTrafficTracker";

function TrafficTracker() {
  useTrafficTracker();
  return null;
}

export default function App() {
  const { logout, profile } = useAuth();
  const [platformSettings, setPlatformSettings] = React.useState<any>(null);
  const [loadingSettings, setLoadingSettings] = React.useState(true);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from("settings")
          .select("content")
          .eq("id", "platform")
          .maybeSingle();

        if (data?.content) {
          setPlatformSettings(data.content);
        }
      } catch (err) {
        console.error("Error fetching platform settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();

    const channel = supabase
      .channel("platform_settings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settings",
          filter: "id=eq.platform",
        },
        (payload: any) => {
          if (payload.new?.content) {
            setPlatformSettings(payload.new.content);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loadingSettings) return <LoadingFallback />;

  // If maintenance mode is on and user is NOT a super admin, show coming soon page
  if (platformSettings?.maintenanceMode && profile?.role !== "super_admin") {
    return (
      <HelmetProvider>
        <Router>
          <TrafficTracker />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="*"
                element={<ComingSoonPage settings={platformSettings} />}
              />
            </Routes>
          </Suspense>
        </Router>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Router>
          <TrafficTracker />
          <Helmet>
            <title>Bennie Tay Studio | AI-Powered Website Ecosystem</title>
            <meta
              name="description"
              content="The world's first AI-driven WaaS platform merging enterprise-grade infrastructure with high-conversion sales psychology."
            />
            <meta
              name="keywords"
              content="AI website builder, WaaS, digital marketing, business automation, Bennie Tay Studio"
            />
            {/* Local SEO */}
            <meta
              property="og:title"
              content="Bennie Tay Studio | AI-Powered Website Ecosystem"
            />
            <meta
              property="og:description"
              content="Synthesize your digital empire with AI. Enterprise-grade infrastructure for modern businesses."
            />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <script type="application/ld+json">
              {`
              {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "name": "Bennie Tay Studio",
                "image": "https://ais-dev-inwffqlhgbtxkxphlddntq-485397637496.asia-southeast1.run.app/logo.png",
                "@id": "https://ais-dev-inwffqlhgbtxkxphlddntq-485397637496.asia-southeast1.run.app",
                "url": "https://ais-dev-inwffqlhgbtxkxphlddntq-485397637496.asia-southeast1.run.app",
                "telephone": "+1234567890",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "123 AI Way",
                  "addressLocality": "Singapore",
                  "postalCode": "123456",
                  "addressCountry": "SG"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": 1.3521,
                  "longitude": 103.8198
                },
                "openingHoursSpecification": {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday"
                  ],
                  "opens": "09:00",
                  "closes": "18:00"
                }
              }
            `}
            </script>
          </Helmet>
          <Toaster position="top-right" />
          <Suspense
            fallback={<LoadingFallback message="Loading core modules..." />}
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/book-demo" element={<BookDemo />} />
              <Route path="/privacy" element={<PolicyPage type="privacy" />} />
              <Route path="/terms" element={<PolicyPage type="terms" />} />
              <Route path="/w/:businessId" element={<WebsiteRenderer />} />
              <Route
                path="/affiliate/join/:businessId"
                element={<AffiliateJoinPage />}
              />

              {/* Business Admin Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/signup"
                element={<LoginPage initialSignUp={true} />}
              />
              <Route path="/affiliate/login" element={<AffiliateAuthPage />} />
              <Route path="/affiliate/signup" element={<AffiliateAuthPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Top-level Profile Redirect */}
              <Route
                path="/profile"
                element={<Navigate to="/dashboard/profile" replace />}
              />

              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "business_admin",
                      "super_admin",
                      "client",
                      "affiliate",
                    ]}
                  >
                    <BusinessDashboard>
                      <DashboardLayout
                        role={profile?.role as any}
                        onLogout={logout}
                      >
                        <FeatureTour />
                        <Suspense fallback={<LoadingFallback />}>
                          <Routes>
                            <Route
                              path=""
                              element={
                                profile?.role === "affiliate" ? (
                                  <AffiliateDashboard />
                                ) : (
                                  <DashboardOverview />
                                )
                              }
                            />
                            <Route
                              path="leads"
                              element={
                                <FeatureGate featureId="lead_crm">
                                  <LeadCRM />
                                </FeatureGate>
                              }
                            />
                            <Route
                              path="appointments"
                              element={
                                <FeatureGate featureId="booking">
                                  <Appointments />
                                </FeatureGate>
                              }
                            />
                            <Route
                              path="products"
                              element={
                                <FeatureGate featureId="ecommerce">
                                  <ProductManagement />
                                </FeatureGate>
                              }
                            />
                            <Route
                              path="chatbot"
                              element={
                                <FeatureGate featureId="ai_chatbot">
                                  <ChatbotSettings />
                                </FeatureGate>
                              }
                            />
                            <Route
                              path="ai-hub"
                              element={
                                <FeatureGate featureId="ai_synthesis">
                                  <AIContentHub />
                                </FeatureGate>
                              }
                            />
                            <Route
                              path="reviews"
                              element={
                                <FeatureGate featureId="review_management">
                                  <ReviewManagement />
                                </FeatureGate>
                              }
                            />
                            <Route
                              path="team"
                              element={
                                <ProtectedRoute
                                  allowedRoles={["business_admin"]}
                                >
                                  <TeamManagement />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="affiliates"
                              element={
                                <FeatureGate featureId="affiliate_system">
                                  <AffiliateProgram />
                                </FeatureGate>
                              }
                            />
                            <Route
                              path="affiliate/dashboard"
                              element={<AffiliateDashboard />}
                            />
                            <Route
                              path="automations"
                              element={
                                <FeatureGate featureId="automation">
                                  <MarketingHub />
                                </FeatureGate>
                              }
                            />
                            <Route
                              path="analytics"
                              element={
                                <FeatureGate featureId="analytics">
                                  <DashboardOverview />
                                </FeatureGate>
                              }
                            />

                            {/* Business Admin Only Routes */}
                            <Route
                              path="website"
                              element={
                                <ProtectedRoute
                                  allowedRoles={[
                                    "business_admin",
                                    "super_admin",
                                  ]}
                                >
                                  <FeatureGate featureId="ai_synthesis">
                                    <WebsiteEditor />
                                  </FeatureGate>
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="website/regenerate"
                              element={
                                <ProtectedRoute
                                  allowedRoles={[
                                    "business_admin",
                                    "super_admin",
                                  ]}
                                >
                                  <FeatureGate featureId="ai_synthesis">
                                    <WebsiteEditor forceShowGenerator={true} />
                                  </FeatureGate>
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="templates"
                              element={
                                <ProtectedRoute
                                  allowedRoles={[
                                    "business_admin",
                                    "super_admin",
                                  ]}
                                >
                                  <WebsiteEditor />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="blog"
                              element={
                                <ProtectedRoute
                                  allowedRoles={[
                                    "business_admin",
                                    "super_admin",
                                  ]}
                                >
                                  <BlogCMS />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="policies"
                              element={
                                <ProtectedRoute
                                  allowedRoles={[
                                    "business_admin",
                                    "super_admin",
                                  ]}
                                >
                                  <PoliciesCMS />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="billing"
                              element={
                                <ProtectedRoute
                                  allowedRoles={[
                                    "business_admin",
                                    "super_admin",
                                  ]}
                                >
                                  <Billing />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="settings"
                              element={
                                <ProtectedRoute
                                  allowedRoles={[
                                    "business_admin",
                                    "super_admin",
                                  ]}
                                >
                                  <BusinessSettings />
                                </ProtectedRoute>
                              }
                            />
                            <Route path="profile" element={<Profile />} />
                            <Route path="support" element={<Support />} />
                            <Route
                              path="*"
                              element={<Navigate to="/dashboard" replace />}
                            />
                          </Routes>
                        </Suspense>
                      </DashboardLayout>
                    </BusinessDashboard>
                  </ProtectedRoute>
                }
              />

              {/* Super Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <DashboardLayout role="super_admin" onLogout={logout}>
                      <Routes>
                        <Route path="/*" element={<SuperAdminDashboard />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
