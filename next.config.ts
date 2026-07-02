import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev server access from local network devices (phones, tablets on same WiFi)
  // Your machine's IP is 192.168.40.3 — add any other IPs that access this dev server
  allowedDevOrigins: [
    '192.168.40.3',
    '192.168.1.135',
    '10.153.205.73',
    '192.168.137.1',
    '192.168.40.0/24',
  ],
};

export default nextConfig;
