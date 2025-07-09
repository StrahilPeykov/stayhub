'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Camera,
  Check,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

// Form validation schema
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
  }),
  preferences: z.object({
    language: z.string(),
    currency: z.string(),
    newsletter: z.boolean(),
    smsNotifications: z.boolean(),
    emailNotifications: z.boolean(),
  }),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileImage, setProfileImage] = useState(session?.user?.image || '')

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      phone: '',
      dateOfBirth: '',
      nationality: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      },
      preferences: {
        language: 'en',
        currency: 'USD',
        newsletter: true,
        smsNotifications: false,
        emailNotifications: true,
      },
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true)
    
    try {
      // In a real app, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update session
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
        },
      })
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      })
      
      setIsEditing(false)
      reset(data)
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Unable to update your profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const verificationStatus = {
    email: true,
    phone: false,
    government: false,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">
            Manage your personal information and preferences
          </p>
        </div>
        
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                reset()
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Picture */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
        
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                session?.user?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">
              {session?.user?.name || 'Guest User'}
            </h3>
            <p className="text-sm text-gray-500">
              Member since January 2023
            </p>
          </div>
        </div>
      </motion.div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
        
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...register('name')}
                disabled={!isEditing}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                disabled={!isEditing}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                disabled={!isEditing}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register('dateOfBirth')}
                disabled={!isEditing}
              />
            </div>
            
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                {...register('nationality')}
                disabled={!isEditing}
                placeholder="United States"
              />
            </div>
          </div>
        </form>
      </motion.div>

      {/* Address Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Address Information</h2>
        
        <form className="space-y-4">
          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              {...register('address.street')}
              disabled={!isEditing}
              placeholder="123 Main Street"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('address.city')}
                disabled={!isEditing}
                placeholder="New York"
              />
            </div>
            
            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                {...register('address.state')}
                disabled={!isEditing}
                placeholder="NY"
              />
            </div>
            
            <div>
              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
              <Input
                id="zipCode"
                {...register('address.zipCode')}
                disabled={!isEditing}
                placeholder="10001"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register('address.country')}
              disabled={!isEditing}
              placeholder="United States"
            />
          </div>
        </form>
      </motion.div>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Preferences</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Preferred Language</Label>
              <select
                id="language"
                {...register('preferences.language')}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="currency">Preferred Currency</Label>
              <select
                id="currency"
                {...register('preferences.currency')}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Communication Preferences</h3>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('preferences.emailNotifications')}
                disabled={!isEditing}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive booking confirmations and updates via email</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('preferences.smsNotifications')}
                disabled={!isEditing}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-gray-500">Receive important updates via text message</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('preferences.newsletter')}
                disabled={!isEditing}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <p className="font-medium">Newsletter</p>
                <p className="text-sm text-gray-500">Receive travel deals and inspiration</p>
              </div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Verification Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Verification Status</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium">Email Address</p>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </div>
            </div>
            <div className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
              verificationStatus.email
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            )}>
              {verificationStatus.email ? (
                <>
                  <Check className="w-4 h-4" />
                  Verified
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Not Verified
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium">Phone Number</p>
                <p className="text-sm text-gray-500">Not provided</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Add Phone
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium">Government ID</p>
                <p className="text-sm text-gray-500">Verify your identity for enhanced security</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Verify ID
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}