/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    // pdf-parse lê arquivos via fs em runtime; webpack não deve bundlar
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

export default nextConfig;
