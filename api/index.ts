import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";
import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Admin client for server-side operations that should bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

let platformSettings: any = null;

async function syncSettings() {
  try {
    const { data } = await supabaseAdmin
      .from("settings")
      .select("content")
      .eq("id", "platform")
      .maybeSingle();
    if (data?.content) {
      platformSettings = data.content;
    }
  } catch (err) {
    console.error("Error syncing settings:", err);
  }

  supabaseAdmin
    .channel("platform_settings_server")
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
          platformSettings = payload.new.content;
          // Reset stripe instance if key changed
          stripeInstance = null;
        }
      },
    )
    .subscribe();
}

// Sync settings
await syncSettings();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let stripeInstance: Stripe | null = null;
const merchantStripeCache = new Map<
  string,
  { instance: Stripe; timestamp: number }
>();

let resendInstance: Resend | null = null;
function getResend() {
  const key = platformSettings?.resendApiKey || process.env.RESEND_API_KEY;
  if (!key || key.trim() === "" || key.includes("TODO")) {
    throw new Error("RESEND_CONFIG_ERROR");
  }
  if (!resendInstance) {
    resendInstance = new Resend(key.trim());
  }
  return resendInstance;
}
const MAX_CACHE_SIZE = 500; // Keep up to 500 active merchant instances in memory
const CACHE_TTL = 1000 * 60 * 60; // 1 hour TTL

async function getStripe(merchantBusinessId?: string) {
  let key = platformSettings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

  if (merchantBusinessId) {
    const cached = merchantStripeCache.get(merchantBusinessId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      cached.timestamp = Date.now(); // Refresh timestamp
      return cached.instance;
    }

    // Cleanup cache if it gets too big
    if (merchantStripeCache.size > MAX_CACHE_SIZE) {
      const oldestKey = merchantStripeCache.keys().next().value;
      if (oldestKey) merchantStripeCache.delete(oldestKey);
    }

    const { data: biz } = await supabaseAdmin
      .from("businesses")
      .select("stripe_secret_key, stripe_connected_account_id")
      .eq("id", merchantBusinessId)
      .single();

    // Case 1: Merchant provided their own Secret Key (legacy/manual)
    if (biz?.stripe_secret_key && biz.stripe_secret_key.trim() !== "") {
      key = biz.stripe_secret_key.trim();
      const merchantStripe = new Stripe(key, {
        apiVersion: "2025-01-27.acacia" as any,
      });
      merchantStripeCache.set(merchantBusinessId, {
        instance: merchantStripe,
        timestamp: Date.now(),
      });
      return merchantStripe;
    }

    // Case 2: Merchant used Stripe Connect (Single Click)
    if (biz?.stripe_connected_account_id) {
      const platformKey =
        platformSettings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
      if (platformKey && platformKey.startsWith("sk_")) {
        const merchantStripe = new Stripe(platformKey, {
          apiVersion: "2025-01-27.acacia" as any,
          stripeAccount: biz.stripe_connected_account_id,
        });
        merchantStripeCache.set(merchantBusinessId, {
          instance: merchantStripe,
          timestamp: Date.now(),
        });
        return merchantStripe;
      }
    }
  }

  if (
    !key ||
    key === "" ||
    key.trim() === "" ||
    key.includes("TODO") ||
    key === "undefined" ||
    key === "null"
  ) {
    throw new Error("STRIPE_CONFIG_ERROR");
  }

  key = key.trim();

  if (key.startsWith("pk_")) {
    throw new Error("STRIPE_SECRET_KEY_REQUIRED_BUT_GOT_PUBLISHABLE");
  }

  if (!key.startsWith("sk_") && !key.startsWith("rk_")) {
    throw new Error("STRIPE_INVALID_KEY_FORMAT");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(key, {
      apiVersion: "2025-01-27.acacia" as any,
    });
  }
  return stripeInstance;
}

const useCredits = async (
  businessId: string,
  amount: number = 1,
  useCase: string = "internal",
  modelName: string = "none",
) => {
  try {
    const { data: biz, error } = await supabase
      .from("businesses")
      .select("ai_credits, ai_credits_used")
      .eq("id", businessId)
      .single();

    if (error) {
      console.warn("Credit check/tracking failed:", error);
      // If columns don't exist yet, we allow the operation but log it
      if (error.code === "42703") {
        // Undefined column
        return;
      }
      throw error;
    }

    if (!biz) return;

    // Only enforce if ai_credits is set (not 0)
    if (biz.ai_credits > 0 && (biz.ai_credits_used || 0) >= biz.ai_credits) {
      throw new Error(
        "AI credits exceeded. Please top up your balance in Billing.",
      );
    }

    await supabaseAdmin.rpc("increment_ai_usage", {
      biz_id: businessId,
      amount,
      use_case_name: useCase,
      model_name: modelName,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("credits exceeded")) {
      throw err;
    }
    console.error("AI Usage Tracking Error:", err);
    // Continue anyway to not break the user experience if tracking fails
  }
};

const app = express();
const PORT = 3000;

async function startServer() {
  // Supabase Auth Middleware
  const authenticate = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader)
        return res.status(401).json({ error: "Missing Authorization header" });

      const token = authHeader.split(" ")[1];
      if (!token || token === "undefined") {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res
          .status(401)
          .json({ error: "Unauthorized: Invalid or expired token" });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("Auth middleware error:", err);
      res
        .status(500)
        .json({ error: "Internal Server Error during authentication" });
    }
  };

  const superAdminOnly = async (req: any, res: any, next: any) => {
    try {
      // Use the user's token to query their own profile to satisfy RLS
      const authHeader = req.headers.authorization;
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: profile, error } = await userSupabase
        .from("profiles")
        .select("role")
        .eq("id", req.user.id)
        .single();

      if (error || profile?.role !== "super_admin") {
        console.warn(
          `Admin access denied for ${req.user.email}. Role: ${profile?.role || "none"}`,
        );
        return res
          .status(403)
          .json({ error: "Forbidden: Super Admin access required" });
      }
      next();
    } catch (err) {
      console.error("Superadmin middleware error:", err);
      res
        .status(500)
        .json({ error: "Internal Server Error verifying admin status" });
    }
  };

  // Stripe Webhook - MUST be before express.json()
  app.post(
    "/api/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const businessIdParam = req.query.businessId as string;

      let webhookSecret =
        platformSettings?.stripeWebhookSecret ||
        process.env.STRIPE_WEBHOOK_SECRET;

      if (businessIdParam) {
        const { data: biz } = await supabaseAdmin
          .from("businesses")
          .select("stripe_webhook_secret")
          .eq("id", businessIdParam)
          .single();
        if (biz?.stripe_webhook_secret) {
          webhookSecret = biz.stripe_webhook_secret;
        }
      }

      if (!sig || !webhookSecret) {
        return res
          .status(400)
          .send("Webhook Error: Missing signature or secret");
      }

      let event;

      try {
        const stripe = await getStripe(businessIdParam);
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error(`[Stripe Webhook] Verification Failed: ${err.message}`);
        return res
          .status(400)
          .send(`Webhook Verification Error: ${err.message}`);
      }

      console.log(
        `[Stripe Webhook] Received event: ${event.type} (${event.id})`,
      );
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const businessId = session.metadata?.businessId;
          const type = session.metadata?.type;

          if (businessId) {
            console.log(
              `Processing successful checkout for business: ${businessId} (Type: ${type || "subscription"})`,
            );

            try {
              const stripe = await getStripe(businessId);

              if (type === "product_sale") {
                const orderId = session.metadata?.orderId;
                if (orderId) {
                  await supabaseAdmin
                    .from("orders")
                    .update({
                      status: "paid",
                      stripe_session_id: session.id,
                      customer_name:
                        session.customer_details?.name || "Customer",
                      customer_email: session.customer_details?.email || "",
                    })
                    .eq("id", orderId);
                  console.log(`Order ${orderId} marked as paid`);
                }
              } else if (type === "credits") {
                // Handle one-time credit purchase
                const lineItems = await stripe.checkout.sessions.listLineItems(
                  session.id,
                );
                const priceId = lineItems.data[0]?.price?.id;

                // We'll search for credit pack definitions in metadata or price description
                // But for robustness, we'll check the platform settings for bundle mappings
                const { data: creditBundlesData } = await supabase
                  .from("settings")
                  .select("content")
                  .eq("id", "credit_bundles")
                  .maybeSingle();
                const bundles = creditBundlesData?.content?.bundles || [];
                const bundle = bundles.find((b: any) => b.priceId === priceId);

                const creditsToAdd =
                  bundle?.amount || parseInt(session.metadata?.credits || "0");

                if (creditsToAdd > 0) {
                  // Fetch current credits
                  const { data: biz } = await supabase
                    .from("businesses")
                    .select("ai_credits")
                    .eq("id", businessId)
                    .single();
                  await supabase
                    .from("businesses")
                    .update({
                      ai_credits: (biz?.ai_credits || 0) + creditsToAdd,
                    })
                    .eq("id", businessId);

                  console.log(
                    `Successfully added ${creditsToAdd} credits to business ${businessId}`,
                  );

                  // Track in billing history
                  await supabase.from("billing_history").insert({
                    business_id: businessId,
                    amount: session.amount_total! / 100,
                    currency: session.currency || "usd",
                    description: `Credit Top-up: ${creditsToAdd} Credits`,
                    status: "paid",
                    stripe_invoice_id: session.id, // This is a session but we use it as ref
                  });
                }
              } else {
                // Existing Subscription logic
                const { data: plansData } = await supabase
                  .from("settings")
                  .select("content")
                  .eq("id", "plans")
                  .maybeSingle();
                const plans = plansData?.content?.pricing || [];

                const lineItems = await stripe.checkout.sessions.listLineItems(
                  session.id,
                );
                const priceId = lineItems.data[0]?.price?.id;
                const plan =
                  plans.find((p: any) => p.priceId === priceId)?.id ||
                  "starter";

                const subscription = await stripe.subscriptions.retrieve(
                  session.subscription as string,
                );

                const { error } = await supabase
                  .from("businesses")
                  .update({
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: session.subscription as string,
                    subscription_status: subscription.status,
                    status: "active",
                    plan: plan,
                  })
                  .eq("id", businessId);

                if (error) throw error;
                console.log(
                  `Successfully updated business ${businessId} to plan ${plan}`,
                );

                // Affiliate Commission Logic
                const { data: business } = await supabase
                  .from("businesses")
                  .select("referred_by_affiliate_id")
                  .eq("id", businessId)
                  .single();
                if (
                  business?.referred_by_affiliate_id &&
                  session.amount_total
                ) {
                  const amountPaid = session.amount_total / 100;
                  const rate = 0.2;
                  const commission = amountPaid * rate;

                  await supabaseAdmin.rpc("reward_affiliate", {
                    aff_id: business.referred_by_affiliate_id,
                    amount: commission,
                    sale_val: amountPaid,
                  });
                  console.log(
                    `Rewarded affiliate ${business.referred_by_affiliate_id} with $${commission}`,
                  );
                }
              }
            } catch (err) {
              console.error(`Error updating business after checkout:`, err);
            }
          }
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(
            `Subscription updated: ${subscription.id} (Status: ${subscription.status})`,
          );

          try {
            const { data: plansData } = await supabase
              .from("settings")
              .select("content")
              .eq("id", "plans")
              .maybeSingle();
            const plans = plansData?.content?.pricing || [];
            const priceId = subscription.items.data[0]?.price?.id;
            const plan = plans.find((p: any) => p.priceId === priceId)?.id;

            const updateData: any = {
              subscription_status: subscription.status,
              status: subscription.status === "active" ? "active" : "inactive",
            };

            if (plan) {
              updateData.plan = plan;
            }

            await supabase
              .from("businesses")
              .update(updateData)
              .eq("stripe_subscription_id", subscription.id);
          } catch (err) {
            console.error(`Error handling subscription update:`, err);
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`Subscription deleted: ${subscription.id}`);

          try {
            await supabase
              .from("businesses")
              .update({
                subscription_status: "canceled",
                status: "inactive",
              })
              .eq("stripe_subscription_id", subscription.id);
          } catch (err) {
            console.error(`Error handling subscription deletion:`, err);
          }
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    },
  );

  app.use(express.json());

  // DeepSeek AI Proxy
  app.post("/api/ai/deepseek", async (req, res) => {
    const apiKey =
      platformSettings?.deepseekApiKey || process.env.DEEPSEEK_API_KEY;

    if (!apiKey || apiKey.trim() === "" || apiKey.includes("TODO")) {
      return res.status(400).json({
        error: "DEEPSEEK_CONFIG_ERROR",
        message:
          "DeepSeek API Key is not configured. Please add it to your environment or settings.",
      });
    }

    try {
      const { model, messages, max_tokens, response_format } = req.body;

      const response = await axios.post(
        "https://api.deepseek.com/v1/chat/completions",
        {
          model: model || "deepseek-chat",
          messages,
          max_tokens: max_tokens || 4096,
          response_format: response_format || { type: "text" },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            "Content-Type": "application/json",
          },
        },
      );

      res.json(response.data);
    } catch (error: any) {
      console.error(
        "DeepSeek Proxy Error:",
        error.response?.data || error.message,
      );
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { error: "Internal AI synthesis error" });
    }
  });

  // Resend Email API
  app.post("/api/send-email", authenticate, async (req, res) => {
    try {
      const { to, subject, html, from } = req.body;

      if (!to || !subject || !html) {
        return res
          .status(400)
          .json({ error: "Missing required fields: to, subject, or html" });
      }

      console.log(`[Email] Sending to ${to} subject: ${subject}`);
      const resend = getResend();
      const { data, error } = await resend.emails.send({
        from: from || platformSettings?.emailFrom || "onboarding@resend.dev",
        to,
        subject,
        html,
      });

      if (error) {
        console.error("Resend API Error:", error);
        return res.status(error.statusCode || 400).json({
          error: error.name || "RESEND_ERROR",
          message: error.message,
          details: error
        });
      }

      res.json(data);
    } catch (error: any) {
      console.error("Email Sending Logic Error:", error);
      if (error.message === "RESEND_CONFIG_ERROR") {
        return res.status(503).json({
          error: "Email service not configured",
          message: "RESEND_API_KEY is missing from environment or settings.",
        });
      }
      res.status(500).json({ 
        error: "Failed to send email",
        message: error.message 
      });
    }
  });



  // Admin Member Routes
  app.post("/api/admin/create-member", authenticate, async (req, res) => {
    const { email, password, role, businessId } = req.body;
    const userId = (req as any).user.id;

    try {
      // 1. Verify caller is a business admin for this business OR super admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, business_id")
        .eq("id", userId)
        .single();

      if (
        !profile ||
        (profile.role !== "business_admin" && profile.role !== "super_admin")
      ) {
        return res
          .status(403)
          .json({ error: "Only business admins can add team members" });
      }

      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseServiceKey) {
        return res.status(500).json({
          error: "Server configuration error: Service role key missing",
        });
      }

      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // 2. Create user in Auth
      const { data: authUser, error: authError } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { role, business_id: businessId },
        });

      if (authError) throw authError;

      // 3. Profiles table
      const { error: profileError } = await adminClient
        .from("profiles")
        .upsert({
          id: authUser.user.id,
          email: email.toLowerCase(),
          role: role,
          business_id: businessId,
          onboarding_completed: true,
        });

      if (profileError) throw profileError;

      res.status(200).json({
        success: true,
        message: "Member created successfully",
        userId: authUser.user.id,
      });
    } catch (err: any) {
      console.error("Error creating team member:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/create-checkout-session", authenticate, async (req, res) => {
    const { priceId, businessId, customerEmail, couponId } = req.body;

    if (!priceId || !priceId.startsWith("price_")) {
      return res.status(400).json({
        error:
          "Invalid or missing Stripe Price ID. Please configure your plans with real Stripe Price IDs in the Super Admin dashboard.",
        code: "STRIPE_INVALID_PRICE_ID",
      });
    }

    try {
      // Verify business ownership or admin status
      const { data: businessCheck } = await supabase
        .from("businesses")
        .select("owner_id")
        .eq("id", businessId)
        .single();

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (req as any).user.id)
        .single();

      if (
        !businessCheck ||
        (businessCheck.owner_id !== (req as any).user.id &&
          profile?.role !== "super_admin")
      ) {
        return res.status(403).json({
          error:
            "Forbidden: You do not have permission to manage this business subscription.",
        });
      }

      const stripe = await getStripe();

      // Check if business already has a stripe_customer_id and trial info
      const { data: business } = await supabase
        .from("businesses")
        .select("stripe_customer_id, stripe_subscription_id, trial_ends_at")
        .eq("id", businessId)
        .single();

      const sessionOptions: any = {
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode:
          priceId.includes("credits") || req.body.type === "credits"
            ? "payment"
            : "subscription",
        success_url: `${req.headers.origin}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/dashboard/settings`,
        metadata: {
          businessId,
          type:
            priceId.includes("credits") || req.body.type === "credits"
              ? "credits"
              : "subscription",
        },
      };

      if (couponId) {
        sessionOptions.discounts = [{ coupon: couponId }];
      }

      if (business?.stripe_customer_id) {
        sessionOptions.customer = business.stripe_customer_id;
      } else {
        sessionOptions.customer_email = customerEmail;
      }

      // Handle Trial Period
      const now = Math.floor(Date.now() / 1000);
      let trialEnd: number | null = null;

      if (business?.trial_ends_at) {
        const dbTrialEnd = Math.floor(
          new Date(business.trial_ends_at).getTime() / 1000,
        );
        // Only use if it's at least 48 hours in the future (Stripe requirement for trial_end usually)
        // Actually Stripe requires at least 1 second in the future, but let's be safe.
        if (dbTrialEnd > now + 60) {
          trialEnd = dbTrialEnd;
        }
      }

      if (!business?.stripe_subscription_id) {
        if (trialEnd) {
          sessionOptions.subscription_data = {
            trial_end: trialEnd,
          };
        } else if (platformSettings?.defaultTrialDays > 0) {
          sessionOptions.subscription_data = {
            trial_period_days: platformSettings.defaultTrialDays,
          };
        }
      }

      const session = await stripe.checkout.sessions.create(sessionOptions);

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);

      if (error.type === "StripeAuthenticationError") {
        return res.status(401).json({
          error:
            "Invalid Stripe API Key. Please check your Stripe Secret Key in the Super Admin settings.",
          code: "STRIPE_INVALID_KEY",
        });
      }

      if (error.message === "STRIPE_CONFIG_ERROR") {
        return res.status(400).json({
          error:
            "Stripe is not configured. Please provide a valid Stripe Secret Key (sk_test_...) in the Super Admin settings.",
          code: "STRIPE_CONFIG_MISSING",
        });
      }
      if (error.message === "STRIPE_INVALID_KEY_FORMAT") {
        return res.status(400).json({
          error:
            'Invalid Stripe Secret Key format. Your key should start with "sk_" or "rk_". Please check your settings.',
          code: "STRIPE_INVALID_KEY",
        });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/create-product-checkout", async (req, res) => {
    const { productId, quantity, businessId, customerEmail } = req.body;

    try {
      // 1. Fetch product details from Supabase (to ensure valid price)
      const { data: product, error: productError } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (productError || !product) {
        if (
          productError?.code === "PGRST204" ||
          productError?.message.includes("schema cache")
        ) {
          return res.status(400).json({
            error:
              "The product catalog is still initializing. Please wait a moment and try again.",
            code: "TABLE_NOT_FOUND",
          });
        }
        return res.status(404).json({ error: "Product not found" });
      }

      // 2. Create a placeholder order record
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          business_id: businessId,
          total_amount: product.price * (quantity || 1),
          status: "pending",
          customer_email: customerEmail || "guest@example.com",
          items: [
            {
              productId: product.id,
              name: product.name,
              quantity: quantity || 1,
              price: product.price,
            },
          ],
        })
        .select()
        .single();

      if (orderError) {
        if (
          orderError.code === "PGRST204" ||
          orderError.message.includes("schema cache") ||
          orderError.message.includes("not found")
        ) {
          return res.status(400).json({
            error:
              "The e-commerce system is still initializing (missing orders table). Please wait a moment and try again.",
            code: "TABLE_NOT_FOUND",
          });
        }
        throw orderError;
      }

      const stripe = await getStripe(businessId);

      const sessionOptions: any = {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: product.name,
                description: product.description,
                images: product.image_url ? [product.image_url] : [],
              },
              unit_amount: Math.round(product.price * 100),
            },
            quantity: quantity || 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}/?success=true&order_id=${order.id}`,
        cancel_url: `${req.headers.origin}/?canceled=true`,
        metadata: {
          businessId,
          productId,
          orderId: order.id,
          type: "product_sale",
        },
      };

      if (customerEmail) {
        sessionOptions.customer_email = customerEmail;
      }

      const session = await stripe.checkout.sessions.create(sessionOptions);
      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Error creating product checkout:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/platform/test-stripe",
    authenticate,
    superAdminOnly,
    async (req, res) => {
      try {
        const { secretKey } = req.body;

        let stripe;
        if (secretKey && secretKey.trim()) {
          const trimmedKey = secretKey.trim();

          if (trimmedKey.startsWith("pk_")) {
            return res.status(400).json({
              error:
                "You provided a Publishable Key (pk_...) instead of a Secret Key (sk_...). Please use your Stripe Secret Key.",
            });
          }

          if (!trimmedKey.startsWith("sk_") && !trimmedKey.startsWith("rk_")) {
            return res.status(400).json({
              error:
                'Invalid Stripe Secret Key format. It should start with "sk_" or "rk_".',
            });
          }

          // Test with provided key
          stripe = new Stripe(trimmedKey, {
            apiVersion: "2025-01-27.acacia" as any,
          });
        } else {
          // Fallback to saved/local key
          try {
            stripe = await getStripe();
          } catch (err: any) {
            if (
              err.message === "STRIPE_CONFIG_ERROR" ||
              err.message === "STRIPE_INVALID_KEY_FORMAT"
            ) {
              return res.status(400).json({
                error:
                  'No valid Stripe Secret Key found. Please enter a key starting with "sk_".',
              });
            }
            throw err;
          }
        }

        // Simple call to verify key
        await stripe.balance.retrieve();
        res.json({ success: true, message: "Stripe connection successful!" });
      } catch (error: any) {
        console.error("Stripe test failed:", error);
        let message = "Stripe connection failed";
        let code = "STRIPE_ERROR";

        const errorMsg = error.message || String(error);

        if (error.type === "StripeAuthenticationError") {
          message = "Invalid Stripe API Key. Please check your secret key.";
          code = "STRIPE_INVALID_KEY";
        } else if (
          errorMsg.includes("STRIPE_SECRET_KEY_REQUIRED_BUT_GOT_PUBLISHABLE")
        ) {
          message =
            "You provided a Publishable Key (pk_...) instead of a Secret Key (sk_...). Please use your Stripe Secret Key.";
          code = "STRIPE_INVALID_KEY";
        } else if (errorMsg.includes("STRIPE_INVALID_KEY_FORMAT")) {
          message =
            'Invalid Stripe Secret Key format. Your key should start with "sk_" or "rk_".';
          code = "STRIPE_INVALID_KEY";
        } else if (errorMsg.includes("STRIPE_CONFIG_ERROR")) {
          message = "Stripe is not configured.";
          code = "STRIPE_CONFIG_MISSING";
        }

        res.status(400).json({
          error: message,
          code,
          details: errorMsg,
        });
      }
    },
  );

  app.post("/api/create-portal-session", authenticate, async (req, res) => {
    const { customerId } = req.body;

    try {
      // Verify customer ownership or admin status
      const { data: business } = await supabase
        .from("businesses")
        .select("id, owner_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (req as any).user.id)
        .single();

      if (
        !business ||
        (business.owner_id !== (req as any).user.id &&
          profile?.role !== "super_admin")
      ) {
        return res.status(403).json({
          error:
            "Forbidden: You do not have permission to access this billing portal.",
        });
      }

      const stripe = await getStripe();
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.origin}/dashboard/settings`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating portal session:", error);
      if (error.message === "STRIPE_CONFIG_ERROR") {
        return res.status(400).json({
          error:
            "Stripe is not configured. Please provide a valid Stripe Secret Key (sk_test_...) in the application settings menu (top right).",
          code: "STRIPE_CONFIG_MISSING",
        });
      }
      if (error.message === "STRIPE_INVALID_KEY_FORMAT") {
        return res.status(400).json({
          error:
            'Invalid Stripe Secret Key format. Your key should start with "sk_" or "rk_". Please check your settings.',
          code: "STRIPE_INVALID_KEY",
        });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get(
    "/api/platform/ai-usage",
    authenticate,
    superAdminOnly,
    async (req, res) => {
      try {
        const { data } = await supabaseAdmin
          .from("settings")
          .select("content")
          .eq("id", "ai_metrics")
          .maybeSingle();
        res.json({
          success: true,
          data: data?.content || { totalGenerations: 0, estimatedCost: 0 },
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.get(
    "/api/platform/traffic-metrics",
    authenticate,
    superAdminOnly,
    async (req, res) => {
      try {
        const days = parseInt(req.query.days as string) || 30;

        const { data: stats, error: statsError } = await supabaseAdmin.rpc(
          "get_platform_traffic_stats",
          {
            p_days: days,
          },
        );

        if (statsError) throw statsError;

        const { data: trend, error: trendError } = await supabaseAdmin.rpc(
          "get_daily_traffic_trend",
          {
            p_days: days,
          },
        );

        if (trendError) throw trendError;

        const aggregate = stats?.[0]
          ? {
              totalViews: parseInt(stats[0].total_views),
              uniqueVisitors: parseInt(stats[0].unique_visitors),
              avgViewsPerVisitor: parseFloat(stats[0].avg_views_per_visitor),
            }
          : {
              totalViews: 0,
              uniqueVisitors: 0,
              avgViewsPerVisitor: 0,
            };

        // For top pages, we need to extract from multiple rows if returned by the first RPC
        const topPages =
          stats
            ?.filter((row) => row.page_path)
            .map((row) => ({
              path: row.page_path,
              count: parseInt(row.view_count),
            })) || [];

        res.json({
          success: true,
          aggregate,
          topPages,
          trend: trend || [],
        });
      } catch (error: any) {
        console.error("Traffic metrics error:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.get(
    "/api/platform/mrr-metrics",
    authenticate,
    superAdminOnly,
    async (req, res) => {
      try {
        const stripe = await getStripe();

        // Fetch all active subscriptions
        // Note: For very large accounts, you'd need pagination
        const subscriptions = await stripe.subscriptions.list({
          status: "active",
          limit: 100,
          expand: ["data.customer"],
        });

        let mrr = 0;
        let activeCustomers = 0;
        let chartData: any[] = [];

        // Simplified MRR calculation: Sum of all active subscription items
        subscriptions.data.forEach((sub) => {
          sub.items.data.forEach((item) => {
            const amount = item.price.unit_amount || 0;
            const quantity = item.quantity || 1;
            const interval = item.price.recurring?.interval;
            const intervalCount = item.price.recurring?.interval_count || 1;

            let monthlyAmount = (amount * quantity) / 100; // to dollars

            if (interval === "year") {
              monthlyAmount = monthlyAmount / 12;
            } else if (interval === "week") {
              monthlyAmount = monthlyAmount * 4;
            } else if (interval === "month" && intervalCount > 1) {
              monthlyAmount = monthlyAmount / intervalCount;
            }

            mrr += monthlyAmount;
          });
          activeCustomers++;
        });

        // Generate some dummy historical data for the chart based on the current MRR
        // In a real app, you'd fetch snapshots or calculate from history
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const currentMonth = new Date().getMonth();

        for (let i = 6; i >= 0; i--) {
          const monthIdx = (currentMonth - i + 12) % 12;
          // Simulating growth
          const factor = 1 - i * 0.05;
          chartData.push({
            name: months[monthIdx],
            mrr: Math.round(mrr * factor),
            subscriptions: Math.round(activeCustomers * factor),
          });
        }

        res.json({
          success: true,
          data: {
            mrr: Math.round(mrr),
            activeCustomers,
            averageRevenuePerUser:
              activeCustomers > 0 ? Math.round(mrr / activeCustomers) : 0,
            growthRate: 12.5, // Mocked growth rate
            chartData,
            isLive: true,
          },
        });
      } catch (error: any) {
        // Fallback: Calculate metrics from the actual business database when Stripe is not configured
        // CRITICAL: We use supabaseAdmin here to bypass RLS and get platform-wide metrics for the Super Admin
        try {
          const { data: activeBusinesses } = await supabaseAdmin
            .from("businesses")
            .select("plan, subscription_status")
            .eq("status", "active");

          // Get plan pricing from settings or default constants
          const { data: plansData } = await supabaseAdmin
            .from("settings")
            .select("content")
            .eq("id", "plans")
            .maybeSingle();

          const planDefinitions = plansData?.content?.pricing || [
            { id: "starter", price: "$59" },
            { id: "growth", price: "$99" },
            { id: "premium", price: "$399" },
          ];

          // Create a lookup for numeric prices
          const priceMap: Record<string, number> = {};
          planDefinitions.forEach((p: any) => {
            const numericPrice = parseInt(p.price.replace(/[^0-9]/g, "")) || 0;
            priceMap[p.id] = numericPrice;
          });

          let calculatedMrr = 0;
          let activeCustomersCount = 0;

          (activeBusinesses || []).forEach((biz) => {
            // Count active and trialing subscriptions (trialing represents projected MRR)
            if (
              biz.subscription_status === "active" ||
              biz.subscription_status === "trialing"
            ) {
              calculatedMrr += priceMap[biz.plan] || 0;
              activeCustomersCount++;
            }
          });

          // Generate semi-realistic historical data based on current DB state
          const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const currentMonthIndex = new Date().getMonth();
          const chartData = [];

          for (let i = 6; i >= 0; i--) {
            const monthIdx = (currentMonthIndex - i + 12) % 12;
            // Simulate historical trend for the UI based on current actuals
            const growthFactor = 1 - i * 0.05;
            chartData.push({
              name: months[monthIdx],
              mrr: Math.round(calculatedMrr * growthFactor),
              subscriptions: Math.round(activeCustomersCount * growthFactor),
            });
          }

          res.json({
            success: true,
            data: {
              mrr: calculatedMrr,
              activeCustomers: activeCustomersCount,
              averageRevenuePerUser:
                activeCustomersCount > 0
                  ? Math.round(calculatedMrr / activeCustomersCount)
                  : 0,
              growthRate: 0,
              chartData,
              isLive: false,
              source: "database",
            },
          });
        } catch (fallbackError) {
          console.error("Final fallback failed:", fallbackError);
          res.json({
            success: true,
            data: {
              mrr: 0,
              activeCustomers: 0,
              averageRevenuePerUser: 0,
              growthRate: 0,
              chartData: [],
              isLive: false,
            },
          });
        }
      }
    },
  );

  app.get("/api/dashboard/summary/:businessId", authenticate, async (req: any, res) => {
    const { businessId } = req.params;
    console.log(`[Dashboard] Summary request for business: ${businessId} from user: ${req.user.id}`);

    // Validate businessId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      console.warn(`[Dashboard] Invalid businessId format: ${businessId}`);
      return res.status(400).json({ error: "Invalid business ID format" });
    }

    try {
      // Security check: Ensure user belongs to this business or is super_admin
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("business_id, role")
        .eq("id", req.user.id)
        .single();
      
      if (profileError) {
        console.error("[Dashboard] Profile check error:", profileError);
        return res.status(500).json({ error: "Failed to verify user profile" });
      }

      if (!userProfile || (userProfile.business_id !== businessId && userProfile.role !== 'super_admin')) {
        console.warn(`[Dashboard] Unauthorized access attempt: User ${req.user.id} (Biz: ${userProfile?.business_id}) requested ${businessId}`);
        return res.status(403).json({ error: "Unauthorized access to business data" });
      }

      const [
        { count: leadsCount },
        { count: websitesCount },
        { count: appointmentsCount },
        { data: leadsData },
        { data: appointmentsData },
        { data: businessData },
      ] = await Promise.all([
        supabaseAdmin
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("business_id", businessId),
        supabaseAdmin
          .from("websites")
          .select("*", { count: "exact", head: true })
          .eq("business_id", businessId),
        supabaseAdmin
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("business_id", businessId),
        supabaseAdmin
          .from("leads")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(6),
        supabaseAdmin
          .from("appointments")
          .select("*")
          .eq("business_id", businessId)
          .order("date", { ascending: false })
          .limit(4),
        supabaseAdmin.from("businesses").select("*").eq("id", businessId).maybeSingle(),
      ]);

      res.json({
        stats: {
          leads: leadsCount || 0,
          websites: websitesCount || 0,
          appointments: appointmentsCount || 0,
        },
        recentLeads: leadsData || [],
        recentAppointments: appointmentsData || [],
        business: businessData,
      });
    } catch (error: any) {
      console.error("Error fetching consolidated dashboard data:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Affiliate Endpoints
  app.post(
    "/api/affiliate/request-payout",
    authenticate,
    async (req: any, res) => {
      try {
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("*")
          .eq("uid", req.user.id)
          .single();

        if (!affiliate)
          return res.status(404).json({ error: "Affiliate record not found" });
        if (affiliate.status !== "active")
          return res
            .status(403)
            .json({ error: "Affiliate account is not active" });

        const amount = Number(affiliate.unpaid_earnings);
        // Fetch program minimum if possible
        const { data: program } = await supabase
          .from("affiliate_programs")
          .select("payout_minimum")
          .eq("business_id", affiliate.business_id)
          .maybeSingle();
        const minimum = program?.payout_minimum || 50;

        if (amount < minimum)
          return res
            .status(400)
            .json({ error: `Minimum payout is $${minimum}` });

        // Atomic push to payouts and clear unpaid_earnings
        const { error: payoutError } = await supabase
          .from("affiliate_payouts")
          .insert({
            affiliate_id: affiliate.id,
            amount: amount,
            status: "pending",
          });

        if (payoutError) throw payoutError;

        const { error: updateError } = await supabase
          .from("affiliates")
          .update({ unpaid_earnings: 0 })
          .eq("id", affiliate.id);

        if (updateError) throw updateError;

        res.json({ success: true, amount });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // STRIPE CONNECT ROUTES (Single Click Integration)
  app.get(
    "/api/stripe/connect/:businessId",
    authenticate,
    async (req: any, res) => {
      const { businessId } = req.params;
      const clientId =
        (platformSettings?.stripeConnectClientId?.trim() || "") ||
        (process.env.STRIPE_CONNECT_CLIENT_ID?.trim() || "");

      if (!clientId || clientId.startsWith("TODO") || clientId === "") {
        return res.status(400).json({
          error: "Stripe Connect is not configured on this platform. Super Admins must set the 'Connect Client ID' in Platform Settings.",
          isConfigError: true
        });
      }

      const platformSecretKey = platformSettings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
      if (!platformSecretKey || !platformSecretKey.startsWith("sk_")) {
         return res.status(400).json({
          error: "Platform Stripe Secret Key is not configured. Connect integration requires a valid platform secret key.",
          isConfigError: true
        });
      }

      const state = Buffer.from(
        JSON.stringify({ businessId, userId: req.user.id }),
      ).toString("base64");
      const redirectUri = `${req.headers.origin}/api/stripe/callback`;

      const stripeUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&state=${state}&redirect_uri=${redirectUri}`;

      res.json({ url: stripeUrl });
    },
  );

  app.get("/api/stripe/callback", async (req: any, res) => {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect("/dashboard/settings?error=missing_parameters");
    }

    try {
      const decodedState = JSON.parse(
        Buffer.from(state as string, "base64").toString(),
      );
      const { businessId } = decodedState;

      const stripe = await getStripe();
      const response = await stripe.oauth.token({
        grant_type: "authorization_code",
        code: code as string,
      });

      const connectedAccountId = response.stripe_user_id;

      if (connectedAccountId) {
        // Use supabaseAdmin to bypass RLS for this update
        await supabaseAdmin
          .from("businesses")
          .update({
            stripe_connected_account_id: connectedAccountId,
            // Clear manual keys if they exist to prefer Connect
            stripe_secret_key: null,
            stripe_publishable_key: null,
          })
          .eq("id", businessId);

        res.redirect("/dashboard/settings?success=stripe_connected");
      } else {
        res.redirect("/dashboard/settings?error=connection_failed");
      }
    } catch (error: any) {
      console.error("Stripe Connect error:", error);
      res.redirect(
        `/dashboard/settings?error=${encodeURIComponent(error.message)}`,
      );
    }
  });

  // API 404 Catch-all (to prevent HTML responses for API errors)
  app.all("/api/*", (req, res, next) => {
    // If we've reached here, no other /api route matched
    res.status(404).json({
      error: "API endpoint not found",
      method: req.method,
      path: req.path,
    });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("GLOBAL SERVER ERROR:", err);

    // If headers already sent, delegate to default express error handler
    if (res.headersSent) {
      return next(err);
    }

    const status = err.status || err.statusCode || 500;
    res.status(status).json({
      error: err.name || "Internal Server Error",
      message: err.message || "An unexpected error occurred on the server.",
      ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // On Vercel, static files are handled by the platform via rewrites in vercel.json
    // But we keep this for other production environments (like Cloud Run)
    const distPath = path.resolve(__dirname, "../dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// Initial start logic
await startServer();

// Export for Vercel
export default app;
