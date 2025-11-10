#!/usr/bin/env node
/**
 * Simple Redis Cache Health Check
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

async function healthCheck() {
	console.log("🚀 Lisk Analytics Dashboard - Cache Health Check");
	console.log("=".repeat(60));
	console.log(`📅 Check Time: ${new Date().toLocaleString()}\n`);

	const client = createClient(config);
	const results = {
		connection: { status: "unknown", message: "", duration: 0 },
		readWrite: { status: "unknown", message: "", duration: 0 },
		memory: { status: "unknown", message: "", usage: 0 },
		performance: { status: "unknown", message: "", latency: 0 },
	};

	client.on("error", (err) => {
		console.error("Redis Error:", err.message);
	});

	try {
		// Connection Test
		console.log("🔗 CONNECTION TEST");
		const connStart = Date.now();

		await client.connect();
		const connDuration = Date.now() - connStart;

		results.connection = {
			status: "healthy",
			message: `Connected successfully in ${connDuration}ms`,
			duration: connDuration,
		};
		console.log(`🟢 ${results.connection.message}`);

		// Read/Write Test
		console.log("\n📝 READ/WRITE TEST");
		const rwStart = Date.now();

		const testKey = "health_check_test_key";
		const testValue = `test_${Date.now()}`;

		await client.set(testKey, testValue, { EX: 10 });
		const retrievedValue = await client.get(testKey);
		await client.del(testKey);

		const rwDuration = Date.now() - rwStart;

		if (retrievedValue === testValue) {
			results.readWrite = {
				status: "healthy",
				message: `Read/write operations successful in ${rwDuration}ms`,
				duration: rwDuration,
			};
			console.log(`🟢 ${results.readWrite.message}`);
		} else {
			results.readWrite = {
				status: "failed",
				message: "Data integrity check failed",
				duration: rwDuration,
			};
			console.log(`🔴 ${results.readWrite.message}`);
		}

		// Memory Check
		console.log("\n💾 MEMORY CHECK");
		const info = await client.info("memory");
		const lines = info.split("\r\n");
		const memoryStats = {};

		lines.forEach((line) => {
			if (line.includes(":")) {
				const [key, value] = line.split(":");
				memoryStats[key] = value;
			}
		});

		const usedMemory = parseInt(memoryStats.used_memory || "0");
		const maxMemory = parseInt(memoryStats.maxmemory || "0");
		const fragmentation = parseFloat(memoryStats.mem_fragmentation_ratio || "1");

		let memStatus = "healthy";
		let memMessage = "Memory usage is within normal limits";

		if (maxMemory > 0) {
			const usagePercent = (usedMemory / maxMemory) * 100;
			if (usagePercent > 90) {
				memStatus = "critical";
				memMessage = `Memory usage is critical: ${usagePercent.toFixed(1)}%`;
			} else if (usagePercent > 75) {
				memStatus = "warning";
				memMessage = `Memory usage is high: ${usagePercent.toFixed(1)}%`;
			} else {
				memMessage = `Memory usage: ${usagePercent.toFixed(1)}%`;
			}
		}

		results.memory = {
			status: memStatus,
			message: `${memMessage} | Used: ${formatBytes(usedMemory)}`,
			usage: usedMemory,
			fragmentation,
		};

		const memIcon = memStatus === "healthy" ? "🟢" : memStatus === "warning" ? "🟡" : "🔴";
		console.log(`${memIcon} ${results.memory.message}`);

		// Performance Test
		console.log("\n⚡ PERFORMANCE TEST");
		const iterations = 5;
		const latencies = [];

		for (let i = 0; i < iterations; i++) {
			const start = process.hrtime.bigint();
			await client.ping();
			const end = process.hrtime.bigint();
			const latency = Number(end - start) / 1000000; // Convert to milliseconds
			latencies.push(latency);
		}

		const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

		let perfStatus = "healthy";
		let perfMessage = `Average latency: ${avgLatency.toFixed(2)}ms`;

		if (avgLatency > 100) {
			perfStatus = "warning";
			perfMessage += " (High latency detected)";
		} else if (avgLatency > 50) {
			perfStatus = "warning";
			perfMessage += " (Moderate latency)";
		}

		results.performance = {
			status: perfStatus,
			message: perfMessage,
			latency: avgLatency,
		};

		const perfIcon = perfStatus === "healthy" ? "🟢" : "🟡";
		console.log(`${perfIcon} ${results.performance.message}`);

		// Overall Health
		console.log("\n💊 OVERALL HEALTH");
		const allHealthy = Object.values(results).every((r) => r.status === "healthy");
		const hasWarnings = Object.values(results).some((r) => r.status === "warning");
		const hasFailures = Object.values(results).some(
			(r) => r.status === "failed" || r.status === "critical",
		);

		let overallStatus = "healthy";
		if (hasFailures) overallStatus = "failed";
		else if (hasWarnings) overallStatus = "warning";

		const overallIcon =
			overallStatus === "healthy" ? "🟢" : overallStatus === "warning" ? "🟡" : "🔴";
		console.log(`${overallIcon} Overall Status: ${overallStatus.toUpperCase()}`);

		// Recommendations
		if (overallStatus !== "healthy") {
			console.log("\n💡 RECOMMENDATIONS");
			if (results.connection.duration > 1000) {
				console.log("   ⚠️  Connection is slow - check network latency");
			}
			if (results.memory.status === "critical") {
				console.log("   🚨 Memory usage is critical - consider increasing Redis memory");
			}
			if (results.performance.latency > 50) {
				console.log("   ⚡ High latency detected - check server load");
			}
		}

		await client.quit();
		console.log("\n" + "=".repeat(60));
		console.log("✅ Health check complete");

		// Exit with appropriate code
		process.exit(overallStatus === "failed" ? 1 : 0);
	} catch (error) {
		console.error("\n❌ Health check failed:", error.message);
		if (client) {
			await client.quit().catch(() => {});
		}
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

healthCheck();
