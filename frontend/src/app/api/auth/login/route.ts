import { NextResponse } from 'next/server'
import { userApi } from '@/lib/api/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Call user service to login
    const response = await userApi.post('/api/users/login', {
      email,
      password,
    })

    const user = response.data

    // Return user data with token if available
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      token: user.token, // If your backend returns a JWT token
    })
  } catch (error: any) {
    console.error('Login error:', error)
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { message: error.message || 'Login failed' },
      { status: error.response?.status || 500 }
    )
  }
}