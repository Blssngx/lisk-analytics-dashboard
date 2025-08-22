export class WalletDataProcessor {
  static processWalletData(moralisData: any) {
    const owners = moralisData.result;
    
    // Group by date or current date for fallback
    const currentDate = new Date().toISOString().split('T')[0];
    
    const uniqueWallets = new Set(owners.map((owner: any) => owner.ownerOf));
    
    return [{
      date: currentDate,
      uniqueWalletCount: uniqueWallets.size,
      newWallets: uniqueWallets.size, 
      activeWallets: uniqueWallets.size 
    }];
  }
 
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

    for (const date of sortedDates) {
      const dailyWalletsSet = dailyWallets.get(date)!;
      
      
      let newWalletsCount = 0;
      dailyWalletsSet.forEach(wallet => {
        if (!cumulativeWallets.has(wallet)) {
          newWalletsCount++;
          cumulativeWallets.add(wallet);
        }
      });
      
      result.push({
        date,
        uniqueWalletCount: cumulativeWallets.size,
        newWallets: newWalletsCount, 
        activeWallets: dailyWalletsSet.size 
      });
    }

    return result;
  }
}
