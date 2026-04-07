import "dotenv/config";
import { prisma } from "../src/client";

const defaultAssets = [
  {
    symbol: "BTCUSDT",
    name: "Bitcoin",
    decimals: 4,
    imageUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  },
  {
    symbol: "ETHUSDT",
    name: "Ethereum",
    decimals: 4,
    imageUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    symbol: "SOLUSDT",
    name: "Solana",
    decimals: 4,
    imageUrl: "https://cryptologos.cc/logos/solana-sol-logo.png",
  },
];

async function main() {
  for (const a of defaultAssets) {
    await prisma.asset.upsert({
      where: { symbol: a.symbol },
      update: {
        name: a.name,
        decimals: a.decimals,
        imageUrl: a.imageUrl,
      },
      create: {
        symbol: a.symbol,
        name: a.name,
        decimals: a.decimals,
        imageUrl: a.imageUrl,
      },
    });
  }
  console.log("Seeded assets:", defaultAssets.map((a) => a.symbol).join(", "));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
