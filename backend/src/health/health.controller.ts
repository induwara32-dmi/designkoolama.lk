import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  @ApiOperation({ summary: "Check API process health" })
  check() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Get("ready")
  @ApiOperation({ summary: "Check API and database readiness" })
  async ready() {
    if (!(await this.prisma.isReady())) throw new ServiceUnavailableException("Database unavailable");
    return { status: "ready", database: "available", timestamp: new Date().toISOString() };
  }
}
