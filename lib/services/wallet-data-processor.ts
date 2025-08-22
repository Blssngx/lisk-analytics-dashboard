export class WalletDataProcessor {
  static processWalletData(moralisData: any) {
    const owners = moralisData.result;
    
    // Group by date (assuming we have timestamp data)
    // If not, we'll use current date as fallback
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Count unique wallets
    const uniqueWallets = new Set(owners.map((owner: any) => owner.ownerOf));
    
    return [{
      date: currentDate,
      uniqueWalletCount: uniqueWallets.size,
      newWallets: uniqueWallets.size, // This would need historical comparison
      activeWallets: uniqueWallets.size // This would need transaction activity
    }];
  }

  // Alternative method if you have transaction data
  static processWalletDataFromTransactions(transactions: any[]) {
    const dailyWallets = new Map<string, Set<string>>();

    // First pass: group wallets by date
    transactions.forEach((tx: any) => {
      const date = new Date(tx.blockTimestamp).toISOString().split('T')[0];
      const fromAddress = tx.fromAddress;
      const toAddress = tx.toAddress;

      if (!dailyWallets.has(date)) {
        dailyWallets.set(date, new Set());
      }

      dailyWallets.get(date)!.add(fromAddress);
      dailyWallets.get(date)!.add(toAddress);
    });

    // Calculate cumulative unique wallets
    const sortedDates = Array.from(dailyWallets.keys()).sort();
    const result = [];
    const cumulativeWallets = new Set<string>();

    // Debug: Log all unique wallet addresses found
    const allAddresses = new Set<string>();
    dailyWallets.forEach((wallets, date) => {
      wallets.forEach(wallet => allAddresses.add(wallet));
    });
    // console.log(`Total unique wallet addresses found: ${allAddresses.size}`);
    // console.log(`Sample addresses: ${Array.from(allAddresses).slice(0, 5).join(', ')}`);

    for (const date of sortedDates) {
      const dailyWalletsSet = dailyWallets.get(date)!;
      
      // Count new wallets (wallets that weren't in cumulative set before)
      let newWalletsCount = 0;
      dailyWalletsSet.forEach(wallet => {
        if (!cumulativeWallets.has(wallet)) {
          newWalletsCount++;
          cumulativeWallets.add(wallet);
        }
      });
      
      result.push({
        date,
        uniqueWalletCount: cumulativeWallets.size, // Cumulative unique wallets up to this date
        newWallets: newWalletsCount, // New wallets that appeared for the first time today
        activeWallets: dailyWalletsSet.size // Active wallets on this specific day
      });
    }

    return result;
  }

  // Method using token transfers (more comprehensive)
  static processWalletDataFromTransfers(transfers: any[]) {
    const dailyWallets = new Map<string, Set<string>>();

    // First pass: group wallets by date
    transfers.forEach((transfer: any) => {
      const date = new Date(transfer.block_timestamp).toISOString().split('T')[0];
      const fromAddress = transfer.from_address;
      const toAddress = transfer.to_address;

      if (!dailyWallets.has(date)) {
        dailyWallets.set(date, new Set());
      }

      dailyWallets.get(date)!.add(fromAddress);
      dailyWallets.get(date)!.add(toAddress);
    });

    // Calculate cumulative unique wallets
    const sortedDates = Array.from(dailyWallets.keys()).sort();
    const result = [];
    const cumulativeWallets = new Set<string>();

    // Debug: Log all unique wallet addresses found
    const allAddresses = new Set<string>();
    dailyWallets.forEach((wallets, date) => {
      wallets.forEach(wallet => allAddresses.add(wallet));
    });
    console.log(`Total unique wallet addresses found: ${allAddresses.size}`);
    console.log(`Sample addresses: ${Array.from(allAddresses).slice(0, 5).join(', ')}`);

    for (const date of sortedDates) {
      const dailyWalletsSet = dailyWallets.get(date)!;
      
      // Count new wallets (wallets that weren't in cumulative set before)
      let newWalletsCount = 0;
      dailyWalletsSet.forEach(wallet => {
        if (!cumulativeWallets.has(wallet)) {
          newWalletsCount++;
          cumulativeWallets.add(wallet);
        }
      });
      
      result.push({
        date,
        uniqueWalletCount: cumulativeWallets.size, // Cumulative unique wallets up to this date
        newWallets: newWalletsCount, // New wallets that appeared for the first time today
        activeWallets: dailyWalletsSet.size // Active wallets on this specific day
      });
    }

    return result;
  }
}
