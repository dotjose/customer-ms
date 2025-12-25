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



  renderNewsletterContent(vars: Partial<NewsletterTemplateVars>): string {
    const {
      products = [],
      real_estate = [],
      jobs = [],
      professionals = [],
      news = [],
    } = vars;

    const renderItem = (item: NewsletterItem, showPrice = true, ctaText = 'View Details') => {
      const isPlaceholder = item.image.includes('default') || !item.image.startsWith('http');
      const initials = item.title.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      
      return `
        <table role="presentation" style="width: 100%; margin-bottom: 25px; background-color: #ffffff; border: 1px solid #eef2f6; border-radius: 12px; overflow: hidden; transition: all 0.3s ease;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 140px; vertical-align: top;" class="stack">
              ${isPlaceholder ? `
                <div style="width: 140px; height: 140px; background: linear-gradient(135deg, #0047AB 0%, #002e6e 100%); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 32px; font-weight: 700; font-family: sans-serif;">
                  ${initials}
                </div>
              ` : `
                <img src="${item.image}" alt="${item.title}" style="width: 140px; height: 140px; display: block; object-fit: cover;">
              `}
            </td>
            <td style="padding: 20px; vertical-align: top;" class="stack">
              <span style="display: inline-block; padding: 4px 10px; background-color: #f0f7ff; color: #0047AB; font-size: 11px; font-weight: 700; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${item.category}</span>
              <h3 style="margin: 0 0 8px; color: #1e293b; font-size: 18px; font-weight: 700; line-height: 1.3;">${item.title}</h3>
              <p style="margin: 0 0 12px; color: #64748b; font-size: 14px; line-height: 1.5;">📍 ${item.location}</p>
              ${showPrice && item.price ? `<p style="margin: 0 0 15px; color: #0047AB; font-size: 20px; font-weight: 800;">${item.price}</p>` : ''}
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

    const renderGridItem = (item: NewsletterItem, ctaText = 'View Profile') => {
      const isPlaceholder = item.image.includes('default') || !item.image.startsWith('http');
      const initials = item.title.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      return `
        <td style="width: 50%; padding: 0 10px 20px 0; vertical-align: top;" class="stack">
          <table role="presentation" style="width: 100%; height: 100%; background-color: #ffffff; border: 1px solid #eef2f6; border-radius: 12px; transition: all 0.3s ease;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align: center; padding: 25px;">
                ${isPlaceholder ? `
                  <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #0047AB 0%, #002e6e 100%); display: block; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 24px; font-weight: 700;">
                    ${initials}
                  </div>
                ` : `
                  <img src="${item.image}" alt="${item.title}" style="width: 80px; height: 80px; border-radius: 50%; display: block; margin: 0 auto 15px; object-fit: cover; border: 3px solid #f0f7ff;">
                `}
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
      ${products.length > 0 ? `
          <tr>
              <td class="mobile-padding" style="padding: 40px 40px 20px;">
                  <h2 style="margin: 0 0 25px; color: #1e293b; font-size: 24px; font-weight: 800;">🔥 Trending Deals</h2>
                  ${products.map(item => renderItem(item, true, 'Buy Now')).join('')}
              </td>
          </tr>
      ` : ''}

      <!-- Real Estate -->
      ${real_estate.length > 0 ? `
          <tr>
              <td class="mobile-padding" style="padding: 20px 40px; background-color: #f8fafc;">
                  <h2 style="margin: 0 0 25px; color: #1e293b; font-size: 24px; font-weight: 800;">🏠 Featured Properties</h2>
                  ${real_estate.map(item => renderItem(item, true, 'View Property')).join('')}
              </td>
          </tr>
      ` : ''}

      <!-- Jobs -->
      ${jobs.length > 0 ? `
          <tr>
              <td class="mobile-padding" style="padding: 40px 40px 20px;">
                  <h2 style="margin: 0 0 25px; color: #1e293b; font-size: 24px; font-weight: 800;">💼 Career Opportunities</h2>
                  ${jobs.map(item => renderItem(item, true, 'Apply Now')).join('')}
              </td>
          </tr>
      ` : ''}

      <!-- Professionals -->
      ${professionals.length > 0 ? `
          <tr>
              <td class="mobile-padding" style="padding: 20px 40px; background-color: #f8fafc;">
                  <h2 style="margin: 0 0 25px; color: #1e293b; font-size: 24px; font-weight: 800;">⭐ Featured Professionals</h2>
                  <table role="presentation" style="width: 100%;" cellpadding="0" cellspacing="0">
                      <tr>
                          ${professionals.slice(0, 2).map(item => renderGridItem(item)).join('')}
                      </tr>
                      ${professionals.length > 2 ? `
                          <tr>
                              ${professionals.slice(2, 4).map(item => renderGridItem(item)).join('')}
                          </tr>
                      ` : ''}
                  </table>
              </td>
          </tr>
      ` : ''}

      <!-- Community News -->
      ${news.length > 0 ? `
          <tr>
              <td class="mobile-padding" style="padding: 40px 40px 20px;">
                  <h2 style="margin: 0 0 25px; color: #1e293b; font-size: 24px; font-weight: 800;">📰 Community Highlights</h2>
                  ${news.map(item => renderItem(item, false, 'Read Story')).join('')}
              </td>
          </tr>
      ` : ''}
    `;
  }

  renderNewsletterEmail(vars: NewsletterTemplateVars): string {
    const content = this.renderNewsletterContent(vars);
    return this.renderNewsletterWrapper(content, vars);
  }

  renderNewsletterWrapper(content: string, vars: Pick<NewsletterTemplateVars, 'logo_url' | 'tagline' | 'hero_title' | 'hero_description' | 'hero_link' | 'facebook_url' | 'instagram_url' | 'tiktok_url' | 'company_address' | 'contact_email' | 'contact_phone' | 'preferences_url' | 'unsubscribe_url' | 'current_year'>): string {
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
            <td align="center" style="padding: 20px 0;">
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

                            <p style="margin: 0; color: #475569; font-size: 12px;">© ${current_year} Habesha Network. All rights reserved by Habesha Circle Team.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  };
}
