import React from "react";
import AppProviders from "./app/providers";
import AppRouter from "./app/router";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import "./index.css";

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
