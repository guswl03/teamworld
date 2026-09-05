import type { Metadata } from "next";
import { SessionProvider } from "@/components/session-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: "TeamWorld — 함께 일하는 또 하나의 세계",
  description:
    "다섯 개의 길드, 하나의 세계. GitHub로 연결되는 작은 RPG 협업 공간.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
