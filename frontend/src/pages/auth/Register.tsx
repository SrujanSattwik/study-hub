import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import InternalFooter from '../../components/shared/InternalFooter';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isOtpOpen, setIsOtpOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setToastType('error');
      setToastMessage('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setToastType('error');
      setToastMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setToastType('error');
      setToastMessage('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { email });
      if (res.data && res.data.success) {
        setToastType('success');
        setToastMessage('Verification code sent! Please check your inbox.');
        setIsOtpOpen(true);
      } else {
        setToastType('error');
        setToastMessage(res.data.message || 'Failed to dispatch OTP');
      }
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err.response?.data?.message || 'Error connecting to registration servers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setToastType('error');
      setToastMessage('Verification code must be exactly 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-otp-signup', {
        fullName,
        email,
        password,
        otp: otpCode,
      });

      if (res.data && res.data.success) {
        setToastType('success');
        setToastMessage('Account verified successfully! Redirecting...');
        setIsOtpOpen(false);
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setToastType('error');
        setToastMessage(res.data.message || 'Invalid or expired verification code');
      }
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err.response?.data?.message || 'Verification error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between items-center p-4">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-full max-w-md bg-white border border-gray-150 rounded-2xl p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-extrabold text-indigo-600">
            <i className="fas fa-graduation-cap text-3xl" />
            <span>StudyClub</span>
          </Link>
          <h2 className="text-xl font-bold text-gray-900 mt-2">Get Started</h2>
          <p className="text-xs text-gray-500">Create your free learning sanctuary account</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <Input
            id="reg-name"
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
          />
          <Input
            id="reg-email"
            label="Email Address"
            type="email"
            placeholder="name@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <Input
            id="reg-pass"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <Input
            id="reg-confirm"
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />

          <Button type="submit" variant="primary" className="w-full py-3" isLoading={isLoading}>
            Verify Email
          </Button>
        </form>

        {/* Redirect */}
        <div className="text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700">
            Sign In
          </Link>
        </div>
        </div>
      </div>
      <InternalFooter variant="auth" />


      {/* Verification OTP Modal */}
      <Modal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        title="Email Verification"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOtpOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleVerifyOtp} isLoading={isLoading}>
              Verify Code
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-600">
            We sent a 6-digit confirmation code to <span className="font-bold text-gray-800">{email}</span>.
            Please paste it below to verify your account.
          </p>
          <div className="flex justify-center">
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="text-center tracking-widest text-2xl font-extrabold px-6 py-3 border border-gray-250 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none w-48"
            />
          </div>
        </div>
      </Modal>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};
export default Register;
