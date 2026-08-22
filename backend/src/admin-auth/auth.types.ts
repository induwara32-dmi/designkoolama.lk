export type AdminPrincipal = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  sessionId?: string;
};

export type AccessClaims = { sub: string; sid: string; roles: string[]; exp: number; type: "access" };
