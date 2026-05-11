import { supabase } from "@/lib/supabase";

type LoginData = {
  email: string;
  password: string;
};

export const login = async (data: LoginData) => {
  const { data: response, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) return null;
  return response.user;
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};