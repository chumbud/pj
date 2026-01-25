import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Tag, Zap, AlertCircle } from 'lucide-react'
import './CommissionModal.css'

const difficultyOptions = [
  { value: 'D', label: 'D - Simple', color: '#00f0ff', xp: 15 },
  { value: 'C', label: 'C - Easy', color: '#00ff88', xp: 30 },
  { value: 'B', label: 'B - Medium', color: '#ffcc00', xp: 50 },
  { value: 'A', label: 'A - Hard', color: '#ff6b35', xp: 75 },
  { value: 'S', label: 'S - Extreme', color: '#ff3355', xp: 100 }
]

function CommissionModal({ isOpen, onClose, onSave, commission }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'C',
    reward: 30,
    tags: []
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (commission) {
      setFormData({
        ...commission,
        tags: commission.tags || []
      })
    } else {
      setFormData({
        title: '',
        description: '',
        difficulty: 'C',
        reward: 30,
        tags: []
      })
    }
    setErrors({})
  }, [commission, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleDifficultyChange = (value) => {
    const option = difficultyOptions.find(o => o.value === value)
    setFormData(prev => ({ 
      ...prev, 
      difficulty: value,
      reward: option?.xp || 30
    }))
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Commission title is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSave({
        ...formData,
        id: commission?.id
      })
    }
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      rotateX: -15
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 30,
      transition: { duration: 0.2 }
    }
  }

  const selectedDifficulty = difficultyOptions.find(o => o.value === formData.difficulty)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            className="modal-container"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">
                <Zap size={20} />
                <h2>{commission ? 'Edit Commission' : 'New Commission'}</h2>
              </div>
              <motion.button
                className="modal-close"
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Commission Title</label>
                <input
                  type="text"
                  name="title"
                  className={`zzz-input ${errors.title ? 'error' : ''}`}
                  placeholder="Enter commission title..."
                  value={formData.title}
                  onChange={handleChange}
                />
                {errors.title && (
                  <motion.span 
                    className="error-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle size={12} />
                    {errors.title}
                  </motion.span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className={`zzz-input textarea ${errors.description ? 'error' : ''}`}
                  placeholder="Describe the commission details..."
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                />
                {errors.description && (
                  <motion.span 
                    className="error-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle size={12} />
                    {errors.description}
                  </motion.span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Difficulty Rank</label>
                <div className="difficulty-selector">
                  {difficultyOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      className={`difficulty-option ${formData.difficulty === option.value ? 'selected' : ''}`}
                      style={{ '--diff-color': option.color }}
                      onClick={() => handleDifficultyChange(option.value)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="diff-rank">{option.value}</span>
                      <span className="diff-xp">+{option.xp} XP</span>
                    </motion.button>
                  ))}
                </div>
                <p className="form-hint">
                  Selected: <strong style={{ color: selectedDifficulty?.color }}>
                    {selectedDifficulty?.label}
                  </strong> - Reward: <strong>{formData.reward} XP</strong>
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Tags (Optional)</label>
                <div className="tag-input-wrapper">
                  <Tag size={16} />
                  <input
                    type="text"
                    className="zzz-input tag-input"
                    placeholder="Add tags..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={20}
                  />
                  <motion.button
                    type="button"
                    className="add-tag-btn"
                    onClick={addTag}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={!tagInput.trim()}
                  >
                    <Plus size={16} />
                  </motion.button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="tags-list">
                    {formData.tags.map((tag) => (
                      <motion.span
                        key={tag}
                        className="tag-chip"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        layout
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <X size={12} />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
                <p className="form-hint">{5 - formData.tags.length} tags remaining</p>
              </div>

              <div className="modal-actions">
                <motion.button
                  type="button"
                  className="zzz-button secondary"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="zzz-button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {commission ? 'Update Commission' : 'Post Commission'}
                </motion.button>
              </div>
            </form>

            <div className="modal-decoration">
              <div className="deco-corner tl" />
              <div className="deco-corner tr" />
              <div className="deco-corner bl" />
              <div className="deco-corner br" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CommissionModal
