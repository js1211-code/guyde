import type { NextConfig } from "next";

// 업로드된 사진은 Supabase Storage의 공개 URL로 온다.
// next/image가 최적화하려면 그 호스트를 미리 허용해야 한다.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 도서관 아티클 표지. 우리 자산이 아니라 인용이라 Storage에 복사하지 않고
      // Unsplash CDN을 그대로 쓴다.
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
