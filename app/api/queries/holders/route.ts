import { initializeMoralis } from "@/lib/moralis";
import { TokenDataService } from "@/lib/services/token-data-service";
import { TokenHoldersProcessor } from "@/lib/services/token-holders-processor";
import { NextRequest, NextResponse } from "next/server";
import { EvmChain } from "@moralisweb3/common-evm-utils";

export async function POST(request: NextRequest){
    try{
        const body = await request.json().catch(() => ({} as any))
        const contractAddress: string | undefined = body?.contractAddress

        if (!contractAddress) {
            return NextResponse.json({ error: 'contractAddress is required' }, { status: 400 })
        }

        const token = await TokenDataService.getTokenByContractAddress(contractAddress)
        if (!token) {
            return NextResponse.json({ error: 'Token not found for contractAddress' }, { status: 404 })
        }

        // Fetch from Moralis - get token owners
        const moralis = await initializeMoralis();
        const response = await moralis.EvmApi.token.getTokenOwners({
            chain: EvmChain.create(1135), // Lisk chain ID
            order: "DESC",
            tokenAddress: token.contractAddress,
            limit: 100
        });

        // Extract the data from the response
        const holdersData = response.toJSON().result || [];
        
        console.log('Raw holders data sample:', holdersData[0]);
        
        // Process and calculate holders data
        const processedData = TokenHoldersProcessor.processHoldersData(holdersData, token);
        
        // Store both processed data and raw data for bubble chart
        const dataToStore = {
          ...processedData,
          holders: holdersData // Store raw Moralis data for client-side processing
        };
        
        // Store in db
        await TokenDataService.bulkUpsertTokenHolders(token.id, dataToStore);

        return NextResponse.json({
            success: true,
            data: processedData,
            message: 'Token holders data updated'
        })
    }catch(error)
    {
        console.error('Token holders query error:', error);
        return NextResponse.json({
            error: "Token holders data fetch failed",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, {status: 500})
    }
}
