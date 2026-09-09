import { Module } from '@nestjs/common';
import { RpController } from './rp/rp.controller';
import { RpService } from './rp/rp.service';
import { VerifyController } from './verify/verify.controller';
import { VerifyService } from './verify/verify.service';

@Module({
  controllers: [RpController, VerifyController],
  providers: [RpService, VerifyService],
})
export class AppModule {}
