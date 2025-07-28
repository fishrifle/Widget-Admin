// app/api/org/[orgId]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// GET /api/org/:orgId
export async function GET(
  _req: Request,
  { params }: { params: { orgId: string } }
) {
  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .select("*")
    .eq("id", params.orgId)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(org);
}

// PUT /api/org/:orgId
export async function PUT(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  const updates = await req.json();
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .update(updates)
    .eq("id", params.orgId)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
