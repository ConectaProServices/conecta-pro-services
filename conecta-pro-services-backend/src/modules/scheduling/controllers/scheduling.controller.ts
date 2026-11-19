import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SchedulingService } from '../services/scheduling.service.js';
import { RequestSchedulingDto } from '../dtos/request-scheduling.dto.js';
import type { RequestSchedulingResponseDto } from '../dtos/confirm-schedule-response.dto.js';
import { toRequestSchedulingResponse } from '../mappers/scheduling-response.mapper.js';

@Controller('schedulings')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async request(@Body() dto: RequestSchedulingDto): Promise<RequestSchedulingResponseDto> {
    const scheduling = await this.schedulingService.requestScheduling(dto);
    return toRequestSchedulingResponse(scheduling);
  }
}