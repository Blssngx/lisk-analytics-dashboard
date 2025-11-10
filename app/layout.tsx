import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import AuthProvider from "@/components/providers/session-provider";
import QueryProvider from "@/components/providers/query-provider";

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://liskanalytics.vercel.app"),
	title: {
		default: "Lisk Analytics - LZAR & LUSD Token Tracker",
		template: "%s | Lisk Analytics",
	},
	description:
		"Real-time analytics dashboard for LZAR (Lisk ZAR) and LUSD (Lisk USD) tokens. Track transactions, holders, payments, and network growth on the Lisk blockchain.",
	keywords: [
		"Lisk",
		"LZAR",
		"LUSD",
		"token analytics",
		"blockchain",
		"cryptocurrency",
		"Lisk ZAR",
		"Lisk USD",
		"stablecoin",
		"token tracker",
		"crypto dashboard",
		"DeFi",
		"Web3",
		"blockchain analytics",
		"token metrics",
	],
	authors: [
		{ name: "Solomon Adzape" },
		{ name: "Amarillo Labs", url: "https://amarillolabs.com" },
		{ name: "Manelisi Mpotulo", url: "https://manelisi.mpotulo.com" },
	],
	creator: "Solomon Adzape",
	publisher: "Amarillo Labs",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "/",
		title: "Lisk Analytics - LZAR & LUSD Token Tracker",
		description:
			"Real-time analytics dashboard for LZAR (Lisk ZAR) and LUSD (Lisk USD) tokens. Track transactions, holders, payments, and network growth on the Lisk blockchain.",
		siteName: "Lisk Analytics Dashboard",
	},
	twitter: {
		card: "summary_large_image",
		title: "Lisk Analytics - LZAR & LUSD Token Tracker",
		description:
			"Real-time analytics dashboard for LZAR and LUSD tokens on the Lisk blockchain. Track transactions, holders, and network metrics.",
		creator: "amarillolabs",
		site: "amarillolabs.com",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	category: "technology",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<head>
				<style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
			</head>
			<body className="dark">
				<AuthProvider>
					<QueryProvider>{children}</QueryProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
