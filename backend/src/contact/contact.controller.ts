import {Body,Controller,HttpCode,HttpStatus,Post,UseGuards} from "@nestjs/common";
import {ApiCreatedResponse,ApiOperation,ApiTags} from "@nestjs/swagger";
import {SubmissionRateLimitGuard} from "../common/guards/submission-rate-limit.guard";
import {CreateContactDto} from "./contact.dto";
import {ContactService} from "./contact.service";
@ApiTags("contact") @Controller("contact") @UseGuards(SubmissionRateLimitGuard)
export class ContactController{constructor(private readonly contact:ContactService){} @Post() @HttpCode(HttpStatus.CREATED) @ApiOperation({summary:"Persist a public contact message"}) @ApiCreatedResponse({description:"Message persisted"}) create(@Body() dto:CreateContactDto){return this.contact.create(dto)}}
