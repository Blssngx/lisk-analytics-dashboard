#!/usr/bin/env node
/**
 * Simple Redis Cache Statistics
 * Using the working connection pattern from test-redis.js
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

const KEY_PATTERNS = [
	"tokens:*",
	"token:*:holders",
	"token:*:metrics:*",
	"token:*:payments:*",
	"token:*:wallets:*",
	"token:symbol:*",
];

async function getBasicStats() {
	console.log("🚀 Lisk Analytics Dashboard - Cache Statistics");
	console.log("=".repeat(60));
	console.log(`📅 Generated: ${new Date().toLocaleString()}\n`);

	const client = createClient(config);

	client.on("error", (err) => {
		console.error("❌ Redis Error:", err.message);
	});

	try {
		console.log("🔄 Connecting to Redis...");
		await client.connect();
		console.log("✅ Connected successfully!\n");

		// Get Redis info
		console.log("📊 REDIS SERVER INFO");
		console.log("-".repeat(40));

		const info = await client.info();
		const lines = info.split("\r\n");
		const stats = {};

		lines.forEach((line) => {
			if (line.includes(":")) {
				const [key, value] = line.split(":");
				stats[key] = value;
			}
		});

		console.log(`📋 Redis Version: ${stats.redis_version || "unknown"}`);
		console.log(
			`🕒 Uptime: ${Math.floor((stats.uptime_in_seconds || 0) / 86400)}d ${Math.floor(
				((stats.uptime_in_seconds || 0) % 86400) / 3600,
			)}h`,
		);
		console.log(`💾 Used Memory: ${formatBytes(parseInt(stats.used_memory || "0"))}`);
		console.log(`👥 Connected Clients: ${stats.connected_clients || "0"}`);
		console.log(`🎯 Total Commands: ${stats.total_commands_processed || "0"}`);

		const hits = parseInt(stats.keyspace_hits || "0");
		const misses = parseInt(stats.keyspace_misses || "0");
		const total = hits + misses;
		if (total > 0) {
			const hitRate = ((hits / total) * 100).toFixed(2);
			console.log(`📈 Cache Hit Rate: ${hitRate}% (${hits}/${total})`);
		}

		// Analyze cache keys
		console.log("\n🗝️  CACHE KEY ANALYSIS");
		console.log("-".repeat(40));

		let totalKeys = 0;
		for (const pattern of KEY_PATTERNS) {
			try {
				const keys = await client.keys(pattern);
				const icon = getPatternIcon(pattern);
				console.log(`${icon} ${pattern}: ${keys.length} keys`);

				if (keys.length > 0 && keys.length <= 3) {
					// Show actual keys if there are just a few
					keys.forEach((key) => console.log(`    └─ ${key}`));
				} else if (keys.length > 3) {
					// Show sample for many keys
					keys.slice(0, 3).forEach((key) => console.log(`    └─ ${key}`));
					console.log(`    └─ ... and ${keys.length - 3} more`);
				}

				totalKeys += keys.length;
			} catch (error) {
				console.log(`❌ ${pattern}: Error (${error.message})`);
			}
		}

		console.log(`\n📊 SUMMARY`);
		console.log("-".repeat(40));
		console.log(`🗄️  Total Cache Keys: ${totalKeys}`);
		console.log(`💾 Memory Usage: ${formatBytes(parseInt(stats.used_memory || "0"))}`);
		console.log(`⚡ Performance: ${stats.instantaneous_ops_per_sec || "0"} ops/sec`);

		const health = totalKeys > 0 && hits > misses ? "🟢 HEALTHY" : "🟡 NORMAL";
		console.log(`💊 Status: ${health}`);

		await client.quit();
		console.log("\n✅ Analysis complete!");
	} catch (error) {
		console.error("❌ Analysis failed:", error.message);
		process.exit(1);
	}
}

function formatBytes(bytes) {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getPatternIcon(pattern) {
	const icons = {
		"tokens:*": "🪙",
		"token:*:holders": "👥",
		"token:*:metrics:*": "📊",
		"token:*:payments:*": "💰",
		"token:*:wallets:*": "👛",
		"token:symbol:*": "🔤",
	};
	return icons[pattern] || "🔑";
}

getBasicStats();
