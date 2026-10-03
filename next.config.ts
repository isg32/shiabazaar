import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Report exports run server-side; pdfkit reads its font metrics (.afm) from disk at runtime.
  serverExternalPackages: ["pdfkit", "exceljs"],
  outputFileTracingIncludes: {
    "/api/dashboard/reports/[id]": ["./node_modules/pdfkit/js/data/**"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "shiabazaar.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
