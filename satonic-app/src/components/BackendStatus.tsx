'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'

export function BackendStatus() {
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean | null>(null)
  const [isMockData, setIsMockData] = useState<boolean>(false)
  
  useEffect(() => {
    // Check if we're using mock data
    setIsMockData(api.system.isMockData())
    
    // Only check backend status if we're not using mock data
    if (!api.system.isMockData()) {
      checkBackendStatus()
    }
  }, [])
  
  const checkBackendStatus = async () => {
    try {
      const response = await api.system.healthCheck()
      setIsBackendAvailable(response.success)
      
      if (!response.success) {
        toast.error('Backend API is not available.')
      }
    } catch (error) {
      setIsBackendAvailable(false)
      toast.error('Could not connect to backend API.')
    }
  }
  
  if (isMockData) {
    return (
      <div className="fixed bottom-0 right-0 p-2 bg-black/80 text-yellow-500 text-xs z-50 rounded-tl-md">
        Using mock data
      </div>
    )
  }
  
  if (isBackendAvailable === null) {
    return (
      <div className="fixed bottom-0 right-0 p-2 bg-black/80 text-blue-500 text-xs z-50 rounded-tl-md">
        Checking API...
      </div>
    )
  }
  
  if (!isBackendAvailable) {
    return (
      <div className="fixed bottom-0 right-0 p-2 bg-black/80 text-red-500 text-xs z-50 rounded-tl-md">
        API not available
      </div>
    )
  }
  
  return (
    <div className="fixed bottom-0 right-0 p-2 bg-black/80 text-green-500 text-xs z-50 rounded-tl-md">
      API connected
    </div>
  )
} 