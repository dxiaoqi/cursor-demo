'use client'

import { useEffect } from 'react'
import useAppStore from '@/lib/store'
import IDELayout from '@/components/IDELayout'

export default function HomePage() {
  const { theme, actions } = useAppStore()

  useEffect(() => {
    // 初始化主题
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return <IDELayout />
}