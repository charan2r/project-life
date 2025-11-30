import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseClient";
import { cookies } from "next/headers";

export async function GET(req: Request, context: { params: { id: string } }) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const access_token = cookieStore.get("sb-access-token")?.value;

  if (!access_token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = supabaseServerClient(access_token);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Fetch the target profile
  const { data: target, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: target });
}
