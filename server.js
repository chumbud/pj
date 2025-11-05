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
async function fetchArenaBlocks(page = 1, per = 20) {
    // API URL with dynamic pagination, sorting for newest first, and blocks per page
    // The direction=desc ensures the latest blocks are on page 1, 2, 3, etc.
    const apiUrl = `https://api.are.na/v2/channels/${ARENA_CHANNEL_SLUG}?sort=created_at&direction=desc&per=${per}&page=${page}`;

    try {
        const response = await axios.get(apiUrl);
        // The API provides the total number of blocks (and therefore total pages) in the response metadata.
        const totalBlocks = response.data.length || 0;
        const totalPages = Math.ceil(totalBlocks / per);

        return {
            blocks: response.data.contents || [],
            title: response.data.title || 'Are.na Channel',
            currentPage: page,
            totalPages: totalPages,
            // totalBlocks: totalBlocks // You could use this too if needed
        };
    } catch (error) {
        console.error(`Error fetching data for ${ARENA_CHANNEL_SLUG} (Page ${page}):`, error.message);
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
    const data = await fetchArenaBlocks(1, initialLoadCount); // Fetch page 1 (first 10)

    // Render the EJS file, passing blocks AND the necessary pagination info
    // This data will be critical for the client-side lazy-loader.js
    res.render('likes', {
        pageTitle: data.title,
        channelBlocks: data.blocks,
        totalPages: data.totalPages, // Pass to client for lazy loading control
        currentPage: data.currentPage, // Should be 1
    });
});


// This route responds with pure JSON data, which the client-side JavaScript will use to append content.
app.get('/api/blocks', async (req, res) => {
    // The client will pass the next page number in the query string (e.g., /api/blocks?page=2)
    const page = parseInt(req.query.page) || 1;
    const per = 20; // Subsequent loads fetch 10 blocks at a time

    const data = await fetchArenaBlocks(page, per);

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
