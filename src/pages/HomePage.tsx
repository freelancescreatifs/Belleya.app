import React from 'react'
import { Link } from 'react-router-dom'
import { Crown, CreditCard, Users } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { SubscriptionStatus } from '../components/subscription/SubscriptionStatus'
import { useAuth } from '../hooks/useAuth'

export function HomePage() {
  const { user, signOut } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
              Welcome to Belleya
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our flexible subscription plans designed to meet your needs
            </p>
            
            <div className="mt-10 flex justify-center gap-4">
              <Link to="/login">
                <Button size="lg">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline" size="lg">Create Account</Button>
              </Link>
            </div>
          </div>
          
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                <Crown className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Premium Features</h3>
              <p className="mt-2 text-gray-600">Access all features with our subscription plans</p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Secure Payments</h3>
              <p className="mt-2 text-gray-600">Safe and secure payment processing with Stripe</p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">24/7 Support</h3>
              <p className="mt-2 text-gray-600">Get help whenever you need it</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Belleya</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.email}</span>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
          <SubscriptionStatus />
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Plans</h3>
            <p className="text-gray-600 mb-4">View and manage your subscription</p>
            <Link to="/pricing">
              <Button>View Plans</Button>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Account Settings</h3>
            <p className="text-gray-600 mb-4">Manage your account preferences</p>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Support</h3>
            <p className="text-gray-600 mb-4">Get help with your account</p>
            <Button variant="outline" disabled>
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}