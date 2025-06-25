import { handlers } from "./options";

// Force runtime handling to prevent build-time issues
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export const { GET, POST } = handlers;
