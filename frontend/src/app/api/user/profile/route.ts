import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { userApi } from '@/lib/api/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile from user service
    const response = await userApi.get(`/api/users/${session.user.id}`)
    
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Profile fetch error:', error)
    
    return NextResponse.json(
      { message: error.message || 'Failed to fetch profile' },
      { status: error.response?.status || 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Update user profile in user service
    const response = await userApi.put(`/api/users/${session.user.id}`, body)
    
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Profile update error:', error)
    
    return NextResponse.json(
      { message: error.message || 'Failed to update profile' },
      { status: error.response?.status || 500 }
    )
  }
}