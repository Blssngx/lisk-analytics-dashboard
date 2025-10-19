import redisManager from "../redis";

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
	SHORT: 60 * 2, // 2 minutes
	MEDIUM: 60 * 5, // 5 minutes
	LONG: 60 * 15, // 15 minutes
	VERY_LONG: 60 * 60, // 1 hour
} as const;

// Cache key prefixes for better organization
export const CACHE_KEYS = {
	TOKENS: "tokens",
	TOKEN_BY_SYMBOL: "token_by_symbol",
	TOKEN_HOLDERS: "token_holders",
	TOKEN_METRICS: "token_metrics",
	TOKEN_PAYMENTS: "token_payments",
	TOKEN_WALLETS: "token_wallets",
	MORALIS_DATA: "moralis_data",
} as const;

// Cache helper functions with proper typing
export class CacheService {
	// Generic get/set methods
	static async get(prefix: string, identifier: string) {
		return redisManager.get(prefix, identifier);
	}

	static async set(
		prefix: string,
		identifier: string,
		data: any,
		ttl = CACHE_TTL.MEDIUM,
	): Promise<void> {
		await redisManager.set(prefix, identifier, data, ttl);
	}

	static async del(prefix: string, identifier: string) {
		return redisManager.del(prefix, identifier);
	}

	// Token-specific methods
	static async getTokens() {
		return redisManager.get(CACHE_KEYS.TOKENS, "all");
	}

	static async setTokens(tokens: any[], ttl = CACHE_TTL.LONG): Promise<void> {
		await redisManager.set(CACHE_KEYS.TOKENS, "all", tokens, ttl);
	}

	static async getTokenBySymbol(symbol: string) {
		return redisManager.get(CACHE_KEYS.TOKEN_BY_SYMBOL, symbol.toLowerCase());
	}

	static async setTokenBySymbol(symbol: string, token: any, ttl = CACHE_TTL.LONG): Promise<void> {
		await redisManager.set(CACHE_KEYS.TOKEN_BY_SYMBOL, symbol.toLowerCase(), token, ttl);
	}

	static async invalidateTokenBySymbol(symbol: string) {
		return redisManager.del(CACHE_KEYS.TOKEN_BY_SYMBOL, symbol.toLowerCase());
	}

	static async getTokenHolders(tokenId: string) {
		return redisManager.get(CACHE_KEYS.TOKEN_HOLDERS, tokenId);
	}

	static async setTokenHolders(
		tokenId: string,
		data: any,
		ttl = CACHE_TTL.MEDIUM,
	): Promise<void> {
		await redisManager.set(CACHE_KEYS.TOKEN_HOLDERS, tokenId, data, ttl);
	}

	static async invalidateTokenHolders(tokenId: string) {
		return redisManager.del(CACHE_KEYS.TOKEN_HOLDERS, tokenId);
	}

	static async getTokenMetrics(tokenId: string) {
		return redisManager.get(CACHE_KEYS.TOKEN_METRICS, tokenId);
	}

	static async setTokenMetrics(
		tokenId: string,
		data: any,
		ttl = CACHE_TTL.MEDIUM,
	): Promise<void> {
		await redisManager.set(CACHE_KEYS.TOKEN_METRICS, tokenId, data, ttl);
	}

	static async invalidateTokenMetrics(tokenId: string) {
		return redisManager.del(CACHE_KEYS.TOKEN_METRICS, tokenId);
	}

	static async getTokenPayments(tokenId: string) {
		return redisManager.get(CACHE_KEYS.TOKEN_PAYMENTS, tokenId);
	}

	static async setTokenPayments(
		tokenId: string,
		data: any,
		ttl = CACHE_TTL.MEDIUM,
	): Promise<void> {
		await redisManager.set(CACHE_KEYS.TOKEN_PAYMENTS, tokenId, data, ttl);
	}

	static async invalidateTokenPayments(tokenId: string) {
		return redisManager.del(CACHE_KEYS.TOKEN_PAYMENTS, tokenId);
	}

	static async getTokenWallets(tokenId: string) {
		return redisManager.get(CACHE_KEYS.TOKEN_WALLETS, tokenId);
	}

	static async setTokenWallets(
		tokenId: string,
		data: any,
		ttl = CACHE_TTL.MEDIUM,
	): Promise<void> {
		await redisManager.set(CACHE_KEYS.TOKEN_WALLETS, tokenId, data, ttl);
	}

	static async invalidateTokenWallets(tokenId: string) {
		return redisManager.del(CACHE_KEYS.TOKEN_WALLETS, tokenId);
	}

	// Invalidate all caches for a specific token
	static async invalidateTokenCaches(tokenId: string) {
		const promises = [
			redisManager.del(CACHE_KEYS.TOKEN_HOLDERS, tokenId),
			redisManager.del(CACHE_KEYS.TOKEN_METRICS, tokenId),
			redisManager.del(CACHE_KEYS.TOKEN_PAYMENTS, tokenId),
			redisManager.del(CACHE_KEYS.TOKEN_WALLETS, tokenId),
		];

		await Promise.allSettled(promises);
		console.log(`🧹 Invalidated all caches for token: ${tokenId}`);
	}

	// Invalidate all caches (useful after sync operations)
	static async invalidateAllCaches() {
		const patterns = Object.values(CACHE_KEYS).map((key) => `${key}:*`);
		const promises = patterns.map((pattern) => redisManager.invalidatePattern(pattern));

		await Promise.allSettled(promises);
		console.log("🧹 Invalidated all caches");
	}
}
