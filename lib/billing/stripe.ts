import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia',
  appInfo: {
    name: 'RiskLens AI',
    version: '1.0.0'
  }
});

export const STRIPE_PLANS = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_mock_starter',
  growth: process.env.STRIPE_PRICE_GROWTH || 'price_mock_growth',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_mock_enterprise',
};

export const getPlanIdFromPriceId = (priceId: string): string => {
  if (priceId === STRIPE_PLANS.starter) return 'starter';
  if (priceId === STRIPE_PLANS.growth) return 'growth';
  if (priceId === STRIPE_PLANS.enterprise) return 'enterprise';
  return 'free';
};
