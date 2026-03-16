class PriceStore {
  private prices = new Map<string, number>();

  setPrice(assetId: string, price: number) {
    this.prices.set(assetId, price);
  }

  getPrice(assetId: string) {
    return this.prices.get(assetId);
  }

  getAllPrices() {
    return this.prices;
  }
}

export const priceStore = new PriceStore();
