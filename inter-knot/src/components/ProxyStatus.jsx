import { motion } from 'framer-motion'
import { 
  Trophy, Star, Target, Zap, TrendingUp, Calendar, 
  Award, Shield, Flame, Crown, BarChart2 
} from 'lucide-react'
import './ProxyStatus.css'

const rankTiers = [
  { level: 1, title: 'Novice Proxy', color: '#5a5e70' },
  { level: 5, title: 'Junior Proxy', color: '#00f0ff' },
  { level: 10, title: 'Proxy', color: '#00ff88' },
  { level: 15, title: 'Rising Proxy', color: '#ffcc00' },
  { level: 25, title: 'Senior Proxy', color: '#ff6b35' },
  { level: 35, title: 'Elite Proxy', color: '#ff3355' },
  { level: 50, title: 'Master Proxy', color: '#b44dff' },
  { level: 75, title: 'Legendary Proxy', color: '#ff00ff' },
  { level: 100, title: 'Mythic Proxy', color: '#ffffff' }
]

function ProxyStatus({ proxyData, commissions }) {
  const { level, xp, xpToNext, title, completedTotal } = proxyData
  const xpPercentage = (xp / xpToNext) * 100
  
  const currentTier = [...rankTiers].reverse().find(t => level >= t.level) || rankTiers[0]
  const nextTier = rankTiers.find(t => t.level > level)

  const activeCommissions = commissions.filter(c => c.status === 'active')
  const completedThisWeek = commissions.filter(c => {
    if (c.status !== 'completed') return false
    const completedDate = new Date(c.completedAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return completedDate > weekAgo
  }).length

  // Calculate stats by difficulty
  const difficultyStats = commissions.reduce((acc, c) => {
    if (c.status === 'completed') {
      acc[c.difficulty] = (acc[c.difficulty] || 0) + 1
    }
    return acc
  }, {})

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 400, damping: 25 }
    }
  }

  return (
    <motion.div 
      className="proxy-status"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="status-header" variants={itemVariants}>
        <div className="status-title">
          <BarChart2 className="title-icon" size={24} />
          <h1>Proxy Status</h1>
        </div>
        <p className="status-subtitle">Track your progress and achievements</p>
      </motion.div>

      <div className="status-grid">
        {/* Main Profile Card */}
        <motion.div className="profile-card zzz-panel" variants={itemVariants}>
          <div className="profile-header">
            <div className="profile-avatar" style={{ '--tier-color': currentTier.color }}>
              <Crown size={32} />
              <div className="avatar-ring" />
              <div className="avatar-glow" />
            </div>
            <div className="profile-info">
              <h2 className="profile-title" style={{ color: currentTier.color }}>
                {title}
              </h2>
              <div className="profile-level">
                <span className="level-label">Level</span>
                <span className="level-value">{level}</span>
              </div>
            </div>
          </div>

          <div className="xp-section">
            <div className="xp-header">
              <span className="xp-label">Experience Progress</span>
              <span className="xp-values">
                <span className="xp-current">{xp}</span>
                <span className="xp-separator">/</span>
                <span className="xp-max">{xpToNext} XP</span>
              </span>
            </div>
            <div className="zzz-progress">
              <motion.div 
                className="zzz-progress-bar"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              />
            </div>
            {nextTier && (
              <p className="next-tier">
                <TrendingUp size={12} />
                <span>{nextTier.level - level} levels until <strong style={{ color: nextTier.color }}>{nextTier.title}</strong></span>
              </p>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div className="stat-card zzz-panel" variants={itemVariants}>
          <div className="stat-icon completed">
            <Trophy size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{completedTotal}</span>
            <span className="stat-label">Total Completed</span>
          </div>
        </motion.div>

        <motion.div className="stat-card zzz-panel" variants={itemVariants}>
          <div className="stat-icon active">
            <Target size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{activeCommissions.length}</span>
            <span className="stat-label">Active Commissions</span>
          </div>
        </motion.div>

        <motion.div className="stat-card zzz-panel" variants={itemVariants}>
          <div className="stat-icon weekly">
            <Flame size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{completedThisWeek}</span>
            <span className="stat-label">Completed This Week</span>
          </div>
        </motion.div>

        {/* Difficulty Breakdown */}
        <motion.div className="difficulty-card zzz-panel" variants={itemVariants}>
          <div className="zzz-panel-header">
            <Award size={16} />
            <span>Commission Breakdown</span>
          </div>
          <div className="difficulty-grid">
            {['S', 'A', 'B', 'C', 'D'].map((diff) => (
              <div key={diff} className="difficulty-item">
                <span className={`diff-rank rank-${diff.toLowerCase()}`}>{diff}</span>
                <span className="diff-count">{difficultyStats[diff] || 0}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Rank Progress */}
        <motion.div className="rank-card zzz-panel" variants={itemVariants}>
          <div className="zzz-panel-header">
            <Shield size={16} />
            <span>Rank Progression</span>
          </div>
          <div className="rank-timeline">
            {rankTiers.map((tier, index) => {
              const isUnlocked = level >= tier.level
              const isCurrent = tier.title === currentTier.title
              
              return (
                <div 
                  key={tier.level}
                  className={`rank-tier ${isUnlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  <div 
                    className="tier-marker"
                    style={{ backgroundColor: isUnlocked ? tier.color : undefined }}
                  >
                    {isCurrent && <Star size={10} />}
                  </div>
                  <div className="tier-info">
                    <span className="tier-title" style={{ color: isUnlocked ? tier.color : undefined }}>
                      {tier.title}
                    </span>
                    <span className="tier-level">Lv.{tier.level}</span>
                  </div>
                  {index < rankTiers.length - 1 && (
                    <div className={`tier-line ${isUnlocked ? 'filled' : ''}`} />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ProxyStatus
