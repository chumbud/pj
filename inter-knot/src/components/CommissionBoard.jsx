import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Filter, Search, Zap, Target, CheckCircle2 } from 'lucide-react'
import CommissionCard from './CommissionCard'
import './CommissionBoard.css'

function CommissionBoard({ commissions, onComplete, onDelete, onEdit, onNewCommission }) {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const activeCommissions = commissions.filter(c => c.status === 'active')
  const completedCommissions = commissions.filter(c => c.status === 'completed')

  const filteredCommissions = commissions.filter(c => {
    const matchesFilter = filter === 'all' || c.status === filter
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  return (
    <div className="commission-board">
      <div className="board-header">
        <div className="board-title-section">
          <motion.div 
            className="board-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Target className="title-icon" size={24} />
            <h1>Commission Board</h1>
            <div className="title-badge">
              <Zap size={12} />
              <span>{activeCommissions.length} ACTIVE</span>
            </div>
          </motion.div>
          <p className="board-subtitle">
            Accept and complete commissions to increase your Proxy Level
          </p>
        </div>

        <motion.button
          className="zzz-button new-commission-btn"
          onClick={onNewCommission}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Plus size={16} />
          <span>New Commission</span>
        </motion.button>
      </div>

      <div className="board-controls">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            className="zzz-input search-input"
            placeholder="Search commissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span>All</span>
            <span className="count">{commissions.length}</span>
          </button>
          <button
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            <Target size={14} />
            <span>Active</span>
            <span className="count">{activeCommissions.length}</span>
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            <CheckCircle2 size={14} />
            <span>Completed</span>
            <span className="count">{completedCommissions.length}</span>
          </button>
        </div>
      </div>

      <motion.div 
        className="commissions-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="popLayout">
          {filteredCommissions.length > 0 ? (
            filteredCommissions.map((commission) => (
              <CommissionCard
                key={commission.id}
                commission={commission}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))
          ) : (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="empty-icon">
                <Target size={48} />
              </div>
              <h3>No Commissions Found</h3>
              <p>Post a new commission to get started on your tasks</p>
              <button className="zzz-button" onClick={onNewCommission}>
                <Plus size={16} />
                <span>Post Commission</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default CommissionBoard
