import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('Login attempt for email:', email)

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password')
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get user service URL from environment
    const userServiceUrl = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8084'
    console.log('Calling user service at:', userServiceUrl)

    try {
      // Call user service to login
      const response = await fetch(`${userServiceUrl}/api/users/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      console.log('User service response status:', response.status)
      console.log('User service response headers:', Object.fromEntries(response.headers.entries()))

      // Check if the response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('User service returned non-JSON response')
        const textResponse = await response.text()
        console.error('Response text:', textResponse.substring(0, 500))
        
        return NextResponse.json(
          { message: 'User service error: Invalid response format' },
          { status: 500 }
        )
      }

      const userData = await response.json()
      console.log('User service response data:', userData)

      if (!response.ok) {
        // Handle specific error cases from user service
        if (response.status === 401) {
          return NextResponse.json(
            { message: userData.message || 'Invalid email or password' },
            { status: 401 }
          )
        }
        
        return NextResponse.json(
          { message: userData.message || 'Login failed' },
          { status: response.status }
        )
      }

      // Return user data (the user service should already exclude the password)
      return NextResponse.json({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        token: userData.token, // If your backend returns a JWT token
      })

    } catch (fetchError: any) {
      console.error('Failed to connect to user service:', fetchError)
      
      // Check if it's a network error
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message.includes('fetch failed')) {
        return NextResponse.json(
          { message: 'Authentication service is currently unavailable. Please try again later.' },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { message: 'Authentication service error' },
        { status: 500 }
      )
    }
    
  } catch (error: any) {
    console.error('Login route error:', error)
    
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}