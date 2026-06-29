import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RiskLens AI — From Cyber Threats to Business Impact",
  description:
    "AI-powered platform for cyber threat detection, business impact analysis, and automated mitigation recommendations. Turn security data into business decisions.",
  keywords: [
    "cybersecurity",
    "AI",
    "threat detection",
    "risk analysis",
    "business impact",
    "SIEM",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="min-h-screen bg-[#050816] text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
