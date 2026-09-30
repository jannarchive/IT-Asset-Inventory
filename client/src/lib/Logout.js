import { supabase } from "../lib/SupabaseClient";

export async function logout(navigate) {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Supabase sign out error:", err);
  }

  localStorage.removeItem("authToken");
  localStorage.removeItem("system_user");
  localStorage.removeItem("adminName");
  localStorage.removeItem("adminEmail");

  navigate("/", { replace: true });
}