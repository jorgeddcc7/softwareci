/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Los scripts de CLI no forman parte del bundle web.
  // Se ejecutan con tsx desde la terminal, no desde Next.js.
  experimental: {
    // (dejar vacío por ahora)
  },
};