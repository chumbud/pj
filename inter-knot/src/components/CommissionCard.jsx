import { motion } from 'framer-motion'
import { Check, Trash2, Edit3, Clock, Award, Tag, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import './CommissionCard.css'

const difficultyColors = {
  S: { color: '#ff3355', label: 'EXTREME' },
  A: { color: '#ff6b35', label: 'HARD' },
  B: { color: '#ffcc00', label: 'MEDIUM' },
  C: { color: '#00ff88', label: 'EASY' },
  D: { color: '#00f0ff', label: 'SIMPLE' }
}

function CommissionCard({ commission, onComplete, onDelete, onEdit }) {
  const { id, title, description, difficulty, reward, status, createdAt, completedAt, tags } = commission
  const difficultyInfo = difficultyColors[difficulty] || difficultyColors.C
  const isCompleted = status === 'completed'

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      x: -50,
      transition: { duration: 0.2 }
    }
  }

  return (
    <motion.div
      className={`commission-card ${isCompleted ? 'completed' : ''}`}
      variants={cardVariants}
      layout
      exit="exit"
      whileHover={{ y: -4 }}
      style={{ '--difficulty-color': difficultyInfo.color }}
    >
      <div className="card-header">
        <div 
          className="difficulty-badge"
          style={{ borderColor: difficultyInfo.color, color: difficultyInfo.color }}
        >
          <span className="difficulty-rank">{difficulty}</span>
          <span className="difficulty-label">{difficultyInfo.label}</span>
        </div>
        
        <div className="card-actions">
          {!isCompleted && (
            <>
              <motion.button
                className="action-btn edit"
                onClick={() => onEdit(commission)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Edit Commission"
              >
                <Edit3 size={14} />
              </motion.button>
              <motion.button
                className="action-btn complete"
                onClick={() => onComplete(id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Complete Commission"
              >
                <Check size={14} />
              </motion.button>
            </>
          )}
          <motion.button
            className="action-btn delete"
            onClick={() => onDelete(id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Delete Commission"
          >
            <Trash2 size={14} />
          </motion.button>
        </div>
      </div>

      <div className="card-content">
        <h3 className="card-title">
          {isCompleted && <Check size={18} className="completed-icon" />}
          {title}
        </h3>
        <p className="card-description">{description}</p>

        {tags && tags.length > 0 && (
          <div className="card-tags">
            <Tag size={12} />
            {tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="card-meta">
          <div className="meta-item">
            <Clock size={12} />
            <span>
              {isCompleted 
                ? `Completed ${formatDistanceToNow(new Date(completedAt), { addSuffix: true })}`
                : `Posted ${formatDistanceToNow(new Date(createdAt), { addSuffix: true })}`
              }
            </span>
          </div>
        </div>

        <div className="card-reward">
          <Award size={14} />
          <span className="reward-value">+{reward}</span>
          <span className="reward-label">XP</span>
        </div>
      </div>

      <div className="card-decoration">
        <ChevronRight size={16} />
      </div>
    </motion.div>
  )
}

export default CommissionCard
