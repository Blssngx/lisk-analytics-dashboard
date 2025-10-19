import { createClient } from "redis";

export const redisClient = createClient({
	username: "default",
	password: process.env.REDIS_PASSWORD,
	socket: {
		host: process.env.REDIS_HOST,
		port: 15253,
	},
});

redisClient.connect().catch((err) => {
	console.error("Redis connection error:", err);
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.on("connect", () => console.log("Connected to Redis"));
redisClient.on("ready", () => console.log("Redis Client Ready"));
redisClient.on("end", () => console.log("Redis Client Disconnected"));
