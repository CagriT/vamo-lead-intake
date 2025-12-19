import { Module } from '@nestjs/common';
import { SalesforceOAuthController } from './salesforce-oauth.controller';
import { SalesforceOAuthService } from './salesforce-oauth.service';

@Module({
  controllers: [SalesforceOAuthController],
  providers: [SalesforceOAuthService],
})
export class SalesforceOAuthModule {}
