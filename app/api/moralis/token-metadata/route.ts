import { initializeMoralis } from "@/lib/moralis";
import { NextRequest, NextResponse } from "next/server";
import { EvmChain } from "@moralisweb3/common-evm-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const contractAddress: string | undefined = body?.contractAddress

    if (!contractAddress) {
      return NextResponse.json({ error: 'contractAddress is required' }, { status: 400 })
    }

    const moralis = await initializeMoralis();
    const response = await moralis.EvmApi.token.getTokenMetadata({
      chain: EvmChain.create(1135), // Lisk chain
      addresses: [contractAddress]
    });

    // The response is an array, not an object with a 'result' property
    const tokenData = response.toJSON()?.[0];

    if (!tokenData) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: tokenData,
      message: 'Token metadata fetched successfully'
    })
  } catch (error) {
    console.error('Token metadata fetch error:', error);
    return NextResponse.json({
      error: "Token metadata fetch failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
