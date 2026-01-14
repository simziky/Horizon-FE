import {withSentryConfig} from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  productionBrowserSourceMaps: true,
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [{
      protocol: "https",
      hostname: "avatar.iran.liara.run",
      port: "",
      pathname: "/**"
    },{
      protocol: "https",
      hostname: "flagcdn.com",
      port: "",
      pathname: "/**"
    }, {
      protocol: "https",
      hostname: "m.media-amazon.com",
      port: "",
      pathname: "/**"
    }, {
      protocol: "https",
      hostname: "encrypted-tbn2.gstatic.com",
      port: "",
      pathname: "/**"
    }, {
      protocol: "https",
      hostname: "encrypted-tbn0.gstatic.com",
      port: "",
      pathname: "/**"
    }, {
      protocol: "https",
      hostname: "encrypted-tbn1.gstatic.com",
      port: "",
      pathname: "/**"
    }, {
      protocol: "https",
      hostname: "encrypted-tbn3.gstatic.com",
      port: "",
      pathname: "/**"
    }]
  },
};

export default withSentryConfig(nextConfig, {
// For all available options, see:
// https://www.npmjs.com/package/@sentry/webpack-plugin#options

org: "get-noticed",
project: "optisage-staging",

// Only print logs for uploading source maps in CI
silent: !process.env.CI,

// For all available options, see:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// Pass the auth token
authToken: process.env.SENTRY_AUTH_TOKEN,

// Upload a larger set of source maps for prettier stack traces (increases build time)
widenClientFileUpload: true,

// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
// This can increase your server load as well as your hosting bill.
// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
// side errors will fail.
tunnelRoute: "/monitoring",

// Automatically tree-shake Sentry logger statements to reduce bundle size
disableLogger: true,


// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
// See the following for more information:
// https://docs.sentry.io/product/crons/
// https://vercel.com/docs/cron-jobs
automaticVercelMonitors: true,
});
