// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   // disable ESLint errors from breaking your build:
//   reactStrictMode: true,
//   // disable blocking on TypeScript errors
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   // disable blocking on ESLint errors
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   images: {
//     unoptimized: true,
//     // allow images from ik.imagekit.io
//     // domains: ["ik.imagekit.io"],

//     // –– OR if you’d rather lock it down to just that one folder:
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "ik.imagekit.io",
//         port: "",
//         pathname: "/lrigu76hy/**",
//       },
//     ],
//   },
// };

// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        port: "",
        pathname: "/lrigu76hy/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
