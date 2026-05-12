import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Mengambil daftar API Key
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ apiKeys: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Generate a random API key. Awalan "rg-" (restricted key)
  const keyValue = `rg-${uuidv4().replace(/-/g, "")}`;

  const { data, error } = await supabase
    .from("api_keys")
    .insert([{ user_id: user.id, name, key_value: keyValue }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, apiKey: data });
}