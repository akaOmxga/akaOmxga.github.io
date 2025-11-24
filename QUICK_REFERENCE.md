# CV Request System - Quick Reference

## 📋 System Overview

**Frontend**: `cv-request.html` + `cv-request.js`  
**Backend**: Cloudflare Worker (`cloudflare-worker/worker.js`)  
**Email Service**: MailChannels API (free)  
**Storage**: Cloudflare KV (for rate limiting)

## 🔗 Important URLs

- **CV Request Page**: `https://akaomxga.github.io/cv-request.html`
- **Worker Endpoint**: `https://cv-request-worker.YOUR-SUBDOMAIN.workers.dev/send-cv`
- **CV File**: `https://akaomxga.github.io/CV_VictorSIMON_2026.pdf`

## 🚀 Quick Deploy Commands

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV namespace
cd cloudflare-worker
wrangler kv:namespace create "CV_REQUESTS"

# Deploy Worker
wrangler deploy

# View logs
wrangler tail
```

## 🔒 Security Features

✅ Input sanitization (prevents injection)  
✅ Email validation (RFC 5322 compliant)  
✅ Rate limiting (client + server)  
✅ CORS protection  
✅ No XSS vulnerabilities

**Rate Limits**:
- Client: 3 requests / 5 minutes
- Server: 5 requests / hour per email

## 📧 Email Flow

1. User scans QR code → Opens `cv-request.html`
2. User enters email → Client validates & sanitizes
3. Form submits to Cloudflare Worker
4. Worker validates, checks rate limit
5. Worker fetches CV from GitHub Pages
6. Worker sends 2 emails via MailChannels:
   - **To recruiter**: CV with PDF attachment
   - **To you**: Notification with recruiter's email

## 🛠️ Configuration Files

### `cv-request.js` (Frontend)
```javascript
API_ENDPOINT: 'https://cv-request-worker.YOUR-SUBDOMAIN.workers.dev/send-cv'
```

### `worker.js` (Backend)
```javascript
OWNER_EMAIL: 'victor.simon760@gmail.com'
OWNER_NAME: 'Victor SIMON'
CV_FILENAME: 'Victor_SIMON_CV.pdf'
GITHUB_PAGES_ORIGIN: 'https://akaomxga.github.io'
```

### `wrangler.toml`
```toml
[[kv_namespaces]]
binding = "CV_REQUESTS"
id = "YOUR_KV_NAMESPACE_ID"  # Update after creating KV
```

## 🧪 Testing Checklist

- [ ] Form validation (invalid emails show errors)
- [ ] Email delivery (CV arrives in inbox)
- [ ] Notification email (you receive recruiter's email)
- [ ] Rate limiting (6th request blocked)
- [ ] QR code (scans and opens page)
- [ ] Mobile responsive (works on phone)
- [ ] Bilingual (EN/FR toggle works)

## 📊 Monitoring

**View real-time logs**:
```bash
wrangler tail
```

**Cloudflare Dashboard**:  
Workers → cv-request-worker → Metrics

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS error | Check `GITHUB_PAGES_ORIGIN` in `worker.js` |
| Emails not sending | Check `wrangler tail` for errors |
| Rate limit not working | Verify KV namespace ID in `wrangler.toml` |
| CV not attaching | Verify CV accessible at GitHub Pages URL |

## 💰 Cost

**Free tier limits**:
- Workers: 100,000 requests/day
- KV: 100,000 reads/day, 1,000 writes/day
- MailChannels: 100 emails/day

**Total**: $0/month

## 📝 Files Created

```
cv-request.html          # Form page (retro styled)
cv-request.js            # Client-side logic
cloudflare-worker/
  ├── worker.js          # Serverless function
  └── wrangler.toml      # Worker configuration
SETUP_CV_REQUEST.md      # Full setup guide
QUICK_REFERENCE.md       # This file
cv-qr-code.png          # QR code (to be generated)
```

## 🔄 Update Worker

```bash
cd cloudflare-worker
# Edit worker.js
wrangler deploy
```

Changes are live instantly!

## 📱 QR Code Generation

**Online**: https://www.qr-code-generator.com/  
**CLI**: `qrcode "https://akaomxga.github.io/cv-request.html" -o cv-qr-code.png`

## 🎯 Next Steps

1. Follow `SETUP_CV_REQUEST.md` for detailed setup
2. Deploy Worker to Cloudflare
3. Update `cv-request.js` with Worker URL
4. Generate QR code
5. Test complete flow
6. Print QR code for resume/business cards

---

**Need help?** Check `SETUP_CV_REQUEST.md` for detailed instructions.
