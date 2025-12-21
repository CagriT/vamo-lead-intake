import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SalesforceTokenResponse } from '../../../types';

@Injectable()
export class SalesforceOAuthService {
  constructor(private readonly configService: ConfigService) {}

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing ${key}`);
    }
    return value;
  }

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.getRequiredConfig('SALESFORCE_CLIENT_ID'),
      redirect_uri: this.getRequiredConfig('SALESFORCE_REDIRECT_URI'),
    });

    const loginUrl = this.getRequiredConfig('SALESFORCE_LOGIN_URL');
    return `${loginUrl}/services/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string) {
    const loginUrl = this.getRequiredConfig('SALESFORCE_LOGIN_URL');
    const tokenUrl = `${loginUrl}/services/oauth2/token`;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.getRequiredConfig('SALESFORCE_CLIENT_ID'),
      client_secret: this.getRequiredConfig('SALESFORCE_CLIENT_SECRET'),
      redirect_uri: this.getRequiredConfig('SALESFORCE_REDIRECT_URI'),
      code,
    });

    const response = await axios.post<SalesforceTokenResponse>(
      tokenUrl,
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    const { instance_url } = response.data;

    return {
      message: 'Salesforce OAuth successful',
      instance_url,
    };
  }
}
