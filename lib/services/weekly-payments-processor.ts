export class WeeklyPaymentsProcessor {
  static processWeeklyPaymentsFromLogs(contractLogs: any[], methodId: string, decimals: number = 18) {
    // Group logs by week
    const weeklyData = new Map<string, {
      weekStartDate: string;
      totalPaymentsAmount: number;
      paymentCount: number;
      transactions: any[];
    }>();

    contractLogs.forEach((log: any) => {
      const timestamp = new Date(parseInt(log.blockTimestamp) * 1000);
      const weekStartDate = this.getWeekStartDate(timestamp);
      
      // Decode the log data to get the transfer amount
      // For ERC20 transfer (0xa9059cbb), the data contains the recipient and amount
      const amount = this.decodeTransferAmount(log.data, decimals);
      if (weeklyData.has(weekStartDate)) {
        const existing = weeklyData.get(weekStartDate)!;
        existing.totalPaymentsAmount += amount;
        existing.paymentCount += 1;
        existing.transactions.push(log);
      } else {
        weeklyData.set(weekStartDate, {
          weekStartDate,
          totalPaymentsAmount: amount,
          paymentCount: 1,
          transactions: [log]
        });
      }
    });

    // Convert to array and calculate averages
    return Array.from(weeklyData.values()).map(week => ({
      weekStartDate: week.weekStartDate,
      totalPaymentsAmount: week.totalPaymentsAmount,
      paymentCount: week.paymentCount,
      averagePayment: week.paymentCount > 0 ? week.totalPaymentsAmount / week.paymentCount : 0
    }));
  }

  private static getWeekStartDate(date: Date): string {
    // Get Monday of the week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  }

  private static decodeTransferAmount(data: string, decimals: number = 18): number {
    try {
      // Expect input: 0x + 8 (method) + 64 (address) + 64 (amount)
      if (!data || data.length < 2 + 8 + 64 + 64) return 0
      const methodAndPrefix = 2 + 8
      const amountHex = data.slice(methodAndPrefix + 64, methodAndPrefix + 64 + 64)
      // Parse as BigInt to avoid precision loss, then scale to a normal number string and Number
      const amountBig = BigInt('0x' + (amountHex || '0'))
      return this.bigIntToNumber(amountBig, decimals)
    } catch (error) {
      console.error('Error decoding transfer amount:', error)
      return 0
    }
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

  // Alternative method using transaction receipts
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
// console.log("Weekly Data", weeklyData )
    return Array.from(weeklyData.values()).map(week => ({
      weekStartDate: week.weekStartDate,
      totalPaymentsAmount: week.totalPaymentsAmount,
      paymentCount: week.paymentCount,
      averagePayment: week.paymentCount > 0 ? week.totalPaymentsAmount / week.paymentCount : 0
    }));
  }

  // Method using native token transfers with filtering
  static processWeeklyPaymentsFromTransfers(transfers: any[], paymentContractAddress?: string) {
    const weeklyData = new Map<string, {
      weekStartDate: string;
      totalPaymentsAmount: number;
      paymentCount: number;
    }>();

    transfers.forEach((transfer: any) => {
      const timestamp = new Date(transfer.blockTimestamp);
      const weekStartDate = this.getWeekStartDate(timestamp);
      
      // Filter for payment transactions
      // Option 1: Filter by specific contract address (payment contract)
      if (paymentContractAddress && transfer.toAddress !== paymentContractAddress) {
        return;
      }
      
      // Option 2: Filter by amount threshold (e.g., interest payments are usually small)
      const amount = this.parseAmountFromValue(transfer.value);
      if (amount < 0.000001) { // Adjust threshold as needed
        return;
      }
      
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
    });
// console.log(weeklyData)
    return Array.from(weeklyData.values()).map(week => ({
      weekStartDate: week.weekStartDate,
      totalPaymentsAmount: week.totalPaymentsAmount,
      paymentCount: week.paymentCount,
      averagePayment: week.paymentCount > 0 ? week.totalPaymentsAmount / week.paymentCount : 0
    }));
  }

  private static parseAmountFromValue(value: string, decimals: number = 18): number {
    try {
      if (!value) return 0
      // Moralis often returns native value as string in wei
      if (/^\d+$/.test(value)) {
        const asBig = BigInt(value)
        return this.bigIntToNumber(asBig, decimals)
      }
      // Fallback to float if already formatted
      return parseFloat(value) || 0
    } catch {
      return 0
    }
  }
}
