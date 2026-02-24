export interface StripeProduct {
  id: string
  priceId: string
  name: string
  description: string
  price: number
  currency: string
  mode: 'subscription' | 'payment'
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_U24K42EvyA0DsO',
    priceId: 'price_1T40BmBfytXsUv43SF3X2XTI',
    name: 'Belleya Empire',
    description: 'Premium subscription plan with all features included',
    price: 59.00,
    currency: 'eur',
    mode: 'subscription'
  },
  {
    id: 'prod_U24K0IMEIWSO2Q',
    priceId: 'price_1T40BTBfytXsUv43GAmTjNG4',
    name: 'Belleya Studio',
    description: 'Professional subscription plan for creative professionals',
    price: 39.00,
    currency: 'eur',
    mode: 'subscription'
  },
  {
    id: 'prod_U24J2ARf4Ng3s5',
    priceId: 'price_1T40B2BfytXsUv43fw3OOigJ',
    name: 'Belleya Start',
    description: 'Starter subscription plan perfect for beginners',
    price: 29.00,
    currency: 'eur',
    mode: 'subscription'
  }
]

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId)
}