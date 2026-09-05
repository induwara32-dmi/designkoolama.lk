import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — Creative Design Studio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The site-wide fallback Open Graph image. Next.js automatically serves this for the
// homepage and for every nested route that doesn't define its own opengraph-image, so
// individual pages (services, packages, etc. -- none of which have a dedicated image
// asset of their own) always get a real, on-brand image instead of a blank link
// preview when shared.
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b0b0b",
          backgroundImage: "radial-gradient(circle at 50% 35%, rgba(255,107,0,0.28), transparent 60%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 76, fontWeight: 800, color: "#ffffff", letterSpacing: -2 }}>
          Designkoolama
          <span style={{ display: "flex", marginLeft: 14, width: 16, height: 16, borderRadius: 999, backgroundColor: "#ff6b00" }} />
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "#b3b3b3" }}>
          Bring Your Imagination To Life.
        </div>
      </div>
    ),
    { ...size },
  );
}
