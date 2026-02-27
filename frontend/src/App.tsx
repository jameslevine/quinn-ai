import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { configureAmplify } from "./config/amplify";
import { lightTheme, darkTheme } from "./styles/theme";
import { useStore } from "./store";

// Pages
import Dashboard from "./pages/Dashboard";
import Actions from "./pages/Actions";
import Approvals from "./pages/Approvals";
import Emails from "./pages/Emails";
import Banking from "./pages/Banking";
import Food from "./pages/Food";
import Life from "./pages/Life";
import Chat from "./pages/Chat";
import Calls from "./pages/Calls";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";

// Configure Amplify
configureAmplify();

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const { isDarkMode } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <div style={{ textAlign: "center", color: "white" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🤖</div>
            <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Quinn</h1>
            <p>Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <Authenticator
          signUpAttributes={["email"]}
          components={{
            Header() {
              return (
                <div style={{ textAlign: "center", padding: "2rem 0 1rem" }}>
                  <div style={{ fontSize: "3rem" }}>🤖</div>
                  <h1 style={{ margin: "0.5rem 0", color: "#667eea" }}>Quinn</h1>
                  <p style={{ color: "#666", margin: 0 }}>
                    Your AI Personal Assistant
                  </p>
                </div>
              );
            },
          }}
        >
          {({ signOut, user }) => (
            <BrowserRouter>
              <Routes>
                <Route
                  path="/"
                  element={<Layout user={user} signOut={signOut} />}
                >
                  <Route index element={<Dashboard />} />
                  <Route path="actions" element={<Actions />} />
                  <Route path="approvals" element={<Approvals />} />
                  <Route path="emails" element={<Emails />} />
                  <Route path="banking" element={<Banking />} />
                  <Route path="food" element={<Food />} />
                  <Route path="life" element={<Life />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="calls" element={<Calls />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          )}
        </Authenticator>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
