import { TokenDataService } from './token-data-service';

export class WeeklyPaymentsAggregator {
  static async aggregateWeeklyPayments(tokenId: string, weekStartDate: Date) {
    try {
      // Calculate week end date
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);

      // Get all transactions for this week
      const transactions = await TokenDataService.getTransactionsInDateRange(
        tokenId,
        weekStartDate,
        weekEndDate
      );

      // Filter for payment transactions (you might need to adjust this logic)
      const paymentTransactions = transactions.filter(tx => 
        this.isPaymentTransaction(tx)
      );

      // Calculate weekly totals
      const totalPaymentsAmount = paymentTransactions.reduce(
        (sum, tx) => sum + Number(tx.amount), 
        0
      );

      const paymentCount = paymentTransactions.length;
      const averagePayment = paymentCount > 0 ? totalPaymentsAmount / paymentCount : 0;

      // Store weekly payment data
      await TokenDataService.upsertPaymentData(tokenId, {
        weekStartDate: weekStartDate.toISOString().split('T')[0],
        totalPaymentsAmount,
        paymentCount,
        averagePayment
      });

      return {
        weekStartDate: weekStartDate.toISOString().split('T')[0],
        totalPaymentsAmount,
        paymentCount,
        averagePayment
      };

    } catch (error) {
      console.error('Weekly payments aggregation error:', error);
      throw error;
    }
  }

  private static isPaymentTransaction(transaction: any): boolean {
    // Implement logic to identify payment transactions
    // This depends on your smart contract structure
    // Example: Check if transaction is to a specific payment contract
    return true; // Placeholder - adjust based on your contract
  }

  static async aggregateAllWeeklyPayments(tokenId: string, weeks: number = 12) {
    const results = [];
    const today = new Date();
    
    for (let i = 0; i < weeks; i++) {
      const weekStartDate = new Date(today);
      weekStartDate.setDate(today.getDate() - (i * 7));
      
      // Adjust to start of week (Monday)
      const dayOfWeek = weekStartDate.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStartDate.setDate(weekStartDate.getDate() - daysToSubtract);
      
      const result = await this.aggregateWeeklyPayments(tokenId, weekStartDate);
      results.push(result);
    }

    return results;
  }
}