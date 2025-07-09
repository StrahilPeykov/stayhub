'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Shield, 
  Check,
  AlertCircle,
  Edit,
  Star,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface PaymentMethod {
  id: string
  type: 'card' | 'paypal'
  isDefault: boolean
  card?: {
    brand: string
    last4: string
    expiryMonth: number
    expiryYear: number
    holderName: string
  }
  paypal?: {
    email: string
  }
  billingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

// Mock data - in a real app, this would come from an API
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    isDefault: true,
    card: {
      brand: 'visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
      holderName: 'John Doe',
    },
    billingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
    },
  },
  {
    id: '2',
    type: 'card',
    isDefault: false,
    card: {
      brand: 'mastercard',
      last4: '5555',
      expiryMonth: 6,
      expiryYear: 2024,
      holderName: 'John Doe',
    },
  },
  {
    id: '3',
    type: 'paypal',
    isDefault: false,
    paypal: {
      email: 'john.doe@example.com',
    },
  },
]

const cardBrandIcons: Record<string, string> = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  discover: '💳',
}

export default function PaymentMethodsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods)
  const [showAddCard, setShowAddCard] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  
  // Form state for new card
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    saveCard: true,
    setAsDefault: false,
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  })

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
    )
    
    toast({
      title: 'Default Payment Updated',
      description: 'Your default payment method has been changed.',
    })
  }

  const handleDeleteMethod = async (id: string) => {
    setIsDeleting(id)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setPaymentMethods(methods => methods.filter(m => m.id !== id))
    setIsDeleting(null)
    
    toast({
      title: 'Payment Method Removed',
      description: 'The payment method has been removed from your account.',
    })
  }

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Extract card details from form
    const last4 = newCard.cardNumber.slice(-4)
    const [expiryMonth, expiryYear] = newCard.expiryDate.split('/')
    
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: 'card',
      isDefault: newCard.setAsDefault || paymentMethods.length === 0,
      card: {
        brand: 'visa', // In real app, detect from card number
        last4,
        expiryMonth: parseInt(expiryMonth),
        expiryYear: 2000 + parseInt(expiryYear),
        holderName: newCard.cardName,
      },
      billingAddress: newCard.billingAddress,
    }
    
    setPaymentMethods(methods => {
      if (newMethod.isDefault) {
        return [...methods.map(m => ({ ...m, isDefault: false })), newMethod]
      }
      return [...methods, newMethod]
    })
    
    toast({
      title: 'Card Added',
      description: 'Your new payment method has been added successfully.',
    })
    
    // Reset form
    setShowAddCard(false)
    setNewCard({
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      saveCard: true,
      setAsDefault: false,
      billingAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
    })
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.slice(0, 2) + (v.length > 2 ? '/' + v.slice(2, 4) : '')
    }
    return v
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Methods</h1>
          <p className="text-gray-600">
            Manage your payment methods for faster checkout
          </p>
        </div>
        
        <Button onClick={() => setShowAddCard(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">Your payment information is secure</p>
            <p className="text-sm text-blue-700">
              We use bank-level encryption to protect your payment details. Card numbers are never stored in full.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-4">
        <AnimatePresence>
          {paymentMethods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Card Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center text-2xl",
                    method.isDefault
                      ? "bg-gradient-to-br from-blue-500 to-blue-600"
                      : "bg-gray-100"
                  )}>
                    {method.type === 'card' ? (
                      <span>{cardBrandIcons[method.card?.brand || 'visa']}</span>
                    ) : (
                      <span>💳</span>
                    )}
                  </div>

                  {/* Card Details */}
                  <div className="flex-1">
                    {method.type === 'card' && method.card ? (
                      <>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)} •••• {method.card.last4}
                          </h3>
                          {method.isDefault && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              <Star className="w-3 h-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Expires {method.card.expiryMonth}/{method.card.expiryYear}
                        </p>
                        <p className="text-sm text-gray-600">
                          {method.card.holderName}
                        </p>
                        {method.billingAddress && (
                          <p className="text-sm text-gray-500 mt-1">
                            {method.billingAddress.city}, {method.billingAddress.state} {method.billingAddress.zipCode}
                          </p>
                        )}
                      </>
                    ) : method.type === 'paypal' && method.paypal ? (
                      <>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            PayPal
                          </h3>
                          {method.isDefault && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              <Star className="w-3 h-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {method.paypal.email}
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMethod(method.id)}
                    disabled={isDeleting === method.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isDeleting === method.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {paymentMethods.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No payment methods saved
            </h3>
            <p className="text-gray-500 mb-6">
              Add a payment method for faster checkout
            </p>
            <Button onClick={() => setShowAddCard(true)}>
              Add Payment Method
            </Button>
          </div>
        )}
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Add Payment Method</h2>
              <button
                onClick={() => setShowAddCard(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCard} className="space-y-4">
              {/* Card Details */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Card Information</h3>
                
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    value={formatCardNumber(newCard.cardNumber)}
                    onChange={(e) => setNewCard({
                      ...newCard,
                      cardNumber: e.target.value.replace(/\s/g, '')
                    })}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="text"
                      value={formatExpiryDate(newCard.expiryDate)}
                      onChange={(e) => setNewCard({
                        ...newCard,
                        expiryDate: e.target.value.replace(/\D/g, '')
                      })}
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="text"
                      value={newCard.cvv}
                      onChange={(e) => setNewCard({
                        ...newCard,
                        cvv: e.target.value.replace(/\D/g, '')
                      })}
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    type="text"
                    value={newCard.cardName}
                    onChange={(e) => setNewCard({
                      ...newCard,
                      cardName: e.target.value
                    })}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              {/* Billing Address */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-gray-900">Billing Address</h3>
                
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    type="text"
                    value={newCard.billingAddress.street}
                    onChange={(e) => setNewCard({
                      ...newCard,
                      billingAddress: {
                        ...newCard.billingAddress,
                        street: e.target.value
                      }
                    })}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      value={newCard.billingAddress.city}
                      onChange={(e) => setNewCard({
                        ...newCard,
                        billingAddress: {
                          ...newCard.billingAddress,
                          city: e.target.value
                        }
                      })}
                      placeholder="New York"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      type="text"
                      value={newCard.billingAddress.state}
                      onChange={(e) => setNewCard({
                        ...newCard,
                        billingAddress: {
                          ...newCard.billingAddress,
                          state: e.target.value
                        }
                      })}
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      type="text"
                      value={newCard.billingAddress.zipCode}
                      onChange={(e) => setNewCard({
                        ...newCard,
                        billingAddress: {
                          ...newCard.billingAddress,
                          zipCode: e.target.value
                        }
                      })}
                      placeholder="10001"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      type="text"
                      value={newCard.billingAddress.country}
                      onChange={(e) => setNewCard({
                        ...newCard,
                        billingAddress: {
                          ...newCard.billingAddress,
                          country: e.target.value
                        }
                      })}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={newCard.setAsDefault}
                    onCheckedChange={(checked) => setNewCard({
                      ...newCard,
                      setAsDefault: checked as boolean
                    })}
                  />
                  <span className="text-sm">Set as default payment method</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddCard(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Card
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              When will I be charged?
            </h4>
            <p className="text-sm text-gray-600">
              You'll only be charged when you make a booking. We don't charge any fees for saving payment methods.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              Is my payment information secure?
            </h4>
            <p className="text-sm text-gray-600">
              Yes, we use industry-standard encryption and comply with PCI DSS standards. Your full card number is never stored on our servers.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              Can I use multiple payment methods for one booking?
            </h4>
            <p className="text-sm text-gray-600">
              Currently, each booking must be paid with a single payment method. However, you can save multiple cards and choose which one to use at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}