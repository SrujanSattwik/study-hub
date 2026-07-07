import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ProtectedRoute from "../components/shared/ProtectedRoute";

const MockComponent = () => <div>Protected Content</div>;
const MockLogin = () => <div>Login Page</div>;

describe("ProtectedRoute Redirection Tests", () => {
  it("should redirect unauthenticated users to /login", () => {
    const mockAuthContext = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: () => {},
      logout: async () => {},
      checkSession: async () => {},
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<MockComponent />} />
            </Route>
            <Route path="/login" element={<MockLogin />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should render protected component for authenticated users", () => {
    const mockAuthContext = {
      user: {
        user_id: "1",
        full_name: "Test User",
        email: "test@dev.com",
        role: "student",
      },
      token: "mock-token",
      isAuthenticated: true,
      isLoading: false,
      login: () => {},
      logout: async () => {},
      checkSession: async () => {},
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<MockComponent />} />
            </Route>
            <Route path="/login" element={<MockLogin />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});
