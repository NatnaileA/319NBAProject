import React from "react";
import { useNavigate } from "react-router-dom";

import api from "../api";

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const [mode, setMode] = React.useState("login");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const submit = async (event) => {
    // mode is either "login" or "register", matching backend route names.
    event.preventDefault();
    setError("");

    try {
      const response = await api.post(`/auth/${mode}`, { username, password });
      setUser(response.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed");
    }
  };

  return (
    <section className="mx-auto max-w-md">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{mode === "login" ? "Login" : "Register"}</h1>
        <p className="mt-1 text-sm text-zinc-400">Use a simple username and password for this project.</p>
      </div>

      <form className="rounded-lg border border-zinc-800 bg-zinc-900 p-5" onSubmit={submit}>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">Username</span>
          <input
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-zinc-300">Password</span>
          <input
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <p className="mt-4 rounded-md bg-red-950 p-3 text-sm text-red-200">{error}</p>}

        <button
          className="mt-5 w-full rounded-md bg-orange-500 px-4 py-2 font-semibold text-zinc-950 hover:bg-orange-400"
          type="submit"
        >
          {mode === "login" ? "Login" : "Create Account"}
        </button>

        <button
          className="mt-3 w-full rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-700"
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
        </button>
      </form>
    </section>
  );
}
