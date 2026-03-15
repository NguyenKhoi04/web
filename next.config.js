/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
  ignoreDuringBuilds: true,
},
  webpack: (config) => {
    config.watchOptions = {
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "C:/Users/**/Cookies",
        "C:/Users/**/Application Data",
        "C:/Users/**/Local Settings"
      ]
    }
    return config
  }
}

module.exports = nextConfig
