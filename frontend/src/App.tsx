import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyGames from "./pages/dashboard/MyGames";
import Folder from "./pages/dashboard/Folder";
import Flashcard from "./pages/dashboard/Flashcard";
import GameRoom from "./pages/GameRoom";
import InstallPrompt from "./InstallPrompt";

function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // getSession() resolves instantly from localStorage — no network call.
    supabase.auth.getSession().then(() => setReady(true));
  }, []);

  if (!ready)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to bottom, #3a2d71 0%, #243b55 100%)",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`}</style>
        <span
          style={{
            fontFamily: "'Press Start 2P', cursive",
            color: "#c4b5fd",
            fontSize: "12px",
          }}
        >
          LOADING...
        </span>
      </div>
    );

  return <>{children}</>;
}

// Redirects to /dashboard if already logged in, otherwise shows the page
function PublicRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  if (session === undefined) return null; // still loading
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// Redirects to /login if not logged in
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  if (session === undefined) return null; // still loading
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthGate>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <PrivateRoute>
                <GameRoom />
              </PrivateRoute>
            }
          />
          <Route
            path="/create"
            element={
              <PrivateRoute>
                <MyGames />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/folder"
            element={
              <PrivateRoute>
                <Folder />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/flashcard"
            element={
              <PrivateRoute>
                <Flashcard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <InstallPrompt />
    </AuthGate>
  );
}
