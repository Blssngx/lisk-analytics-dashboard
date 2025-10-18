import { NextResponse } from "next/server";

export async function GET() {
	console.log("Cron route triggered");
	return NextResponse.json({ ok: true });
}
