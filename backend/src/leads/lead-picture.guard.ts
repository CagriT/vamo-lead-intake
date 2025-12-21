import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { LeadPictureTokenService } from './lead-picture-token.service';
import { LEAD_PICTURE_SCOPE } from './lead-picture.constants';

type AuthedRequest = Request & { leadPicture?: { leadId: string } };

@Injectable()
export class LeadPictureGuard implements CanActivate {
  constructor(private readonly tokenService: LeadPictureTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length).trim();

    try {
      const payload = this.tokenService.verify({ token });

      if (payload.scope !== LEAD_PICTURE_SCOPE) {
        throw new UnauthorizedException('Invalid token scope');
      }

      const leadIdFromUrl = req.params.id;
      if (payload.leadId !== leadIdFromUrl) {
        throw new UnauthorizedException('Token does not match lead');
      }

      req.leadPicture = { leadId: payload.leadId };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
