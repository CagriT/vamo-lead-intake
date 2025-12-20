import { Body, Controller, Post, Param, Patch, Query } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';

interface CreateLeadResponse {
  success: boolean;
  message: string;
  leadId: string;
  uploadUrl: string;
  publicUrl: string;
}

interface ImageUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

interface UpdateLeadImageResponse {
  success: boolean;
  message: string;
}

interface UpdateLeadImageBody {
  imageUrl: string;
}

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  async createLead(@Body() dto: CreateLeadDto): Promise<CreateLeadResponse> {
    return this.leadsService.createLead(dto);
  }

  @Post(':id/image-upload-url')
  async generateImageUploadUrl(
    @Param('id') leadId: string,
    @Query('fileName') fileName: string,
    @Query('contentType') contentType: string,
  ): Promise<ImageUploadUrlResponse> {
    return this.leadsService.generateImageUploadUrl(
      leadId,
      fileName,
      contentType,
    );
  }

  @Patch(':id/image')
  async updateLeadWithImage(
    @Param('id') leadId: string,
    @Body() body: UpdateLeadImageBody,
  ): Promise<UpdateLeadImageResponse> {
    return this.leadsService.updateLeadWithImage(leadId, body.imageUrl);
  }
}
