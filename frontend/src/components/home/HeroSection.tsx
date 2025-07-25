'use client'

import { SearchBar } from '@/components/search/SearchBar'
import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SearchBar />
    </motion.div>
  )
}