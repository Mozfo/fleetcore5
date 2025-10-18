import { NextRequest } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { NotFoundError } from "@/lib/core/errors";

export async function GET(request: NextRequest) {
  try {
    throw new NotFoundError("Test error");
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
    });
  }
}
