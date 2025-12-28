import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

import { LeadsModule } from './leads/leads.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrmModule } from './crm/crm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        // DB
        MONGODB_URI: Joi.string().uri().required(),

        // CRM
        CRM_MODE: Joi.string()
          .empty('') // "" becomes undefined
          .valid('FAKE', 'SALESFORCE')
          .default('FAKE'),

        SALESFORCE_CLIENT_ID: Joi.when('CRM_MODE', {
          is: 'SALESFORCE',
          then: Joi.string().min(1).required(),
          otherwise: Joi.string().empty('').optional(), // allow missing/empty in FAKE
        }),

        SALESFORCE_CLIENT_SECRET: Joi.when('CRM_MODE', {
          is: 'SALESFORCE',
          then: Joi.string().min(1).required(),
          otherwise: Joi.string().empty('').optional(),
        }),

        SALESFORCE_REDIRECT_URI: Joi.when('CRM_MODE', {
          is: 'SALESFORCE',
          then: Joi.string().uri().required(),
          otherwise: Joi.string().empty('').optional(),
        }),

        SALESFORCE_LOGIN_URL: Joi.when('CRM_MODE', {
          is: 'SALESFORCE',
          then: Joi.string().uri().required(),
          otherwise: Joi.string().empty('').optional(),
        }),

        // Runtime
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().optional(),

        // AWS (keep required — you actually need these for uploads)
        AWS_REGION: Joi.string().min(1).required(),
        AWS_ACCESS_KEY_ID: Joi.string().min(1).required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().min(1).required(),
        AWS_S3_BUCKET_NAME: Joi.string().min(1).required(),

        // Token
        LEAD_PICTURE_TOKEN_SECRET: Joi.string().min(1).required(),
        LEAD_PICTURE_TOKEN_TTL: Joi.number().default(3600),

        // CORS
        CORS_ORIGIN: Joi.string().min(1).required(),
      }),
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) throw new Error('MONGODB_URI is not set');
        return { uri };
      },
    }),

    CrmModule,
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
