import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const getJwtConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('JWT_SECRET'),
  signOptions: {
    expiresIn: '1d',
    algorithm: 'HS256',
    issuer: 'user-management-service',
  },
  verifyOptions: {
    algorithms: ['HS256'],
    issuer: 'user-management-service',
  },
});