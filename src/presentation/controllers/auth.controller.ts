import { Controller, Post, Body, Get, Param, Put } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { RegisterUserCommand } from "application/commands/user/register-user.command";
import { LoginCommand } from "application/commands/auth/login.command";
import {
  RegisterUserDto,
  LoginDto,
  ResendCodeDto,
  VerifyCodeDto,
  ResetPasswordDto,
  ForgotPasswordDto,
  UserResponseDto,
  UpdatePasswordDto,
  UpdateUserDto,
} from "../dtos/auth.dto";
import { ResendVerificationCommand } from "application/commands/auth/resend-verification.command";
import { VerifyCodeCommand } from "application/commands/auth/verify-code.command";
import { ResetPasswordCommand } from "application/commands/auth/reset-password.command";
import { ForgotPasswordCommand } from "application/commands/auth/forgot.command";
import { GetUserQuery } from "application/queries/user/get-user.query";
import { UpdatePasswordCommand } from "application/commands/auth/update-password.command";
import { UpdateUserCommand } from "application/commands/user/update-user.command";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post("register")
  @ApiOperation({ summary: "Register new user" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  async register(@Body() dto: RegisterUserDto): Promise<UserResponseDto> {
    const command = new RegisterUserCommand(
      dto.email,
      dto.password,
      dto.firstName,
      dto.lastName,
      dto.phoneNumber
    );

    return this.commandBus.execute(command);
  }

  @Post("login")
  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, description: "Login successful" })
  async login(@Body() dto: LoginDto) {
    const command = new LoginCommand(dto.contact, dto.password);
    return this.commandBus.execute(command);
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Request password reset" })
  @ApiResponse({ status: 200, description: "Password reset email sent" })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.commandBus.execute(new ForgotPasswordCommand(dto.email));
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset password" })
  @ApiResponse({ status: 200, description: "Password successfully reset" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.commandBus.execute(
      new ResetPasswordCommand(dto.token, dto.newPassword)
    );
  }

  @Post("resend")
  @ApiOperation({ summary: "Resend sms verification code" })
  @ApiResponse({ status: 200, description: "Sent successfully" })
  async resendCode(@Body() dto: ResendCodeDto) {
    const command = new ResendVerificationCommand(dto.userId, "sms");
    return this.commandBus.execute(command);
  }

  @Post("verify")
  @ApiOperation({ summary: "Verify account" })
  @ApiResponse({ status: 200, description: "Account verified successfully" })
  async verifyAccount(@Body() dto: VerifyCodeDto) {
    const command = new VerifyCodeCommand(dto.userId, dto.code);
    return this.commandBus.execute(command);
  }

  @Put("update-password/:id")
  @ApiOperation({ summary: "Update password" })
  @ApiResponse({ status: 200, description: "New password setted successfully" })
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @Param("id") id: string
  ) {
    const command = new UpdatePasswordCommand(
      dto.currentPassword,
      dto.newPassword,
      id
    );
    return this.commandBus.execute(command);
  }

  @Put("/:id")
  @ApiOperation({ summary: "Update profile" })
  @ApiResponse({
    status: 200,
    description: "User profile updated successfully",
  })
  async updateProfile(@Body() dto: UpdateUserDto, @Param("id") id: string) {
    dto.userId = id;
    const command = new UpdateUserCommand(dto);
    return this.commandBus.execute(command);
  }

  @Get("me/:id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200 })
  async getCurrentUser(@Param("id") id: string) {
    return this.queryBus.execute(new GetUserQuery(id));
  }
}
