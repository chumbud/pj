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

// 3. Define the main route and fetch data
app.get('/', async (req, res) => {
    // The public API URL for channel content
    const apiUrl = `https://api.are.na/v2/channels/${ARENA_CHANNEL_SLUG}`;
    
    let blocks = [];
    let channelTitle = 'Are.na Channel'; // Default title for safety

    try {
        // Fetching without the Authorization header ensures public access to the channel slug.
        const response = await axios.get(apiUrl);

        blocks = response.data.contents || [];
        channelTitle = response.data.title || channelTitle; // Get title from response

        // Console output is now clean and only confirms success
        console.log(`Successfully fetched ${blocks.length} blocks from channel: ${channelTitle}`);

    } catch (error) {
        // Log the error to the server console, but handle gracefully on the frontend.
        console.error(`Error fetching data for ${ARENA_CHANNEL_SLUG}:`, error.message);
        channelTitle = 'Error Loading Channel';
    }
    
    // 4. Render the page with the fetched data
    res.render('index', { 
        pageTitle: channelTitle, 
        channelBlocks: blocks 
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    if (!ARENA_CHANNEL_SLUG) {
        console.warn('⚠️ WARNING: ARENA_CHANNEL_SLUG is not set in your .env file!');
    }
});
