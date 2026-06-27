const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db/postgres');
const materialsRouter = require('./routes/materials');
const communityRouter = require('./routes/community');
const activeSessions = require('./db/sessions');

const app = express();
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

const io = socketIo(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

const { initSocket } = require('./db/socket');
initSocket(io);

// CORS configuration — must include DELETE for feed post deletion
app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing — express.json() is sufficient; body-parser is not needed
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication middleware — consistent { success, message } response format
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  const sessionUser = activeSessions.get(token);
  if (!sessionUser) {
    return res.status(403).json({ success: false, message: 'Invalid or expired session' });
  }

  req.user = sessionUser;
  next();
}

// Session validation endpoint
app.get('/auth/session', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Materials API (Protected)
app.use('/api/materials', authenticateToken, materialsRouter);

// Community API (Protected)
app.use('/api/community', authenticateToken, communityRouter);

// In-memory OTP storage
const otpStore = new Map();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: 'StudyHub - Email Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to StudyHub!</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #6366f1; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Send OTP endpoint
app.post('/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    // Check if email already exists
    const result = await db.query(
      'SELECT email FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Generate and store OTP
    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Send OTP via email
    await sendOTPEmail(email, otp);
    console.log(`OTP sent to ${email}`);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send OTP error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const result = await db.query(
      'SELECT user_id, full_name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    await db.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    const token = uuidv4();
    activeSessions.set(token, {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.json({ success: false, message: 'Invalid email or password' });
  }
});

// Verify OTP and create user
app.post('/auth/verify-otp-signup', async (req, res) => {
  try {
    const { fullName, email, password, otp } = req.body;

    if (!fullName || !email || !password || !otp) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const storedOTP = otpStore.get(email);
    if (!storedOTP) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired' });
    }

    if (storedOTP.expiresAt < Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    otpStore.delete(email);

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    try {
      await db.query(
        `INSERT INTO users (user_id, full_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, 'student')`,
        [userId, fullName, email, passwordHash]
      );

      res.json({
        success: true,
        message: 'Account created successfully',
        userId
      });
    } catch (dbError) {
      if (dbError.code === '23505') {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create account' });
  }
});

// Gemini AI endpoint — API key from env, fixed response parsing
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCGe_4efn5LSsp1_1IKF9_jen3nM-bpdaQ';

app.post('/api/ask', authenticateToken, async (req, res) => {
  let parts = req.body.parts;
  if (!parts && req.body.question) {
    parts = [{ text: req.body.question }];
  }

  if (!parts || !parts.length) {
    return res.status(400).json({ answer: 'No question or content provided.' });
  }

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        contents: [{ parts: parts }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY
        },
        timeout: 30000
      }
    );

    let answer = 'No answer found.';
    const candidates = response.data?.candidates;
    if (candidates && candidates.length > 0) {
      // Correct parsing: candidates[n].content.parts[n].text
      const parts = candidates[0]?.content?.parts;
      if (parts && parts.length > 0) {
        answer = parts.map(p => p.text || '').join('\n');
      }
    }

    res.json({ answer });

  } catch (err) {
    console.error('Gemini API error:', err.response?.data || err.message);
    res.status(500).json({ answer: 'Error contacting Gemini API.' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ StudyHub Backend Server running on port ${PORT}`);
  console.log(`✅ Auth API: http://localhost:${PORT}/auth/*`);
  console.log(`✅ Materials API: http://localhost:${PORT}/api/materials`);
  console.log(`✅ Community API: http://localhost:${PORT}/api/community`);
  console.log(`✅ Gemini AI API: http://localhost:${PORT}/api/ask`);
});
