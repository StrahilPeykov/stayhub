'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  User, 
  Heart, 
  Settings, 
  CreditCard, 
  Bell,
  Home,
  LogOut,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'

const navItems = [
  {
    title: 'Dashboard',
    href: '/account',
    icon: Home,
  },
  {
    title: 'My Bookings',
    href: '/account/bookings',
    icon: Calendar,
  },
  {
    title: 'Profile',
    href: '/account/profile',
    icon: User,
  },
  {
    title: 'Saved Properties',
    href: '/account/wishlist',
    icon: Heart,
  },
  {
    title: 'Payment Methods',
    href: '/account/payment-methods',
    icon: CreditCard,
  },
  {
    title: 'Notifications',
    href: '/account/notifications',
    icon: Bell,
  },
  {
    title: 'Settings',
    href: '/account/settings',
    icon: Settings,
  },
]

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login?redirect=' + pathname)
    }
  }, [session, status, router, pathname])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              {/* User Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || ''}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    session.user?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {session.user?.name || 'Guest User'}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {session.user?.email}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </Link>
                  )
                })}
                
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">Sign Out</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}