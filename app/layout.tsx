import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "CloudVault — Your files. Organized. Under control.",
  description:
    "A modern full-stack cloud file storage and sharing platform where users can safely upload files, organize folders, preview content, manage versions, and share files through secure, configurable links.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "CloudVault — Your files. Organized. Under control.",
    description:
      "A modern full-stack cloud file storage and sharing platform with private S3 object storage and cryptographic sharing links.",
    url: "https://cloudvault.dev",
    siteName: "CloudVault",
    images: [
      {
        url: "/brand/cloudvault-banner.svg",
        width: 1200,
        height: 420,
        alt: "CloudVault - Your files. Organized. Under control.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-cv-bg text-cv-text-main flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
