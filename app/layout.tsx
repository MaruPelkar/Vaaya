import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vaaya - Company Intelligence",
  description: "Research any B2B company in seconds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
