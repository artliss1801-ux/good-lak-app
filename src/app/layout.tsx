import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { InstallPrompt } from "@/components/good-lak/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GOOD Лак - Студия маникюра",
  description: "Запишитесь на маникюр в GOOD Лак. Профессиональные мастера, качественные материалы, уютная атмосфера.",
  keywords: ["маникюр", "ногти", "студия маникюра", "педикюр", "налаживание ногтей", "GOOD Лак"],
  authors: [{ name: "GOOD Лак" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "GOOD Лак - Студия маникюра",
    description: "Запишитесь на маникюр в GOOD Лак. Профессиональные мастера, качественные материалы.",
    url: "https://good-lak.ru",
    siteName: "GOOD Лак",
    type: "website",
    images: [
      {
        url: "/logo.svg",
        width: 400,
        height: 150,
        alt: "GOOD Лак - Студия маникюра",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GOOD Лак - Студия маникюра",
    description: "Запишитесь на маникюр в GOOD Лак",
    images: ["/logo.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GOOD Лак",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta name="theme-color" content="#ec4899" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GOOD Лак" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
        <InstallPrompt />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('SW registered: ', registration);
                    },
                    function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
