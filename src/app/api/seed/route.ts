import { NextResponse } from "next/server";
import { seedSupabaseDatabase } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await seedSupabaseDatabase();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
