import { NextRequest, NextResponse } from 'next/server'
import { TokenDataService } from '@/lib/services/token-data-service'

// Hardcoded token IDs from database
const TOKEN_IDS = {
  LZAR: "b2e29f44-1846-49b0-bafa-4c25695b6664",
  LUSD: "c7b9eb15-2cde-4660-8491-977acaa41699"
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params
    
    // Validate token ID against hardcoded values
    const validTokenIds = Object.values(TOKEN_IDS)
    if (!validTokenIds.includes(tokenId)) {
      return NextResponse.json({ 
        error: 'Invalid token ID',
        validTokenIds: Object.entries(TOKEN_IDS).map(([symbol, id]) => ({ symbol, id }))
      }, { status: 400 })
    }

    // Fetch all wallet data for the token without any filtering
    const wallets = await TokenDataService.getAllWalletData(tokenId)
    
    // No need to convert Int values to strings for JSON serialization
    return NextResponse.json(wallets)
  } catch (error) {
    //console.error('Error fetching wallet data:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 })
  }
}
