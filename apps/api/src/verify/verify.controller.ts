import { Body, Controller, Get, HttpCode, Post, UsePipes } from '@nestjs/common';
import type { VerifyLogResponse, VerifyResponse } from '@ulysses/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { idkitResultSchema, type IdkitResultDto } from './verify.dto';
import { VerifyService } from './verify.service';

@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @Post()
  @HttpCode(200)
  @UsePipes()
  async verify(
    @Body(new ZodValidationPipe(idkitResultSchema)) body: IdkitResultDto,
  ): Promise<VerifyResponse> {
    return this.verifyService.verify(body);
  }

  @Get('log')
  getLog(): VerifyLogResponse {
    return this.verifyService.getLog();
  }
}
