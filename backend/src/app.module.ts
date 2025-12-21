import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LeadsModule } from './leads/leads.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrmModule } from './crm/crm.module';

@Module({
  imports: [
    // Loads .env and makes process.env available everywhere
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // MongoDB connection
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error('MONGODB_URI is not set');
        }
        return { uri };
      },
    }),
    CrmModule,
    // Feature modules
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
