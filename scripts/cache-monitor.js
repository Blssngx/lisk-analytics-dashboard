#!/usr/bin/env node
/**
 * Redis Cache Monitor Script
 * Real-time monitoring of cache performance, hit rates, and key metrics
 */

const { createClient } = require("redis");
const { performance } = require("perf_hooks");
require("dotenv").config();

// Use exact same config as the working test scripts
const REDIS_CONFIG = {
	username: "default",
	password: process.env.REDIS_PASSWORD,
	socket: {
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT) || 15253,
		connectTimeout: 10000,
		lazyConnect: true,
	},
};

const MONITOR_INTERVAL = 5000; // 5 seconds
const KEY_PATTERNS = [
	"tokens:*",
	"token:*:holders",
	"token:*:metrics:*",
	"token:*:payments:*",
	"token:*:wallets:*",
	"token:symbol:*",
];

class CacheMonitor {
	constructor() {
		this.client = null;
		this.stats = {
			hits: 0,
			misses: 0,
			errors: 0,
			totalKeys: 0,
			memoryUsage: 0,
			connections: 0,
			lastUpdate: Date.now(),
		};
		this.isRunning = false;
	}

	async connect() {
		try {
			this.client = createClient(REDIS_CONFIG);

			this.client.on("error", (err) => {
				console.error("❌ Redis connection error:", err.message);
				this.stats.errors++;
			});

			this.client.on("connect", () => {
				console.log("🔗 Connected to Redis");
			});

			this.client.on("ready", () => {
				console.log("✅ Redis client ready");
			});

			await this.client.connect();
			return true;
		} catch (error) {
			console.error("❌ Failed to connect to Redis:", error.message);
			return false;
		}
	}

	async disconnect() {
		if (this.client) {
			await this.client.quit();
			console.log("🔌 Disconnected from Redis");
		}
	}

	async getRedisInfo() {
		try {
			const info = await this.client.info();
			const infoLines = info.split("\r\n");
			const stats = {};

			infoLines.forEach((line) => {
				if (line.includes(":")) {
					const [key, value] = line.split(":");
					stats[key] = value;
				}
			});

			return {
				memory: {
					used: parseInt(stats.used_memory || "0"),
					peak: parseInt(stats.used_memory_peak || "0"),
					fragmentation: parseFloat(stats.mem_fragmentation_ratio || "0"),
				},
				stats: {
					totalConnections: parseInt(stats.total_connections_received || "0"),
					connectedClients: parseInt(stats.connected_clients || "0"),
					totalCommands: parseInt(stats.total_commands_processed || "0"),
					instantaneousOps: parseInt(stats.instantaneous_ops_per_sec || "0"),
				},
				persistence: {
					rdbLastSave: parseInt(stats.rdb_last_save_time || "0"),
					aofEnabled: stats.aof_enabled === "1",
				},
			};
		} catch (error) {
			console.error("❌ Error getting Redis info:", error.message);
			return null;
		}
	}

	async getKeyStats() {
		try {
			const keyStats = {};
			let totalKeys = 0;

			for (const pattern of KEY_PATTERNS) {
				const keys = await this.client.keys(pattern);
				keyStats[pattern] = {
					count: keys.length,
					keys: keys.slice(0, 5), // Show first 5 keys as examples
					hasMore: keys.length > 5,
				};
				totalKeys += keys.length;
			}

			return { keyStats, totalKeys };
		} catch (error) {
			console.error("❌ Error getting key stats:", error.message);
			return { keyStats: {}, totalKeys: 0 };
		}
	}

	formatBytes(bytes) {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}

	formatUptime(seconds) {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		return `${days}d ${hours}h ${minutes}m`;
	}

	clearScreen() {
		process.stdout.write("\x1b[2J\x1b[0f");
	}

	printHeader() {
		const now = new Date().toLocaleString();
		console.log("🚀 Lisk Analytics Dashboard - Redis Cache Monitor");
		console.log("=".repeat(70));
		console.log(`📅 Last Update: ${now}`);
		console.log("=".repeat(70));
	}

	async printStats() {
		try {
			const redisInfo = await this.getRedisInfo();
			const { keyStats, totalKeys } = await this.getKeyStats();

			if (!redisInfo) {
				console.log("❌ Unable to fetch Redis statistics");
				return;
			}

			// Memory Usage
			console.log("\n📊 MEMORY USAGE");
			console.log("-".repeat(30));
			console.log(`💾 Used Memory: ${this.formatBytes(redisInfo.memory.used)}`);
			console.log(`⛰️  Peak Memory: ${this.formatBytes(redisInfo.memory.peak)}`);
			console.log(`📈 Fragmentation: ${redisInfo.memory.fragmentation.toFixed(2)}`);

			// Connection Stats
			console.log("\n🔗 CONNECTION STATS");
			console.log("-".repeat(30));
			console.log(`👥 Connected Clients: ${redisInfo.stats.connectedClients}`);
			console.log(`📈 Total Connections: ${redisInfo.stats.totalConnections}`);
			console.log(`⚡ Commands/sec: ${redisInfo.stats.instantaneousOps}`);
			console.log(`🎯 Total Commands: ${redisInfo.stats.totalCommands.toLocaleString()}`);

			// Cache Keys
			console.log("\n🗝️  CACHE KEYS BY PATTERN");
			console.log("-".repeat(30));
			console.log(`📋 Total Keys: ${totalKeys}`);

			Object.entries(keyStats).forEach(([pattern, stats]) => {
				const icon = this.getPatternIcon(pattern);
				console.log(`${icon} ${pattern}: ${stats.count} keys`);

				if (stats.keys.length > 0) {
					stats.keys.forEach((key) => {
						console.log(`    └─ ${key}`);
					});
					if (stats.hasMore) {
						console.log(`    └─ ... and ${stats.count - 5} more`);
					}
				}
			});

			// Performance Metrics
			console.log("\n📈 PERFORMANCE METRICS");
			console.log("-".repeat(30));
			const hitRate =
				this.stats.hits + this.stats.misses > 0
					? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
					: "0.00";

			console.log(`🎯 Cache Hit Rate: ${hitRate}%`);
			console.log(`✅ Cache Hits: ${this.stats.hits}`);
			console.log(`❌ Cache Misses: ${this.stats.misses}`);
			console.log(`🚨 Errors: ${this.stats.errors}`);

			// Health Status
			const isHealthy = redisInfo.stats.connectedClients > 0 && this.stats.errors < 10;
			const healthIcon = isHealthy ? "🟢" : "🔴";
			const healthStatus = isHealthy ? "HEALTHY" : "DEGRADED";

			console.log("\n💊 HEALTH STATUS");
			console.log("-".repeat(30));
			console.log(`${healthIcon} Status: ${healthStatus}`);

			if (!isHealthy) {
				console.log("⚠️  Warning: High error count or no connections");
			}

			console.log("\n" + "=".repeat(70));
			console.log("Press Ctrl+C to stop monitoring");
		} catch (error) {
			console.error("❌ Error printing stats:", error.message);
		}
	}

	getPatternIcon(pattern) {
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

	async start() {
		console.log("🚀 Starting Redis Cache Monitor...");

		const connected = await this.connect();
		if (!connected) {
			console.error("❌ Failed to connect to Redis. Exiting...");
			process.exit(1);
		}

		this.isRunning = true;

		// Handle graceful shutdown
		process.on("SIGINT", async () => {
			console.log("\n🛑 Shutting down cache monitor...");
			this.isRunning = false;
			await this.disconnect();
			process.exit(0);
		});

		// Start monitoring loop
		while (this.isRunning) {
			this.clearScreen();
			this.printHeader();
			await this.printStats();

			// Wait for next update
			await new Promise((resolve) => setTimeout(resolve, MONITOR_INTERVAL));
		}
	}
}

// Main execution
async function main() {
	// Load environment variables
	require("dotenv").config();

	const monitor = new CacheMonitor();
	await monitor.start();
}

// Run if called directly
if (require.main === module) {
	main().catch((error) => {
		console.error("❌ Cache monitor error:", error);
		process.exit(1);
	});
}

module.exports = CacheMonitor;
