const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;
const ARENA_CHANNEL_SLUG = process.env.ARENA_CHANNEL_SLUG;

// Simple in-memory rate limiting for contact form
const contactRateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 3; // Max 3 submissions per 15 minutes per IP

function getClientIP(req) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    return (xForwardedFor && xForwardedFor.split(',')[0]) || 
           (req.headers['x-real-ip']) || 
           (req.connection && req.connection.remoteAddress) || 
           (req.socket && req.socket.remoteAddress) ||
           'unknown';
}

function checkRateLimit(ip) {
    // Skip rate limiting for localhost during development
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'unknown') {
        return true;
    }
    
    const now = Date.now();
    const record = contactRateLimit.get(ip);
    
    if (!record) {
        contactRateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }
    
    if (now > record.resetTime) {
        // Reset window
        contactRateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }
    
    if (record.count >= RATE_LIMIT_MAX) {
        return false;
    }
    
    record.count++;
    return true;
}

// Parse JSON bodies
app.use(express.json());

// 1. Configure EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Helper function to fetch blocks from the Are.na API with pagination.
 * @param {number} page - The page number to fetch (defaults to 1).
 * @param {number} per - The number of blocks per page (defaults to 10).
 * @returns {object} The response data including blocks, title, and pagination info.
 */
async function fetchArenaBlocks(page = 1, per = 20, apiUrlSlug) {
    // API URL with dynamic pagination, sorting for newest first, and blocks per page
    // The direction=desc ensures the latest blocks are on page 1, 2, 3, etc.
    const apiUrl = `https://api.are.na/v2/channels/${apiUrlSlug}?&direction=desc&per=${per}&page=${page}`;
    try {
        const response = await axios.get(apiUrl);
        // This 'length' property contains the total number of blocks in the channel.
        const totalBlocksInChannel = response.data.length || 0; 
        
        // Calculate total pages based on the total channel length and the 'per' parameter
        const totalPages = Math.ceil(totalBlocksInChannel / per);

        return {
            blocks: response.data.contents || [], // This is the array of blocks for the current page
            title: response.data.title || 'Are.na Channel',
            currentPage: page,
            totalPages: totalPages,
            totalBlocks: totalBlocksInChannel,
            updatedAt: response.data.updated_at,
        };
    } catch (error) {
        console.error(`Error fetching data for ${apiUrlSlug} (Page ${page}):`, error.message);
        return {
            blocks: [],
            title: 'Error Loading Channel',
            currentPage: page,
            totalPages: 1,
        };
    }
}


// 3. Define the main route: Initial Page Load (HTML + first 10 blocks)
app.get('/likes', async (req, res) => {
    const initialLoadCount = 40;
    const apiPerPage = 20; // Must match the 'per' value used in /api/blocks
    const data = await fetchArenaBlocks(1, initialLoadCount, ARENA_CHANNEL_SLUG);

    // Calculate how many API pages the initial load covers
    const pagesLoaded = Math.ceil(initialLoadCount / apiPerPage);
    // Recalculate totalPages based on the API's per-page value (20), not initial load (40)
    const totalPagesForApi = Math.ceil(data.totalBlocks / apiPerPage);

    // Render the EJS file, passing blocks AND the necessary pagination info
    // This data will be critical for the client-side lazy-loader.js
    res.render('likes', {
        pageTitle: data.title,
        channelBlocks: data.blocks,
        totalPages: totalPagesForApi,
        currentPage: pagesLoaded, // Start from page 2 since we loaded 40 blocks (2 pages worth)
        totalBlocks: data.totalBlocks,
        updatedAt: data.updatedAt,
    });
});

// 3. Define the main route: Initial Page Load (HTML + first 10 blocks)
app.get('/minerals', async (req, res) => {
    const initialLoadCount = 40;
    const data = await fetchArenaBlocks(1, initialLoadCount, 'my-rock-slop'); // Fetch page 1 (first 10)

    // Render the EJS file, passing blocks AND the necessary pagination info
    // *** FIX: Rendering 'minerals' template ***
    res.render('minerals', {
        pageTitle: data.title,
        channelBlocks: data.blocks,
        totalPages: data.totalPages, // Pass to client for lazy loading control
        currentPage: data.currentPage, // Should be 1
        totalBlocks: data.totalBlocks,
        updatedAt: data.updatedAt,
        channelSlug: 'my-rock-slop',
    });
});


// Cache for channel length to reduce API calls
const channelLengthCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Returns a random block from the entire channel
app.get('/api/random-block', async (req, res) => {
    const apiUrlSlug = req.query.channel || ARENA_CHANNEL_SLUG;
    
    try {
        let totalBlocks;
        
        // Check cache for channel length
        const cached = channelLengthCache[apiUrlSlug];
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            totalBlocks = cached.length;
        } else {
            // Fetch channel info to get total blocks
            const channelInfoUrl = `https://api.are.na/v2/channels/${apiUrlSlug}?per=1`;
            const infoResponse = await axios.get(channelInfoUrl);
            totalBlocks = infoResponse.data.length || 0;
            
            // Cache the result
            channelLengthCache[apiUrlSlug] = {
                length: totalBlocks,
                timestamp: Date.now()
            };
        }
        
        if (totalBlocks === 0) {
            return res.status(404).json({ error: 'No blocks in channel' });
        }
        
        // Fetch a small batch instead of 1 to increase chance of getting an image
        const batchSize = 5;
        const maxPage = Math.ceil(totalBlocks / batchSize);
        const randomPage = Math.floor(Math.random() * maxPage) + 1;
        
        const blockUrl = `https://api.are.na/v2/channels/${apiUrlSlug}/contents?per=${batchSize}&page=${randomPage}&direction=desc`;
        const blockResponse = await axios.get(blockUrl);
        const blocks = blockResponse.data.contents || [];
        
        // Filter to only image blocks and pick a random one
        const imageBlocks = blocks.filter(b => b.image && b.image.original);
        
        if (imageBlocks.length === 0) {
            // Try one more batch if no images found
            const retryPage = Math.floor(Math.random() * maxPage) + 1;
            const retryResponse = await axios.get(`https://api.are.na/v2/channels/${apiUrlSlug}/contents?per=${batchSize}&page=${retryPage}&direction=desc`);
            const retryBlocks = (retryResponse.data.contents || []).filter(b => b.image && b.image.original);
            
            if (retryBlocks.length === 0) {
                return res.status(404).json({ error: 'Could not find an image block' });
            }
            
            const block = retryBlocks[Math.floor(Math.random() * retryBlocks.length)];
            return res.json({
                block: {
                    originalUrl: block.image.original.url,
                    thumbUrl: block.image.thumb ? block.image.thumb.url : null,
                    title: block.title || 'Are.na Image Block',
                    sourceUrl: (block.source && block.source.url) ? block.source.url : '#',
                }
            });
        }
        
        const blockIndex = Math.floor(Math.random() * imageBlocks.length);
        const block = imageBlocks[blockIndex];
        
        // Calculate the absolute position in the channel
        const absolutePosition = ((randomPage - 1) * batchSize) + blockIndex + 1;
        
        res.json({
            block: {
                originalUrl: block.image.original.url,
                thumbUrl: block.image.thumb ? block.image.thumb.url : null,
                title: block.title || 'Are.na Image Block',
                sourceUrl: (block.source && block.source.url) ? block.source.url : '#',
            },
            position: absolutePosition,
            totalBlocks: totalBlocks
        });
    } catch (error) {
        console.error('Error fetching random block:', error.message);
        res.status(500).json({ error: 'Failed to fetch random block' });
    }
});

// Fetch a block at a specific position in the channel
app.get('/api/block-at-position', async (req, res) => {
    const apiUrlSlug = req.query.channel || ARENA_CHANNEL_SLUG;
    const position = parseInt(req.query.position) || 1;
    
    try {
        // Fetch just that one block using page=position, per=1
        const blockUrl = `https://api.are.na/v2/channels/${apiUrlSlug}/contents?per=1&page=${position}&direction=desc`;
        const blockResponse = await axios.get(blockUrl);
        const blocks = blockResponse.data.contents || [];
        const totalBlocks = blockResponse.data.length || 0;
        
        if (blocks.length === 0) {
            return res.status(404).json({ error: 'No block at this position' });
        }
        
        const block = blocks[0];
        
        // Skip non-image blocks by fetching next/prev
        if (!block.image || !block.image.original) {
            return res.status(404).json({ error: 'No image block at this position', skipTo: position + 1 });
        }
        
        res.json({
            block: {
                originalUrl: block.image.original.url,
                thumbUrl: block.image.thumb ? block.image.thumb.url : null,
                title: block.title || 'Are.na Image Block',
                sourceUrl: (block.source && block.source.url) ? block.source.url : '#',
            },
            position: position,
            totalBlocks: totalBlocks
        });
    } catch (error) {
        console.error('Error fetching block at position:', error.message);
        res.status(500).json({ error: 'Failed to fetch block' });
    }
});

// Fetch a block by ID
app.get('/api/block-by-id', async (req, res) => {
    const apiUrlSlug = req.query.channel || ARENA_CHANNEL_SLUG;
    const blockId = req.query.id;
    
    if (!blockId) {
        return res.status(400).json({ error: 'Block ID is required' });
    }
    
    try {
        // Fetch block directly from Are.na API by ID
        const blockUrl = `https://api.are.na/v2/blocks/${blockId}`;
        const blockResponse = await axios.get(blockUrl);
        const block = blockResponse.data;
        
        if (!block.image || !block.image.original) {
            return res.status(404).json({ error: 'Block is not an image block' });
        }
        
        res.json({
            block: {
                id: block.id,
                originalUrl: block.image.original.url,
                thumbUrl: block.image.thumb ? block.image.thumb.url : null,
                title: block.title || 'Are.na Image Block',
                sourceUrl: (block.source && block.source.url) ? block.source.url : '#',
            }
        });
    } catch (error) {
        console.error('Error fetching block by ID:', error.message);
        res.status(500).json({ error: 'Failed to fetch block' });
    }
});

// This route responds with pure JSON data, which the client-side JavaScript will use to append content.
app.get('/api/blocks', async (req, res) => {
    // 1. Extract the channel slug from the query string, defaulting to the environment variable
    const apiUrlSlug = req.query.channel || ARENA_CHANNEL_SLUG; 
    
    // The client will pass the next page number in the query string (e.g., /api/blocks?page=2)
    const page = parseInt(req.query.page) || 1;
    const per = 20; // Subsequent loads fetch 20 blocks at a time

    // 2. Pass the dynamic slug to the fetchArenaBlocks helper function
    const data = await fetchArenaBlocks(page, per, apiUrlSlug);

    // Send the blocks and the next page number back as JSON
    res.json({
        blocks: data.blocks,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
    });
});


app.get('/', (req, res) => {
    res.render('index', {
        pageTitle: 'PJ'
    });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    const { email, message, website } = req.body;
    
    // Honeypot check - if website field is filled, it's a bot
    if (website) {
        // Silently reject - don't alert bots
        return res.status(200).json({ success: true, message: 'Email sent successfully' });
    }
    
    // Rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    
    if (!email || !message) {
        return res.status(400).json({ error: 'Email and message are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Additional spam checks
    // Reject messages that are suspiciously short or contain only spam-like patterns
    const messageLength = message.trim().length;
    if (messageLength < 3) {
        return res.status(400).json({ error: 'Message is too short' });
    }
    
    // Check for common spam patterns (all caps, excessive special chars, etc.)
    const spamPatterns = [
        /^[A-Z\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{20,}$/, // All caps with special chars
        /(.)\1{10,}/, // Repeated characters (like "aaaaaaaaaa")
    ];
    
    if (spamPatterns.some(pattern => pattern.test(message))) {
        return res.status(400).json({ error: 'Invalid message format' });
    }
    
    try {
        // Check if Gmail credentials are configured
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            // In development, log the message instead of sending email
            console.log('=== CONTACT FORM SUBMISSION (Development Mode) ===');
            console.log('From:', email);
            console.log('Message:', message);
            console.log('================================================');
            return res.json({ success: true, message: 'Email sent successfully (logged in development)' });
        }
        
        // Create transporter with Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
        
        // Send email
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER, // Send to yourself
            replyTo: email, // Reply goes to the sender
            subject: `someone just sent you a message!`,
            text: `From: ${email}\n\nMessage:\n${message}`,
            html: `
                <h3>New contact form submission</h3>
                <p><strong>From:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        });
        
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        // Provide more helpful error message
        const errorMessage = error.code === 'EAUTH' 
            ? 'Email authentication failed. Please check your Gmail credentials.'
            : 'Failed to send email';
        res.status(500).json({ error: errorMessage });
    }
});

// YIPPEE Counter endpoints
const YIPPEE_COUNTER_FILE = path.join(__dirname, 'yippee-counter.json');

/** API only exposes last yippee as an ISO timestamp string (never legacy geo objects). */
function yippeeLastAtForApi(lastLocation) {
    if (lastLocation == null || typeof lastLocation !== 'string') return null;
    const t = Date.parse(lastLocation);
    return Number.isNaN(t) ? null : lastLocation;
}

function migrateYippeeCounterIfLegacyGeo(counter) {
    if (counter.lastLocation != null && typeof counter.lastLocation === 'object') {
        delete counter.lastLocation;
        return true;
    }
    return false;
}

// Initialize counter file if it doesn't exist or is empty/corrupted
function initCounterFile() {
    if (!fs.existsSync(YIPPEE_COUNTER_FILE)) {
        fs.writeFileSync(YIPPEE_COUNTER_FILE, JSON.stringify({ count: 0 }), 'utf8');
        return;
    }
    
    // Check if file is empty or corrupted
    try {
        const data = fs.readFileSync(YIPPEE_COUNTER_FILE, 'utf8');
        if (!data || data.trim() === '') {
            // File exists but is empty, reinitialize it
            fs.writeFileSync(YIPPEE_COUNTER_FILE, JSON.stringify({ count: 0 }), 'utf8');
            return;
        }
        // Try to parse to check if it's valid JSON
        JSON.parse(data);
    } catch (error) {
        // File is corrupted or invalid JSON, reinitialize it
        console.warn('Counter file is corrupted, reinitializing:', error.message);
        fs.writeFileSync(YIPPEE_COUNTER_FILE, JSON.stringify({ count: 0 }), 'utf8');
    }
}

// Get current counter value
app.get('/api/yippee', (req, res) => {
    initCounterFile();
    try {
        const data = fs.readFileSync(YIPPEE_COUNTER_FILE, 'utf8');
        // Handle empty file
        if (!data || data.trim() === '') {
            return res.json({ count: 0, location: null });
        }
        const counter = JSON.parse(data);
        if (migrateYippeeCounterIfLegacyGeo(counter)) {
            fs.writeFileSync(YIPPEE_COUNTER_FILE, JSON.stringify(counter), 'utf8');
        }
        res.json({
            count: counter.count || 0,
            location: yippeeLastAtForApi(counter.lastLocation)
        });
    } catch (error) {
        console.error('Error reading counter:', error);
        res.json({ count: 0, location: null });
    }
});

// Get user location by looking up the requesting client's IP (not the server's)
app.get('/api/location', async (req, res) => {
    try {
        const clientIp = getClientIP(req).trim();
        // Skip lookup for localhost and private IPs
        if (!clientIp || clientIp === 'unknown' ||
            clientIp === '127.0.0.1' || clientIp === '::1' ||
            clientIp.startsWith('::ffff:127.') || clientIp.startsWith('10.') ||
            clientIp.startsWith('172.16.') || clientIp.startsWith('172.17.') ||
            clientIp.startsWith('172.18.') || clientIp.startsWith('172.19.') ||
            /^172\.(2[0-9]|3[0-1])\./.test(clientIp) || clientIp.startsWith('192.168.')) {
            return res.json({ error: 'Location not available for this network' });
        }
        const response = await axios.get(`https://ipapi.co/${clientIp}/json/`, {
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = response.data;
        if (data && data.city && data.region && data.country_code) {
            res.json({
                city: data.city,
                region: data.region,
                countryCode: data.country_code
            });
        } else {
            res.json({ error: 'Location data not available' });
        }
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.warn('Location API rate limited, returning empty response');
            return res.json({ error: 'Location service temporarily unavailable' });
        }
        console.error('Error fetching location:', error.message);
        res.json({ error: 'Failed to fetch location' });
    }
});

// Increment counter
app.post('/api/yippee/increment', (req, res) => {
    initCounterFile();
    try {
        const data = fs.readFileSync(YIPPEE_COUNTER_FILE, 'utf8');
        // Handle empty file
        if (!data || data.trim() === '') {
            const counter = { count: 1, lastLocation: new Date().toISOString() };
            fs.writeFileSync(YIPPEE_COUNTER_FILE, JSON.stringify(counter), 'utf8');
            
            const responseData = {
                count: counter.count,
                location: yippeeLastAtForApi(counter.lastLocation)
            };

            // Broadcast update to all connected clients
            io.emit('yippee-update', responseData);

            return res.json(responseData);
        }

        const counter = JSON.parse(data);
        migrateYippeeCounterIfLegacyGeo(counter);
        counter.count = (counter.count || 0) + 1;
        counter.lastLocation = new Date().toISOString();

        fs.writeFileSync(YIPPEE_COUNTER_FILE, JSON.stringify(counter), 'utf8');

        const responseData = {
            count: counter.count,
            location: yippeeLastAtForApi(counter.lastLocation)
        };
        
        // Broadcast update to all connected clients
        io.emit('yippee-update', responseData);
        
        res.json(responseData);
    } catch (error) {
        console.error('Error incrementing counter:', error);
        console.error('Error details:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to increment counter', details: error.message });
    }
});

// OSRS Stats Cache
const osrsStatsCache = { data: null, timestamp: 0 };
const OSRS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const OSRS_USERNAME = process.env.OSRS_USERNAME || 'spoooji';
const RUNESCAPE_STATS_FILE = path.join(__dirname, 'runescape-stats.json');


// Initialize runescape stats file if it doesn't exist
function initRunescapeStatsFile() {
    if (!fs.existsSync(RUNESCAPE_STATS_FILE)) {
        fs.writeFileSync(RUNESCAPE_STATS_FILE, JSON.stringify({ timestamp: Date.now(), skills: {} }), 'utf8');
    }
}

// OSRS Stats API Endpoint
app.get('/api/osrs/stats', async (req, res) => {
    try {
        // Check cache first
        if (Date.now() - osrsStatsCache.timestamp < OSRS_CACHE_TTL && osrsStatsCache.data) {
            return res.json(osrsStatsCache.data);
        }

        // Fetch current stats with timeout
        const { getStatsByGamemode } = require('osrs-json-hiscores');
        const statsResponse = await Promise.race([
            getStatsByGamemode(OSRS_USERNAME),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('OSRS API request timeout')), 10000)
            )
        ]);
        
        // The package returns stats directly as an object with skill names as keys
        // If it's already in the right format, use it; otherwise wrap it
        const currentStats = (statsResponse && statsResponse.skills) ? statsResponse : { skills: statsResponse || {} };
        
        // Debug log in development
        if (process.env.NODE_ENV === 'development') {
            console.log('OSRS API response structure:', Object.keys(statsResponse || {}).slice(0, 5));
        }

        // Read previous stats
        initRunescapeStatsFile();
        let previousStats = { timestamp: Date.now(), skills: {} };
        try {
            const prevData = fs.readFileSync(RUNESCAPE_STATS_FILE, 'utf8');
            if (prevData && prevData.trim()) {
                previousStats = JSON.parse(prevData);
            }
        } catch (error) {
            console.warn('Error reading previous OSRS stats, using empty:', error.message);
        }

        // Process skills and detect active ones (with XP gains)
        const skillsList = [
            'attack', 'strength', 'defence', 'ranged', 'prayer', 'magic',
            'runecraft', 'construction', 'hitpoints', 'agility', 'herblore',
            'thieving', 'crafting', 'fletching', 'slayer', 'hunter', 'mining',
            'smithing', 'fishing', 'cooking', 'firemaking', 'woodcutting', 'farming'
        ];

        const skillsData = [];
        const activeSkills = [];

        // XP needed for level 99 in OSRS
        const XP_FOR_99 = 13034431;
        
        skillsList.forEach(skillName => {
            const skill = currentStats.skills && currentStats.skills[skillName] ? currentStats.skills[skillName] : null;
            if (!skill) return;

            const level = skill.level || 0;
            const xp = skill.xp || 0;
            const progress = Math.min(xp / XP_FOR_99, 1.0); // Cap at 1.0 (100%) for skills at/above 99
            
            // Check if skill gained XP (active)
            const prevSkill = previousStats.skills[skillName];
            const xpGained = prevSkill && prevSkill.xp ? (xp - prevSkill.xp) : 0;
            const isActive = xpGained > 0 && (Date.now() - previousStats.timestamp) < (48 * 60 * 60 * 1000); // 48 hours

            const skillData = {
                name: skillName.charAt(0).toUpperCase() + skillName.slice(1),
                level,
                xp,
                rank: skill.rank || 0,
                progress,
                xpGained: isActive ? xpGained : 0,
                active: isActive
            };

            skillsData.push(skillData);
            if (isActive) {
                activeSkills.push(skillData);
            }
        });

        // Sort all skills by progress to 99 (descending) for display
        skillsData.sort((a, b) => b.progress - a.progress);
        
        // Sort active skills by progress to 99 (descending)
        activeSkills.sort((a, b) => b.progress - a.progress);
        
        // Get last 5 active skills (for homepage widget)
        const last5Active = activeSkills.slice(0, 5);

        // Find closest skill to 99 (highest level that's not 99)
        const closestTo99 = skillsData
            .filter(s => s.level < 99)
            .sort((a, b) => b.progress - a.progress)[0] || null;

        // Find all max-leveled skills (level 99)
        const maxLeveledSkills = skillsData
            .filter(s => s.level === 99)
            .map(s => ({
                name: s.name,
                level: s.level,
                xp: s.xp
            }));

        // Detect gamemode by checking which endpoint the player exists in
        // getStatsByGamemode auto-detects, but we need to check manually
        let gamemode = 'normal';
        try {
            const osrsHiscores = require('osrs-json-hiscores');
            const getStats = osrsHiscores.getStats;
            
            if (typeof getStats === 'function') {
                // Try ironman modes (with short timeout to avoid blocking)
                const checkMode = async (mode, name) => {
                    try {
                        await Promise.race([
                            getStats(OSRS_USERNAME, mode),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 800))
                        ]);
                        return name;
                    } catch {
                        return null;
                    }
                };
                
                // Check in priority order
                const ultimateCheck = await checkMode('ultimate', 'ultimate_ironman');
                if (ultimateCheck) {
                    gamemode = ultimateCheck;
                } else {
                    const hardcoreCheck = await checkMode('hardcore', 'hardcore_ironman');
                    if (hardcoreCheck) {
                        gamemode = hardcoreCheck;
                    } else {
                        const ironmanCheck = await checkMode('ironman', 'ironman');
                        if (ironmanCheck) {
                            gamemode = ironmanCheck;
                        }
                    }
                }
            }
        } catch (error) {
            // If detection fails, default to normal
            console.warn('Gamemode detection failed, defaulting to normal:', error.message);
            // Don't throw - just use default
        }

        // Update stored stats
        const skillsObj = {};
        if (currentStats && currentStats.skills) {
            skillsList.forEach(skillName => {
                const skill = currentStats.skills[skillName];
                if (skill) {
                    skillsObj[skillName] = {
                        level: skill.level || 0,
                        xp: skill.xp || 0,
                        rank: skill.rank || 0
                    };
                }
            });
        }

        fs.writeFileSync(RUNESCAPE_STATS_FILE, JSON.stringify({
            timestamp: Date.now(),
            skills: skillsObj
        }), 'utf8');

        const responseData = {
            closestTo99: closestTo99 ? {
                name: closestTo99.name,
                level: closestTo99.level,
                progress: closestTo99.progress,
                remaining: Math.ceil((99 - closestTo99.level) / 99 * 100)
            } : null,
            maxLeveledSkills: maxLeveledSkills,
            lastUpdated: Date.now()
        };

        // Update cache
        osrsStatsCache.data = responseData;
        osrsStatsCache.timestamp = Date.now();

        res.json(responseData);
    } catch (error) {
        console.error('Error fetching OSRS stats:', error.message);
        if (error.stack) {
            console.error('Error stack:', error.stack);
        }
        
        // Return cached data if available, even if expired
        if (osrsStatsCache.data) {
            console.log('Returning cached OSRS stats due to error');
            return res.json({
                ...osrsStatsCache.data,
                cached: true,
                error: 'Using cached data due to API error'
            });
        }

        // If no cached data, return a graceful error response
        // Don't send 500 if connection was reset - send 200 with error
        const isConnectionError = error.message.includes('timeout') || 
                                  error.message.includes('ECONNRESET') ||
                                  error.message.includes('ENOTFOUND') ||
                                  error.code === 'ECONNRESET';
        
        if (isConnectionError) {
            return res.json({ 
                error: 'OSRS API temporarily unavailable',
                closestTo99: null
            });
        }

        res.status(500).json({ 
            error: 'Failed to fetch OSRS stats', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});


// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});