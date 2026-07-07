import { z } from 'zod';

export const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address').max(150),
});

export const verifyOtpSignupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address').max(150),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  otp: z.string().length(6, 'OTP must be exactly 6 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
