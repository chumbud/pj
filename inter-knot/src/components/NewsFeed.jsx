import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Newspaper, AlertTriangle, Info, Zap, ExternalLink, 
  RefreshCw, Radio, Clock, TrendingUp, Code, Globe
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import './NewsFeed.css'

// Simulated dev news - In production, you'd fetch from Hacker News, Dev.to, etc.
const generateMockNews = () => {
  const newsTemplates = [
    { 
      type: 'alert', 
      title: 'System Maintenance Scheduled',
      content: 'Hollows connectivity may be unstable during the maintenance window. All Proxies advised to complete active commissions.',
      source: 'SYSTEM',
      category: 'MAINTENANCE'
    },
    { 
      type: 'news', 
      title: 'React 19 RC Now Available',
      content: 'New concurrent features and improved Suspense boundaries. Major performance improvements for large applications.',
      source: 'DEV.TO',
      category: 'FRAMEWORK',
      url: 'https://react.dev'
    },
    { 
      type: 'trending', 
      title: 'TypeScript 5.4 Released',
      content: 'New NoInfer utility type and improved type narrowing for closures. Check the release notes for migration guide.',
      source: 'GITHUB',
      category: 'LANGUAGE',
      url: 'https://github.com/microsoft/TypeScript'
    },
    { 
      type: 'alert', 
      title: 'Hollow Activity Detected - Sector 6',
      content: 'Unusual ethereal readings detected near the old research facility. High-level Proxies requested for investigation.',
      source: 'PUBSEC',
      category: 'URGENT'
    },
    { 
      type: 'news', 
      title: 'Vite 6 Beta Announced',
      content: 'Environment API redesign with improved HMR performance. New plugin hooks for better framework integration.',
      source: 'VITEJS',
      category: 'TOOLING',
      url: 'https://vitejs.dev'
    },
    { 
      type: 'trending', 
      title: 'Bun 1.2 Performance Benchmarks',
      content: 'New benchmarks show 3x improvement in package installation speed. Node.js compatibility now at 99%.',
      source: 'BUN.SH',
      category: 'RUNTIME',
      url: 'https://bun.sh'
    },
    { 
      type: 'news', 
      title: 'New Eridu Weather Update',
      content: 'Clear skies expected throughout the week. Perfect conditions for outdoor commission work.',
      source: 'WEATHER',
      category: 'CITY'
    },
    { 
      type: 'trending', 
      title: 'Framer Motion 12 Released',
      content: 'New layout animations API with improved performance. Gesture support for touch devices enhanced.',
      source: 'FRAMER',
      category: 'ANIMATION',
      url: 'https://www.framer.com/motion'
    },
    { 
      type: 'alert', 
      title: 'Proxy Network Upgrade Complete',
      content: 'Inter-Knot servers upgraded to latest protocol. Commission matching algorithm improved by 40%.',
      source: 'SYSTEM',
      category: 'UPDATE'
    },
    { 
      type: 'news', 
      title: 'Tailwind CSS 4.0 Alpha Preview',
      content: 'New Rust-based engine delivers 10x faster builds. Native cascade layers support included.',
      source: 'TAILWINDCSS',
      category: 'CSS',
      url: 'https://tailwindcss.com'
    }
  ]

  return newsTemplates.map((item, index) => ({
    ...item,
    id: `news-${index}-${Date.now()}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
  })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

function NewsFeed() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setNews(generateMockNews())
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const refreshNews = () => {
    setLoading(true)
    setTimeout(() => {
      setNews(generateMockNews())
      setLoading(false)
    }, 500)
  }

  const filteredNews = selectedType === 'all' 
    ? news 
    : news.filter(n => n.type === selectedType)

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={16} />
      case 'trending': return <TrendingUp size={16} />
      default: return <Info size={16} />
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.95 },
    show: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 400, damping: 25 }
    }
  }

  return (
    <div className="news-feed">
      <div className="feed-header">
        <motion.div 
          className="feed-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Newspaper className="title-icon" size={24} />
          <h1>City Feed</h1>
          <div className="live-indicator">
            <Radio size={12} />
            <span>LIVE</span>
          </div>
        </motion.div>
        <p className="feed-subtitle">
          New Eridu news and developer updates from across the network
        </p>
      </div>

      <div className="feed-controls">
        <div className="type-filters">
          {[
            { id: 'all', label: 'All', icon: Globe },
            { id: 'alert', label: 'Alerts', icon: AlertTriangle },
            { id: 'news', label: 'News', icon: Info },
            { id: 'trending', label: 'Trending', icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`type-filter ${selectedType === id ? 'active' : ''}`}
              onClick={() => setSelectedType(id)}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <motion.button
          className="refresh-btn"
          onClick={refreshNews}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95, rotate: 180 }}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          <span>Refresh</span>
        </motion.button>
      </div>

      <div className="feed-content">
        {loading ? (
          <div className="loading-state">
            <div className="loader" />
            <span>Syncing with network...</span>
          </div>
        ) : (
          <motion.div 
            className="news-list"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence>
              {filteredNews.map((item) => (
                <motion.article
                  key={item.id}
                  className={`news-item ${item.type}`}
                  variants={itemVariants}
                  layout
                  whileHover={{ x: 4 }}
                >
                  <div className="news-accent" />
                  
                  <div className="news-type-badge">
                    {getTypeIcon(item.type)}
                  </div>

                  <div className="news-content">
                    <div className="news-header">
                      <span className="news-category">{item.category}</span>
                      <span className="news-source">{item.source}</span>
                    </div>
                    
                    <h3 className="news-title">{item.title}</h3>
                    <p className="news-body">{item.content}</p>
                    
                    <div className="news-footer">
                      <div className="news-time">
                        <Clock size={12} />
                        <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                      </div>
                      
                      {item.url && (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="news-link"
                        >
                          <span>Read More</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <div className="feed-footer">
        <Code size={14} />
        <span>Powered by Inter-Knot Network Protocol v2.4</span>
      </div>
    </div>
  )
}

export default NewsFeed
