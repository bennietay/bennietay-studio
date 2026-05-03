/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";
import { UserProfile, UserRole } from "@/src/types";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  business: any | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    role?: UserRole,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  isAuthReady: boolean;
  clearError: () => void;
  isSigningIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setBusiness(null);
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        // Profile doesn't exist, create it
        const { data: userData } = await supabase.auth.getUser();
        const userMetadata = userData.user?.user_metadata || {};
        const email = userData.user?.email || "";

        let initialRole: UserRole = "business_admin";
        if (email === "bennietayhanhau@gmail.com") {
          initialRole = "super_admin";
        } else if (userMetadata.initial_role) {
          initialRole = userMetadata.initial_role;
        }

        const newProfile: any = {
          id: uid,
          email: email,
          role: initialRole,
          created_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert([newProfile])
          .select()
          .single();

        if (createError) throw createError;
        if (createdProfile) {
          setProfile(mapProfile(createdProfile));
        }
      } else if (profileError) {
        throw profileError;
      } else if (data) {
        let currentProfile = data;
        // Auto-upgrade for specific emails to ensure Super Admin access
        if (
          data.email === "bennietayhanhau@gmail.com" &&
          data.role !== "super_admin"
        ) {
          console.log("Upgrading user to super_admin:", data.email);
          const { data: updatedData } = await supabase
            .from("profiles")
            .update({ role: "super_admin" })
            .eq("id", uid)
            .select()
            .single();
          if (updatedData) currentProfile = updatedData;
        }

        setProfile(mapProfile(currentProfile));
        // Fetch business info
        if (currentProfile.business_id) {
          const { data: bizData } = await supabase
            .from("businesses")
            .select("*")
            .eq("id", currentProfile.business_id)
            .maybeSingle();
          if (bizData) setBusiness(bizData);
        }
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsAuthReady(true);
    }
  };

  const mapProfile = (dbProfile: any): UserProfile => ({
    uid: dbProfile.id,
    email: dbProfile.email,
    role: dbProfile.role,
    businessId: dbProfile.business_id,
    onboardingCompleted: dbProfile.onboarding_completed,
    status: dbProfile.status,
    createdAt: new Date(dbProfile.created_at).getTime(),
  });

  const signInWithEmail = async (email: string, pass: string) => {
    if (isSigningIn) return;
    setError(null);
    setIsSigningIn(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (signInError) {
        // If sign in fails, try to sign up (Smart Sign In)
        // This handles the case where the user hasn't created an account yet
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: pass,
        });

        if (signUpError) {
          // If sign up also fails, it might be a real "Invalid credentials" (wrong password for existing user)
          // or some other error.
          if (signUpError.message.includes("already registered")) {
            throw new Error(
              "Invalid login credentials. Please check your password.",
            );
          }
          throw signUpError;
        }

        // If sign up succeeded, Supabase might automatically sign them in or require email confirmation
        // In most of our configs, it signs them in or we can try signing in again
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (retryError) throw retryError;
      }
    } catch (err: any) {
      console.error("Email sign in error:", err);
      setError(err.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    role?: UserRole,
  ) => {
    if (isSigningIn) return;
    setError(null);
    setIsSigningIn(true);
    try {
      // New signups default to business_admin
      const defaultRole = role || "business_admin";
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            initial_role: defaultRole,
          },
        },
      });
      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          throw new Error(
            "This email is already registered. Please sign in instead.",
          );
        }
        throw error;
      }
    } catch (err: any) {
      console.error("Email sign up error:", err);
      setError(err.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const clearError = () => setError(null);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent!");
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(err.message);
      toast.error(err.message);
    }
  };

  const updatePassword = async (password: string) => {
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully!");
    } catch (err: any) {
      console.error("Update password error:", err);
      setError(err.message);
      toast.error(err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        business,
        loading,
        error,
        signInWithEmail,
        signUpWithEmail,
        logout,
        refreshProfile,
        resetPassword,
        updatePassword,
        isAuthReady,
        clearError,
        isSigningIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
