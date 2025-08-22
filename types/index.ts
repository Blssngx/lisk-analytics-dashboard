export interface MoralisTokenData {
    address: string
    address_label: string | null
    name: string
    symbol: string
    decimals: string
    logo: string | null
    logo_hash: string | null
    thumbnail: string | null
    total_supply: string
    total_supply_formatted: string
    fully_diluted_valuation: string
    block_number: string
    validated: number
    created_at: string
    possible_spam: boolean
    verified_contract: boolean
    categories: string[]
    links: Record<string, any>
    security_score: number | null
    description: string | null
    circulating_supply: string
    market_cap: string
  }
  
  export interface MoralisTransaction {
    hash: string
    nonce: string
    transaction_index: string
    from_address: string
    to_address: string
    value: string
    gas: string
    gas_price: string
    input: string
    receipt_cumulative_gas_used: string
    receipt_gas_used: string
    receipt_contract_address: string | null
    receipt_root: string | null
    receipt_status: string
    block_timestamp: string
    block_number: string
    block_hash: string
    transfer_index: number[]
  }
  
  export interface MoralisTransfer {
    transaction_hash: string
    address: string
    block_timestamp: string
    block_number: string
    block_hash: string
    to_address: string
    from_address: string
    value: string
    transaction_type: string
    token_address: string
    token_name: string
    token_symbol: string
    token_decimals: string
    token_logo: string | null
    token_thumbnail: string | null
    token_logo_hash: string | null
    token_thumbnail_hash: string | null
    method_label: string | null
    method_name: string | null
    block_truncated: boolean
    category: string
    verified: number
    verified_method: string | null
    verified_method_signature: string | null
    verified_method_signature_hash: string | null
    verified_contract: boolean
    verified_contract_name: string | null
    verified_contract_symbol: string | null
    verified_contract_decimals: number | null
    verified_contract_logo: string | null
    verified_contract_thumbnail: string | null
    verified_contract_logo_hash: string | null
    verified_contract_thumbnail_hash: string | null
    collection_logo: string | null
    collection_thumbnail: string | null
    collection_logo_hash: string | null
    collection_thumbnail_hash: string | null
    possible_spam: boolean
    verified_collection: boolean
    verified_collection_name: string | null
    verified_collection_symbol: string | null
    verified_collection_logo: string | null
    verified_collection_thumbnail: string | null
    verified_collection_logo_hash: string | null
    verified_collection_thumbnail_hash: string | null
    nft_token_id: string | null
    nft_metadata_name: string | null
    nft_metadata_symbol: string | null
    nft_metadata_contract_type: string | null
    nft_metadata_token_hash: string | null
    nft_metadata_last_token_uri_sync: string | null
    nft_metadata_last_metadata_sync: string | null
    amount: string
    amount_decimal: string
    block_decimal: string
    log_index: number
    value_decimal: string
    value_quote: number
    pretty_value_quote: string
    gas_offered: string
    gas_spent: string
    gas_price: string
    fees_paid: string
    gas_quote: number
    pretty_gas_quote: string
    gas_quote_rate: number
    log_offset: number
    raw_log_data: string
    decoded_log: {
      name: string
      signature: string
      params: Array<{
        name: string
        type: string
        indexed: boolean
        decoded: boolean
        value: string
      }>
    } | null
  }
  export interface Token {
    id: string
    name: string
    symbol: string
    contractAddress: string
    decimals: number
    totalSupply: string
    totalSupplyFormatted?: string
    circulatingSupply?: string
    marketCap: string
    blockNumber?: number
    validated: number
    verifiedContract: boolean
    possibleSpam: boolean
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  export interface DailyCumulativeMetrics {
    id: string
    date: string
    cumulativeTxCount: number
    cumulativeTxAmount: string
    dailyTxCount: number
    dailyTxAmount: string
    tokenId: string
  }
  
  export interface DailyUniqueWallets {
    id: string
    date: string
    uniqueWalletCount: number
    newWallets: number
    activeWallets: number
    tokenId: string
  }
  
  export interface WeeklyPayments {
    id: string
    weekStartDate: string
    totalPaymentsAmount: string
    paymentCount: number
    averagePayment: string
    tokenId: string
  }
  
  export interface TokenHolders {
    id: string
    date: string
    totalHolders: number
    totalSupply: string
    whaleCount: number
    largeCount: number
    mediumCount: number
    smallCount: number
    holdersData: any
    tokenId: string
  }
  export interface TokenData {
    name: string
    symbol: string
    contractAddress: string
    decimals?: number
    totalSupply?: number
    totalSupplyFormatted?: string
    circulatingSupply?: string
    marketCap?: number
    blockNumber?: number
    validated?: number
    verifiedContract?: boolean
    possibleSpam?: boolean
  }
  
  export interface CumulativeMetricsData {
    date: string
    cumulativeTxCount: number
    cumulativeTxAmount: number
    dailyTxCount?: number
    dailyTxAmount?: number
  }
  
  export interface WalletData {
    date: string
    uniqueWalletCount: number
    newWallets?: number
    activeWallets?: number
  }
  
  export interface PaymentData {
    weekStartDate: string
    totalPaymentsAmount: number
    paymentCount?: number
    averagePayment?: number
  }
  
  export interface PriceData {
    timestamp: string
    price: number
    volume?: number
    marketCap?: number
    change24h?: number
  }
  export interface TokenHolder {
    address: string;
    balance: number;
    balanceFormatted: string;
    percentage: number;
  }
  
  export interface ProcessedHoldersData {
    totalHolders: number;
    totalSupply: number;
    holders: TokenHolder[];
    distribution: {
      whales: number;
      large: number; 
      medium: number; 
      small: number;
    };
  }