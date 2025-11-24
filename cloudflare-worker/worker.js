/**
 * Cloudflare Worker for CV Request System
 * Sends CV via email using MailChannels API with security features
 */

// Configuration - Set these as environment variables in Cloudflare Worker
const CONFIG = {
    OWNER_EMAIL: 'victor.simon760@gmail.com', // Your email for notifications
    OWNER_NAME: 'Victor SIMON',
    CV_FILENAME: 'Victor_SIMON_CV.pdf',
    GITHUB_PAGES_ORIGIN: 'https://akaomxga.github.io', // Update with your actual GitHub Pages URL

    // Rate limiting: 5 requests per hour per email
    RATE_LIMIT: {
        MAX_REQUESTS: 5,
        TIME_WINDOW: 60 * 60 * 1000 // 1 hour in milliseconds
    }
};

// Email validation (server-side)
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    if (email.length > 254) return false;

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) return false;

    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const [local, domain] = parts;

    if (local.length > 64) return false;
    if (local.startsWith('.') || local.endsWith('.')) return false;
    if (local.includes('..')) return false;
    if (domain.length > 253) return false;
    if (domain.startsWith('-') || domain.endsWith('-')) return false;
    if (!domain.includes('.')) return false;

    return true;
}

// Sanitize email to prevent injection
function sanitizeEmail(email) {
    if (!email) return '';

    email = String(email).trim();
    email = email.replace(/<[^>]*>/g, '');
    email = email.replace(/\0/g, '');
    email = email.replace(/[\r\n]/g, '');
    email = email.substring(0, 254);

    return email;
}

// Rate limiting using Cloudflare KV (you'll need to bind a KV namespace)
async function checkRateLimit(email, env) {
    if (!env.CV_REQUESTS) {
        // KV not configured, skip rate limiting
        console.warn('KV namespace not configured, rate limiting disabled');
        return { allowed: true };
    }

    const key = `rate_limit:${email}`;
    const now = Date.now();

    try {
        // Get existing request timestamps
        const stored = await env.CV_REQUESTS.get(key, 'json');
        const timestamps = stored || [];

        // Filter out old timestamps
        const recentTimestamps = timestamps.filter(ts => now - ts < CONFIG.RATE_LIMIT.TIME_WINDOW);

        // Check if under limit
        if (recentTimestamps.length >= CONFIG.RATE_LIMIT.MAX_REQUESTS) {
            const oldestTimestamp = Math.min(...recentTimestamps);
            const retryAfter = Math.ceil((CONFIG.RATE_LIMIT.TIME_WINDOW - (now - oldestTimestamp)) / 1000);
            return { allowed: false, retryAfter };
        }

        // Add current timestamp
        recentTimestamps.push(now);

        // Store updated timestamps (expire after time window)
        await env.CV_REQUESTS.put(key, JSON.stringify(recentTimestamps), {
            expirationTtl: Math.ceil(CONFIG.RATE_LIMIT.TIME_WINDOW / 1000)
        });

        return { allowed: true };
    } catch (error) {
        console.error('Rate limit check failed:', error);
        // On error, allow the request
        return { allowed: true };
    }
}

// Convert CV PDF to base64 (you'll embed this or fetch from GitHub Pages)
// For now, we'll fetch it from GitHub Pages
async function getCVBase64(env) {
    try {
        // Fetch CV from GitHub Pages
        const cvUrl = `${CONFIG.GITHUB_PAGES_ORIGIN}/CV_VictorSIMON_2026.pdf`;
        const response = await fetch(cvUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch CV: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        return base64;
    } catch (error) {
        console.error('Failed to get CV:', error);
        throw error;
    }
}

// Send email via MailChannels
async function sendEmail(to, subject, htmlBody, textBody, cvBase64) {
    const mailChannelsEndpoint = 'https://api.mailchannels.net/tx/v1/send';

    const emailData = {
        personalizations: [
            {
                to: [{ email: to }]
            }
        ],
        from: {
            email: CONFIG.OWNER_EMAIL,
            name: CONFIG.OWNER_NAME
        },
        subject: subject,
        content: [
            {
                type: 'text/plain',
                value: textBody
            },
            {
                type: 'text/html',
                value: htmlBody
            }
        ],
        attachments: cvBase64 ? [
            {
                content: cvBase64,
                filename: CONFIG.CV_FILENAME,
                type: 'application/pdf',
                disposition: 'attachment'
            }
        ] : []
    };

    const response = await fetch(mailChannelsEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MailChannels API error: ${response.status} - ${errorText}`);
    }

    return response;
}

// Main handler
export default {
    async fetch(request, env, ctx) {
        // Get request origin
        const origin = request.headers.get('Origin');

        // Allow GitHub Pages and local file testing
        const allowedOrigins = [CONFIG.GITHUB_PAGES_ORIGIN, 'null'];
        const corsOrigin = allowedOrigins.includes(origin) ? origin : CONFIG.GITHUB_PAGES_ORIGIN;

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': corsOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Only allow POST
        if (request.method !== 'POST') {
            return new Response('Method not allowed', {
                status: 405,
                headers: corsHeaders
            });
        }

        try {
            // Parse request body
            const body = await request.json();
            const rawEmail = body.email;

            // Sanitize and validate email
            const email = sanitizeEmail(rawEmail);

            if (!isValidEmail(email)) {
                return new Response(JSON.stringify({ error: 'Invalid email address' }), {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    }
                });
            }

            // Check rate limit
            const rateLimitResult = await checkRateLimit(email, env);
            if (!rateLimitResult.allowed) {
                return new Response(JSON.stringify({
                    error: 'Rate limit exceeded',
                    retryAfter: rateLimitResult.retryAfter
                }), {
                    status: 429,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'Retry-After': String(rateLimitResult.retryAfter)
                    }
                });
            }

            // Get CV as base64
            const cvBase64 = await getCVBase64(env);

            // Send CV to recruiter
            const recruiterSubject = 'Victor SIMON - Curriculum Vitae';
            const recruiterHtml = `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Thank you for your interest!</h2>
                    <p>Dear Recruiter,</p>
                    <p>Thank you for requesting my CV. Please find attached my curriculum vitae in PDF format.</p>
                    <p>I look forward to discussing potential opportunities with you.</p>
                    <br>
                    <p>Best regards,<br>
                    <strong>Victor SIMON</strong><br>
                    Engineering Student - École Centrale Nantes<br>
                    Email: <a href="mailto:${CONFIG.OWNER_EMAIL}">${CONFIG.OWNER_EMAIL}</a><br>
                    LinkedIn: <a href="https://www.linkedin.com/in/victor-simon-167a21301/">Victor SIMON</a><br>
                    Portfolio: <a href="${CONFIG.GITHUB_PAGES_ORIGIN}">${CONFIG.GITHUB_PAGES_ORIGIN}</a></p>
                </body>
                </html>
            `;
            const recruiterText = `Thank you for your interest!\n\nDear Recruiter,\n\nThank you for requesting my CV. Please find attached my curriculum vitae in PDF format.\n\nI look forward to discussing potential opportunities with you.\n\nBest regards,\nVictor SIMON\nEngineering Student - École Centrale Nantes\nEmail: ${CONFIG.OWNER_EMAIL}\nLinkedIn: https://www.linkedin.com/in/victor-simon-167a21301/\nPortfolio: ${CONFIG.GITHUB_PAGES_ORIGIN}`;

            await sendEmail(email, recruiterSubject, recruiterHtml, recruiterText, cvBase64);

            // Send notification to owner
            const ownerSubject = `CV Request from ${email}`;
            const ownerHtml = `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>New CV Request</h2>
                    <p>Someone has requested your CV via the QR code form.</p>
                    <p><strong>Email address:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                    <p>Your CV has been automatically sent to this address.</p>
                </body>
                </html>
            `;
            const ownerText = `New CV Request\n\nSomeone has requested your CV via the QR code form.\n\nEmail address: ${email}\nTimestamp: ${new Date().toISOString()}\n\nYour CV has been automatically sent to this address.`;

            await sendEmail(CONFIG.OWNER_EMAIL, ownerSubject, ownerHtml, ownerText, null);

            // Success response
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });

        } catch (error) {
            console.error('Error processing request:', error);

            return new Response(JSON.stringify({
                error: 'Internal server error',
                message: error.message
            }), {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }
    }
};
