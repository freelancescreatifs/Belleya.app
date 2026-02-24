import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck as CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useSubscription } from '../hooks/useSubscription'

export function SuccessPage() {
  const { refetch } = useSubscription()

  useEffect(() => {
    // Refetch subscription data after successful payment
    const timer = setTimeout(() => {
      refetch()
    }, 2000)

    return () => clearTimeout(timer)
  }, [refetch])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h2>
          
          <p className="text-gray-600 mb-8">
            Thank you for your subscription. Your account has been activated and you can now access all features.
          </p>
          
          <div className="space-y-4">
            <Link to="/">
              <Button className="w-full">
                Go to Dashboard
              </Button>
            </Link>
            
            <Link to="/pricing">
              <Button variant="outline" className="w-full">
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}