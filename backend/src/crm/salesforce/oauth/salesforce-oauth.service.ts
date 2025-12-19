import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SalesforceOAuthService {
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.SALESFORCE_CLIENT_ID!,
      redirect_uri: process.env.SALESFORCE_REDIRECT_URI!,
    });

    return `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string) {
    const tokenUrl = `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/token`;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SALESFORCE_CLIENT_ID!,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
      redirect_uri: process.env.SALESFORCE_REDIRECT_URI!,
      code,
    });

    const response = await axios.post(tokenUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, refresh_token, instance_url } = response.data;

    // For challenge: log or store temporarily
    console.log('🔐 Salesforce OAuth success');
    console.log({ access_token, refresh_token, instance_url });

    return {
      message: 'Salesforce OAuth successful',
      instance_url,
    };
  }
}
