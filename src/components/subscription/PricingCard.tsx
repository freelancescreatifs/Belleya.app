import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '../ui/Button'
import { StripeProduct } from '../../stripe-config'
import { supabase } from '../../lib/supabase'

interface PricingCardProps {
  product: StripeProduct
  isPopular?: boolean
  currentPlan?: string | null
}

export function PricingCard({ product, isPopular = false, currentPlan }: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const isCurrentPlan = currentPlan === product.name

  const handleSubscribe = async () => {
    setLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/login'
        return
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}/success`,
          cancel_url: window.location.href
        })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    'All core features included',
    '24/7 customer support',
    'Regular updates',
    'Cancel anytime'
  ]

  return (
    <div className={`relative rounded-2xl border-2 p-8 ${
      isPopular 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-200 bg-white'
    }`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
        <p className="mt-2 text-gray-600">{product.description}</p>
        
        <div className="mt-6">
          <span className="text-4xl font-bold text-gray-900">
            €{product.price}
          </span>
          <span className="text-gray-600">/month</span>
        </div>
      </div>
      
      <ul className="mt-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      
      <div className="mt-8">
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : (
          <Button 
            onClick={handleSubscribe}
            loading={loading}
            className="w-full"
            variant={isPopular ? 'primary' : 'outline'}
          >
            Subscribe Now
          </Button>
        )}
      </div>
    </div>
  )
}