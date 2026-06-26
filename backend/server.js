const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db/postgres');
const materialsRouter = require('./routes/materials');

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use(bodyParser.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Materials API
app.use('/api/materials', materialsRouter);

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
    console.error('Send OTP error:', error);
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
    console.error('Login error:', error);
    res.json({ success: false, message: 'Invalid email or password' });
  }
});

// Verify OTP and create user
app.post('/auth/verify-otp-signup', async (req, res) => {
  try {
    const { fullName, email, password, otp } = req.body;

    // Validate input
    if (!fullName || !email || !password || !otp) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Verify OTP
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

    // OTP verified, delete it
    otpStore.delete(email);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Insert user into database
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
      if (dbError.code === '23505') { // PostgreSQL unique violation code
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to create account' });
  }
});

// Gemini AI endpoint
const GEMINI_API_KEY = "AIzaSyCGe_4efn5LSsp1_1IKF9_jen3nM-bpdaQ";

app.post("/api/ask", async (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ answer: "No question provided." });

    try {
        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            {
                contents: [{ parts: [{ text: question }] }]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-goog-api-key": GEMINI_API_KEY
                }
            }
        );

        console.log("Full Gemini API response:", JSON.stringify(response.data, null, 2));

        let answer = "No answer found.";
        if (response.data?.candidates?.length) {
            answer = response.data.candidates.map(candidate => {
                if (candidate?.content?.length) {
                    return candidate.content.map(c => c.text).join("\n");
                }
                return "";
            }).join("\n");
        }

        res.json({ answer });

    } catch (err) {
        console.error("Gemini API error:", err.response?.data || err.message);
        res.status(500).json({ answer: "Error contacting Gemini API." });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ StudyHub Backend Server running on port ${PORT}`);
  console.log(`✅ Auth API: http://localhost:${PORT}/auth/*`);
  console.log(`✅ Materials API: http://localhost:${PORT}/api/materials`);
  console.log(`✅ Gemini AI API: http://localhost:${PORT}/api/ask`);
});
