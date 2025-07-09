'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Star, 
  Camera, 
  X, 
  Check,
  ChevronLeft,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { propertyService } from '@/services/propertyService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

// Review form schema
const reviewSchema = z.object({
  rating: z.object({
    overall: z.number().min(1, 'Please rate your overall experience'),
    cleanliness: z.number().min(1),
    accuracy: z.number().min(1),
    checkIn: z.number().min(1),
    communication: z.number().min(1),
    location: z.number().min(1),
    value: z.number().min(1),
  }),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  comment: z.string().min(20, 'Review must be at least 20 characters').max(1000),
  travelType: z.enum(['business', 'leisure', 'family', 'couple', 'solo']),
  wouldRecommend: z.boolean(),
})

type ReviewFormData = z.infer<typeof reviewSchema>

const categories = [
  { key: 'cleanliness', label: 'Cleanliness', description: 'Was the property clean and well-maintained?' },
  { key: 'accuracy', label: 'Accuracy', description: 'Did the property match the listing description?' },
  { key: 'checkIn', label: 'Check-in', description: 'Was the check-in process smooth?' },
  { key: 'communication', label: 'Communication', description: 'Was the host responsive and helpful?' },
  { key: 'location', label: 'Location', description: 'Was the location convenient?' },
  { key: 'value', label: 'Value', description: 'Was it good value for money?' },
]

const travelTypes = [
  { value: 'leisure', label: 'Leisure', icon: '🏖️' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'couple', label: 'Couple', icon: '💑' },
  { value: 'solo', label: 'Solo', icon: '🎒' },
]

export default function AddReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [pros, setPros] = useState<string[]>([])
  const [cons, setCons] = useState<string[]>([])
  const [newPro, setNewPro] = useState('')
  const [newCon, setNewCon] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // Fetch property details
  const { data: property } = useQuery({
    queryKey: ['property', resolvedParams.id],
    queryFn: () => propertyService.getPropertyById(resolvedParams.id),
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    mode: 'onChange',
    defaultValues: {
      rating: {
        overall: 0,
        cleanliness: 0,
        accuracy: 0,
        checkIn: 0,
        communication: 0,
        location: 0,
        value: 0,
      },
      travelType: 'leisure',
      wouldRecommend: true,
    },
  })

  const watchedRating = watch('rating')
  const watchedTravelType = watch('travelType')

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      // In a real app, this would submit to an API
      const formData = new FormData()
      formData.append('propertyId', resolvedParams.id)
      formData.append('data', JSON.stringify({ ...data, pros, cons }))
      images.forEach(image => formData.append('images', image))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      return { success: true }
    },
    onSuccess: () => {
      toast({
        title: 'Review Submitted!',
        description: 'Thank you for sharing your experience.',
      })
      router.push(`/properties/${resolvedParams.id}`)
    },
    onError: () => {
      toast({
        title: 'Submission Failed',
        description: 'Unable to submit your review. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleAddPro = () => {
    if (newPro.trim() && pros.length < 5) {
      setPros([...pros, newPro.trim()])
      setNewPro('')
    }
  }

  const handleAddCon = () => {
    if (newCon.trim() && cons.length < 5) {
      setCons([...cons, newCon.trim()])
      setNewCon('')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 5) {
      toast({
        title: 'Too many images',
        description: 'You can upload a maximum of 5 images',
        variant: 'destructive',
      })
      return
    }

    setImages([...images, ...files])
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const steps = [
    { title: 'Rate Your Stay', description: 'How was your experience?' },
    { title: 'Write Your Review', description: 'Share the details' },
    { title: 'Add Photos', description: 'Show your experience (optional)' },
  ]

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return watchedRating.overall > 0 && Object.values(watchedRating).every(r => r > 0)
      case 1:
        return !errors.title && !errors.comment && watch('title') && watch('comment')
      case 2:
        return true // Photos are optional
      default:
        return false
    }
  }

  const onSubmit = (data: ReviewFormData) => {
    submitReviewMutation.mutate(data)
  }

  if (!session) {
    router.push(`/auth/login?redirect=/properties/${resolvedParams.id}/review`)
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {property && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h1 className="text-2xl font-bold mb-2">Review Your Stay</h1>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={property.images?.[0]?.url || `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=200&h=200&fit=crop`}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{property.name}</h2>
                  <p className="text-gray-600">
                    {property.address.city}, {property.address.country}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 text-center",
                  index < steps.length - 1 && "relative"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center transition-colors",
                    index < currentStep
                      ? "bg-green-600 text-white"
                      : index === currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
                
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-5 left-1/2 w-full h-0.5",
                      index < currentStep ? "bg-green-600" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* Step 1: Ratings */}
            {currentStep === 0 && (
              <motion.div
                key="ratings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-xl p-6 shadow-sm space-y-6"
              >
                {/* Overall Rating */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Overall, how was your stay?
                  </h3>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setValue('rating.overall', rating)}
                        className="group"
                      >
                        <Star
                          className={cn(
                            "w-10 h-10 transition-all",
                            rating <= watchedRating.overall
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200 group-hover:fill-yellow-200 group-hover:text-yellow-200"
                          )}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-lg font-medium">
                      {watchedRating.overall > 0 && (
                        <>
                          {watchedRating.overall === 5 && 'Excellent!'}
                          {watchedRating.overall === 4 && 'Very Good'}
                          {watchedRating.overall === 3 && 'Good'}
                          {watchedRating.overall === 2 && 'Fair'}
                          {watchedRating.overall === 1 && 'Poor'}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Category Ratings */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Rate specific aspects
                  </h3>
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category.key}>
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <p className="font-medium">{category.label}</p>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => setValue(`rating.${category.key as keyof typeof watchedRating}`, rating)}
                                className="group"
                              >
                                <Star
                                  className={cn(
                                    "w-6 h-6 transition-all",
                                    rating <= watchedRating[category.key as keyof typeof watchedRating]
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-gray-200 text-gray-200 group-hover:fill-yellow-200 group-hover:text-yellow-200"
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Written Review */}
            {currentStep === 1 && (
              <motion.div
                key="written"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-xl p-6 shadow-sm space-y-6"
              >
                {/* Travel Type */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    What type of trip was this?
                  </Label>
                  <RadioGroup
                    value={watchedTravelType}
                    onValueChange={(value) => setValue('travelType', value as any)}
                    className="grid grid-cols-2 md:grid-cols-5 gap-3"
                  >
                    {travelTypes.map((type) => (
                      <label
                        key={type.value}
                        htmlFor={type.value}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-all",
                          watchedTravelType === type.value
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                        <span className="text-2xl">{type.icon}</span>
                        <span className="text-sm font-medium">{type.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Review Title */}
                <div>
                  <Label htmlFor="title" className="text-base font-semibold">
                    Give your review a title
                  </Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Summarize your experience..."
                    className="mt-2"
                    maxLength={100}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                  )}
                </div>

                {/* Review Comment */}
                <div>
                  <Label htmlFor="comment" className="text-base font-semibold">
                    Tell us about your stay
                  </Label>
                  <textarea
                    id="comment"
                    {...register('comment')}
                    placeholder="What did you like or dislike? Would you recommend this property?"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                    maxLength={1000}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.comment && (
                      <p className="text-sm text-red-500">{errors.comment.message}</p>
                    )}
                    <p className="text-sm text-gray-500 ml-auto">
                      {watch('comment')?.length || 0}/1000
                    </p>
                  </div>
                </div>

                {/* Pros and Cons */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      What we loved (optional)
                    </Label>
                    <div className="space-y-2">
                      {pros.map((pro, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="flex-1 text-sm">{pro}</span>
                          <button
                            type="button"
                            onClick={() => setPros(pros.filter((_, i) => i !== index))}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {pros.length < 5 && (
                        <div className="flex gap-2">
                          <Input
                            value={newPro}
                            onChange={(e) => setNewPro(e.target.value)}
                            placeholder="Add a pro..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPro())}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddPro}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Could be better (optional)
                    </Label>
                    <div className="space-y-2">
                      {cons.map((con, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                          <Minus className="w-4 h-4 text-red-600" />
                          <span className="flex-1 text-sm">{con}</span>
                          <button
                            type="button"
                            onClick={() => setCons(cons.filter((_, i) => i !== index))}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {cons.length < 5 && (
                        <div className="flex gap-2">
                          <Input
                            value={newCon}
                            onChange={(e) => setNewCon(e.target.value)}
                            placeholder="Add a con..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCon())}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddCon}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Would Recommend */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="recommend"
                    {...register('wouldRecommend')}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="recommend" className="flex-1 cursor-pointer">
                    <p className="font-medium">I would recommend this property</p>
                    <p className="text-sm text-gray-600">
                      Let other travelers know if you'd suggest staying here
                    </p>
                  </label>
                </div>
              </motion.div>
            )}

            {/* Step 3: Photos */}
            {currentStep === 2 && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold mb-4">
                  Add photos from your stay (optional)
                </h3>
                <p className="text-gray-600 mb-6">
                  Share photos to help other travelers see what to expect
                </p>

                {/* Image Upload */}
                <div className="space-y-4">
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {images.length < 5 && (
                    <label className="block">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 cursor-pointer transition-colors">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-1">
                          Click to upload photos
                        </p>
                        <p className="text-sm text-gray-500">
                          Up to 5 photos, max 5MB each
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Submit Button */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Before you submit</p>
                      <p>
                        Your review will be public and cannot be edited after submission.
                        Make sure you're happy with everything before posting.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : router.back()}
            >
              {currentStep === 0 ? 'Cancel' : 'Previous'}
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!isStepValid()}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!isValid || submitReviewMutation.isPending}
              >
                {submitReviewMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Review'
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}