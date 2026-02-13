const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const ROOT = `${BASE_PATH}/login`;
export const ADMIN_LOGIN = `${BASE_PATH}/admin/login`;
export const PUBLIC_ROUTES = [`${BASE_PATH}/login`, `${BASE_PATH}/auth/register`, `${BASE_PATH}/admin/login`];
export const DEFAULT_REDIRECT = `${BASE_PATH}/x-ray`;
