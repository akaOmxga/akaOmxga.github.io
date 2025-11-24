/**
 * CV Request Form Handler
 * Handles form submission with email validation, sanitization, and rate limiting
 */

// Configuration
const CONFIG = {
    // Cloudflare Worker endpoint
    API_ENDPOINT: 'https://cv-request-worker.victor-simon760.workers.dev/send-cv',

    // Rate limiting: max 3 requests per 5 minutes per IP (client-side check)
    RATE_LIMIT: {
        MAX_REQUESTS: 3,
        TIME_WINDOW: 5 * 60 * 1000 // 5 minutes in milliseconds
    }
};

// Rate limiting storage (using localStorage)
const RateLimiter = {
    STORAGE_KEY: 'cv_request_timestamps',

    /**
     * Check if request is allowed based on rate limit
     */
    isAllowed: function () {
        const timestamps = this.getTimestamps();
        const now = Date.now();

        // Remove timestamps older than the time window
        const recentTimestamps = timestamps.filter(ts => now - ts < CONFIG.RATE_LIMIT.TIME_WINDOW);

        // Update storage with cleaned timestamps
        this.setTimestamps(recentTimestamps);

        // Check if under limit
        return recentTimestamps.length < CONFIG.RATE_LIMIT.MAX_REQUESTS;
    },

    /**
     * Record a new request timestamp
     */
    recordRequest: function () {
        const timestamps = this.getTimestamps();
        timestamps.push(Date.now());
        this.setTimestamps(timestamps);
    },

    /**
     * Get timestamps from localStorage
     */
    getTimestamps: function () {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * Save timestamps to localStorage
     */
    setTimestamps: function (timestamps) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(timestamps));
        } catch (e) {
            console.error('Failed to save rate limit data:', e);
        }
    },

    /**
     * Get time until next request is allowed
     */
    getTimeUntilNextRequest: function () {
        const timestamps = this.getTimestamps();
        if (timestamps.length === 0) return 0;

        const oldestRelevant = Math.min(...timestamps);
        const timeElapsed = Date.now() - oldestRelevant;
        const timeRemaining = CONFIG.RATE_LIMIT.TIME_WINDOW - timeElapsed;

        return Math.max(0, Math.ceil(timeRemaining / 1000)); // Return seconds
    }
};

// Email validation
const EmailValidator = {
    /**
     * RFC 5322 compliant email validation regex
     */
    EMAIL_REGEX: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

    /**
     * Validate email format
     */
    isValid: function (email) {
        if (!email || typeof email !== 'string') return false;

        // Basic length check
        if (email.length > 254) return false;

        // Regex validation
        if (!this.EMAIL_REGEX.test(email)) return false;

        // Additional checks
        const parts = email.split('@');
        if (parts.length !== 2) return false;

        const [local, domain] = parts;

        // Local part checks
        if (local.length > 64) return false;
        if (local.startsWith('.') || local.endsWith('.')) return false;
        if (local.includes('..')) return false;

        // Domain part checks
        if (domain.length > 253) return false;
        if (domain.startsWith('-') || domain.endsWith('-')) return false;
        if (!domain.includes('.')) return false;

        return true;
    },

    /**
     * Sanitize email input to prevent injection attacks
     */
    sanitize: function (email) {
        if (!email) return '';

        // Convert to string and trim
        email = String(email).trim();

        // Remove any HTML tags
        email = email.replace(/<[^>]*>/g, '');

        // Remove any null bytes
        email = email.replace(/\0/g, '');

        // Remove any newlines or carriage returns (prevent header injection)
        email = email.replace(/[\r\n]/g, '');

        // Limit length
        email = email.substring(0, 254);

        return email;
    }
};

// Form handler
class CVRequestForm {
    constructor(formId, emailInputId, errorMsgId, statusMsgId, submitBtnId, language) {
        this.form = document.getElementById(formId);
        this.emailInput = document.getElementById(emailInputId);
        this.errorMsg = document.getElementById(errorMsgId);
        this.statusMsg = document.getElementById(statusMsgId);
        this.submitBtn = document.getElementById(submitBtnId);
        this.language = language;

        this.messages = {
            en: {
                invalidEmail: 'Please enter a valid email address',
                rateLimitExceeded: 'Too many requests. Please try again in {time} seconds.',
                sending: 'Sending',
                success: 'CV sent successfully! Please check your inbox.',
                networkError: 'Network error. Please check your connection and try again.',
                serverError: 'Server error. Please try again later.',
                unknownError: 'An error occurred. Please try again.'
            },
            fr: {
                invalidEmail: 'Veuillez entrer une adresse e-mail valide',
                rateLimitExceeded: 'Trop de requêtes. Veuillez réessayer dans {time} secondes.',
                sending: 'Envoi en cours',
                success: 'CV envoyé avec succès ! Veuillez vérifier votre boîte mail.',
                networkError: 'Erreur réseau. Veuillez vérifier votre connexion et réessayer.',
                serverError: 'Erreur serveur. Veuillez réessayer plus tard.',
                unknownError: 'Une erreur s\'est produite. Veuillez réessayer.'
            }
        };

        this.init();
    }

    init() {
        if (!this.form) return;

        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time email validation
        this.emailInput.addEventListener('input', () => this.validateEmailInput());
        this.emailInput.addEventListener('blur', () => this.validateEmailInput());
    }

    validateEmailInput() {
        const email = EmailValidator.sanitize(this.emailInput.value);

        if (email && !EmailValidator.isValid(email)) {
            this.emailInput.classList.add('error');
            this.errorMsg.classList.add('show');
            return false;
        } else {
            this.emailInput.classList.remove('error');
            this.errorMsg.classList.remove('show');
            return true;
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Clear previous status
        this.hideStatus();

        // Sanitize and validate email
        const rawEmail = this.emailInput.value;
        const email = EmailValidator.sanitize(rawEmail);

        if (!EmailValidator.isValid(email)) {
            this.showError(this.messages[this.language].invalidEmail);
            this.emailInput.classList.add('error');
            this.errorMsg.classList.add('show');
            return;
        }

        // Check rate limit
        if (!RateLimiter.isAllowed()) {
            const timeRemaining = RateLimiter.getTimeUntilNextRequest();
            const message = this.messages[this.language].rateLimitExceeded.replace('{time}', timeRemaining);
            this.showError(message);
            return;
        }

        // Disable form and show loading state
        this.setLoading(true);

        try {
            // Send request to Cloudflare Worker
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });

            if (response.ok) {
                // Success
                RateLimiter.recordRequest();
                this.showSuccess(this.messages[this.language].success);
                this.form.reset();
            } else if (response.status === 400) {
                // Invalid email (server-side validation failed)
                this.showError(this.messages[this.language].invalidEmail);
            } else if (response.status === 429) {
                // Rate limit exceeded (server-side)
                const data = await response.json().catch(() => ({}));
                const retryAfter = data.retryAfter || 300;
                const message = this.messages[this.language].rateLimitExceeded.replace('{time}', retryAfter);
                this.showError(message);
            } else if (response.status >= 500) {
                // Server error
                this.showError(this.messages[this.language].serverError);
            } else {
                // Other error
                this.showError(this.messages[this.language].unknownError);
            }
        } catch (error) {
            console.error('Request failed:', error);
            this.showError(this.messages[this.language].networkError);
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        this.submitBtn.disabled = isLoading;
        if (isLoading) {
            this.submitBtn.classList.add('loading');
            this.submitBtn.textContent = this.messages[this.language].sending;
        } else {
            this.submitBtn.classList.remove('loading');
            this.submitBtn.textContent = this.language === 'en' ? 'Send CV' : 'Envoyer le CV';
        }
    }

    showSuccess(message) {
        this.statusMsg.textContent = message;
        this.statusMsg.className = 'status-message success';
    }

    showError(message) {
        this.statusMsg.textContent = message;
        this.statusMsg.className = 'status-message error';
    }

    hideStatus() {
        this.statusMsg.className = 'status-message';
        this.statusMsg.textContent = '';
    }
}

// Initialize forms when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // English form
    new CVRequestForm(
        'cvRequestForm',
        'email',
        'emailError',
        'statusMessage',
        'submitBtn',
        'en'
    );

    // French form
    new CVRequestForm(
        'cvRequestFormFr',
        'emailFr',
        'emailErrorFr',
        'statusMessageFr',
        'submitBtnFr',
        'fr'
    );
});
