const nodemailer = require('nodemailer');

/**
 * Unified email sender - uses Brevo REST API if BREVO_API_KEY is set,
 * otherwise falls back to SMTP (Gmail or any SMTP provider).
 * This ensures compatibility with Render.com which blocks outbound SMTP.
 */
const sendEmail = async ({ to, subject, html }) => {
    const senderName = process.env.SMTP_SENDER_NAME || 'VIBE';
    const senderEmail = process.env.SMTP_FROM_EMAIL || process.env.GMAIL_USER || 'noreply@vibe.com';

    // --- METHOD 1: Brevo REST API (Render-safe, bypasses SMTP block) ---
    if (process.env.BREVO_API_KEY) {
        const payload = {
            sender: { name: senderName, email: senderEmail },
            to: [{ email: to }],
            subject: subject,
            htmlContent: html
        };

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`Brevo API Error: ${JSON.stringify(errData)}`);
        }

        const result = await response.json();
        console.log(`[EMAIL] Brevo delivery success to ${to}: ${JSON.stringify(result)}`);
        return result;
    }

    // --- METHOD 2: Gmail SMTP Fallback ---
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
            connectionTimeout: 10000,
            socketTimeout: 15000,
        });

        const mailOptions = {
            from: `"${senderName}" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
        };

        console.log(`[SMTP] Attempting Gmail delivery to ${to}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP] Success: ${info.messageId}`);
        return info;
    }

    // --- METHOD 3: Generic SMTP Fallback ---
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"${senderName}" <${senderEmail}>`,
            to,
            subject,
            html,
        };

        console.log(`[SMTP] Attempting generic SMTP delivery to ${to}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP] Success: ${info.messageId}`);
        return info;
    }

    // No email config found
    throw new Error('Email verification service unavailable. Set BREVO_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD in environment variables.');
};

module.exports = sendEmail;
