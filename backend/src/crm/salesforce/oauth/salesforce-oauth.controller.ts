import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SalesforceOAuthService } from './salesforce-oauth.service';

@Controller('oauth/salesforce')
export class SalesforceOAuthController {
  constructor(private readonly oauthService: SalesforceOAuthService) {}

  @Get('login')
  login(@Res() res: Response) {
    const url = this.oauthService.getAuthorizationUrl();
    return res.redirect(url);
  }

  @Get('callback')
  async callback(@Query('code') code: string) {
    return this.oauthService.exchangeCodeForToken(code);
  }
}
