/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
    /** Keep `pg` native bindings out of the server bundle (Next 14). */
    serverComponentsExternalPackages: ["pg"],
  },
};

export default nextConfig;
