'use client'

import { useState } from 'react'
import { CreditCard, Lock, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface PaymentFormProps {
  paymentData: {
    cardNumber: string
    cardName: string
    expiryDate: string
    cvv: string
    billingAddress: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
  }
  onChange: (data: any) => void
  totalAmount: number
  currency: string
}

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, Amex',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.65h4.898c1.412 0 2.613.209 3.558.618 1.163.503 1.996 1.298 2.476 2.362.484 1.074.528 2.327.128 3.723a6.963 6.963 0 0 1-.636 1.756 5.49 5.49 0 0 1-1.033 1.351c-.885.841-2.044 1.337-3.445 1.476l-.164.013c-.225.018-.45.026-.675.026H8.76l-.022.146-.625 3.953-.018.116a.627.627 0 0 1-.62.536zm5.516-11.223c-.13.824-.38 1.514-.732 2.054-.35.539-.806.954-1.35 1.233-.411.21-.886.317-1.413.317h-.774c-.323 0-.6.234-.654.548l-.728 4.608h1.315c.298 0 .555-.216.606-.508l.018-.116.487-3.08.031-.198a.608.608 0 0 1 .601-.508h.378c2.456 0 4.378-1.073 4.94-4.178.237-1.304.113-2.394-.514-3.162-.194-.237-.431-.438-.706-.599.122.893.038 1.784-.236 2.589z" />
      </svg>
    ),
    description: 'Pay with your PayPal account',
  },
]

export function PaymentForm({ paymentData, onChange, totalAmount, currency }: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [saveCard, setSaveCard] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      onChange({
        ...paymentData,
        [parent]: {
          ...paymentData[parent as keyof typeof paymentData],
          [child]: value,
        },
      })
    } else {
      onChange({
        ...paymentData,
        [field]: value,
      })
    }
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
      <div>
        <h2 className="text-2xl font-semibold mb-6">Payment Information</h2>
        
        {/* Payment Method Selection */}
        <RadioGroup
          value={selectedMethod}
          onValueChange={setSelectedMethod}
          className="grid grid-cols-1 gap-4 mb-6"
        >
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              htmlFor={method.id}
              className={cn(
                "relative flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors",
                selectedMethod === method.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200"
              )}
            >
              <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                selectedMethod === method.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              )}>
                <method.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{method.name}</div>
                <div className="text-sm text-gray-600">{method.description}</div>
              </div>
              {selectedMethod === method.id && (
                <div className="absolute top-4 right-4 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </label>
          ))}
        </RadioGroup>

        {/* Card Payment Form */}
        {selectedMethod === 'card' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    type="text"
                    value={formatCardNumber(paymentData.cardNumber)}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value.replace(/\s/g, ''))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="pl-12"
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="text"
                  value={formatExpiryDate(paymentData.expiryDate)}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value.replace(/\D/g, ''))}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <div className="relative">
                  <Input
                    id="cvv"
                    type="text"
                    value={paymentData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                    placeholder="123"
                    maxLength={4}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="The 3 or 4 digit code on the back of your card"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                type="text"
                value={paymentData.cardName}
                onChange={(e) => handleInputChange('cardName', e.target.value)}
                placeholder="John Doe"
              />
            </div>

            {/* Billing Address */}
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-4">Billing Address</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    type="text"
                    value={paymentData.billingAddress.street}
                    onChange={(e) => handleInputChange('billingAddress.street', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      value={paymentData.billingAddress.city}
                      onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                      placeholder="New York"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      type="text"
                      value={paymentData.billingAddress.state}
                      onChange={(e) => handleInputChange('billingAddress.state', e.target.value)}
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
                      value={paymentData.billingAddress.zipCode}
                      onChange={(e) => handleInputChange('billingAddress.zipCode', e.target.value)}
                      placeholder="10001"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      type="text"
                      value={paymentData.billingAddress.country}
                      onChange={(e) => handleInputChange('billingAddress.country', e.target.value)}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Card Option */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox
                id="saveCard"
                checked={saveCard}
                onCheckedChange={(checked) => setSaveCard(checked as boolean)}
              />
              <Label
                htmlFor="saveCard"
                className="text-sm font-normal cursor-pointer"
              >
                Save this card for future bookings
              </Label>
            </div>
          </div>
        )}

        {/* PayPal */}
        {selectedMethod === 'paypal' && (
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-gray-600 mb-4">
              You will be redirected to PayPal to complete your payment securely.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <Lock className="w-4 h-4" />
              Your payment information is secure and encrypted
            </div>
          </div>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="border-t pt-6">
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
          />
          <Label
            htmlFor="terms"
            className="text-sm font-normal cursor-pointer"
          >
            I agree to the{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Terms and Conditions
            </a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </Label>
        </div>
      </div>

      {/* Security Badge */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-green-600" />
          <div>
            <div className="font-medium text-green-900">Secure Payment</div>
            <div className="text-sm text-green-700">
              Your payment information is encrypted and secure. We never store your card details.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}