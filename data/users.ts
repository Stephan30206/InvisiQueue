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

export const updateUserProfile = async (name: string, phone: string) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({
      id: userData.user.id,
      full_name: name,
      phone_number: phone,
      updated_at: new Date().toISOString(),
    })
    .select();

  return error ? null : data?.[0];
};

export const getUserProfile = async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  return error ? null : data;
};

export const updatePassword = async (oldPassword: string, newPassword: string) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.user.email!,
    password: oldPassword,
  });

  if (signInError) return false;

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return !updateError;
};
