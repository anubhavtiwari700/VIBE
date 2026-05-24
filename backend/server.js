const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const connectDB = require('./config/db');
const { seedAdminUser } = require('./config/seedAdmin');
const { errorHandler } = require('./middleware/errorMiddleware');
const Counter = require('./models/Counter');

// Load env vars
dotenv.config();

const app = express();

// Health Check Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.enable('trust proxy');

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
];

// Parse FRONTEND_URL (can be comma-separated list)
if (process.env.FRONTEND_URL) {
    const urls = process.env.FRONTEND_URL.split(',').map(url => url.trim().replace(/\/$/, ''));
    allowedOrigins.push(...urls);
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        const cleanOrigin = origin.replace(/\/$/, '');
        
        // Allow localhost
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
            return callback(null, true);
        }
        
        // Check exact match in allowed list
        if (allowedOrigins.includes(cleanOrigin)) {
            return callback(null, true);
        }
        
        console.warn(`[CORS Blocked] Origin: ${origin}`);
        return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
}));

// Serve Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(helmet());
app.use(morgan('dev'));

// Route logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/songs', require('./routes/songRoutes'));

// Counter Routes
app.get('/api/counter/visitor', async (req, res) => {
    try {
        const counter = await Counter.findOne({ identifier: 'visitor' });
        res.json({ count: counter ? counter.count : 0 });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching visitor count' });
    }
});

app.post('/api/counter/visitor', async (req, res) => {
    try {
        const counter = await Counter.findOneAndUpdate(
            { identifier: 'visitor' },
            { $inc: { count: 1 } },
            { new: true, upsert: true }
        );
        res.json({ count: counter.count });
    } catch (err) {
        res.status(500).json({ message: 'Error incrementing visitor count' });
    }
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start Server with Robustness for Render
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}...`);
});

const startServer = async () => {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Synchronizing administrative nodes...');
    await seedAdminUser();
    console.log(`Backend fully operational in ${process.env.NODE_ENV || 'development'} mode.`);
};

startServer().catch((error) => {
    console.error('Core system initialization failed:', error.message);
    // Keep server running so we can see the error in logs instead of a crash timeout
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection: ${err.message}`);
});
