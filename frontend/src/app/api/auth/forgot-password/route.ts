import { NextResponse } from 'next/server'
import { userApi } from '@/lib/api/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Call user service
    const response = await userApi.post('/api/users/forgot-password', { email })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Forgot password error:', error)
    
    return NextResponse.json(
      { message: 'If the email exists, a reset link has been sent' },
      { status: 200 } // Always return 200 for security
    )
  }
}