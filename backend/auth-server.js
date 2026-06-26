const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
require('dotenv').config();
const getConnection = require('./db/oracle');

const app = express();



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
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        'SELECT email FROM users WHERE email = :email',
        { email }
      );

      if (result.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
    } finally {
      await conn.close();
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
    const conn = await getConnection();
    try {
      await conn.execute(
        `INSERT INTO users (user_id, full_name, email, password_hash, role)
         VALUES (:userId, :fullName, :email, :passwordHash, 'student')`,
        { userId, fullName, email, passwordHash },
        { autoCommit: true }
      );

      res.json({ 
        success: true, 
        message: 'Account created successfully',
        userId 
      });
    } catch (dbError) {
      if (dbError.errorNum === 1) { // ORA-00001: unique constraint violated
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
      throw dbError;
    } finally {
      await conn.close();
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to create account' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Auth server running on port ${PORT}`);
});
