import { TokenHolder, ProcessedHoldersData } from "@/types";

export class TokenHoldersProcessor {
  static processHoldersData(moralisData: any[], token: any): ProcessedHoldersData {
    const holders: TokenHolder[] = [];
    let totalSupply = 0;

    console.log(moralisData[0])
    // Process each holder using pre-formatted data from Moralis
    moralisData.forEach((holder: any) => {
      try {
        if (!holder.balance_formatted || !holder.owner_address) {
          console.warn('Skipping holder with missing data:', holder);
          return;
        }

        // Use the pre-formatted balance from Moralis
        const balance = parseFloat(holder.balance_formatted);
        
        // Skip if balance conversion failed
        if (isNaN(balance)) {
          console.warn('Skipping holder with invalid balance:', holder);
          return;
        }

        // Use the pre-calculated percentage from Moralis
        const percentage = holder.percentage_relative_to_total_supply || 0;

        holders.push({
          address: holder.owner_address,
          balance,
          balanceFormatted: holder.balance_formatted,
          percentage
        });

        totalSupply += balance;
      } catch (error) {
        console.error('Error processing holder:', holder, error);
      }
    });

    // Sort by balance (descending) - percentages are already calculated by Moralis
    holders.sort((a, b) => b.balance - a.balance);

    // Calculate distribution categories
    const distribution = {
      whales: 0, // >1% of supply
      large: 0,  // 0.1% - 1% of supply
      medium: 0, // 0.01% - 0.1% of supply
      small: 0   // <0.01% of supply
    };

    holders.forEach(holder => {
      if (holder.percentage > 1) {
        distribution.whales++;
      } else if (holder.percentage > 0.1) {
        distribution.large++;
      } else if (holder.percentage > 0.01) {
        distribution.medium++;
      } else {
        distribution.small++;
      }
    });

    return {
      totalHolders: holders.length,
      totalSupply,
      holders,
      distribution
    };
  }

  // Method to format data for pie chart
  static formatForPieChart(processedData: ProcessedHoldersData) {
    const chartData = [
      {
        category: "Whales (>1%)",
        count: processedData.distribution.whales,
        percentage: (processedData.distribution.whales / processedData.totalHolders) * 100,
        fill: "var(--chart-1)"
      },
      {
        category: "Large (0.1-1%)",
        count: processedData.distribution.large,
        percentage: (processedData.distribution.large / processedData.totalHolders) * 100,
        fill: "var(--chart-2)"
      },
      {
        category: "Medium (0.01-0.1%)",
        count: processedData.distribution.medium,
        percentage: (processedData.distribution.medium / processedData.totalHolders) * 100,
        fill: "var(--chart-3)"
      },
      {
        category: "Small (<0.01%)",
        count: processedData.distribution.small,
        percentage: (processedData.distribution.small / processedData.totalHolders) * 100,
        fill: "var(--chart-4)"
      }
    ];

    return chartData.filter(item => item.count > 0); // Only show categories with holders
  }

  // Method to format data for bubble chart showing individual holders
  static formatForBubbleChart(processedData: ProcessedHoldersData) {
    return processedData.holders.map((holder, index) => ({
      address: holder.address,
      balance: holder.balance,
      balanceFormatted: holder.balanceFormatted,
      percentage: holder.percentage,
      // Size based on percentage (min 10, max 50)
      size: Math.max(10, Math.min(50, holder.percentage * 10)),
      // Color based on category
      fill: holder.percentage > 1 
        ? "var(--chart-1)" 
        : holder.percentage > 0.1 
        ? "var(--chart-2)" 
        : holder.percentage > 0.01 
        ? "var(--chart-3)" 
        : "var(--chart-4)",
      // Position (we'll use index for x, percentage for y)
      x: index,
      y: holder.percentage
    }));
  }
}
