# CV Request System - Setup Guide

This guide will walk you through setting up the serverless CV request system using Cloudflare Workers and MailChannels.

## Overview

The system consists of:
- **Frontend**: `cv-request.html` - A retro-styled form accessible via QR code
- **Client-side JS**: `cv-request.js` - Email validation, sanitization, and rate limiting
- **Serverless Backend**: Cloudflare Worker - Email delivery via MailChannels API
- **Security**: Input sanitization, rate limiting, CORS protection

## Prerequisites

1. **Cloudflare Account** (free tier is sufficient)
   - Sign up at https://dash.cloudflare.com/sign-up

2. **Node.js and npm** installed on your computer
   - Download from https://nodejs.org/

3. **Your CV PDF** ready
   - File: `CV_VictorSIMON_2026.pdf`
   - Should be in your GitHub Pages repository

## Step 1: Install Wrangler CLI

Wrangler is Cloudflare's command-line tool for managing Workers.

```bash
npm install -g wrangler
```

Verify installation:
```bash
wrangler --version
```

## Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window for you to log in to your Cloudflare account.

## Step 3: Create KV Namespace for Rate Limiting

KV (Key-Value) storage is used to track request rates per email address.

```bash
cd cloudflare-worker
wrangler kv:namespace create "CV_REQUESTS"
```

This will output something like:
```
{ binding = "CV_REQUESTS", id = "abc123def456..." }
```

**Copy the `id` value** and update it in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CV_REQUESTS"
id = "abc123def456..."  # Replace with your actual ID
```

## Step 4: Configure Worker Settings

Edit `cloudflare-worker/worker.js` and update the following constants:

```javascript
const CONFIG = {
    OWNER_EMAIL: 'victor.simon760@gmail.com',  // Your email
    OWNER_NAME: 'Victor SIMON',                 // Your name
    CV_FILENAME: 'Victor_SIMON_CV.pdf',        // CV filename in emails
    GITHUB_PAGES_ORIGIN: 'https://akaomxga.github.io', // Your GitHub Pages URL
    
    RATE_LIMIT: {
        MAX_REQUESTS: 5,              // Max requests per email
        TIME_WINDOW: 60 * 60 * 1000   // Time window (1 hour)
    }
};
```

## Step 5: Deploy the Worker

From the `cloudflare-worker` directory:

```bash
wrangler deploy
```

After deployment, you'll see output like:
```
Published cv-request-worker (1.23 sec)
  https://cv-request-worker.YOUR-SUBDOMAIN.workers.dev
```

**Copy this URL** - you'll need it for the next step.

## Step 6: Update Frontend Configuration

Edit `cv-request.js` and update the API endpoint:

```javascript
const CONFIG = {
    API_ENDPOINT: 'https://cv-request-worker.YOUR-SUBDOMAIN.workers.dev/send-cv',
    // ... rest of config
};
```

Replace `YOUR-SUBDOMAIN` with your actual Cloudflare Workers subdomain.

## Step 7: Configure MailChannels

MailChannels provides free email sending for Cloudflare Workers.

### Domain Verification (Recommended for better deliverability)

1. Go to your domain's DNS settings
2. Add the following DNS records:

**SPF Record** (TXT):
```
Name: @
Value: v=spf1 include:relay.mailchannels.net ~all
```

**DKIM Record** (TXT):
```
Name: _mailchannels
Value: v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY
```

To generate DKIM keys, use MailChannels' documentation: https://support.mailchannels.com/hc/en-us/articles/4565898358413

**Note**: If you're using GitHub Pages with a custom domain, add these records to your domain provider. If using the default `github.io` domain, MailChannels will still work but with slightly lower deliverability.

## Step 8: Upload CV to GitHub Pages

Make sure `CV_VictorSIMON_2026.pdf` is in your repository root and accessible at:
```
https://akaomxga.github.io/CV_VictorSIMON_2026.pdf
```

Test by visiting this URL in your browser - it should download the PDF.

## Step 9: Deploy Frontend Files

Commit and push the following files to your GitHub Pages repository:

```bash
git add cv-request.html cv-request.js
git commit -m "Add CV request system"
git push origin main
```

Wait a few minutes for GitHub Pages to deploy.

## Step 10: Generate QR Code

You can generate a QR code pointing to your CV request page using any QR code generator:

### Online Option:
1. Go to https://www.qr-code-generator.com/
2. Enter URL: `https://akaomxga.github.io/cv-request.html`
3. Download the QR code image
4. Save as `cv-qr-code.png`

### Python Option:
```python
import qrcode

url = "https://akaomxga.github.io/cv-request.html"
qr = qrcode.QRCode(version=1, box_size=10, border=5)
qr.add_data(url)
qr.make(fit=True)

img = qr.make_image(fill_color="black", back_color="white")
img.save("cv-qr-code.png")
```

### Command Line Option (using Node.js):
```bash
npm install -g qrcode
qrcode "https://akaomxga.github.io/cv-request.html" -o cv-qr-code.png
```

## Testing

### Test 1: Form Validation
1. Visit `https://akaomxga.github.io/cv-request.html`
2. Try entering invalid emails (e.g., `test`, `test@`, `@example.com`)
3. Verify error messages appear
4. Enter a valid email - error should disappear

### Test 2: Email Delivery
1. Enter your own email address
2. Click "Send CV"
3. Check your inbox - you should receive the CV with PDF attachment
4. Check your notification email (`victor.simon760@gmail.com`) - you should receive a notification with the requester's email

### Test 3: Rate Limiting
1. Submit the form 6 times quickly with the same email
2. After 5 submissions, you should see a rate limit error
3. Wait 1 hour or clear localStorage to reset

### Test 4: QR Code
1. Open the QR code image on your computer
2. Scan it with your phone
3. Verify it opens the CV request page
4. Submit the form from mobile
5. Verify email delivery works

## Troubleshooting

### Worker not receiving requests
- Check CORS settings in `worker.js` - make sure `GITHUB_PAGES_ORIGIN` matches your site URL exactly
- Check browser console for CORS errors
- Verify Worker is deployed: `wrangler deployments list`

### Emails not sending
- Check Cloudflare Worker logs: `wrangler tail`
- Verify MailChannels API is working (check Worker logs for error messages)
- Check spam folder in email inbox
- Verify CV PDF is accessible at the GitHub Pages URL

### Rate limiting not working
- Verify KV namespace is created and bound correctly in `wrangler.toml`
- Check Worker logs for KV errors
- KV namespace ID must match in `wrangler.toml`

### CV not attaching to email
- Verify CV file exists at `https://akaomxga.github.io/CV_VictorSIMON_2026.pdf`
- Check file size - should be under 10MB
- Check Worker logs for fetch errors

## Monitoring

### View Worker Logs
```bash
wrangler tail
```

This shows real-time logs from your Worker, including:
- Incoming requests
- Email sending status
- Errors and warnings

### Check Worker Analytics
Visit Cloudflare Dashboard → Workers → cv-request-worker → Metrics

You can see:
- Request count
- Error rate
- CPU time
- Success rate

## Updating the Worker

After making changes to `worker.js`:

```bash
cd cloudflare-worker
wrangler deploy
```

Changes are deployed instantly.

## Security Features

✅ **Input Sanitization**: All email inputs are sanitized to prevent injection attacks
✅ **Email Validation**: RFC 5322 compliant validation on both client and server
✅ **Rate Limiting**: 
   - Client-side: 3 requests per 5 minutes (localStorage)
   - Server-side: 5 requests per hour per email (KV storage)
✅ **CORS Protection**: Only your GitHub Pages domain can make requests
✅ **No SQL Injection**: No database, all data is ephemeral
✅ **No XSS**: Input sanitization removes HTML tags and special characters

## Cost

- **Cloudflare Workers**: Free tier includes 100,000 requests/day
- **KV Storage**: Free tier includes 100,000 reads/day, 1,000 writes/day
- **MailChannels**: Free for Cloudflare Workers (up to 100 emails/day)

**Total cost**: $0/month for typical usage

## Support

If you encounter issues:

1. **Check Worker logs**: `wrangler tail`
2. **Check browser console**: Look for JavaScript errors
3. **Verify configuration**: Double-check all URLs and IDs
4. **Test components individually**:
   - Test form validation without submitting
   - Test Worker directly with curl
   - Test MailChannels API separately

## Next Steps

1. ✅ Deploy the Worker
2. ✅ Test email delivery
3. ✅ Generate QR code
4. 📄 Print QR code for your resume/business cards
5. 📊 Monitor usage in Cloudflare dashboard
6. 🎨 Customize email templates in `worker.js` if desired

---

**Congratulations!** Your CV request system is now live. Recruiters can scan your QR code and receive your CV instantly.
