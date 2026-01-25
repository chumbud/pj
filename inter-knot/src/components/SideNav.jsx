import { motion } from 'framer-motion'
import { ClipboardList, BarChart3, Newspaper, Zap, Radio } from 'lucide-react'
import './SideNav.css'

const navItems = [
  { id: 'commissions', label: 'Commissions', icon: ClipboardList },
  { id: 'status', label: 'Proxy Status', icon: BarChart3 },
  { id: 'news', label: 'City Feed', icon: Newspaper },
]

function SideNav({ activeTab, setActiveTab }) {
  return (
    <nav className="side-nav">
      <div className="nav-section">
        <div className="nav-section-title">
          <Zap size={12} />
          <span>NAVIGATION</span>
        </div>
        
        <ul className="nav-list">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <div className="nav-icon">
                    <Icon size={18} />
                  </div>
                  <span className="nav-label">{item.label}</span>
                  
                  {isActive && (
                    <motion.div
                      className="active-indicator"
                      layoutId="activeIndicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              </motion.li>
            )
          })}
        </ul>
      </div>

      <div className="nav-footer">
        <div className="signal-strength">
          <Radio size={14} />
          <div className="signal-bars">
            <span className="bar active" />
            <span className="bar active" />
            <span className="bar active" />
            <span className="bar" />
          </div>
        </div>
        <div className="nav-version">
          <span>SYS.STABLE</span>
        </div>
      </div>

      <div className="nav-decoration">
        <div className="deco-corner top-right" />
        <div className="deco-corner bottom-left" />
      </div>
    </nav>
  )
}

export default SideNav
