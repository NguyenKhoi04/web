/** @type {import('next').NextConfig} */
const nextConfig = {
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
