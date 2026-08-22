import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";

export interface ResetDeliveryProvider { deliver(email: string, resetUrl: string): boolean; }

@Injectable()
export class SafeResetDeliveryProvider implements ResetDeliveryProvider {
  private readonly testTokens = new Map<string, string>();
  constructor(private readonly config: ConfigService) {}
  deliver(email: string, resetUrl: string) {
    const enabled = this.config.get<boolean>("AUTH_DEV_RESET_PROVIDER", false);
    if (this.config.get<string>("NODE_ENV") === "production" || !enabled) return false;
    this.testTokens.set(email.toLowerCase(), resetUrl);
    return true;
  }
  consumeForTesting(email: string) {
    const value = this.testTokens.get(email.toLowerCase());
    this.testTokens.delete(email.toLowerCase());
    return value;
  }
}
