import type { NextConfig } from "next";
import { appBasePath } from "./src/lib/base-path";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  ...(appBasePath ? { basePath: appBasePath } : {}),
};

export default nextConfig;
