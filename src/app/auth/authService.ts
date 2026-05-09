import apiClient from "../api/client";

export type UserRole =
  | "Manager"
  | "Accounting"
  | "Inventory"
  | "Sales Person"
  | "Technician";

export interface AuthSession {
  role: UserRole;
  token: string;
  name: string;
  userId: string;
  email?: string;
  loggedInAt: string;
}

const AUTH_KEY = "iwms_auth_session";

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export async function login(userId: string, password: string): Promise<AuthSession> {
  const response = await apiClient.post("/auth/login", { userId, password });
  const { role, token, name, email, userId: responseUserId } = response.data;

  // Map backend role names to frontend role names if necessary
  let mappedRole: UserRole = "Technician";
  switch (role.toLowerCase()) {
    case "manager": mappedRole = "Manager"; break;
    case "accountant": mappedRole = "Accounting"; break;
    case "inventory": mappedRole = "Inventory"; break;
    case "sales": mappedRole = "Sales Person"; break;
    case "technician": mappedRole = "Technician"; break;
  }

  const session: AuthSession = {
    role: mappedRole,
    token,
    name,
    userId: responseUserId || userId,
    email,
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return session;
}

export async function signup(userData: {
  name: string;
  userId: string;
  password: string;
  role: string;
  hourlyRate: number;
}): Promise<AuthSession> {
  let backendRole = userData.role;
  switch (userData.role) {
    case "accounting": backendRole = "accountant"; break;
    case "sales person": backendRole = "sales"; break;
  }
  
  const payload = { ...userData, role: backendRole };
  const response = await apiClient.post("/auth/register", payload);
  const { role, token, name, email, userId: responseUserId } = response.data;

  let mappedRole: UserRole = "Technician";
  switch (role.toLowerCase()) {
    case "manager": mappedRole = "Manager"; break;
    case "accountant": mappedRole = "Accounting"; break;
    case "inventory": mappedRole = "Inventory"; break;
    case "sales": mappedRole = "Sales Person"; break;
    case "technician": mappedRole = "Technician"; break;
  }

  const session: AuthSession = {
    role: mappedRole,
    token,
    name,
    userId: responseUserId || userData.userId,
    email,
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return session;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case "Manager":
      return "/Manager";
    case "Accounting":
      return "/Accounting";
    case "Inventory":
      return "/inventory/management";
    case "Sales Person":
      return "/Sales";
    case "Technician":
      return "/JOBS";
    default:
      return "/login";
  }
}
