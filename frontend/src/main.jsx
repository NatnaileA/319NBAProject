import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { LogOut } from "lucide-react";

import api from "./api";
import BoxScore from "./pages/BoxScore";
import Login from "./pages/Login";
import Scoreboard from "./pages/Scoreboard";
import "./styles.css";

// Shows a readable error instead of a blank white screen if React crashes.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
          <div className="mx-auto max-w-2xl rounded-lg border border-red-900 bg-red-950/60 p-5">
            <h1 className="text-xl font-bold text-red-100">Something broke on this page.</h1>
            <p className="mt-2 text-sm text-red-200">
              Refresh the page. If it happens again, check the browser console for the error message.
            </p>
            <pre className="mt-4 overflow-auto rounded-md bg-zinc-950 p-3 text-xs text-red-100">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [user, setUser] = React.useState(null);
  const [checkedAuth, setCheckedAuth] = React.useState(false);

  React.useEffect(() => {
    // On page load, ask the backend if the session cookie belongs to a user.
    api
      .get("/auth/me")
      .then((response) => {
        setUser(response.data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setCheckedAuth(true);
      });
  }, []);

  const logout = async () => {
    // Backend clears the session cookie, then the UI switches back to Login.
    await api.post("/auth/logout");
    setUser(null);
  };

  if (!checkedAuth) {
    return <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold tracking-tight">
            NBA Playoff Tracker
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="nav-link" to="/">
              Scoreboard
            </Link>
            {user ? (
              <button className="icon-button" onClick={logout} title="Log out">
                <LogOut size={18} />
              </button>
            ) : (
              <Link className="nav-link" to="/login">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* React Router chooses which page to show based on the URL. */}
        <Routes>
          <Route path="/" element={<Scoreboard user={user} />} />
          <Route path="/games/:gameId" element={<BoxScore user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
