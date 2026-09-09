import { Controller, HttpCode, Post } from '@nestjs/common';
import type { RpContextResponse } from '@ulysses/shared';
import { RpService } from './rp.service';

@Controller('rp')
export class RpController {
  constructor(private readonly rpService: RpService) {}

  @Post('sign')
  @HttpCode(200)
  sign(): RpContextResponse {
    return this.rpService.sign();
  }
}
