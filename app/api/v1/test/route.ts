// Example protected API route to test middleware
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";

export async function GET(request: NextRequest) {
  // 1. Extract auth headers (before try for error context)
  const userId = request.headers.get("x-user-id");
  const tenantId = request.headers.get("x-tenant-id");

  try {
    // 2. Auth check
    if (!userId || !tenantId) {
      return NextResponse.json(
        { error: "Missing authentication headers" },
        { status: 401 }
      );
    }

    // 3. Return test success response
    return NextResponse.json({
      message: "Protected API route accessed successfully",
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}

export async function POST(request: NextRequest) {
  // 1. Extract auth headers (before try for error context)
  const userId = request.headers.get("x-user-id");
  const tenantId = request.headers.get("x-tenant-id");

  try {
    // 2. Auth check
    if (!userId || !tenantId) {
      return NextResponse.json(
        { error: "Missing authentication headers" },
        { status: 401 }
      );
    }

    // 3. Parse request body
    const body = await request.json();

    // 4. Return test success response with received data
    return NextResponse.json({
      message: "Data received successfully",
      userId,
      tenantId,
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
