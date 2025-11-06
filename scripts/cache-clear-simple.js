#!/usr/bin/env node
/**
 * Simple Redis Cache Clear Tool
 * Using the working connection pattern
 */

const { createClient } = require("redis");
require("dotenv").config();

// Use exact same config as the working test
const config = {
	username: "default",
	password: process.env.REDIS_PASSWORD,
	socket: {
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT) || 15253,
		connectTimeout: 10000,
		lazyConnect: true,
	},
};

const AVAILABLE_PATTERNS = [
	"tokens:*", // All token list caches
	"token:*:holders", // All token holder caches
	"token:*:metrics:*", // All token metrics caches
	"token:*:payments:*", // All payment caches
	"token:*:wallets:*", // All wallet caches
	"token:symbol:*", // All symbol lookup caches
	"*", // All cache keys (DANGER!)
];

async function clearCache() {
	const args = process.argv.slice(2);

	if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
		printHelp();
		return;
	}

	console.log("🚀 Lisk Analytics Dashboard - Cache Clear Tool");
	console.log("=".repeat(60));
	console.log(`📅 Clear Time: ${new Date().toLocaleString()}\n`);

	const client = createClient(config);

	client.on("error", (err) => {
		console.error("Redis Error:", err.message);
	});

	try {
		console.log("🔄 Connecting to Redis...");
		await client.connect();
		console.log("✅ Connected successfully!\n");

		for (const pattern of args) {
			console.log(`🔍 Clearing pattern: ${pattern}`);

			const keys = await client.keys(pattern);

			if (keys.length === 0) {
				console.log(`ℹ️  No keys found matching pattern: ${pattern}\n`);
				continue;
			}

			console.log(`📋 Found ${keys.length} keys to delete`);

			// Show examples
			if (keys.length > 0) {
				console.log("🔑 Example keys:");
				keys.slice(0, 3).forEach((key) => {
					console.log(`    └─ ${key}`);
				});
				if (keys.length > 3) {
					console.log(`    └─ ... and ${keys.length - 3} more`);
				}
			}

			// Confirm for dangerous operations
			if (pattern === "*" || keys.length > 20) {
				const readline = require("readline");
				const rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});

				const answer = await new Promise((resolve) => {
					rl.question(
						`⚠️  This will delete ${keys.length} keys. Continue? (y/N): `,
						resolve,
					);
				});

				rl.close();

				if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
					console.log("❌ Operation cancelled\n");
					continue;
				}
			}

			// Delete keys
			const deleted = await client.del(keys);
			console.log(`✅ Successfully deleted ${deleted} keys\n`);
		}

		await client.quit();
		console.log("✅ Cache clear complete!");
	} catch (error) {
		console.error("❌ Cache clear failed:", error.message);
		if (client) {
			await client.quit().catch(() => {});
		}
		process.exit(1);
	}
}

function printHelp() {
	console.log("🚀 Lisk Analytics Dashboard - Cache Clear Tool");
	console.log("=".repeat(50));
	console.log("\nUsage:");
	console.log("  npm run cache:clear [pattern1] [pattern2] ...");
	console.log("  node scripts/cache-clear-simple.js [pattern1] [pattern2] ...");
	console.log("\nAvailable patterns:");

	AVAILABLE_PATTERNS.forEach((pattern) => {
		const description = getPatternDescription(pattern);
		const icon = getPatternIcon(pattern);
		console.log(`  ${icon} ${pattern.padEnd(20)} - ${description}`);
	});

	console.log("\nExamples:");
	console.log("  npm run cache:clear tokens:*");
	console.log('  npm run cache:clear "token:*:holders" "token:*:metrics:*"');
	console.log('  npm run cache:clear "*"  # Clear ALL cache (dangerous!)');
}

function getPatternDescription(pattern) {
	const descriptions = {
		"tokens:*": "All token list caches",
		"token:*:holders": "All token holder caches",
		"token:*:metrics:*": "All token metrics caches",
		"token:*:payments:*": "All payment data caches",
		"token:*:wallets:*": "All wallet data caches",
		"token:symbol:*": "All symbol lookup caches",
		"*": "ALL cache keys (DANGER!)",
	};
	return descriptions[pattern] || "Custom pattern";
}

function getPatternIcon(pattern) {
	const icons = {
		"tokens:*": "🪙",
		"token:*:holders": "👥",
		"token:*:metrics:*": "📊",
		"token:*:payments:*": "💰",
		"token:*:wallets:*": "👛",
		"token:symbol:*": "🔤",
		"*": "💥",
	};
	return icons[pattern] || "🔑";
}

clearCache();
