import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export function formatNumber(num: number): string {
	if (num >= 1_000_000_000) {
		return `${(num / 1_000_000_000).toFixed(1)}B`;
	}
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1)}M`;
	}
	if (num >= 1_000) {
		return `${(num / 1_000).toFixed(1)}K`;
	}
	return num.toLocaleString();
}

/**
 * Format currency values with R prefix
 */
export function formatCurrency(num: number): string {
	if (num >= 1_000_000_000) {
		return `R${(num / 1_000_000_000).toFixed(1)}B`;
	}
	if (num >= 1_000_000) {
		return `R${(num / 1_000_000).toFixed(1)}M`;
	}
	if (num >= 1_000) {
		return `R${(num / 1_000).toFixed(1)}K`;
	}
	return `R${num.toLocaleString()}`;
}
