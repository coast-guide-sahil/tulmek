import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(
    { status: "ok", version: packageJson.version },
    { status: 200 },
  );
}
