# 🚀 Lisk Analytics Dashboard

A comprehensive, real-time analytics dashboard for tracking LZAR (Lisk ZAR) and LUSD (Lisk USD) token metrics on the Lisk blockchain. Built with Next.js 14, TypeScript, and modern caching architecture.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAEAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?&style=for-the-badge&logo=redis&logoColor=white)

## ✨ Features

### 📊 **Analytics & Visualizations**

-   **Real-time Token Metrics**: Live tracking of LZAR and LUSD token data
-   **Interactive Charts**: Cumulative growth, holder distribution, unique wallets, weekly payments
-   **Token Holder Analysis**: Pie charts with whale/large/medium/small holder categorization
-   **Bubble Charts**: Visual representation of holder distribution patterns
-   **Time Range Filtering**: 7/30/90 days and custom date ranges

### 🔄 **Data Sources & Integration**

-   **Moralis API Integration**: Real-time blockchain data fetching
-   **Automated Sync**: Background data synchronization with intelligent scheduling
-   **Contract Address Tracking**: Multi-contract support for different tokens
-   **Blockchain Analytics**: Transaction analysis and wallet activity tracking

### ⚡ **Performance & Caching**

-   **Advanced Redis Caching**: Multi-tier TTL system with circuit breaker pattern
-   **Connection Pooling**: Optimized Redis connection management
-   **Cache Invalidation**: Smart pattern-based cache clearing
-   **Fallback Strategies**: Graceful degradation when cache is unavailable
-   **Cache Monitoring**: Hit/miss tracking and performance metrics

### 🎨 **Modern UI/UX**

-   **Dark Theme**: Sleek, modern dark interface
-   **Responsive Design**: Mobile-first approach with adaptive layouts
-   **Loading States**: Skeleton loaders and smooth transitions
-   **Error Handling**: User-friendly error messages and recovery options
-   **Interactive Elements**: Hover states, animations, and real-time updates

### 🔐 **Authentication & Security**

-   **NextAuth.js**: Secure authentication system
-   **Protected Routes**: Role-based access control
-   **Session Management**: Persistent user sessions
-   **Environment Security**: Secure API key management

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14 App Router │ React 18 │ TypeScript │ TailwindCSS│
│  • Dynamic Routes      │ • Hooks  │ • Strict   │ • Components│
│  • Server Components  │ • Context│ • Types    │ • Responsive│
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
├─────────────────────────────────────────────────────────────┤
│           Route Handlers │ Middleware │ Services              │
│  • /api/tokens/*        │ • Auth     │ • TokenDataService   │
│  • /api/symbol/*        │ • CORS     │ • CacheService       │
│  • /api/queries/*       │ • Cache    │ • Processors         │
│  • /api/cron/*          │ • Rate     │ • Validators         │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Caching Layer                             │
├─────────────────────────────────────────────────────────────┤
│     Redis Cloud │ Circuit Breaker │ Connection Pool         │
│  • Multi-TTL    │ • Failover      │ • Auto-reconnect       │
│  • Pattern Keys │ • Monitoring    │ • Health Checks        │
│  • Invalidation │ • Metrics       │ • Load Balancing       │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer                             │
├─────────────────────────────────────────────────────────────┤
│    MongoDB Atlas │ Prisma ORM │ Connection Pooling          │
│  • Documents    │ • Type Safe │ • Auto-scaling             │
│  • Indexes     │ • Migrations│ • Backup & Recovery        │
│  • Aggregation │ • Relations │ • Global Distribution      │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│               External Services                             │
├─────────────────────────────────────────────────────────────┤
│   Moralis API │ Lisk Network │ Token Contracts              │
│ • Blockchain  │ • EVM Chain  │ • LZAR: 0x7b70...           │
│ • Real-time   │ • 1135       │ • LUSD: 0x2A0F...           │
│ • REST/GraphQL│ • Events     │ • Transfer Events           │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ **Tech Stack**

### **Frontend**

-   **Next.js 14**: App Router, Server Components, API Routes
-   **React 18**: Hooks, Context API, Suspense
-   **TypeScript**: Strict type checking, interface definitions
-   **TailwindCSS**: Utility-first styling, responsive design
-   **Recharts**: Interactive data visualizations
-   **React Query**: Data fetching, caching, synchronization

### **Backend & API**

-   **Next.js API Routes**: RESTful endpoints
-   **Prisma ORM**: Database modeling, migrations, type safety
-   **MongoDB**: Document database, flexible schema
-   **Redis**: Advanced caching, session storage
-   **Moralis**: Blockchain data provider

### **Developer Experience**

-   **ESLint**: Code linting and formatting
-   **Prettier**: Code formatting
-   **Husky**: Git hooks
-   **TypeScript**: Static type checking
-   **Vercel**: Deployment and hosting

## 🚀 **Quick Start**

### **Prerequisites**

-   Node.js 18.17+
-   npm/yarn/pnpm
-   MongoDB database
-   Redis instance
-   Moralis API key

### **1. Clone Repository**

```bash
git clone https://github.com/mmpotulo28/lisk-analytics-dashboard.git
cd lisk-analytics-dashboard
```

### **2. Install Dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

### **3. Environment Setup**

Create `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority"

# Moralis API
MORALIS_API_KEY="your_moralis_api_key"
NEXT_PUBLIC_LZAR_CONTRACT_ADDRESS="0x7b7047c49eaf68b8514a20624773ca620e2cd4a3"
NEXT_PUBLIC_LUSD_CONTRACT_ADDRESS="0x2A0FA5d670DEb472c1a72977b75Ba53D1E6FAB72"

# Redis Cache
REDIS_PASSWORD="your_redis_password"
REDIS_HOST="your_redis_host"
REDIS_PORT="your_redis_port"

# Authentication
NEXT_AUTH_SECRET="your_nextauth_secret"
```

### **4. Database Setup**

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Optional: Seed initial data
npx prisma db seed
```

### **5. Start Development Server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 **Project Structure**

```
lisk-analytics-dashboard/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 api/                      # API Routes
│   │   ├── 📁 tokens/               # Token management endpoints
│   │   ├── 📁 symbol/               # Token by symbol lookup
│   │   ├── 📁 queries/              # Data query endpoints
│   │   └── 📁 cron/                 # Scheduled tasks
│   ├── 📁 dashboard/                # Dashboard pages
│   │   └── 📁 [symbol]/             # Dynamic token pages
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home page
├── 📁 components/                   # React components
│   ├── 📁 charts/                   # Chart components
│   ├── 📁 providers/                # Context providers
│   └── 📁 ui/                       # UI components
├── 📁 lib/                          # Utilities & services
│   ├── 📁 services/                 # Business logic
│   │   ├── cache-service.ts         # Redis cache management
│   │   ├── token-data-service.ts    # Token data operations
│   │   └── *-processor.ts           # Data processors
│   ├── cache-middleware.ts          # Cache middleware
│   ├── redis.ts                     # Redis configuration
│   └── utils.ts                     # Utility functions
├── 📁 hooks/                        # Custom React hooks
├── 📁 types/                        # TypeScript definitions
├── 📁 prisma/                       # Database schema
└── 📁 public/                       # Static assets
```

## 🎯 **Key Components**

### **Caching System**

```typescript
// Advanced caching with fallback
const result = await withCacheFallback(
	() => CacheService.getTokens(), // Cache operation
	() => TokenDataService.getAllTokens(), // Fallback operation
	(data) => CacheService.setTokens(data), // Cache set operation
);
```

### **Data Processing**

```typescript
// Token holders analysis
const processedData = TokenHoldersProcessor.processHoldersData(moralisData, token);
const pieChartData = TokenHoldersProcessor.formatForPieChart(processedData);
```

### **API Routes**

```typescript
// Cached API endpoint
export async function GET() {
	const result = await withCacheFallback(
		() => CacheService.getTokenMetrics(tokenId),
		() => TokenDataService.getAllCumulativeMetrics(tokenId),
		(data) => CacheService.setTokenMetrics(tokenId, data),
	);
	return NextResponse.json(result);
}
```

## 📊 **Dashboard Features**

### **Token Overview**

-   Real-time token prices and market data
-   Total supply and circulating supply tracking
-   24h price changes and volume metrics
-   Market capitalization calculations

### **Holder Analytics**

-   **Whale Tracking**: Holders with >1% of supply
-   **Large Holders**: 0.1% - 1% of supply
-   **Medium Holders**: 0.01% - 0.1% of supply
-   **Small Holders**: <0.01% of supply
-   Interactive pie charts and bubble visualizations

### **Transaction Metrics**

-   Daily transaction counts and volumes
-   Cumulative growth charts with time range filtering
-   Transaction amount distributions
-   Gas usage analytics

### **Wallet Activity**

-   Unique wallet counts over time
-   New wallet adoption tracking
-   Active wallet engagement metrics
-   Wallet growth rate calculations

### **Payment Analysis**

-   Weekly payment distributions
-   Average payment amounts
-   Payment frequency analysis
-   Interest payment tracking

## 🔧 **API Endpoints**

### **Token Management**

-   `GET /api/tokens` - List all tokens
-   `POST /api/tokens` - Create new token
-   `GET /api/symbol/[symbol]` - Get token by symbol

### **Token Data**

-   `GET /api/tokens/[tokenId]/metrics` - Cumulative metrics
-   `GET /api/tokens/[tokenId]/holders` - Holder distribution
-   `GET /api/tokens/[tokenId]/wallets` - Wallet analytics
-   `GET /api/tokens/[tokenId]/payments` - Payment data

### **Live Queries**

-   `GET /api/queries/holders?contractAddress=0x...` - Live holder data
-   `GET /api/queries/cumulative-growth?contractAddress=0x...` - Growth metrics
-   `GET /api/queries/unique-wallets?contractAddress=0x...` - Wallet data
-   `GET /api/queries/weekly-payments?contractAddress=0x...` - Payment data

### **Sync Operations**

-   `GET /api/cron/sync-moralis` - Sync all token data
-   `GET /api/cron/sync-moralis?contracts=LZAR` - Sync specific token

## 🚀 **Deployment**

### **Vercel (Recommended)**

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

### **Manual Deployment**

```bash
# Build for production
npm run build

# Start production server
npm start
```

### **Environment Variables for Production**

```env
# Production database
DATABASE_URL="mongodb+srv://..."

# Production Redis
REDIS_URL="rediss://..."

# API keys
MORALIS_API_KEY="..."
NEXT_AUTH_SECRET="..."

# Contract addresses
NEXT_PUBLIC_LZAR_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_LUSD_CONTRACT_ADDRESS="0x..."
```

## 🔍 **Monitoring & Analytics**

### **Cache Performance**

```typescript
// Cache metrics monitoring
const metrics = CacheMonitor.getMetrics();
console.log(`Cache hit rate: ${metrics.hitRate}%`);
```

### **Error Tracking**

-   Comprehensive error handling with fallback strategies
-   Redis circuit breaker for connection failures
-   Graceful degradation when external APIs are unavailable
-   User-friendly error messages and retry mechanisms

### **Performance Optimization**

-   Server-side rendering for fast initial loads
-   Incremental Static Regeneration (ISR) for cached pages
-   Image optimization with Next.js Image component
-   Bundle splitting and lazy loading

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 **Team**

-   **Creator**: Solomon Adzape
-   **Repository**: [mmpotulo28/lisk-analytics-dashboard](https://github.com/mmpotulo28/lisk-analytics-dashboard)

## 🔗 **Links**

-   [Live Demo](https://lisk-analytics-dashboard.vercel.app)
-   [Documentation](./README-DATABASE.md)
-   [Issue Tracker](https://github.com/mmpotulo28/lisk-analytics-dashboard/issues)
-   [Changelog](./CHANGELOG.md)

---

**Built with ❤️ for the Lisk community**
