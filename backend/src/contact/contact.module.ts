import {Module} from "@nestjs/common";import {SubmissionRateLimitGuard} from "../common/guards/submission-rate-limit.guard";import {ContactController} from "./contact.controller";import {ContactService} from "./contact.service";
@Module({controllers:[ContactController],providers:[ContactService,SubmissionRateLimitGuard]}) export class ContactModule{}
