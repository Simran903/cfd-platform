import "dotenv/config";
import { prisma } from "../src/client";

const defaultAssets = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
];

async function main() {
  await prisma.asset.createMany({
    data: defaultAssets,
    skipDuplicates: true,
  });
  console.log("Seeded assets:", defaultAssets.map((a) => a.symbol).join(", "));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
