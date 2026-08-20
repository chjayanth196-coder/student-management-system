import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Ensures the user belongs to the institution specified in the route params.
 * SuperAdmin can access any institution.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const institutionId = request.params.institutionId;

    // SuperAdmin can access any institution
    if (user.role === 'SuperAdmin') {
      return true;
    }

    // User must belong to the requested institution
    if (institutionId && user.institutionId !== institutionId) {
      throw new ForbiddenException('You do not have access to this institution');
    }

    return true;
  }
}

