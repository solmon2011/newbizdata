// Lob SDK v6 uses the pattern: const Lob = require('lob')('API_KEY')
// or new Lob(apiKey) — it handles both via constructor check

const hasLobKey = !!process.env.LOB_API_KEY;
let lob: any = null;

if (hasLobKey) {
  try {
    const Lob = require("lob");
    lob = new Lob(process.env.LOB_API_KEY!);
    console.log("Lob SDK initialized successfully");
  } catch (err) {
    console.warn("Failed to initialize Lob SDK:", err);
  }
} else {
  console.warn("LOB_API_KEY not set — Lob features will return mock data");
}

export function renderTemplate(html: string, variables: Record<string, string>): string {
  let rendered = html;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    rendered = rendered.replace(pattern, value || "");
  }
  return rendered;
}

export interface SendPostcardParams {
  to: {
    name: string;
    address_line1: string;
    address_city: string;
    address_state: string;
    address_zip: string;
  };
  from: {
    name: string;
    address_line1: string;
    address_city: string;
    address_state: string;
    address_zip: string;
  };
  frontHtml: string;
  backHtml: string;
  size: string;
  mergeVariables: Record<string, string>;
}

export async function sendPostcard(params: SendPostcardParams): Promise<{ id: string; url: string } | null> {
  const renderedFront = renderTemplate(params.frontHtml, params.mergeVariables);
  const renderedBack = renderTemplate(params.backHtml, params.mergeVariables);

  if (!lob) {
    // Return mock data when no API key is configured
    const mockId = `psc_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[Lob Mock] Would send postcard to ${params.to.name} at ${params.to.address_line1}`);
    return { id: mockId, url: "" };
  }

  try {
    const postcard = await new Promise<any>((resolve, reject) => {
      lob.postcards.create(
        {
          to: params.to,
          from: params.from,
          front: renderedFront,
          back: renderedBack,
          size: params.size || "6x9",
        },
        (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    return {
      id: postcard.id,
      url: postcard.thumbnails?.[0]?.large || postcard.url || "",
    };
  } catch (err) {
    console.error("Lob postcard creation failed:", err);
    throw err;
  }
}

export function isLobConfigured(): boolean {
  return hasLobKey && lob !== null;
}
