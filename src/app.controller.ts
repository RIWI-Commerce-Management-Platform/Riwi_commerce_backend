import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './modules/auth/decorators/public.decorator.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHealth(): string {
    return this.appService.getHealth();
  }
}
