import { Injectable } from "@nestjs/common";

export interface NewsletterItem {
    id: string;
    title: string;
    category: string;
    location: string;
    price: string;
    image: string;
    link: string;
}

export interface NewsletterTemplateVars {
    logo_url: string;
    tagline: string;
    hero_title: string;
    hero_description: string;
    hero_link: string;

    products: NewsletterItem[];
    real_estate: NewsletterItem[];
    jobs: NewsletterItem[];
    professionals: NewsletterItem[];
    news: NewsletterItem[];

    facebook_url: string;
    instagram_url: string;
    tiktok_url: string;

    company_address: string;
    contact_email: string;
    contact_phone: string;

    preferences_url: string;
    unsubscribe_url: string;
    current_year: number;
}

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
          Habesha Circle Team
        </p>
      </body>
      </html>
    `;
    }

    contactUsEmailTemplate = ({
        name,
        email,
        subject,
        message,
    }: {
        name: string;
        email: string;
        subject: string;
        message: string;
    }) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f4f6f8;
      color: #333;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #fff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }
    .title {
      font-size: 20px;
      margin-bottom: 10px;
    }
    .section {
      margin-bottom: 16px;
    }
    .label {
      font-weight: 600;
      color: #1a1a1a;
    }
    .value {
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">📬 New Contact Us Submission</div>
    <div class="section">
      <div class="label">Name:</div>
      <div class="value">${name}</div>
    </div>
    <div class="section">
      <div class="label">Email:</div>
      <div class="value"><a href="mailto:${email}">${email}</a></div>
    </div>
    <div class="section">
      <div class="label">Subject:</div>
      <div class="value">${subject}</div>
    </div>
    <div class="section">
      <div class="label">Message:</div>
      <div class="value" style="white-space: pre-line">${message}</div>
    </div>
  </div>
</body>
</html>
`;

    getSMSTemplate(token: string): string {
        return `Your verification code is ${token}. It will expire in 5 minutes. Welcome to Our Platform!`;
    }

    getNewsLetterTemplate(
        preferences_url: string,
        unsubscribe_url: string,
        current_year: string,
    ): string {
        return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Welcome to Habesha Network!</title>
    <style type="text/css">
        body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        table {
            border-collapse: collapse;
        }

        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        /* Modern Button Styles */
        .feature-button {
            width: 100% !important;
            box-sizing: border-box !important;
        }

        .feature-button a {
            display: block !important;
            width: 100% !important;
            padding: 14px 20px !important;
            background-color: #0047AB !important;
            color: #ffffff !important;
            text-decoration: none !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            border-radius: 8px !important;
            text-align: center !important;
            border: none !important;
            transition: all 0.3s ease !important;
        }

        /* Hover effect for desktop */
        .feature-button a:hover {
            background-color: #0066CC !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(0, 71, 171, 0.25) !important;
        }

        a[style*="background: linear-gradient(135deg, #0047AB"]:hover {
            background: linear-gradient(135deg, #0066CC 0%, #0088FF 100%) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 12px rgba(0, 71, 171, 0.25) !important;
        }


        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
            }

            .mobile-padding {
                padding: 10px !important;
            }

            .mobile-font {
                font-size: 14px !important;
            }

            .mobile-hidden {
                display: none !important;
            }

            .stack {
                display: block !important;
                width: 100% !important;
            }

            .feature-grid td {
                display: block !important;
                width: 100% !important;
                padding: 0 0 20px 0 !important;
            }

            .feature-grid tr {
                display: block !important;
                width: 100% !important;
            }

            .feature-grid td[width="50%"] {
                width: 100% !important;
                padding: 0 0 20px 0 !important;
            }

            .feature-button {
                width: 100% !important;
                box-sizing: border-box !important;
            }

            .feature-button a {
                display: block !important;
                width: 100% !important;
                box-sizing: border-box !important;
                text-align: center !important;
            }

            .social-links img {
                width: 20px !important;
            }

            /* Feature grid adjustments */
            .feature-grid td[width="50%"] {
                width: 100% !important;
                padding: 0 0 20px 0 !important;
                display: block !important;
            }

            /* Feature card spacing */
            .feature-grid td[style*="padding:0 10px"] {
                padding: 0 !important;
                margin-bottom: 20px !important;
            }

            /* Feature card content */
            td[style*="padding:30px 20px 25px"] {
                padding: 25px 18px 20px !important;
            }

            /* Button sizing */
            a[style*="min-width: 160px"] {
                min-width: 140px !important;
                padding: 14px 20px !important;
                display: block !important;
                margin: 0 auto !important;
            }

            /* Icon container */
            div[style*="width: 60px; height: 60px"] {
                width: 50px !important;
                height: 50px !important;
                margin-bottom: 15px !important;
            }

            /* Icon size */
            div[style*="font-size: 28px"] {
                font-size: 22px !important;
            }
        }
    </style>
</head>

<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; background-color: #f4f4f4;" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding: 0;">
                <!-- Main Container -->
                <table role="presentation" class="container"
                    style="width: 600px; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                    cellpadding="0" cellspacing="0">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #0047AB; padding: 30px 20px; text-align: center;">
                            <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <img src="https://meeting-bota-assets.s3.us-east-1.amazonaws.com/logo_vectorized.svg"
                                            alt="Habesha Network"
                                            style="width: 80px; height: 80px; display: block; margin: 0 auto 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); border-radius: 50%; background: #fff; padding: 5px;">
                                        <h1
                                            style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                            Habesha Network</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Hero Section -->
                    <tr>
                        <td style="padding: 40px 20px; background-color: #f9f9f9; text-align: center;">
                            <h2 style="margin: 0 0 15px; color: #1a1a1a; font-size: 28px; font-weight: 700;">Welcome!
                            </h2>
                            <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">We're thrilled to
                                have you join our community. Get ready to discover amazing products, job opportunities,
                                connect with professionals, and stay updated with community events.</p>
                        </td>
                    </tr>

                    <!-- Getting Started Checklist -->
                    <tr>
                        <td class="mobile-padding" style="padding: 40px;">
                            <h2
                                style="margin: 0 0 30px; color: #1a1a1a; font-size: 24px; font-weight: 700; border-bottom: 3px solid #0047AB; padding-bottom: 10px; display: inline-block;">
                                Get Started in 3 Steps</h2>

                            <!-- Step 1 -->
                            <table role="presentation"
                                style="width: 100%; margin-bottom: 20px; background-color: #E8F0FF; border-radius: 8px; border-left: 4px solid #0047AB;"
                                cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 50px; vertical-align: top;">
                                                    <div
                                                        style="width: 40px; height: 40px; background-color: #0047AB; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 20px; font-weight: 700; line-height: 40px; text-align: center;">
                                                        1</div>
                                                </td>
                                                <td style="vertical-align: top; padding-left: 15px;">
                                                    <h3
                                                        style="margin: 0 0 8px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                                                        Complete Your Profile</h3>
                                                    <p
                                                        style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                                        Add a profile photo, bio, and interests so the community gets to
                                                        know you better.</p>
                                                    <table role="presentation" cellpadding="0" cellspacing="0"
                                                        style="margin-top: 15px;">
                                                        <tr>
                                                            <td style="border-radius: 5px; background-color: #0047AB;">
                                                                <a href="https://www.habeshanetwork.com/dashboard/user-settings"
                                                                    style="display: inline-block; padding: 10px 20px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 5px;">Complete
                                                                    Profile</a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Step 2 -->
                            <table role="presentation"
                                style="width: 100%; margin-bottom: 20px; background-color: #E8F0FF; border-radius: 8px; border-left: 4px solid #0047AB;"
                                cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 50px; vertical-align: top;">
                                                    <div
                                                        style="width: 40px; height: 40px; background-color: #0047AB; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 20px; font-weight: 700; line-height: 40px; text-align: center;">
                                                        2</div>
                                                </td>
                                                <td style="vertical-align: top; padding-left: 15px;">
                                                    <h3
                                                        style="margin: 0 0 8px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                                                        Set Your Preferences</h3>
                                                    <p
                                                        style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                                        Choose which updates you want to receive: jobs, products,
                                                        events, or community news.</p>
                                                    <table role="presentation" cellpadding="0" cellspacing="0"
                                                        style="margin-top: 15px;">
                                                        <tr>
                                                            <td style="border-radius: 5px; background-color: #0047AB;">
                                                                <a href="${preferences_url}"
                                                                    style="display: inline-block; padding: 10px 20px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 5px;">Set
                                                                    Preferences</a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Step 3 -->
                            <table role="presentation"
                                style="width: 100%; margin-bottom: 20px; background-color: #E8F0FF; border-radius: 8px; border-left: 4px solid #0047AB;"
                                cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 50px; vertical-align: top;">
                                                    <div
                                                        style="width: 40px; height: 40px; background-color: #0047AB; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 20px; font-weight: 700; line-height: 40px; text-align: center;">
                                                        3</div>
                                                </td>
                                                <td style="vertical-align: top; padding-left: 15px;">
                                                    <h3
                                                        style="margin: 0 0 8px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                                                        Start Exploring</h3>
                                                    <p
                                                        style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                                        Browse our marketplace, discover job opportunities, and connect
                                                        with professionals in your field.</p>
                                                    <table role="presentation" cellpadding="0" cellspacing="0"
                                                        style="margin-top: 15px;">
                                                        <tr>
                                                            <td style="border-radius: 5px; background-color: #0047AB;">
                                                                <a href="https://www.habeshanetwork.com"
                                                                    style="display: inline-block; padding: 10px 20px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 5px;">Start
                                                                    Exploring</a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Features Overview -->
                    <tr>
                        <td class="mobile-padding" style="padding: 0 40px 40px; background-color: #f9f9f9;">
                            <h2
                                style="margin: 0 0 30px; padding-top: 40px; color: #1a1a1a; font-size: 24px; font-weight: 700; border-bottom: 3px solid #0047AB; padding-bottom: 10px; display: inline-block;">
                                Explore What's Available</h2>

                            <table role="presentation" class="feature-grid" width="100%" cellpadding="0" cellspacing="0"
                                style="border-collapse: separate; border-spacing: 0 20px;">
                                <!-- Row 1 -->
                                <tr>
                                    <!-- Feature 1: Marketplace -->
                                    <td width="50%" style="padding:0 10px 0 0; vertical-align: top;" class="stack">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                            style="background:#ffffff; border-radius:10px; border:1px solid #e5e5e5; box-shadow:0 4px 12px rgba(0,0,0,0.08); height: 100%;">
                                            <tr>
                                                <td align="center" style="padding:30px 20px 25px;">
                                                    <div
                                                        style="width: 60px; height: 60px; background: linear-gradient(135deg, #E8F0FF 0%, #ffffff 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 1px solid rgba(0,71,171,0.1);">
                                                        <div style="font-size: 28px;">🛍️</div>
                                                    </div>
                                                    <h3
                                                        style="margin:0 0 12px; color:#1a1a1a; font-size:18px; font-weight:700;">
                                                        Marketplace</h3>
                                                    <p
                                                        style="margin:0 0 24px; color:#666666; font-size:14px; line-height:1.5; padding: 0 15px;">
                                                        Discover unique products from local sellers, from handcrafted
                                                        goods to everyday essentials.
                                                    </p>

                                                    <!-- Modern Button -->
                                                    <table role="presentation" width="100%" cellpadding="0"
                                                        cellspacing="0" style="margin:0 auto;">
                                                        <tr>
                                                            <td align="center">
                                                                <a href="https://www.habeshanetwork.com/shop"
                                                                    style="display: inline-block; min-width: 60px; padding:14px 28px; background: linear-gradient(135deg, #0047AB 0%, #0066CC 100%); color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; border-radius:8px; text-align:center; border:none; box-shadow: 0 4px 6px rgba(0,71,171,0.15); transition: all 0.3s ease;">
                                                                    Browse Marketplace
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>

                                    <!-- Feature 2: Jobs -->
                                    <td width="50%" style="padding:0 0 0 10px; vertical-align: top;" class="stack">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                            style="background:#ffffff; border-radius:10px; border:1px solid #e5e5e5; box-shadow:0 4px 12px rgba(0,0,0,0.08); height: 100%;">
                                            <tr>
                                                <td align="center" style="padding:30px 20px 25px;">
                                                    <div
                                                        style="width: 60px; height: 60px; background: linear-gradient(135deg, #E8F0FF 0%, #ffffff 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 1px solid rgba(0,71,171,0.1);">
                                                        <div style="font-size: 28px;">💼</div>
                                                    </div>
                                                    <h3
                                                        style="margin:0 0 12px; color:#1a1a1a; font-size:18px; font-weight:700;">
                                                        Job Board</h3>
                                                    <p
                                                        style="margin:0 0 24px; color:#666666; font-size:14px; line-height:1.5; padding: 0 15px;">
                                                        Find your next opportunity with job listings from local
                                                        companies and startups.
                                                    </p>

                                                    <!-- Modern Button -->
                                                    <table role="presentation" width="100%" cellpadding="0"
                                                        cellspacing="0" style="margin:0 auto;">
                                                        <tr>
                                                            <td align="center">
                                                                <a href="https://www.habeshanetwork.com/jobs"
                                                                    style="display: inline-block; min-width: 60px; padding:14px 28px; background: linear-gradient(135deg, #0047AB 0%, #0066CC 100%); color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; border-radius:8px; text-align:center; border:none; box-shadow: 0 4px 6px rgba(0,71,171,0.15); transition: all 0.3s ease;">
                                                                    Search Jobs
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Row 2 -->
                                <tr>
                                    <!-- Feature 3: Professionals -->
                                    <td width="50%" style="padding:0 10px 0 0; vertical-align: top;" class="stack">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                            style="background:#ffffff; border-radius:10px; border:1px solid #e5e5e5; box-shadow:0 4px 12px rgba(0,0,0,0.08); height: 100%;">
                                            <tr>
                                                <td align="center" style="padding:30px 20px 25px;">
                                                    <div
                                                        style="width: 60px; height: 60px; background: linear-gradient(135deg, #E8F0FF 0%, #ffffff 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 1px solid rgba(0,71,171,0.1);">
                                                        <div style="font-size: 28px;">👥</div>
                                                    </div>
                                                    <h3
                                                        style="margin:0 0 12px; color:#1a1a1a; font-size:18px; font-weight:700;">
                                                        Professionals</h3>
                                                    <p
                                                        style="margin:0 0 24px; color:#666666; font-size:14px; line-height:1.5; padding: 0 15px;">
                                                        Connect with skilled professionals and experts in your field for
                                                        collaboration and growth.
                                                    </p>

                                                    <!-- Modern Button -->
                                                    <table role="presentation" width="100%" cellpadding="0"
                                                        cellspacing="0" style="margin:0 auto;">
                                                        <tr>
                                                            <td align="center">
                                                                <a href="https://www.habeshanetwork.com/consultants"
                                                                    style="display: inline-block; min-width: 60px; padding:14px 28px; background: linear-gradient(135deg, #0047AB 0%, #0066CC 100%); color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; border-radius:8px; text-align:center; border:none; box-shadow: 0 4px 6px rgba(0,71,171,0.15); transition: all 0.3s ease;">
                                                                    Connect Now
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>

                                    <!-- Feature 4: Community -->
                                    <td width="50%" style="padding:0 0 0 10px; vertical-align: top;" class="stack">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                            style="background:#ffffff; border-radius:10px; border:1px solid #e5e5e5; box-shadow:0 4px 12px rgba(0,0,0,0.08); height: 100%;">
                                            <tr>
                                                <td align="center" style="padding:30px 20px 25px;">
                                                    <div
                                                        style="width: 60px; height: 60px; background: linear-gradient(135deg, #E8F0FF 0%, #ffffff 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 1px solid rgba(0,71,171,0.1);">
                                                        <div style="font-size: 28px;">🎉</div>
                                                    </div>
                                                    <h3
                                                        style="margin:0 0 12px; color:#1a1a1a; font-size:18px; font-weight:700;">
                                                        Events & News</h3>
                                                    <p
                                                        style="margin:0 0 24px; color:#666666; font-size:14px; line-height:1.5; padding: 0 15px;">
                                                        Stay updated with community events, workshops, and inspiring
                                                        stories from members.
                                                    </p>

                                                    <!-- Modern Button -->
                                                    <table role="presentation" width="100%" cellpadding="0"
                                                        cellspacing="0" style="margin:0 auto;">
                                                        <tr>
                                                            <td align="center">
                                                                <a href="https://www.habeshanetwork.com/stories"
                                                                    style="display: inline-block; min-width: 60px; padding:14px 28px; background: linear-gradient(135deg, #0047AB 0%, #0066CC 100%); color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; border-radius:8px; text-align:center; border:none; box-shadow: 0 4px 6px rgba(0,71,171,0.15); transition: all 0.3s ease;">
                                                                    View Events
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- FAQ / Quick Tips -->
                    <tr>
                        <td class="mobile-padding" style="padding: 40px;">
                            <h2
                                style="margin: 0 0 25px; color: #1a1a1a; font-size: 24px; font-weight: 700; border-bottom: 3px solid #0047AB; padding-bottom: 10px; display: inline-block;">
                                Quick Tips</h2>

                            <!-- Tip 1 -->
                            <table role="presentation" style="width: 100%; margin-bottom: 15px;" cellpadding="0"
                                cellspacing="0">
                                <tr>
                                    <td style="vertical-align: top; padding-right: 15px; font-size: 20px;">💡</td>
                                    <td style="vertical-align: top;">
                                        <h3 style="margin: 0 0 5px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                                            Personalize Your Feed</h3>
                                        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">Update
                                            your interests in preferences to see more relevant products, jobs, and
                                            professionals.</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Tip 2 -->
                            <table role="presentation" style="width: 100%; margin-bottom: 15px;" cellpadding="0"
                                cellspacing="0">
                                <tr>
                                    <td style="vertical-align: top; padding-right: 15px; font-size: 20px;">🔔</td>
                                    <td style="vertical-align: top;">
                                        <h3 style="margin: 0 0 5px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                                            Enable Notifications</h3>
                                        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">Turn on
                                            notifications to stay updated on new opportunities and messages from the
                                            community.</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Tip 3 -->
                            <table role="presentation" style="width: 100%; margin-bottom: 15px;" cellpadding="0"
                                cellspacing="0">
                                <tr>
                                    <td style="vertical-align: top; padding-right: 15px; font-size: 20px;">🤝</td>
                                    <td style="vertical-align: top;">
                                        <h3 style="margin: 0 0 5px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                                            Join the Community</h3>
                                        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">Attend
                                            events, share your story, and connect with like-minded individuals.
                                            Together, we're stronger.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA Section -->
                    <tr>
                        <td
                            style="padding: 40px; background: linear-gradient(135deg, #0047AB 0%, #0066CC 100%); text-align: center;">
                            <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 22px; font-weight: 700;">Ready to
                                Get Started?</h2>
                            <p style="margin: 0 0 25px; color: #E8F0FF; font-size: 16px; line-height: 1.6;">Log in to
                                your account and begin your Habesha Network journey today.</p>
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #ffffff;">
                                        <a href="https://www.habeshanetwork.com/auth/login"
                                            style="display: inline-block; padding: 14px 40px; color: #0047AB; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">Log
                                            In to Account</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Support Section -->
                    <tr>
                        <td class="mobile-padding"
                            style="padding: 40px; background-color: #f9f9f9; text-align: center;">
                            <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 18px; font-weight: 600;">Need Help?
                            </h3>
                            <p style="margin: 0 0 15px; color: #666666; font-size: 14px; line-height: 1.6;">Check out
                                our help center or reach out to our support team. We're here to help!</p>
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="padding: 0 10px;">
                                        <a href="https://www.habeshanetwork.com/about"
                                            style="color: #0047AB; text-decoration: underline; font-size: 14px; font-weight: 600;">Help
                                            Center</a>
                                    </td>
                                    <td style="padding: 0 10px; color: #cccccc;">•</td>
                                    <td style="padding: 0 10px;">
                                        <a href="mailto:support@habeshanetwork.com"
                                            style="color: #0047AB; text-decoration: underline; font-size: 14px; font-weight: 600;">Contact
                                            Support</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 40px; background-color: #1a1a1a; text-align: center;">
                            <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <!-- Social Links -->
                                        <table role="presentation" style="margin: 0 auto 35px;" cellpadding="0"
                                            cellspacing="0" class="social-links">
                                            <tr>
                                                <td style="padding: 0 12px;">
                                                    <a href="https://www.facebook.com/HabeshaNetwork"
                                                        style="text-decoration: none;">
                                                        <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png"
                                                            alt="Facebook" style="width: 24px; filter: invert(1);">
                                                    </a>
                                                </td>
                                                <td style="padding: 0 12px;">
                                                    <a href="https://www.instagram.com/yehabeshanetwork"
                                                        style="text-decoration: none;">
                                                        <img src="https://cdn-icons-png.flaticon.com/512/733/733558.png"
                                                            alt="Instagram" style="width: 24px; filter: invert(1);">
                                                    </a>
                                                </td>
                                                <td style="padding: 0 12px;">
                                                    <a href="https://www.tiktok.com/@habeshanetwork"
                                                        style="text-decoration: none;">
                                                        <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png"
                                                            alt="TikTok" style="width: 24px; filter: invert(1);">
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Contact Info -->
                                        <p style="margin: 0 0 15px; color: #cccccc; font-size: 14px; line-height: 1.6;">
                                            <strong style="color: #ffffff;">Habesha Network</strong><br>Lavon, TX 75166,
                                            USA<br>
                                            Email: <a href="mailto:support@habeshanetwork.com"
                                                style="color: #0047AB; text-decoration: none;">support@habeshanetwork.com</a><br>
                                            Phone: +1 (855) 553-7873
                                        </p>

                                        <!-- Footer Links -->
                                        <table role="presentation" style="margin: 20px auto 0;" cellpadding="0"
                                            cellspacing="0">
                                            <tr>
                                                <td style="padding: 0 10px;">
                                                    <a href="https://www.habeshanetwork.com/legal/terms"
                                                        style="color: #0047AB; text-decoration: underline; font-size: 13px;">Terms</a>
                                                </td>
                                                <td style="padding: 0 10px; color: #666666;">|</td>
                                                <td style="padding: 0 10px;">
                                                    <a href="https://www.habeshanetwork.com/legal/privacy"
                                                        style="color: #0047AB; text-decoration: underline; font-size: 13px;">Privacy</a>
                                                </td>
                                                <td style="padding: 0 10px; color: #666666;">|</td>
                                                <td style="padding: 0 10px;">
                                                    <a href="${unsubscribe_url}"
                                                        style="color: #0047AB; text-decoration: underline; font-size: 13px;">Unsubscribe</a>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="margin: 15px 0 0; color: #666666; font-size: 12px;">
                                            © ${current_year} Habesha Network. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <!-- End Main Container -->
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    renderNewsletterContent(vars: Partial<NewsletterTemplateVars>): string {
        const {
            products = [],
            real_estate = [],
            jobs = [],
            professionals = [],
            news = [],
        } = vars;

        const renderItem = (
            item: NewsletterItem,
            showPrice = true,
            ctaText = "View Details",
        ) => {
            const isPlaceholder =
                item.image.includes("default") || !item.image.startsWith("http");
            const initials = item.title
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

            return `
        <table role="presentation" style="width: 100%; margin-bottom: 25px; background-color: #ffffff; border: 1px solid #eef2f6; border-radius: 12px; overflow: hidden; transition: all 0.3s ease;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 140px; vertical-align: top;" class="stack">
              ${isPlaceholder
                    ? `
                <div style="width: 140px; height: 140px; background: linear-gradient(135deg, #0047AB 0%, #002e6e 100%); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 32px; font-weight: 700; font-family: sans-serif;">
                  ${initials}
                </div>
              `
                    : `
                <img src="${item.image}" alt="${item.title}" style="width: 140px; height: 140px; display: block; object-fit: cover;">
              `
                }
            </td>
            <td style="padding: 20px; vertical-align: top;" class="stack">
              <span style="display: inline-block; padding: 4px 10px; background-color: #f0f7ff; color: #0047AB; font-size: 11px; font-weight: 700; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${item.category}</span>
              <h3 style="margin: 0 0 8px; color: #1e293b; font-size: 18px; font-weight: 700; line-height: 1.3;">${item.title}</h3>
              <p style="margin: 0 0 12px; color: #64748b; font-size: 14px; line-height: 1.5;">📍 ${item.location}</p>
              ${showPrice && item.price ? `<p style="margin: 0 0 15px; color: #0047AB; font-size: 20px; font-weight: 800;">${item.price}</p>` : ""}
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius: 8px; background-color: #0047AB; box-shadow: 0 4px 6px rgba(0, 71, 171, 0.2);">
                    <a href="${item.link}" style="display: inline-block; padding: 10px 24px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">${ctaText}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
        };

        const renderGridItem = (item: NewsletterItem, ctaText = "View Profile") => {
            const isPlaceholder =
                item.image.includes("default") || !item.image.startsWith("http");
            const initials = item.title
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

            return `
        <td style="width: 50%; padding: 0 10px 20px 0; vertical-align: top;" class="stack">
          <table role="presentation" style="width: 100%; height: 100%; background-color: #ffffff; border: 1px solid #eef2f6; border-radius: 12px; transition: all 0.3s ease;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align: center; padding: 25px;">
                ${isPlaceholder
                    ? `
                  <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #0047AB 0%, #002e6e 100%); display: block; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 24px; font-weight: 700;">
                    ${initials}
                  </div>
                `
                    : `
                  <img src="${item.image}" alt="${item.title}" style="width: 80px; height: 80px; border-radius: 50%; display: block; margin: 0 auto 15px; object-fit: cover; border: 3px solid #f0f7ff;">
                `
                }
                <h3 style="margin: 0 0 5px; color: #1e293b; font-size: 16px; font-weight: 700;">${item.title}</h3>
                <p style="margin: 0 0 8px; color: #0047AB; font-size: 13px; font-weight: 600;">${item.category}</p>
                <p style="margin: 0 0 15px; color: #64748b; font-size: 12px; line-height: 1.5;">📍 ${item.location}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="border-radius: 6px; border: 2px solid #0047AB;">
                      <a href="${item.link}" style="display: inline-block; padding: 6px 16px; color: #0047AB; text-decoration: none; font-size: 13px; font-weight: 700;">${ctaText}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      `;
        };

        return `
      <!-- Top Deals & Products -->
      ${products.length > 0
                ? `
          <tr>
              <td class="mobile-padding" style="padding: 40px 40px 20px;">
                  <h2 style="margin: 0 0 25px; color: #1e293b; font-size: 24px; font-weight: 800;">🔥 Trending Deals</h2>
                  ${products.map((item) => renderItem(item, true, "Buy Now")).join("")}
              </td>
          </tr>
      `
                : ""
            }

      <!-- Real Estate -->
      ${real_estate.length > 0
                ? `
          <tr>
              <td class="mobile-padding" style="padding: 20px 40px; background-color: #f8fafc;">
                  <h2 style="margin: 0 0 25px; color: #1e293b; font-size: 24px; font-weight: 800;">🏠 Featured Properties</h2>
                  ${real_estate.map((item) => renderItem(item, true, "View Property")).join("")}
              </td>
          </tr>
      `
                : ""
            }

      <!-- Jobs -->
      ${jobs.length > 0
                ? `
          <tr>
              <td class="mobile-padding" style="padding: 40px 40px 20px;">
                  <h2 style="margin: 0 0 25px; color: #1e293b; font-size: 24px; font-weight: 800;">💼 Career Opportunities</h2>
                  ${jobs.map((item) => renderItem(item, true, "Apply Now")).join("")}
              </td>
          </tr>
      `
                : ""
            }

      <!-- Professionals -->
      ${professionals.length > 0
                ? `
          <tr>
              <td class="mobile-padding" style="padding: 20px 40px; background-color: #f8fafc;">
                  <h2 style="margin: 0 0 25px; color: #1e293b; font-size: 24px; font-weight: 800;">⭐ Featured Professionals</h2>
                  <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
                      <tr>
                          ${professionals
                    .slice(0, 2)
                    .map((item) => renderGridItem(item))
                    .join("")}
                      </tr>
                      ${professionals.length > 2
                    ? `
                          <tr>
                              ${professionals
                        .slice(2, 4)
                        .map((item) => renderGridItem(item))
                        .join("")}
                          </tr>
                      `
                    : ""
                }
                  </table>
              </td>
          </tr>
      `
                : ""
            }

      <!-- Community News -->
      ${news.length > 0
                ? `
          <tr>
              <td class="mobile-padding" style="padding: 40px 40px 20px;">
                  <h2 style="margin: 0 0 25px; color: #1e293b; font-size: 24px; font-weight: 800;">📰 Community Highlights</h2>
                  ${news.map((item) => renderItem(item, false, "Read Story")).join("")}
              </td>
          </tr>
      `
                : ""
            }
    `;
    }

    renderNewsletterEmail(vars: NewsletterTemplateVars): string {
        const content = this.renderNewsletterContent(vars);
        return this.renderNewsletterWrapper(content, vars);
    }

    renderNewsletterWrapper(
        content: string,
        vars: Pick<
            NewsletterTemplateVars,
            | "logo_url"
            | "tagline"
            | "hero_title"
            | "hero_description"
            | "hero_link"
            | "facebook_url"
            | "instagram_url"
            | "tiktok_url"
            | "company_address"
            | "contact_email"
            | "contact_phone"
            | "preferences_url"
            | "unsubscribe_url"
            | "current_year"
        >,
    ): string {
        const {
            logo_url,
            tagline,
            hero_title,
            hero_description,
            hero_link,
            facebook_url,
            instagram_url,
            tiktok_url,
            company_address,
            contact_email,
            contact_phone,
            preferences_url,
            unsubscribe_url,
            current_year,
        } = vars;

        return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>Habesha Network Newsletter</title>
    <!--[if mso]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <style type="text/css">
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .mobile-padding { padding: 20px !important; }
            .stack { display: block !important; width: 100% !important; padding-right: 0 !important; padding-left: 0 !important; }
            .mobile-center { text-align: center !important; }
            .hero-title { font-size: 28px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
    <table role="presentation" style="width: 100%; background-color: #f8fafc;" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding: 0px 0;">
                <!-- Main Container -->
                <table role="presentation" class="container" style="width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);" cellpadding="0" cellspacing="0">
                    <!-- Hero Section (CSS-based) -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0047AB 0%, #002e6e 100%); padding: 0 20px 40px; text-align: center;">
                            <img src="${logo_url}" alt="Habesha Network" style="width: 80px; height: 80px; display: block; margin: 0 auto 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); border-radius: 50%; background: #fff; padding: 5px;">
                            <h1 style="margin: 0 0 10px; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); line-height: 1.2;">Habesha Network</h1>
                            <p style="margin: 0 0 30px; color: #e0f2fe; font-size: 18px; font-weight: 500;">${tagline}</p>
                            
                            <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 30px; border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px);">
                                <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 28px; font-weight: 700;">${hero_title}</h2>
                                <p style="margin: 0 0 25px; color: #f0f9ff; font-size: 16px; line-height: 1.6;">${hero_description}</p>
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                    <tr>
                                        <td style="border-radius: 8px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                            <a href="${hero_link}" style="display: inline-block; padding: 14px 32px; color: #0047AB; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 8px;">Explore Now</a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    ${content}

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 60px 40px; background-color: #0f172a; text-align: center;">
                            <!-- Socials -->
                            <table role="presentation" style="margin: 0 auto 35px;" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 0 12px;"><a href="${facebook_url}" style="text-decoration: none;"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" style="width: 24px; filter: invert(1);"></a></td>
                                    <td style="padding: 0 12px;"><a href="${instagram_url}" style="text-decoration: none;"><img src="https://cdn-icons-png.flaticon.com/512/733/733558.png" style="width: 24px; filter: invert(1);"></a></td>
                                    <td style="padding: 0 12px;"><a href="${tiktok_url}" style="text-decoration: none;"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" style="width: 24px; filter: invert(1);"></a></td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 10px; color: #f8fafc; font-size: 16px; font-weight: 700;">Habesha Network</p>
                            <p style="margin: 0 0 20px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                                ${company_address}<br>
                                Support: <a href="mailto:${contact_email}" style="color: #38bdf8; text-decoration: none;">${contact_email}</a><br>
                                Phone: ${contact_phone}
                            </p>

                            <table role="presentation" style="margin: 0 auto 30px;" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 0 15px;"><a href="${preferences_url}" style="color: #38bdf8; text-decoration: underline; font-size: 13px; font-weight: 500;">Manage Preferences</a></td>
                                    <td style="color: #475569;">|</td>
                                    <td style="padding: 0 15px;"><a href="${unsubscribe_url}" style="color: #38bdf8; text-decoration: underline; font-size: 13px; font-weight: 500;">Unsubscribe</a></td>
                                </tr>
                            </table>

                            <p style="margin: 0; color: #475569; font-size: 12px;">© ${current_year} Habesha Network. All rights reserved by Habesha Network Team.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    getAccountRestrictionTemplate(
        user_name: string,
        current_year: string,
    ): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Account Access Restricted</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    table {
      border-collapse: collapse;
    }
    .container {
      width: 600px;
      background: #ffffff;
      margin: 0 auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    @media (max-width: 600px) {
      .container {
        width: 100% !important;
      }
    }
  </style>
</head>

<body>
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center">

      <table class="container" cellpadding="0" cellspacing="0">

         <!-- Header -->
                    <tr>
                        <td style="background-color: #0047AB; padding: 30px 20px; text-align: center;">
                            <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <img src="https://meeting-bota-assets.s3.us-east-1.amazonaws.com/logo_vectorized.svg"
                                            alt="Habesha Network"
                                            style="width: 80px; height: 80px; display: block; margin: 0 auto 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); border-radius: 50%; background: #fff; padding: 5px;">
                                        <h1
                                            style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                            Habesha Network</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

        <!-- Main -->
        <tr>
          <td style="padding:40px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#444;">
              Hello ${user_name},
            </p>

            <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">
              We identified activity associated with your Habesha Network account that violates our Community Standards.
              As a result, your account has been restricted and is no longer accessible.
            </p>

            <p style="margin:0;font-size:15px;color:#B91C1C;font-weight:600;">
              This action is effective immediately.
            </p>

            <!-- What this may include -->
            <h3 style="margin:32px 0 12px;font-size:18px;color:#111;">
              What this may include
            </h3>

            <p style="margin:0 0 14px;font-size:14px;color:#555;line-height:1.6;">
              Account restrictions may occur due to content or behavior that violates our standards, including but not limited to:
            </p>

            <ul style="margin:0;padding-left:18px;font-size:14px;color:#555;line-height:1.7;">
              <li>Harassment, hate speech, or abusive behavior</li>
              <li>Sexually explicit, suggestive, or inappropriate content</li>
              <li>Content that exploits, threatens, or harms individuals or groups</li>
              <li>Listings, products, or services that violate marketplace policies</li>
              <li>Repeated or severe violations of platform rules</li>
            </ul>

            <!-- Impact -->
            <h3 style="margin:32px 0 12px;font-size:18px;color:#111;">
              What this means
            </h3>

            <ul style="margin:0;padding-left:18px;font-size:14px;color:#555;line-height:1.7;">
              <li>You cannot sign in to your account</li>
              <li>Your content and listings are no longer visible</li>
              <li>You cannot message or interact on the platform</li>
              <li>Creating new accounts to bypass this action is not permitted</li>
            </ul>

            <!-- Appeal -->
            <h3 style="margin:32px 0 12px;font-size:18px;color:#111;">
              Appeal this decision
            </h3>

            <p style="margin:0 0 18px;font-size:14px;color:#555;line-height:1.6;">
              If you believe this action was taken in error, you may submit an appeal. Our Trust & Safety team will review your request and respond after evaluation.
            </p>

            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#0047AB;border-radius:6px;">
                  <a href="https://www.habeshanetwork.com/about"
                     style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
                    Submit an Appeal
                  </a>
                </td>
              </tr>
            </table>

            <!-- Support -->
            <p style="margin:28px 0 0;font-size:14px;color:#555;line-height:1.6;">
              For more information, please review our policies or contact our support team.
            </p>

            <p style="margin:8px 0 0;font-size:14px;">
              <a href="https://www.habeshanetwork.com/about" style="color:#0047AB;text-decoration:underline;font-weight:600;">
                Contact Support
              </a>
            </p>
          </td>
        </tr>

       <!-- Footer -->
                    <tr>
                        <td style="padding: 40px; background-color: #1a1a1a; text-align: center;">
                            <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <!-- Social Links -->
                                        <table role="presentation" style="margin: 0 auto 35px;" cellpadding="0"
                                            cellspacing="0" class="social-links">
                                            <tr>
                                                <td style="padding: 0 12px;">
                                                    <a href="https://www.facebook.com/HabeshaNetwork"
                                                        style="text-decoration: none;">
                                                        <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png"
                                                            alt="Facebook" style="width: 24px; filter: invert(1);">
                                                    </a>
                                                </td>
                                                <td style="padding: 0 12px;">
                                                    <a href="https://www.instagram.com/yehabeshanetwork"
                                                        style="text-decoration: none;">
                                                        <img src="https://cdn-icons-png.flaticon.com/512/733/733558.png"
                                                            alt="Instagram" style="width: 24px; filter: invert(1);">
                                                    </a>
                                                </td>
                                                <td style="padding: 0 12px;">
                                                    <a href="https://www.tiktok.com/@habeshanetwork"
                                                        style="text-decoration: none;">
                                                        <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png"
                                                            alt="TikTok" style="width: 24px; filter: invert(1);">
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Contact Info -->
                                        <p style="margin: 0 0 15px; color: #cccccc; font-size: 14px; line-height: 1.6;">
                                            <strong style="color: #ffffff;">Habesha Network</strong><br>Lavon, TX 75166,
                                            USA<br>
                                            Email: <a href="mailto:support@habeshanetwork.com"
                                                style="color: #0047AB; text-decoration: none;">support@habeshanetwork.com</a><br>
                                            Phone: +1 (855) 553-7873
                                        </p>

                                        <!-- Footer Links -->
                                        <table role="presentation" style="margin: 20px auto 0;" cellpadding="0"
                                            cellspacing="0">
                                            <tr>
                                                <td style="padding: 0 10px;">
                                                    <a href="https://www.habeshanetwork.com/legal/terms"
                                                        style="color: #0047AB; text-decoration: underline; font-size: 13px;">Terms</a>
                                                </td>
                                                <td style="padding: 0 10px; color: #666666;">|</td>
                                                <td style="padding: 0 10px;">
                                                    <a href="https://www.habeshanetwork.com/legal/privacy"
                                                        style="color: #0047AB; text-decoration: underline; font-size: 13px;">Privacy</a>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="margin: 15px 0 0; color: #666666; font-size: 12px;">
                                            © ${current_year} Habesha Network. All rights reserved.
                                        </p>
                                    </td>
                                </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
    }
}
