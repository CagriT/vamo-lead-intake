import { Body, Controller, Post, Param, UseGuards } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';
import { PresignPictureDto } from './dto/presign-picture.dto';
import { AttachPictureDto } from './dto/attach-picture.dto';
import { LeadPictureGuard } from './lead-picture.guard';
import { Throttle, ThrottlerGuard, seconds } from '@nestjs/throttler';

interface CreateLeadResponse {
  success: boolean;
  message: string;
  leadId: string;
  pictureToken: string;
}

interface PresignPictureResponse {
  url: string;
  fields: Record<string, string>;
  accessUrl: string;
  key: string;
}

interface AttachPictureResponse {
  success: boolean;
  message: string;
}

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ leads: { ttl: seconds(60), limit: 5 } })
  @Post()
  async createLead(@Body() dto: CreateLeadDto): Promise<CreateLeadResponse> {
    return this.leadsService.createLead(dto);
  }

  @UseGuards(ThrottlerGuard, LeadPictureGuard)
  @Throttle({ pictures: { ttl: seconds(60), limit: 10 } })
  @Post(':id/pictures/presign')
  async presignPicture(
    @Param('id') leadId: string,
    @Body() body: PresignPictureDto,
  ): Promise<PresignPictureResponse> {
    return this.leadsService.presignPicture(leadId, body);
  }

  @UseGuards(ThrottlerGuard, LeadPictureGuard)
  @Throttle({ pictures: { ttl: seconds(60), limit: 10 } })
  @Post(':id/pictures')
  async attachPicture(
    @Param('id') leadId: string,
    @Body() body: AttachPictureDto,
  ): Promise<AttachPictureResponse> {
    return this.leadsService.attachPicture(leadId, body);
  }
}
