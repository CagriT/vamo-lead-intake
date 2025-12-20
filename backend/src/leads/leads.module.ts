import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from './schemas/lead.schema';
import { CrmModule } from 'src/crm/crm.module';
import { S3Module } from '../s3/s3.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
    CrmModule,
    S3Module
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
