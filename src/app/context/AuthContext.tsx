import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: "email" | "google" | "twitter" | "facebook";
  joinedAt: string;
  plan: "free" | "pro" | "enterprise";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  socialLogin: (provider: "google" | "twitter" | "facebook") => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  verifyEmail: (code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (_email: string, _password: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setUser({
      id: "usr_001",
      name: "أحمد المطيري",
      email: _email,
      avatar: "https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MTQ5NTk3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      provider: "email",
      joinedAt: "2025/06",
      plan: "pro",
    });
    setIsLoading(false);
    return true;
  }, []);

  const socialLogin = useCallback(async (provider: "google" | "twitter" | "facebook") => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    const names: Record<string, string> = {
      google: "أحمد المطيري",
      twitter: "Ahmed Tech",
      facebook: "أحمد المطيري",
    };
    setUser({
      id: "usr_001",
      name: names[provider] || "أحمد المطيري",
      email: "ahmed@example.com",
      avatar: "https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MTQ5NTk3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      provider,
      joinedAt: "2025/06",
      plan: "pro",
    });
    setIsLoading(false);
    return true;
  }, []);

  const signup = useCallback(async (name: string, email: string, _password: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setUser({
      id: "usr_001",
      name,
      email,
      provider: "email",
      joinedAt: "2025/06",
      plan: "pro",
    });
    setIsLoading(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (_email: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    return true;
  }, []);

  const verifyEmail = useCallback(async (_code: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    return true;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        socialLogin,
        signup,
        logout,
        resetPassword,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}