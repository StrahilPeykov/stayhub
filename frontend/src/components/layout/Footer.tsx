import Link from 'next/link'
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Stay in the loop</h3>
            <p className="text-gray-400 mb-6">
              Get exclusive travel deals, insider tips, and inspiration delivered to your inbox
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              />
              <Button className="bg-blue-600 hover:bg-blue-700">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-bold">StayHub</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              Your trusted platform for finding the perfect accommodation worldwide. 
              Book with confidence, travel with ease.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/properties" className="hover:text-white transition-colors">
                  All Properties
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="hover:text-white transition-colors">
                  Top Destinations
                </Link>
              </li>
              <li>
                <Link href="/deals" className="hover:text-white transition-colors">
                  Special Offers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Travel Blog
                </Link>
              </li>
              <li>
                <Link href="/mobile" className="hover:text-white transition-colors">
                  Mobile App
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-white transition-colors">
                  Safety Info
                </Link>
              </li>
              <li>
                <Link href="/cancellation" className="hover:text-white transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/covid" className="hover:text-white transition-colors">
                  COVID-19 Updates
                </Link>
              </li>
            </ul>
          </div>

          {/* Business */}
          <div>
            <h4 className="font-semibold mb-4">Business</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/partner" className="hover:text-white transition-colors">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link href="/partner/dashboard" className="hover:text-white transition-colors">
                  Partner Dashboard
                </Link>
              </li>
              <li>
                <Link href="/affiliate" className="hover:text-white transition-colors">
                  Affiliate Program
                </Link>
              </li>
              <li>
                <Link href="/corporate" className="hover:text-white transition-colors">
                  Corporate Travel
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-gray-800">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h5 className="font-medium mb-1">24/7 Support</h5>
              <p className="text-gray-400 text-sm">+1 (888) 123-4567</p>
              <p className="text-gray-400 text-sm">werbenhs@gmail.com</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h5 className="font-medium mb-1">Email Us</h5>
              <p className="text-gray-400 text-sm">werbenhs@gmail.com</p>
              <p className="text-gray-400 text-sm">werbenhs@gmail.com</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h5 className="font-medium mb-1">Headquarters</h5>
              <p className="text-gray-400 text-sm">123 Travel Street</p>
              <p className="text-gray-400 text-sm">San Francisco, CA 94105</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-400">
              <p>© {currentYear} StayHub. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <span>·</span>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <span>·</span>
                <Link href="/sitemap" className="hover:text-white transition-colors">
                  Sitemap
                </Link>
              </div>
            </div>
            
            {/* Language and Currency Selectors */}
            <div className="flex items-center gap-4">
              <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gray-600">
                <option>🇺🇸 English (US)</option>
                <option>🇪🇸 Español</option>
                <option>🇫🇷 Français</option>
                <option>🇩🇪 Deutsch</option>
                <option>🇮🇹 Italiano</option>
                <option>🇯🇵 日本語</option>
                <option>🇨🇳 中文</option>
              </select>
              <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gray-600">
                <option>USD $</option>
                <option>EUR €</option>
                <option>GBP £</option>
                <option>JPY ¥</option>
                <option>AUD $</option>
                <option>CAD $</option>
              </select>
            </div>
          </div>
          
          {/* Security Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-16 h-8" viewBox="0 0 100 40" fill="currentColor">
                <rect x="0" y="0" width="100" height="40" rx="5" opacity="0.1"/>
                <text x="50" y="25" textAnchor="middle" fontSize="12" fill="currentColor">SSL Secured</text>
              </svg>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-16 h-8" viewBox="0 0 100 40" fill="currentColor">
                <rect x="0" y="0" width="100" height="40" rx="5" opacity="0.1"/>
                <text x="50" y="25" textAnchor="middle" fontSize="12" fill="currentColor">PCI DSS</text>
              </svg>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-16 h-8" viewBox="0 0 100 40" fill="currentColor">
                <rect x="0" y="0" width="100" height="40" rx="5" opacity="0.1"/>
                <text x="50" y="25" textAnchor="middle" fontSize="12" fill="currentColor">GDPR</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}