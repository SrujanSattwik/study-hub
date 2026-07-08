import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import InternalFooter from "../../components/shared/InternalFooter";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setToastType("error");
      setToastMessage("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data && res.data.success) {
        login(res.data.access_token, res.data.user);
        navigate("/dashboard");
      } else {
        setToastType("error");
        setToastMessage(res.data.message || "Invalid email or password");
      }
    } catch (err: any) {
      setToastType("error");
      setToastMessage(
        err.response?.data?.message ||
          "Connection error. Please try again later.",
      );
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
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-2xl font-extrabold text-indigo-600"
          >
            <i className="fas fa-graduation-cap text-3xl" />
            <span>StudyClub</span>
          </Link>
          <h2 className="text-xl font-bold text-gray-900 mt-2">
            Welcome Back!
          </h2>
          <p className="text-xs text-gray-500">
            Sign in to resume your learning sessions
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="login-email"
            label="Email Address"
            type="email"
            placeholder="name@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <Input
            id="login-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        {/* Redirect */}
        <div className="text-center text-xs text-gray-500">
          New to StudyClub?{" "}
          <Link
            to="/register"
            className="font-bold text-indigo-600 hover:text-indigo-700"
          >
            Create an Account
          </Link>
        </div>
        </div>
      </div>
      <InternalFooter variant="auth" />

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
export default Login;
