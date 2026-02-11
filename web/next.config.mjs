/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@septcode/db"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "api.dicebear.com" }]
  }
};

export default nextConfig;
