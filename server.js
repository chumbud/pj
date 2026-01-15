const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ARENA_CHANNEL_SLUG = process.env.ARENA_CHANNEL_SLUG;

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
    const { email, message } = req.body;
    
    if (!email || !message) {
        return res.status(400).json({ error: 'Email and message are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    try {
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
        res.status(500).json({ error: 'Failed to send email' });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});