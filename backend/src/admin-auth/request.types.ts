import type { Request } from "express";
import type { AdminPrincipal } from "./auth.types";

export type AdminRequest = Request & { admin?: AdminPrincipal };

