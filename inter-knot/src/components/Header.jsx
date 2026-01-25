import { motion } from 'framer-motion'
import { Wifi, Bell, Settings, User } from 'lucide-react'
import './Header.css'

function Header({ proxyData }) {
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  return (
    <header className="header">
      <div className="header-left">
        <motion.div 
          className="logo"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <div className="logo-icon">
            <span className="logo-letter">IK</span>
            <div className="logo-ring" />
          </div>
          <div className="logo-text">
            <span className="logo-title">INTER-KNOT</span>
            <span className="logo-subtitle">Proxy Network v2.4.7</span>
          </div>
        </motion.div>
      </div>

      <div className="header-center">
        <motion.div 
          className="system-status"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="status-item online">
            <Wifi size={14} />
            <span>ONLINE</span>
          </div>
          <div className="status-divider" />
          <div className="status-item">
            <span className="status-label">NEW ERIDU</span>
          </div>
          <div className="status-divider" />
          <div className="status-item time">
            <span>{currentTime}</span>
            <span className="date">{currentDate}</span>
          </div>
        </motion.div>
      </div>

      <div className="header-right">
        <motion.div 
          className="header-actions"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button className="header-btn">
            <Bell size={18} />
            <span className="notification-dot" />
          </button>
          <button className="header-btn">
            <Settings size={18} />
          </button>
          
          <div className="user-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-details">
              <span className="user-name">PROXY</span>
              <span className="user-level">Lv.{proxyData.level}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="header-decoration">
        <div className="deco-line left" />
        <div className="deco-line right" />
      </div>
    </header>
  )
}

export default Header
