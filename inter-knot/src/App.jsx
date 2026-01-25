import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import Header from './components/Header'
import SideNav from './components/SideNav'
import CommissionBoard from './components/CommissionBoard'
import ProxyStatus from './components/ProxyStatus'
import NewsFeed from './components/NewsFeed'
import CommissionModal from './components/CommissionModal'
import './App.css'

// Load saved data from localStorage
const loadFromStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : defaultValue
  } catch {
    return defaultValue
  }
}

// Initial commissions for demo
const defaultCommissions = [
  {
    id: uuidv4(),
    title: 'Fix Critical Bug in Auth System',
    description: 'Users are getting logged out randomly. Investigate and fix the session handling.',
    difficulty: 'S',
    reward: 150,
    status: 'active',
    createdAt: new Date().toISOString(),
    tags: ['bug', 'auth', 'urgent']
  },
  {
    id: uuidv4(),
    title: 'Implement Dark Mode Toggle',
    description: 'Add a toggle in settings to switch between light and dark themes.',
    difficulty: 'A',
    reward: 80,
    status: 'active',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    tags: ['feature', 'ui']
  },
  {
    id: uuidv4(),
    title: 'Optimize Database Queries',
    description: 'The dashboard is loading slowly. Profile and optimize the main queries.',
    difficulty: 'B',
    reward: 60,
    status: 'completed',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    tags: ['performance', 'database']
  }
]

function App() {
  const [commissions, setCommissions] = useState(() => 
    loadFromStorage('interknot-commissions', defaultCommissions)
  )
  const [proxyData, setProxyData] = useState(() => 
    loadFromStorage('interknot-proxy', {
      level: 15,
      xp: 340,
      xpToNext: 500,
      title: 'Rising Proxy',
      completedTotal: 47
    })
  )
  const [activeTab, setActiveTab] = useState('commissions')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCommission, setEditingCommission] = useState(null)

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('interknot-commissions', JSON.stringify(commissions))
  }, [commissions])

  useEffect(() => {
    localStorage.setItem('interknot-proxy', JSON.stringify(proxyData))
  }, [proxyData])

  const addCommission = (commission) => {
    const newCommission = {
      ...commission,
      id: uuidv4(),
      status: 'active',
      createdAt: new Date().toISOString()
    }
    setCommissions(prev => [newCommission, ...prev])
    setModalOpen(false)
  }

  const updateCommission = (updatedCommission) => {
    setCommissions(prev => 
      prev.map(c => c.id === updatedCommission.id ? updatedCommission : c)
    )
    setModalOpen(false)
    setEditingCommission(null)
  }

  const deleteCommission = (id) => {
    setCommissions(prev => prev.filter(c => c.id !== id))
  }

  const completeCommission = (id) => {
    const commission = commissions.find(c => c.id === id)
    if (!commission) return

    // Update commission status
    setCommissions(prev => 
      prev.map(c => c.id === id ? { 
        ...c, 
        status: 'completed',
        completedAt: new Date().toISOString()
      } : c)
    )

    // Award XP based on difficulty
    const xpRewards = { S: 100, A: 75, B: 50, C: 30, D: 15 }
    const earnedXp = xpRewards[commission.difficulty] || 30

    setProxyData(prev => {
      let newXp = prev.xp + earnedXp
      let newLevel = prev.level
      let newXpToNext = prev.xpToNext

      // Level up check
      while (newXp >= newXpToNext) {
        newXp -= newXpToNext
        newLevel += 1
        newXpToNext = Math.floor(newXpToNext * 1.15) // Increase XP needed each level
      }

      // Update title based on level
      const titles = [
        { level: 1, title: 'Novice Proxy' },
        { level: 5, title: 'Junior Proxy' },
        { level: 10, title: 'Proxy' },
        { level: 15, title: 'Rising Proxy' },
        { level: 25, title: 'Senior Proxy' },
        { level: 35, title: 'Elite Proxy' },
        { level: 50, title: 'Master Proxy' },
        { level: 75, title: 'Legendary Proxy' },
        { level: 100, title: 'Mythic Proxy' }
      ]
      
      const newTitle = [...titles].reverse().find(t => newLevel >= t.level)?.title || 'Novice Proxy'

      return {
        level: newLevel,
        xp: newXp,
        xpToNext: newXpToNext,
        title: newTitle,
        completedTotal: prev.completedTotal + 1
      }
    })
  }

  const openEditModal = (commission) => {
    setEditingCommission(commission)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingCommission(null)
  }

  return (
    <div className="app">
      <div className="noise-overlay" />
      
      <Header proxyData={proxyData} />
      
      <div className="main-layout">
        <SideNav activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="main-content">
          <AnimatePresence mode="wait">
            {activeTab === 'commissions' && (
              <motion.div
                key="commissions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="content-wrapper"
              >
                <CommissionBoard
                  commissions={commissions}
                  onComplete={completeCommission}
                  onDelete={deleteCommission}
                  onEdit={openEditModal}
                  onNewCommission={() => setModalOpen(true)}
                />
              </motion.div>
            )}
            
            {activeTab === 'status' && (
              <motion.div
                key="status"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="content-wrapper"
              >
                <ProxyStatus 
                  proxyData={proxyData} 
                  commissions={commissions}
                />
              </motion.div>
            )}
            
            {activeTab === 'news' && (
              <motion.div
                key="news"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="content-wrapper"
              >
                <NewsFeed />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <CommissionModal
            isOpen={modalOpen}
            onClose={closeModal}
            onSave={editingCommission ? updateCommission : addCommission}
            commission={editingCommission}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
