import { loadStripe } from "@stripe/stripe-js";

/**
 * Stripe Client Initialization
 * Uses VITE_STRIPE_PUBLISHABLE_KEY from .env.
 */
export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

export const holdsValidStripeKey = () => {
  return (
    typeof stripePublishableKey === "string" &&
    stripePublishableKey.startsWith("pk_")
  );
};
