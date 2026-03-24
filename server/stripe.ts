import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY not set — Stripe features will be disabled");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Map of tier+interval to Stripe price IDs, populated on startup
export const priceIds: Record<string, string> = {};

const PRODUCT_NAME = "EveryNewCustomer - State Data Access";

const PRICE_DEFINITIONS = [
  { tier: "first_state", interval: "month" as const, unit_amount: 9900 },
  { tier: "additional_state", interval: "month" as const, unit_amount: 3900 },
  { tier: "all_states", interval: "month" as const, unit_amount: 69900 },
  // Annual prices — billed as yearly totals
  { tier: "first_state", interval: "year" as const, unit_amount: 79200 },       // $66/mo * 12 = $792
  { tier: "additional_state", interval: "year" as const, unit_amount: 31200 },   // $26/mo * 12 = $312
  { tier: "all_states", interval: "year" as const, unit_amount: 561600 },        // $468/mo * 12 = $5,616
];

/**
 * Creates or finds the EveryNewCustomer product and all pricing tiers in Stripe.
 * Safe to call on every server startup — uses metadata to find existing resources.
 */
export async function ensureStripeProducts(): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) return;

  // Find or create the product
  let product: Stripe.Product | undefined;

  const existingProducts = await stripe.products.list({ limit: 100 });
  product = existingProducts.data.find(
    (p) => p.metadata?.app === "everynewcustomer"
  );

  if (!product) {
    product = await stripe.products.create({
      name: PRODUCT_NAME,
      metadata: { app: "everynewcustomer" },
      statement_descriptor: "EVERYNEWCUSTOMER",
    });
    console.log(`Created Stripe product: ${product.id}`);
  }

  // Find or create each price
  const existingPrices = await stripe.prices.list({
    product: product.id,
    limit: 100,
    active: true,
  });

  for (const def of PRICE_DEFINITIONS) {
    const key = `${def.tier}_${def.interval === "year" ? "annual" : "monthly"}`;

    // Check if price already exists by metadata
    const existing = existingPrices.data.find(
      (p) =>
        p.metadata?.tier === def.tier &&
        p.metadata?.interval === def.interval &&
        p.unit_amount === def.unit_amount
    );

    if (existing) {
      priceIds[key] = existing.id;
    } else {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: def.unit_amount,
        currency: "usd",
        recurring: { interval: def.interval },
        metadata: { tier: def.tier, interval: def.interval },
      });
      priceIds[key] = price.id;
      console.log(`Created Stripe price: ${key} = ${price.id}`);
    }
  }

  console.log("Stripe products/prices ready:", priceIds);
}

/**
 * Creates a Stripe Checkout session for the given selection.
 */
export async function createCheckoutSession(opts: {
  states: string[];
  annual: boolean;
  allStates: boolean;
}): Promise<string> {
  const { states, annual, allStates } = opts;
  const suffix = annual ? "annual" : "monthly";

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  if (allStates) {
    lineItems.push({
      price: priceIds[`all_states_${suffix}`],
      quantity: 1,
    });
  } else if (states.length === 1) {
    lineItems.push({
      price: priceIds[`first_state_${suffix}`],
      quantity: 1,
    });
  } else if (states.length > 1) {
    lineItems.push({
      price: priceIds[`first_state_${suffix}`],
      quantity: 1,
    });
    lineItems.push({
      price: priceIds[`additional_state_${suffix}`],
      quantity: states.length - 1,
    });
  }

  const domain = process.env.DOMAIN || "http://localhost:5000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${domain}/#/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domain}/#/pricing`,
    metadata: {
      states: allStates ? "ALL" : states.join(","),
      allStates: allStates ? "true" : "false",
    },
  });

  return session.url!;
}

/**
 * Creates a Stripe Billing Portal session for an existing customer.
 */
export async function createPortalSession(
  customerId: string
): Promise<string> {
  const domain = process.env.DOMAIN || "http://localhost:5000";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${domain}/#/dashboard`,
  });

  return session.url;
}
