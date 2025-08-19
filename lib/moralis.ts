import Moralis from 'moralis';

// Initialize once, reuse across API routes
export async function initializeMoralis() {
  if (!Moralis.Core.isStarted) {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY!,
    });
  }
  return Moralis;
}