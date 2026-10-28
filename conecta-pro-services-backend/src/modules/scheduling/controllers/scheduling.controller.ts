import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SchedulingService } from '../services/scheduling.service.js';
import { RequestSchedulingDto } from '../dtos/request-scheduling.dto.js';

@Controller('schedulings')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) 
  async request(@Body() dto: RequestSchedulingDto) {
    return this.schedulingService.requestScheduling(dto);
  }
}