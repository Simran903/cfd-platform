type PriceTickerProps = {
  symbol: string;
  price: number | null;
};

export default function PriceTicker({ symbol, price }: PriceTickerProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-gray-500">Live Price</div>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-2xl font-semibold">{symbol}</span>
        <span className="text-xl">{price === null ? "--" : price.toFixed(2)}</span>
      </div>
    </div>
  );
}
