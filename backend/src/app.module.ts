import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
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
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    CrmModule,
    // Feature modules
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
