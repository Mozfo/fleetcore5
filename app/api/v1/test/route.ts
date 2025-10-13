// Example protected API route to test middleware
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get headers injected by middleware
  const userId = request.headers.get("x-user-id");
  const tenantId = request.headers.get("x-tenant-id");

  if (!userId || !tenantId) {
    return NextResponse.json(
      { error: "Missing authentication headers" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    message: "Protected API route accessed successfully",
    userId,
    tenantId,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  // Get headers injected by middleware
  const userId = request.headers.get("x-user-id");
  const tenantId = request.headers.get("x-tenant-id");

  if (!userId || !tenantId) {
    return NextResponse.json(
      { error: "Missing authentication headers" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    return NextResponse.json({
      message: "Data received successfully",
      userId,
      tenantId,
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
