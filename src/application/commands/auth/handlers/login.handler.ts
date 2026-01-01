import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { LoginCommand } from "../login.command";
import { JwtService } from "infrastructure/services/jwt.service";
import { UnauthorizedException, Logger, Inject } from "@nestjs/common";
import { UserRepository } from "domain/user/user.repository";
import { UserSecurityService } from "domain/user/services/user-security.service";

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  private readonly logger = new Logger(LoginHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly userSecurityService: UserSecurityService
  ) {}

  async execute(command: LoginCommand): Promise<{ token: string; user: any }> {
    const { email, password } = command;
    const normalizedEmail = email.trim().toLowerCase();
    
    // Log intent without sensitive details
    this.logger.log(`Processing login attempt for email: ${this.maskEmail(normalizedEmail)}`);

    // 1. Fetch user by email
    const user = await this.userRepository.findByEmailOrPhone(normalizedEmail);

    // 2. Anti-Enumeration: If user not found, throw generic error immediately
    // Ideally, we might want to fake a hash verification time here to prevent timing attacks,
    // but for this scope, a consistent generic error is the priority.
    if (!user) {
      this.logger.warn(`Login failed: Account not found for ${this.maskEmail(normalizedEmail)}`);
      throw new UnauthorizedException(
        "We couldn't sign you in with the provided details. Please try again."
      );
    }

    // 3. Delegate Validation (Password + Status + Verification) to Domain Service
    try {
      await this.userSecurityService.validateLogin(user, password);
    } catch (error) {
      // Log the specific reason internally but ensure the user sees the friendly message from the service
      this.logger.warn(`Login validation failed for ${this.maskEmail(normalizedEmail)}: ${error.message}`);
      throw error;
    }

    // 4. Generate JWT token
    const token = await this.jwtService.generateToken(user);
    this.logger.log(`Login successful for user: ${user.id}`);

    // 5. Return minimal DTO
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        roles: user.roles[0], // Assuming single role primary usage for now, or maintain existing array if FE expects it. Existing code had user.roles[0]
      },
    };
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***';
    return `${local.slice(0, 3)}***@${domain}`;
  }
}
