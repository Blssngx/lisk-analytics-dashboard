"use client";
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Alert } from "./ui/alert";

interface MetricCardProps {
	title: string;
	value: string | number;
	subtitle?: string;
	isLoading?: boolean;
	error?: string;
	children?: React.ReactNode;
}

export function MetricCard({
	title,
	value,
	subtitle,
	isLoading,
	error,
	children,
}: Readonly<MetricCardProps>) {
	return (
		<Card className="rounded-xl">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold text-white">
					{isLoading ? (
						<div className="animate-pulse bg-gray-700 h-8 w-24 rounded"></div>
					) : (
						value
					)}
				</div>
				{subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
				{!!children && children}
			</CardContent>
			<CardFooter>{error && <Alert variant="destructive">{error}</Alert>}</CardFooter>
		</Card>
	);
}
