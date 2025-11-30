import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseClient";
import { cookies } from "next/headers";

export async function POST(req: Request, context: { params: { id: string } }) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing user_id in params" },
      { status: 400 }
    );
  }

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

  const isAdmin = user.user_metadata?.role === "admin";
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only admin can update profiles" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { updates } = body;

  if (!updates || typeof updates !== "object") {
    return NextResponse.json(
      { error: "Missing or invalid updates object" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Profile updated successfully",
  });
}
