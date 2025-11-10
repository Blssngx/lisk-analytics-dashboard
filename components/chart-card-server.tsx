"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardServerProps {
	title: string;
	description?: React.ReactNode;
	children: React.ReactNode;
}

export function ChartCardServer({ title, description, children }: Readonly<ChartCardServerProps>) {
	return (
		<Card className="rounded-xl">
			<CardHeader>
				<CardTitle className="text-white">{title}</CardTitle>
				{description && (
					<CardDescription className="text-gray-400">{description}</CardDescription>
				)}
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}
