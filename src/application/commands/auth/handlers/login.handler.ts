import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { LoginCommand } from "../login.command";
import { HashService } from "infrastructure/services/hash.service";
import { JwtService } from "infrastructure/services/jwt.service";
import { UnauthorizedException, Logger, Inject } from "@nestjs/common";
import { UserRepository } from "domain/user/user.repository";

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  private readonly logger = new Logger(LoginHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService
  ) {}

  async execute(command: LoginCommand): Promise<{ token: string; user: any }> {
    const { email, password } = command;

    this.logger.log(`Attempting login for email: ${email}`);

    // Fetch user by email
    const user = await this.userRepository.findByEmailOrPhone(email);

    if (!user) {
      this.logger.warn(
        `Login failed: User with email or phone ${email} not found`
      );
      throw new UnauthorizedException("Invalid credentials");
    }

    // Validate password
    const isPasswordValid = await this.hashService.compare(
      password,
      user.password
    );
    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password for email ${email}`);
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isVerified) {
      throw new UnauthorizedException("Please verify your account first");
    }

    // Generate JWT token
    const token = await this.jwtService.generateToken(user);
    this.logger.log(`Login successful for email: ${email}`);

    // Return token and user details
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phone: user.phoneNumber,
        avatar: user.avatar,
      },
    };
  }
}
