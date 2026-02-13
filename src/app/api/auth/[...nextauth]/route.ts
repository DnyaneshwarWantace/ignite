import { NextRequest } from "next/server";
import { handlers } from "./options";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

function withFullPath(req: NextRequest): NextRequest {
  if (!basePath) return req;
  const url = new URL(req.url);
  url.pathname = basePath + url.pathname;
  return new NextRequest(url, req);
}

export async function GET(req: NextRequest) {
  return handlers.GET(withFullPath(req));
}
export async function POST(req: NextRequest) {
  return handlers.POST(withFullPath(req));
}
