'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { propertyService } from '@/services/propertyService'
import { PropertyDetails } from '@/components/booking/PropertyDetails'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/lib/hooks/useAnalytics'

export default function PropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { track } = useAnalytics()
  
  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', params.id],
    queryFn: () => propertyService.getPropertyById(params.id),
  })

  const handleBookNow = () => {
    track('property_book_now_clicked', {
      property_id: params.id,
      property_name: property?.name,
    })
    router.push(`/booking/${params.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property not found</h1>
          <Button onClick={() => router.push('/properties')}>
            Browse Properties
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <PropertyDetails property={property} />
        
        <div className="mt-8 text-center">
          <Button size="lg" onClick={handleBookNow}>
            Book Now
          </Button>
        </div>
      </div>
    </div>
  )
}