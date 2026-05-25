import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DailyOps - Organiza tu día",
  description: "Planifica, ejecuta y mide tu trabajo diario",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg text-text" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = localStorage.getItem('dailyops-theme');
                var p = s ? JSON.parse(s) : {};
                var t = (p && p.state && p.state.theme) || 'dark';
                var r = t === 'system'
                  ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                  : t;
                document.documentElement.classList.toggle('dark', r === 'dark');
              } catch(e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
