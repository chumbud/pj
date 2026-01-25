# HoYolab API Setup Guide

To enable Zenless Zone Zero stats on your games page, you need to configure HoYolab authentication cookies in your `.env` file.

## Step 1: Get Your HoYolab Cookies

1. **Open your browser** and go to [https://www.hoyolab.com](https://www.hoyolab.com)
2. **Log in** to your HoYolab account (the same account linked to your ZZZ game)
3. **Open Developer Tools**:
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
4. **Go to the Application/Storage tab**:
   - In Chrome/Edge: Click "Application" tab → "Cookies" → `https://www.hoyolab.com`
   - In Firefox: Click "Storage" tab → "Cookies" → `https://www.hoyolab.com`
5. **Find these cookies**:
   - `ltuid` - Copy the value (a long number)
   - `ltoken` - Copy the value (a long alphanumeric string)

## Step 2: Get Your ZZZ UID and Server

1. **Open Zenless Zone Zero** on your device
2. **Go to Settings** → **Account** (or similar)
3. **Find your UID** - It's usually displayed in the bottom right corner or in account settings
4. **Determine your server** based on your region:
   - `prod_gf_us` - Americas
   - `prod_gf_eu` - Europe
   - `prod_gf_asia` - Asia
   - `prod_gf_cht` - Traditional Chinese
   - `prod_gf_kr` - Korea

## Step 3: Add to .env File

Add these lines to your `.env` file in the project root:

```env
HOYOLAB_LTUID=your_ltuid_value_here
HOYOLAB_LTOKEN=your_ltoken_value_here
ZZZ_UID=your_zzz_uid_here
ZZZ_SERVER=prod_gf_us
OSRS_USERNAME=your_osrs_username
```

**Example:**
```env
HOYOLAB_LTUID=12345678
HOYOLAB_LTOKEN=abcdef1234567890abcdef1234567890
ZZZ_UID=123456789
ZZZ_SERVER=prod_gf_us
OSRS_USERNAME=spoooji
```

**Note:** `OSRS_USERNAME` is optional - if not set, it defaults to "spoooji". Set it to your actual RuneScape username if different.

## Step 4: Restart Your Server

After adding the environment variables, restart your Node.js server for the changes to take effect.

## Troubleshooting

### Cookies Not Working?
- Make sure you're logged into HoYolab in the same browser where you're copying cookies
- Cookies expire after some time - you may need to refresh them periodically
- Try logging out and back into HoYolab, then copy fresh cookies

### 401/403 Errors?
- Check that your `ltuid` and `ltoken` values are correct (no extra spaces)
- Make sure you're using the cookies from `hoyolab.com`, not `hoyoverse.com`
- Try getting fresh cookies by logging out and back in

### 503 Service Unavailable?
- This means the environment variables aren't set yet
- Double-check your `.env` file is in the project root
- Make sure there are no quotes around the values in `.env`

### Can't Find ZZZ UID?
- Check the bottom right corner of the game screen
- Look in Settings → Account → User Info
- The UID is usually 9 digits long

## Security Note

**Never commit your `.env` file to git!** It contains sensitive authentication tokens. Make sure `.env` is in your `.gitignore` file.
