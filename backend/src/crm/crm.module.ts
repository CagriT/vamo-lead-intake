import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FakeCrmService } from './fake-crm.service';
import { SalesforceCrmService } from './salesforce-crm.service';
import { CRM_SERVICE } from './crm.constants';
import { SalesforceOAuthModule } from './salesforce/oauth/salesforce-oauth.module';

@Module({
  imports: [SalesforceOAuthModule],
  providers: [
    {
      provide: CRM_SERVICE,
      useFactory: (configService: ConfigService) => {
        const mode = configService.get('CRM_MODE');

        if (mode === 'SALESFORCE') {
          return new SalesforceCrmService();
        }

        return new FakeCrmService();
      },
      inject: [ConfigService],
    },
  ],
  exports: [CRM_SERVICE],
})
export class CrmModule {}
