"use client";

import type React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, Play, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertTitle } from "./ui/alert";

interface ChartCardProps {
	title: string;
	description?: React.ReactNode;
	children: React.ReactNode;
	isLoading?: boolean;
	error?: string;
	onRunQuery?: () => void;
	cooldownKey?: string;
}

export function ChartCard({
	title,
	description,
	children,
	isLoading,
	onRunQuery,
	cooldownKey,
	error,
}: Readonly<ChartCardProps>) {
	const COOLDOWN_MS = useMemo(() => 10 * 1000, []); // 10 seconds cooldown
	const [remaining, setRemaining] = useState(0);

	useEffect(() => {
		const update = () => {
			if (!cooldownKey) {
				setRemaining(0);
				return;
			}
			const last = Number(localStorage.getItem(cooldownKey) || 0);
			const diff = Date.now() - last;
			const left = Math.max(0, COOLDOWN_MS - diff);
			setRemaining(Math.ceil(left / 1000));
		};
		update();
		const id = setInterval(update, 1000);
		return () => clearInterval(id);
	}, [cooldownKey, COOLDOWN_MS]);

	const disabled = isLoading || remaining > 0;
	const label =
		remaining > 0
			? `Wait ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
			: "Run Query";
	return (
		<Card className="rounded-xl ">
			<CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row ">
				<div className="grid flex-1 gap-1">
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</div>
				{onRunQuery && (
					<Button
						onClick={onRunQuery}
						disabled={disabled}
						size="sm"
						className="bg-green-600 hover:bg-green-700 text-white">
						{isLoading ? (
							<RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<Play className="h-4 w-4 mr-2" />
						)}
						{label}
					</Button>
				)}
			</CardHeader>
			<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
				{isLoading ? (
					<div className="animate-pulse bg-gray-700 h-64 w-full rounded"></div>
				) : (
					children
				)}
			</CardContent>
			<CardFooter>
				{error && (
					<Alert variant={"destructive"}>
						<AlertCircleIcon className="h-4 w-4 mr-2" />
						<AlertTitle>{error}</AlertTitle>
					</Alert>
				)}
			</CardFooter>
		</Card>
	);
}
