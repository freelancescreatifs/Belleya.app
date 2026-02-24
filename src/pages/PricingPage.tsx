import React from 'react'
import { PricingCard } from '../components/subscription/PricingCard'
import { stripeProducts } from '../stripe-config'
import { useSubscription } from '../hooks/useSubscription'

export function PricingPage() {
  const { getActivePlan } = useSubscription()
  const activePlan = getActivePlan()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Select the perfect plan for your needs
          </p>
        </div>
        
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {stripeProducts.map((product, index) => (
            <PricingCard
              key={product.id}
              product={product}
              isPopular={index === 1}
              currentPlan={activePlan?.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}