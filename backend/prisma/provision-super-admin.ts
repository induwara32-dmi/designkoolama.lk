import { AccountStatus, PrismaClient } from "@prisma/client";
import { loadEnvFile } from "node:process";
import { resolve } from "node:path";
import { assertStrongPassword, hashPassword } from "../src/admin-auth/security";

loadEnvFile(resolve(__dirname, "../../.env"));
function required(name: "INITIAL_SUPER_ADMIN_EMAIL" | "INITIAL_SUPER_ADMIN_PASSWORD") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required provisioning variable: ${name}`);
  return value;
}
const email = required("INITIAL_SUPER_ADMIN_EMAIL").trim().toLowerCase();
const password = required("INITIAL_SUPER_ADMIN_PASSWORD");
if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Initial Super Admin email is invalid");
if (!assertStrongPassword(password)) throw new Error("Initial Super Admin password does not meet strength requirements");

const prisma = new PrismaClient();
async function main() {
  const existing = await prisma.adminUser.findUnique({ where: { email }, select: { id: true } });
  if (existing) { console.info("Super Admin already exists; no credentials were changed."); return; }
  const role = await prisma.role.upsert({ where: { name: "SUPER_ADMIN" }, update: {}, create: { name: "SUPER_ADMIN", description: "Full administrator access" } });
  for (const [name, description] of [["CONTENT_MANAGER", "Content management"], ["PORTFOLIO_MANAGER", "Portfolio management"], ["INQUIRY_MANAGER", "Inquiry management"]] as const) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name, description } });
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.adminUser.create({ data: { email, passwordHash, displayName: "Super Admin", status: AccountStatus.ACTIVE, passwordChangedAt: new Date() } });
  await prisma.adminUserRole.create({ data: { userId: user.id, roleId: role.id } });
  console.info("Super Admin provisioned successfully.");
}
main().catch(() => { console.error("Super Admin provisioning failed."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
