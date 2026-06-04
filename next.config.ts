import type { NextConfig } from "next";
import { appBasePath } from "./src/lib/base-path";

const nextConfig: NextConfig = {
  ...(appBasePath ? { basePath: appBasePath } : {}),
};

export default nextConfig;
