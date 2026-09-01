import type { NextConfig } from "next";

// El navegador nunca habla directo con el backend: pide a `/api/v1/core/...`
// del propio front y el servidor de Next reenvia (ver `rewrites` abajo). Eso
// evita el CORS (mismo origen) y el mixed content (el salto a http lo hace el
// servidor, no el navegador).
//
// El fallback es el backend local de desarrollo, igual que en `src/config/env.ts`.
const BACKEND_URL = (process.env.BACKEND_URL ?? "https://localhost:7099").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  /* config options here */

  // Empaqueta el servidor y solo las dependencias que usa en `.next/standalone`,
  // para que la imagen final no tenga que llevar `node_modules` entero.
  output: "standalone",

  reactStrictMode: false,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/core/:path*",
        destination: `${BACKEND_URL}/api/v1/core/:path*`,
      },
    ];
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgoConfig: {
              plugins: [
                {
                  name: "preset-default",
                  params: {
                    overrides: {
                      removeViewBox: false,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    });
    return config;
  },
  
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: [
                  {
                    name: 'preset-default',
                    params: {
                      overrides: {
                        removeViewBox: false,
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
        as: '*.js',
      },
    },
  },
  
};

export default nextConfig;
