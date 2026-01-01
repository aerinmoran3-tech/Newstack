import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User, AuthContextType, UserRole } from './types';
import { supabase, isSupabaseConfigured, getSupabaseOrThrow } from './supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ---------------------------------------
   Helpers
--------------------------------------- */

const normalizeRole = (role?: string): UserRole => {
  if (role === 'buyer') return 'renter';
  return (role as UserRole) || 'renter';
};

const needsRoleSelection = (authUser: any) => {
  return !authUser?.user_metadata?.role;
};

async function loadUserFromDB(authUser: any): Promise<User> {
  const { data } = await supabase
    .from('users')
    .select('role, full_name, phone, profile_image, bio')
    .eq('id', authUser.id)
    .single();

  const role = normalizeRole(data?.role || authUser.user_metadata?.role);

  return {
    id: authUser.id,
    email: authUser.email || '',
    role,
    full_name:
      data?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      null,
    phone: data?.phone || authUser.phone || null,
    profile_image:
      data?.profile_image || authUser.user_metadata?.avatar_url || null,
    bio: data?.bio || null,
    created_at: authUser.created_at,
    updated_at: null,
    email_verified: !!authUser.email_confirmed_at,
    needs_role_selection: !role || needsRoleSelection(authUser)
  };
}

/* ---------------------------------------
   Provider
--------------------------------------- */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const initializing = useRef(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthReady(true);
      return;
    }

      const init = async () => {
        const {
          data: { session }
        } = await getSupabaseOrThrow().auth.getSession();

      if (session?.user) {
        const builtUser = await loadUserFromDB(session.user);
        setUser(builtUser);
        setEmailVerified(builtUser.email_verified);
      }

      setAuthReady(true);
      initializing.current = false;
    };

    init();

    const {
      data: { subscription }
    } = getSupabaseOrThrow().auth.onAuthStateChange(async (event, session) => {
      if (initializing.current) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setEmailVerified(false);
        return;
      }

      if (session?.user) {
        const builtUser = await loadUserFromDB(session.user);
        setUser(builtUser);
        setEmailVerified(builtUser.email_verified);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ---------------------------------------
     Actions
  --------------------------------------- */

  const login = async (
    email: string,
    password: string,
    rememberMe = true
  ): Promise<UserRole> => {
    const { data, error } = await getSupabaseOrThrow().auth.signInWithPassword({
      email,
      password,
      options: { shouldCreateUser: false }
    });

    if (error) throw error;

    if (!rememberMe) {
      await getSupabaseOrThrow().auth.refreshSession();
    }

    const role = normalizeRole(
      data.user?.user_metadata?.role
    );

    return role;
  };

  const signup = async (
    email: string,
    name: string,
    password: string,
    phone?: string,
    role: UserRole = 'renter'
  ): Promise<UserRole> => {
    const redirectTo =
      import.meta.env.VITE_APP_URL || window.location.origin;

    const { data, error } = await getSupabaseOrThrow().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${redirectTo}/auth/callback`,
        data: { full_name: name, phone, role }
      }
    });

    if (error) throw error;

    if (data.user) {
      await getSupabaseOrThrow().from('users').upsert({
        id: data.user.id,
        email,
        full_name: name,
        phone,
        role
      });
    }

    return role;
  };

  const updateUserRole = async (role: UserRole) => {
    if (!user) throw new Error('No user');

    // Use server-side endpoint to change role to avoid client-side privilege escalation
    const tokenRes = await getSupabaseOrThrow().auth.getSession();
    const token = tokenRes?.data?.session?.access_token || null;

    const resp = await fetch(`/api/admin/users/${user.id}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ role }),
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body?.error || body?.message || 'Failed to update role');
    }

    // Update local state after successful server-side change
    setUser({ ...user, role, needs_role_selection: false });
  };

  const logout = async () => {
    await getSupabaseOrThrow().auth.signOut();
    setUser(null);
    setEmailVerified(false);
  };

  const resetPassword = async (email: string) => {
    const redirectTo =
      import.meta.env.VITE_APP_URL || window.location.origin;
    await getSupabaseOrThrow().auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectTo}/reset-password`
    });
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) throw new Error('No email');

    const redirectTo =
      import.meta.env.VITE_APP_URL || window.location.origin;

    await getSupabaseOrThrow().auth.resend({
      type: 'signup',
      email: user.email,
      options: { emailRedirectTo: `${redirectTo}/auth/callback` }
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        updateUserRole,
        resetPassword,
        resendVerificationEmail,
        isLoggedIn: !!user,
        isLoading: !authReady,
        isEmailVerified: emailVerified
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export async function getAuthToken(): Promise<string | null> {
  const {
    data: { session }
  } = await getSupabaseOrThrow().auth.getSession();
  return session?.access_token || null;
}