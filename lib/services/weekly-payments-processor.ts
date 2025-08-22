export class WeeklyPaymentsProcessor {

  private static getWeekStartDate(date: Date): string {
    // Get Monday of the week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  }
  private static bigIntToNumber(value: bigint, decimals: number): number {
    try {
      const base = BigInt('1' + '0'.repeat(decimals))
      const integer = value / base
      const fraction = value % base
      const fractionStrRaw = fraction.toString().padStart(decimals, '0')
      const fractionStr = fractionStrRaw.replace(/0+$/, '')
      const asString = fractionStr ? `${integer.toString()}.${fractionStr}` : integer.toString()
      return Number(asString)
    } catch {
      // Fallback: return Number conversion directly
      return Number(value)
    }
  }

  // using transaction receipts
  static async processWeeklyPaymentsFromTransactions(transactions: any[], methodId: string, decimals: number = 18) {
    const weeklyData = new Map<string, {
      weekStartDate: string;
      totalPaymentsAmount: number;
      paymentCount: number;
    }>();

    transactions.forEach((tx: any) => {
      const ts = tx.block_timestamp || tx.blockTimestamp
      const timestamp = new Date(ts)
      const weekStartDate = this.getWeekStartDate(timestamp);
      
      // Check if this transaction calls the specific method
      if (tx.input && tx.input.startsWith(methodId)) {
        const amount: number = Array.isArray(tx.logs)
          ? tx.logs.reduce((acc: number, currentLog: { decoded_event?: { params: { value: string }[] } }) => {
              const rawValue = currentLog?.decoded_event?.params?.[2]?.value;
              if (rawValue == null) return acc;
              try {
                const asBigInt = BigInt(rawValue);
                const scaled = this.bigIntToNumber(asBigInt, 18);
                return acc + (Number.isFinite(scaled) ? scaled : 0);
              } catch {
                return acc;
              }
            }, 0)
          : 0;

        if (weeklyData.has(weekStartDate)) {
          const existing = weeklyData.get(weekStartDate)!;
          existing.totalPaymentsAmount += amount;
          existing.paymentCount += 1;
        } else {
          weeklyData.set(weekStartDate, {
            weekStartDate,
            totalPaymentsAmount: amount,
            paymentCount: 1
          });
        }
      }
    });
    return Array.from(weeklyData.values()).map(week => ({
      weekStartDate: week.weekStartDate,
      totalPaymentsAmount: week.totalPaymentsAmount,
      paymentCount: week.paymentCount,
      averagePayment: week.paymentCount > 0 ? week.totalPaymentsAmount / week.paymentCount : 0
    }));
  }
}
