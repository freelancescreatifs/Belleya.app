import React from 'react'
import { Crown, Calendar } from 'lucide-react'
import { useSubscription } from '../../hooks/useSubscription'

export function SubscriptionStatus() {
  const { subscription, loading, getActivePlan } = useSubscription()
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const activePlan = getActivePlan()
  
  if (!subscription || !activePlan) {
    return (
      <div className="bg-gray-50 rounded-lg border p-4">
        <div className="flex items-center">
          <Crown className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-gray-600">No active subscription</span>
        </div>
      </div>
    )
  }

  const isActive = subscription.subscription_status === 'active'
  const periodEnd = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
    : null

  return (
    <div className={`rounded-lg border p-4 ${
      isActive ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Crown className={`h-5 w-5 mr-2 ${
            isActive ? 'text-green-600' : 'text-yellow-600'
          }`} />
          <div>
            <span className={`font-medium ${
              isActive ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {activePlan.name}
            </span>
            <span className={`ml-2 text-sm ${
              isActive ? 'text-green-600' : 'text-yellow-600'
            }`}>
              ({subscription.subscription_status})
            </span>
          </div>
        </div>
        
        {periodEnd && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-1" />
            {subscription.cancel_at_period_end ? 'Expires' : 'Renews'}: {periodEnd}
          </div>
        )}
      </div>
    </div>
  )
}