import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Call user service directly instead of going through our API route
          const userServiceUrl = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8084'
          const response = await fetch(`${userServiceUrl}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          console.log('Login response status:', response.status)
          console.log('Login response headers:', Object.fromEntries(response.headers.entries()))

          // Check if response is ok first
          if (!response.ok) {
            console.error('Login failed with status:', response.status)
            
            // Try to get error message from response
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              try {
                const errorData = await response.json()
                console.error('Login error data:', errorData)
              } catch (jsonError) {
                console.error('Failed to parse error response as JSON:', jsonError)
              }
            } else {
              // Response is not JSON, likely HTML error page
              const textResponse = await response.text()
              console.error('Non-JSON error response:', textResponse.substring(0, 200) + '...')
            }
            return null
          }

          // Check if response is JSON before parsing
          const contentType = response.headers.get('content-type')
          if (!contentType || !contentType.includes('application/json')) {
            console.error('Response is not JSON, content-type:', contentType)
            const textResponse = await response.text()
            console.error('Response text:', textResponse.substring(0, 200) + '...')
            return null
          }

          const data = await response.json()
          console.log('Login successful, user data:', data)

          if (data && data.id) {
            // Return user object that will be saved in JWT
            return {
              id: data.id,
              email: data.email,
              name: data.name,
              image: data.avatar,
            }
          }

          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      
      if (account?.provider === 'google' && user) {
        // Register or login with Google
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_USER_SERVICE_URL}/api/users/oauth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'google',
              providerId: account.providerAccountId,
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          })
          
          if (response.ok) {
            const userData = await response.json()
            token.id = userData.id
          }
        } catch (error) {
          console.error('OAuth registration error:', error)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    newUser: '/welcome',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }