import { NextResponse } from 'next/server'
import { userApi } from '@/lib/api/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Call user service to register
    const response = await userApi.post('/api/users/register', {
      name,
      email,
      password,
    })

    return NextResponse.json(response.data, { status: 201 })
  } catch (error: any) {
    console.error('Registration error:', error)
    
    // Handle specific error cases
    if (error.response?.status === 409) {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { message: error.message || 'Registration failed' },
      { status: error.response?.status || 500 }
    )
  }
}