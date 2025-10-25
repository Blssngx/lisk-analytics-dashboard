"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
	const router = useRouter();

	useEffect(() => {
		// Redirect to LZAR page by default
		router.replace("/dashboard/lzar");
	}, [router]);

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-white">Loading...</div>
		</div>
	);
}
