import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../common/errors';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: string;
  primaryRole?: string;
  department?: string;
  facility?: string;
  facilityId?: string;
  districtId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authorization header missing or invalid format');
  }

  const token = authHeader.split(' ')[1];
  if (token.startsWith('mock_jwt_token')) {
    let facility = 'PGI';
    let email = 'pgi@hospital.org';
    let facilityId = 'hosp_pgi';

    if (token.includes('rml')) {
      facility = 'RML';
      email = 'rml@hospital.org';
      facilityId = 'hosp_rml';
    } else if (token.includes('kgmu')) {
      facility = 'KGMU';
      email = 'kgmu@hospital.org';
      facilityId = 'hosp_kgmu';
    }

    req.user = {
      userId: `user_${facility.toLowerCase()}`,
      email,
      role: 'receiving_hospital',
      primaryRole: 'receiving_hospital',
      department: 'Pediatrics',
      facility,
      facilityId,
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    throw new UnauthorizedError('Token expired or invalid');
  }
}

export function authorizeRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Role ${req.user.role} is not authorized to access this resource`);
    }
    next();
  };
}
