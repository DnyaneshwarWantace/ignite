import { Inter, Roboto_Mono } from "next/font/google";
import { Toaster } from "../../../components/ui/sonner";
import { baseUrl, createMetadata } from "../utils/metadata";
import {
	StoreInitializer,
	BackgroundUploadRunner,
} from "../components/store-initializer";
import { QueryProvider } from "../components/query-provider";
import { Outfit } from "next/font/google";

import "./globals.css";

const geistMono = Roboto_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const geist = Inter({
	variable: "--font-geist",
	subsets: ["latin"],
});

const outfit = Outfit({
	variable: "--font-outfit",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
});

export const metadata = createMetadata({
	title: {
		template: "%s | Ignite",
		default: "Ignite",
	},
	description: "AI Video generator for the next gen web.",
	metadataBase: baseUrl,
});

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistMono.variable} ${geist.variable} ${outfit.variable} antialiased font-sans bg-background`}
				suppressHydrationWarning={true}
			>
				<QueryProvider>
					{children}
					<StoreInitializer />
					<BackgroundUploadRunner />
					<Toaster />
				</QueryProvider>
			</body>
		</html>
	);
}
