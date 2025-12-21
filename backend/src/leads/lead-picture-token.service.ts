import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LEAD_PICTURE_SCOPE, LeadPictureScope } from './lead-picture.constants';

export type LeadPictureTokenPayload = {
  leadId: string;
  scope: LeadPictureScope;
};

export interface SignForLeadParams {
  leadId: string;
}

export interface VerifyTokenParams {
  token: string;
}

@Injectable()
export class LeadPictureTokenService {
  constructor(private readonly jwtService: JwtService) {}

  // Signs a short-lived token scoped to a single lead
  signForLead(params: SignForLeadParams): string {
    const { leadId } = params;

    return this.jwtService.sign({
      leadId,
      scope: LEAD_PICTURE_SCOPE,
    });
  }

  // Verifies token integrity + expiration and returns payload
  verify(params: VerifyTokenParams): LeadPictureTokenPayload {
    const { token } = params;
    return this.jwtService.verify<LeadPictureTokenPayload>(token);
  }
}
