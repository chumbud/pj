const express = require('express');
const axios = require('axios');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ARENA_CHANNEL_SLUG = process.env.ARENA_CHANNEL_SLUG;

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
    const data = await fetchArenaBlocks(1, initialLoadCount, ARENA_CHANNEL_SLUG); // Fetch page 1 (first 10)

    // Render the EJS file, passing blocks AND the necessary pagination info
    // This data will be critical for the client-side lazy-loader.js
    res.render('likes', {
        pageTitle: data.title,
        channelBlocks: data.blocks,
        totalPages: data.totalPages, // Pass to client for lazy loading control
        currentPage: data.currentPage, // Should be 1
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

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});