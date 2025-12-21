import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from './schemas/lead.schema';
import { CrmModule } from 'src/crm/crm.module';
import { S3Module } from '../s3/s3.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LeadPictureTokenService } from './lead-picture-token.service';
import { LeadPictureGuard } from './lead-picture.guard';
import type { StringValue } from 'ms';
import { seconds, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
    CrmModule,
    S3Module,
    // JWT config for short-lived lead picture tokens
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('LEAD_PICTURE_TOKEN_SECRET');
        if (!secret) {
          throw new Error('LEAD_PICTURE_TOKEN_SECRET is not set');
        }

        const ttl =
          configService.get<StringValue>('LEAD_PICTURE_TOKEN_TTL') || '15m';

        return {
          secret,
          signOptions: { expiresIn: ttl },
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'pictures',
        ttl: seconds(60), // seconds
        limit: 10, // max 10 req per minute per IP
      },
      {
        name: 'leads',
        ttl: seconds(60),
        limit: 5,
      },
    ]),
  ],
  controllers: [LeadsController],
  providers: [LeadsService, LeadPictureTokenService, LeadPictureGuard],
})
export class LeadsModule {}
