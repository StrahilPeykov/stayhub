#!/bin/bash
# setup-frontend.sh - Script to create the StayHub frontend

echo "🚀 Setting up StayHub Frontend..."

# Create Next.js app with TypeScript
npx create-next-app@latest stayhub-frontend --typescript --tailwind --app --eslint
cd stayhub-frontend

# Install additional dependencies
echo "📦 Installing dependencies..."
npm install axios @tanstack/react-query @tanstack/react-query-devtools
npm install react-hook-form @hookform/resolvers zod
npm install date-fns react-datepicker @types/react-datepicker
npm install lucide-react clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-toast
npm install next-auth @auth/prisma-adapter
npm install @vercel/analytics posthog-js
npm install framer-motion
npm install sharp
npm install --save-dev @types/node

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p src/components/{ui,booking,property,search,layout}
mkdir -p src/lib/{api,hooks,utils,types}
mkdir -p src/app/{properties,booking,search,auth,api}
mkdir -p src/features/{search,booking,property,user}
mkdir -p src/services
mkdir -p src/stores
mkdir -p public/images

echo "✅ Frontend setup complete!"
echo "📝 Next steps:"
echo "1. cd stayhub-frontend"
echo "2. Copy the provided files to their respective locations"
echo "3. Update .env.local with your backend URLs"
echo "4. npm run dev"