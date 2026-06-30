export type BillingPlan = {
  id: string;
  name: string;
  pricePerMonth: number;
  stripePriceId: string;
  limits: {
    logsIngested: number;
    aiAnalyses: number;
    seats: number;
  };
  overage: {
    enabled: boolean;
    pricePer10kLogs?: number;
    pricePer100Analyses?: number;
  };
};

export const PLANS: Record<string, BillingPlan> = {
  free: {
    id: "free",
    name: "Free Trial",
    pricePerMonth: 0,
    stripePriceId: "",
    limits: {
      logsIngested: 1000,
      aiAnalyses: 10,
      seats: 1,
    },
    overage: { enabled: false }
  },
  starter: {
    id: "starter",
    name: "Starter",
    pricePerMonth: 299,
    stripePriceId: "price_starter_mock",
    limits: {
      logsIngested: 10000,
      aiAnalyses: 100,
      seats: 3,
    },
    overage: {
      enabled: true,
      pricePer10kLogs: 50,
      pricePer100Analyses: 20
    }
  },
  growth: {
    id: "growth",
    name: "Growth",
    pricePerMonth: 999,
    stripePriceId: "price_growth_mock",
    limits: {
      logsIngested: 100000,
      aiAnalyses: 2000,
      seats: 20,
    },
    overage: {
      enabled: true,
      pricePer10kLogs: 40,
      pricePer100Analyses: 15
    }
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    pricePerMonth: 5000,
    stripePriceId: "price_enterprise_mock",
    limits: {
      logsIngested: 999999999, // Unlimited
      aiAnalyses: 999999999,
      seats: 999,
    },
    overage: { enabled: false }
  }
};

export function getPlan(planId: string): BillingPlan {
  return PLANS[planId] || PLANS["free"];
}
