import { db } from "./storage";
import { campaignTemplates } from "@shared/schema";
import { sql } from "drizzle-orm";

interface TemplateData {
  name: string;
  description: string;
  category: string;
  frontHtml: string;
  backHtml: string;
}

function makeFrontHtml(opts: { bgColor: string; accentColor: string; icon: string; defaultHeadline: string }): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Helvetica,Arial,sans-serif;">
  <div style="width:6in;height:4in;position:relative;overflow:hidden;background:${opts.bgColor};">
    <div style="position:absolute;top:0;right:0;width:200px;height:200px;background:${opts.accentColor};border-radius:0 0 0 200px;opacity:0.15;"></div>
    <div style="position:absolute;bottom:0;left:0;width:150px;height:150px;background:${opts.accentColor};border-radius:0 150px 0 0;opacity:0.1;"></div>
    <div style="padding:32px 36px;height:100%;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;">
      <div style="font-size:36px;margin-bottom:12px;">${opts.icon}</div>
      <h1 style="font-size:26px;font-weight:800;color:#1a1a1a;margin:0 0 10px 0;line-height:1.15;">{{headline}}</h1>
      <p style="font-size:13px;font-weight:600;color:${opts.accentColor};margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.5px;">{{company_name}}</p>
      <div style="width:40px;height:3px;background:${opts.accentColor};border-radius:2px;"></div>
    </div>
  </div>
</body>
</html>`;
}

function makeBackHtml(opts: { accentColor: string; ctaText: string }): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Helvetica,Arial,sans-serif;">
  <div style="width:6in;height:4in;position:relative;overflow:hidden;background:#ffffff;">
    <div style="padding:28px 32px;height:100%;box-sizing:border-box;">
      <div style="display:flex;height:100%;">
        <!-- Left content -->
        <div style="flex:1;padding-right:24px;">
          <p style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;font-weight:600;">Dear {{business_name}},</p>
          <p style="font-size:13px;color:#333;line-height:1.5;margin:0 0 14px 0;">{{offer}}</p>
          <div style="background:${opts.accentColor};color:#fff;padding:10px 20px;border-radius:4px;display:inline-block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${opts.ctaText}</div>
          <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;">
            <p style="font-size:11px;color:#333;margin:0;line-height:1.6;">
              <strong>{{company_name}}</strong><br>
              {{phone}} · {{email}}<br>
              {{website}}
            </p>
          </div>
        </div>
        <!-- Right address area -->
        <div style="width:180px;display:flex;flex-direction:column;justify-content:flex-end;padding-left:20px;border-left:1px solid #eee;">
          <div style="font-size:10px;color:#999;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Recipient</div>
          <div style="font-size:11px;color:#333;line-height:1.5;min-height:60px;">
            <!-- Lob handles addressing -->
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

const TEMPLATES: TemplateData[] = [
  {
    name: "Protect Your New Business",
    description: "Insurance-focused template highlighting coverage for new business owners. Professional blue tone with trust-building messaging.",
    category: "insurance",
    frontHtml: makeFrontHtml({ bgColor: "#f0f4ff", accentColor: "#1e40af", icon: "🛡️", defaultHeadline: "Protect Your New Business" }),
    backHtml: makeBackHtml({ accentColor: "#1e40af", ctaText: "Get a Free Quote" }),
  },
  {
    name: "Get Your Finances Right",
    description: "Accounting and tax services template for reaching newly formed businesses. Warm, trustworthy green tones.",
    category: "accounting",
    frontHtml: makeFrontHtml({ bgColor: "#f0fdf4", accentColor: "#15803d", icon: "📊", defaultHeadline: "New Business? Get Your Finances Right" }),
    backHtml: makeBackHtml({ accentColor: "#15803d", ctaText: "Book Free Consultation" }),
  },
  {
    name: "Find Your Perfect Space",
    description: "Commercial real estate template targeting businesses that need office or retail space. Bold, modern design.",
    category: "real_estate",
    frontHtml: makeFrontHtml({ bgColor: "#faf5ff", accentColor: "#7c3aed", icon: "🏢", defaultHeadline: "Find Your Perfect Business Space" }),
    backHtml: makeBackHtml({ accentColor: "#7c3aed", ctaText: "See Available Spaces" }),
  },
  {
    name: "Start Accepting Payments",
    description: "Payment processing and merchant services template. Dynamic orange accents convey energy and action.",
    category: "merchant_services",
    frontHtml: makeFrontHtml({ bgColor: "#fff7ed", accentColor: "#c2410c", icon: "💳", defaultHeadline: "Start Accepting Payments Day One" }),
    backHtml: makeBackHtml({ accentColor: "#c2410c", ctaText: "Get Started Today" }),
  },
  {
    name: "Welcome to Business",
    description: "General business services template. Works for any B2B service targeting new business formations. Clean teal design.",
    category: "general",
    frontHtml: makeFrontHtml({ bgColor: "#f0fdfa", accentColor: "#0d9488", icon: "🤝", defaultHeadline: "Welcome to the Business Community" }),
    backHtml: makeBackHtml({ accentColor: "#0d9488", ctaText: "Learn More" }),
  },
  {
    name: "Make Your First Impression",
    description: "Marketing and web design template for agencies targeting brand-new businesses. Bold, creative feel.",
    category: "marketing",
    frontHtml: makeFrontHtml({ bgColor: "#fdf2f8", accentColor: "#be185d", icon: "🎨", defaultHeadline: "Make Your First Impression Count" }),
    backHtml: makeBackHtml({ accentColor: "#be185d", ctaText: "See Our Work" }),
  },
];

export async function seedTemplates(): Promise<void> {
  const existing = db.select({ count: sql<number>`count(*)` }).from(campaignTemplates).get();
  if (existing && existing.count > 0) {
    console.log(`Templates already seeded (${existing.count} found)`);
    return;
  }

  for (const t of TEMPLATES) {
    db.insert(campaignTemplates).values({
      name: t.name,
      description: t.description,
      category: t.category,
      frontHtml: t.frontHtml,
      backHtml: t.backHtml,
      isSystem: 1,
      size: "6x9",
    }).run();
  }

  console.log(`Seeded ${TEMPLATES.length} campaign templates`);
}
