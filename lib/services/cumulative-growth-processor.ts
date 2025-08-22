export class CumulativeGrowthProcessor {
  static processCumulativeData(moralisData: any) {
    const ZERO = "0x0000000000000000000000000000000000000000";

    const transfers = moralisData.result.filter(
      (tx: { from_address: string; to_address: string }) =>
        tx.from_address !== ZERO && tx.to_address !== ZERO
    );

    // Group transfers by date
    const dailyData = new Map<string, {
      date: string;
      dailyTxCount: number;
      dailyTxAmount: number;
    }>();

    transfers.forEach((transfer: any) => {
      const date = new Date(transfer.block_timestamp).toISOString().split('T')[0];
      
      let amount = parseFloat(transfer.value_decimal)

      if (dailyData.has(date)) {
        const existing = dailyData.get(date)!;
        existing.dailyTxCount += 1;
        existing.dailyTxAmount += amount;
      } else {
        dailyData.set(date, {
          date,
          dailyTxCount: 1,
          dailyTxAmount: amount
        });
      }
    });

    // Calculate cumulative values
    const sortedDates = Array.from(dailyData.keys()).sort();
    let cumulativeTxCount = 0;
    let cumulativeTxAmount = 0;

    return sortedDates.map(date => {
      const daily = dailyData.get(date)!;
      cumulativeTxCount += daily.dailyTxCount;
      cumulativeTxAmount += daily.dailyTxAmount;

      return {
        date,
        cumulativeTxCount,
        cumulativeTxAmount,
        dailyTxCount: daily.dailyTxCount,
        dailyTxAmount: daily.dailyTxAmount
      };
    });
  }
}
