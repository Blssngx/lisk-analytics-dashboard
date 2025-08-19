# Lisk Dashboard Database Schema & API Documentation

## Overview

This document describes the updated Prisma schema and API structure for the Lisk Dashboard, designed to efficiently store and retrieve token analytics data for LZAR and LUSD tokens.

## Database Schema

### Core Models

#### Token Model
The central model that represents each token in the system.

```prisma
model Token {
  id               String @id @default(uuid())
  name             String @unique // e.g., "Lisk ZAR" or "Lisk USD"
  symbol           String @unique // e.g., "LZAR" or "LUSD"
  contractAddress  String @unique
  decimals         Int    @default(18)
  totalSupply      Decimal @db.Decimal(65, 30) @default(0)
  isActive         Boolean @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  // Relations
  dailyMetrics     DailyCumulativeMetrics[]
  uniqueWallets    DailyUniqueWallets[]
  weeklyPayments   WeeklyPayments[]
  priceData        TokenPriceData[]
  transactionActivity TransactionActivity[]
  hourlyActivity   HourlyActivity[]
}
```

#### DailyCumulativeMetrics
Stores daily cumulative transaction data for growth charts.

```prisma
model DailyCumulativeMetrics {
  id                   String   @id @default(uuid())
  date                 DateTime @db.Date
  cumulativeTxCount    BigInt
  cumulativeTxAmount   Decimal  @db.Decimal(65, 30)
  dailyTxCount         BigInt   @default(0)
  dailyTxAmount        Decimal  @db.Decimal(65, 30) @default(0)
  
  tokenId              String
  token                Token    @relation(fields: [tokenId], references: [id], onDelete: Cascade)

  @@unique([tokenId, date])
  @@index([tokenId, date])
}
```

#### DailyUniqueWallets
Tracks daily unique wallet statistics.

```prisma
model DailyUniqueWallets {
  id                String   @id @default(uuid())
  date              DateTime @db.Date
  uniqueWalletCount BigInt
  newWallets        BigInt   @default(0)
  activeWallets     BigInt   @default(0)

  tokenId           String
  token             Token    @relation(fields: [tokenId], references: [id], onDelete: Cascade)

  @@unique([tokenId, date])
  @@index([tokenId, date])
}
```

#### WeeklyPayments
Stores weekly interest payment data.

```prisma
model WeeklyPayments {
  id                  String   @id @default(uuid())
  weekStartDate       DateTime @db.Date
  totalPaymentsAmount Decimal  @db.Decimal(65, 30)
  paymentCount        BigInt   @default(0)
  averagePayment      Decimal  @db.Decimal(65, 30) @default(0)

  tokenId             String
  token               Token    @relation(fields: [tokenId], references: [id], onDelete: Cascade)

  @@unique([tokenId, weekStartDate])
  @@index([tokenId, weekStartDate])
}
```

#### TokenPriceData
Stores price and market data for price charts.

```prisma
model TokenPriceData {
  id          String   @id @default(uuid())
  timestamp   DateTime
  price       Decimal  @db.Decimal(20, 8)
  volume      Decimal  @db.Decimal(65, 30) @default(0)
  marketCap   Decimal  @db.Decimal(65, 30) @default(0)
  change24h   Decimal  @db.Decimal(10, 4) @default(0)

  tokenId     String
  token       Token    @relation(fields: [tokenId], references: [id], onDelete: Cascade)

  @@index([tokenId, timestamp])
  @@index([timestamp])
}
```

#### TransactionActivity
Stores individual transaction data for detailed analysis.

```prisma
model TransactionActivity {
  id              String   @id @default(uuid())
  timestamp       DateTime
  transactionHash String?  @db.VarChar(66)
  fromAddress     String   @db.VarChar(42)
  toAddress       String   @db.VarChar(42)
  amount          Decimal  @db.Decimal(65, 30)
  gasUsed         BigInt   @default(0)
  gasPrice        BigInt   @default(0)
  blockNumber     BigInt?
  isSuccess       Boolean  @default(true)

  tokenId         String
  token           Token    @relation(fields: [tokenId], references: [id], onDelete: Cascade)

  @@index([tokenId, timestamp])
  @@index([fromAddress])
  @@index([toAddress])
  @@index([timestamp])
}
```

#### HourlyActivity
Stores hourly activity data for heatmap charts.

```prisma
model HourlyActivity {
  id              String   @id @default(uuid())
  date            DateTime @db.Date
  hour            Int      // 0-23
  transactionCount BigInt  @default(0)
  totalVolume     Decimal  @db.Decimal(65, 30) @default(0)
  uniqueWallets   BigInt   @default(0)

  tokenId         String
  token           Token    @relation(fields: [tokenId], references: [id], onDelete: Cascade)

  @@unique([tokenId, date, hour])
  @@index([tokenId, date])
  @@index([date, hour])
}
```

## API Endpoints

### Token Management

#### GET /api/tokens
Retrieve all tokens or a specific token.

**Query Parameters:**
- `tokenId` (optional): Get specific token
- `includeData` (optional): Include related data

**Example:**
```bash
GET /api/tokens?includeData=true
GET /api/tokens?tokenId=123&includeData=true
```

#### POST /api/tokens
Create a new token.

**Body:**
```json
{
  "name": "Lisk ZAR",
  "symbol": "LZAR",
  "contractAddress": "0x1234...",
  "decimals": 18,
  "totalSupply": 1000000000
}
```

### Token Metrics

#### GET /api/tokens/[tokenId]/metrics
Retrieve token metrics data.

**Query Parameters:**
- `type`: 'cumulative', 'wallets', 'payments', or omit for all
- `days`: Number of days (default: 30)
- `weeks`: Number of weeks (default: 12)

**Example:**
```bash
GET /api/tokens/123/metrics?type=cumulative&days=30
GET /api/tokens/123/metrics?type=wallets&days=7
GET /api/tokens/123/metrics?type=payments&weeks=12
```

#### POST /api/tokens/[tokenId]/metrics
Update token metrics data.

**Body:**
```json
{
  "metricType": "cumulative",
  "data": {
    "date": "2024-01-01",
    "cumulativeTxCount": 1000,
    "cumulativeTxAmount": 50000,
    "dailyTxCount": 50,
    "dailyTxAmount": 2500
  }
}
```

### Token Price Data

#### GET /api/tokens/[tokenId]/price
Retrieve token price data.

**Query Parameters:**
- `hours`: Number of hours (default: 24)
- `days`: Number of days (default: 7)

**Example:**
```bash
GET /api/tokens/123/price?hours=24
GET /api/tokens/123/price?days=7
```

#### POST /api/tokens/[tokenId]/price
Create new price data point.

**Body:**
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "price": 1.00,
  "volume": 100000,
  "marketCap": 1000000000,
  "change24h": 0
}
```

### Token Activity

#### GET /api/tokens/[tokenId]/activity
Retrieve transaction activity data.

**Query Parameters:**
- `type`: 'transactions', 'hourly', 'heatmap'
- `days`: Number of days (default: 7)
- `limit`: Number of transactions (default: 100)

**Example:**
```bash
GET /api/tokens/123/activity?type=transactions&limit=50
GET /api/tokens/123/activity?type=heatmap&days=7
```

#### POST /api/tokens/[tokenId]/activity
Create new activity data.

**Body:**
```json
{
  "activityType": "transaction",
  "data": {
    "timestamp": "2024-01-01T00:00:00Z",
    "transactionHash": "0x1234...",
    "fromAddress": "0xabcd...",
    "toAddress": "0xefgh...",
    "amount": 1000,
    "gasUsed": 21000,
    "gasPrice": 20000000000,
    "blockNumber": 12345,
    "isSuccess": true
  }
}
```

## Data Service

The `TokenDataService` class provides a comprehensive interface for working with token data:

```typescript
import { TokenDataService } from '@/lib/services/token-data-service'

// Create a token
const token = await TokenDataService.createToken({
  name: 'Lisk ZAR',
  symbol: 'LZAR',
  contractAddress: '0x1234...'
})

// Update cumulative metrics
await TokenDataService.upsertCumulativeMetrics(tokenId, {
  date: '2024-01-01',
  cumulativeTxCount: 1000,
  cumulativeTxAmount: 50000
})

// Get token summary
const summary = await TokenDataService.getTokenSummary(tokenId)
```

## Setup Instructions

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Run Database Migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Seed Initial Data:**
   ```bash
   npx tsx scripts/seed-tokens.ts
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

## Key Features

- **Token Classification**: Each data point is properly classified by token ID
- **Efficient Indexing**: Optimized database indexes for fast queries
- **Cascade Deletion**: Automatic cleanup when tokens are deleted
- **Bulk Operations**: Support for bulk data insertion and updates
- **Analytics Support**: Built-in methods for growth rate calculations
- **Flexible API**: Query parameters for customizing data retrieval
- **Type Safety**: Full TypeScript support with Prisma client

## Data Flow

1. **Data Collection**: External data sources fetch token information
2. **Data Processing**: Backend processes and validates the data
3. **Data Storage**: Processed data is stored in the database using the API endpoints
4. **Data Retrieval**: Frontend components fetch data through the API
5. **Data Visualization**: Charts and metrics display the retrieved data

This structure ensures that your token data is properly organized, efficiently stored, and easily accessible for your dashboard components.
