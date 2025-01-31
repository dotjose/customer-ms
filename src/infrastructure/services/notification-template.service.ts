import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationTemplateService {
  getEmailTemplate(name: string, token: string): string {
    return `
      <html>
      <head>
        <style>
          .email-header {
            font-size: 24px;
            font-weight: bold;
            color: #2d89ef;
          }
          .email-body {
            font-size: 16px;
            color: #444;
          }
          .token {
            font-size: 20px;
            font-weight: bold;
            color: #f44336;
          }
          .cta {
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="email-header">Welcome to Our Platform!</div>
        <p class="email-body">
          Hello ${name},<br/><br/>
          We're thrilled to have you on board! To get started, please verify your account using the code below:
        </p>
        <div class="token">${token}</div>
        <p class="email-body">
          This code is valid for the next 5 minutes. If you didn't sign up, please ignore this message.
        </p>
        <div class="cta">
          <a href="${process.env.APP_BASE_URL}/verify?token=${token}" 
             style="background-color: #2d89ef; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Now
          </a>
        </div>
        <p class="email-body">
          Thanks for joining us!<br/>
          MeetingPlace Team
        </p>
      </body>
      </html>
    `;
  }

  getSMSTemplate(token: string): string {
    return `Your verification code is ${token}. It will expire in 5 minutes. Welcome to Our Platform!`;
  }
}
