
import { createClient } from '@supabase/supabase-js';
import { User } from '../types/user';

// This is a placeholder - in a real app, you would connect to your Supabase instance
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;
    
    // Fetch additional user data from your profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return {
      id: user.id,
      email: user.email || '',
      displayName: profile?.display_name || user.email?.split('@')[0] || '',
      phoneNumber: profile?.phone_number || '',
      avatarUrl: profile?.avatar_url || '',
      isVerified: profile?.is_verified || false,
      createdAt: user.created_at || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// For demonstration purposes, return mock user data
export const getMockCurrentUser = (): User | null => {
  // Check if user is logged in (for demo)
  const isLoggedIn = localStorage.getItem('reportify_user') !== null;
  
  if (!isLoggedIn) return null;
  
  return {
    id: '123456',
    email: 'demo@example.com',
    displayName: 'Demo User',
    phoneNumber: '+1234567890',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=John',
    isVerified: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    reports: ['report1', 'report2']
  };
};

// Mock sign in function for demonstration
export const mockSignIn = (email: string, password: string) => {
  // In a real app, you would validate credentials against your backend
  if (email && password) {
    const user = {
      id: '123456',
      email: email,
      displayName: email.split('@')[0],
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    
    localStorage.setItem('reportify_user', JSON.stringify(user));
    return Promise.resolve(user);
  }
  
  return Promise.reject(new Error('Invalid credentials'));
};

// Mock sign out function
export const mockSignOut = () => {
  localStorage.removeItem('reportify_user');
  return Promise.resolve(true);
};
