import React, { useEffect } from 'react'
import { MobileCheckInOut } from '../../components/timeTracking'
import './MobileTimeTrackingPage.css'

const MobileTimeTrackingPage: React.FC = () => {
  // Prevent zoom on mobile
  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    }

    // Add mobile-specific body class
    document.body.classList.add('mobile-time-tracking')

    // Cleanup
    return () => {
      document.body.classList.remove('mobile-time-tracking')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0')
      }
    }
  }, [])

  // Prevent pull-to-refresh on mobile
  useEffect(() => {
    const preventPullToRefresh = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      
      const touch = e.touches[0]
      const target = e.target as Element
      
      // Allow scrolling within scrollable elements
      if (target.closest('.scrollable')) return
      
      // Prevent pull-to-refresh at the top of the page
      if (window.scrollY === 0 && touch.clientY > 50) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchmove', preventPullToRefresh, { passive: false })
    
    return () => {
      document.removeEventListener('touchmove', preventPullToRefresh)
    }
  }, [])

  return (
    <div className="mobile-time-tracking-page">
      <MobileCheckInOut />
    </div>
  )
}

export default MobileTimeTrackingPage