import { createContext, useContext, useEffect, useState } from "react";
import {
  loginRequest,
  logoutRequest,
  refreshSession,
  setSessionExpiredHandler,
} from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On page load, restore the session from the refresh cookie (if any)
    refreshSession().then((session) => {
      setUser(session ? { username: session.username } : null);
      setLoading(false);
    });
    setSessionExpiredHandler(() => setUser(null));
  }, []);

  async function login(username, password) {
    await loginRequest(username, password);
    setUser({ username });
  }

  async function logout() {
    await logoutRequest();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
