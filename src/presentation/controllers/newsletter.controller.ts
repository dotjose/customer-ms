import { Controller, Post, Get, Body, Query, Res, HttpStatus } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SubscribeNewsletterCommand, UnsubscribeNewsletterCommand, UpdateNewsletterPreferencesCommand } from 'application/commands/newsletter/newsletter.commands';
import { GetSubscriberByTokenQuery } from 'application/queries/newsletter/newsletter.queries';
import { NewsletterTokenService, NewsletterTokenType } from 'infrastructure/services/newsletter-token.service';
import { SubscribeDto, UpdatePreferencesDto } from '../dtos/newsletter.dto';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly tokenService: NewsletterTokenService,
    private readonly configService: ConfigService,
  ) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  async subscribe(@Body() dto: SubscribeDto) {
    await this.commandBus.execute(new SubscribeNewsletterCommand(dto.email));
    return { message: 'Successfully subscribed to newsletter' };
  }

  @Get('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  async unsubscribe(@Query('token') token: string, @Res() res: Response) {
    try {
      const email = await this.tokenService.verifyToken(token, NewsletterTokenType.UNSUBSCRIBE);
      await this.commandBus.execute(new UnsubscribeNewsletterCommand(email));
      
      const redirectUrl = this.configService.get<string>('APP_BASE_URL') || 'https://habeshanetwork.com';
      return res.redirect(`${redirectUrl}?action=unsubscribed`);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid or expired token' });
    }
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get newsletter preferences' })
  async getPreferences(@Query('token') token: string) {
    const subscriber = await this.queryBus.execute(new GetSubscriberByTokenQuery(token));
    if (!subscriber) {
      return { message: 'Invalid token or subscriber not found' };
    }
    return subscriber.toObject();
  }

  @Post('preferences')
  @ApiOperation({ summary: 'Update newsletter preferences' })
  async updatePreferences(@Body() dto: UpdatePreferencesDto) {
    const email = await this.tokenService.verifyToken(dto.token, NewsletterTokenType.PREFERENCES);
    await this.commandBus.execute(new UpdateNewsletterPreferencesCommand(email, {
      products: dto.products,
      jobs: dto.jobs,
      professionals: dto.professionals,
      events: dto.events,
      realestate: dto.realestate,
    }));
    return { message: 'Preferences updated successfully' };
  }
}
