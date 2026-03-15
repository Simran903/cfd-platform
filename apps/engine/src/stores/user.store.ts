type UserBalance = {
  balance: number;
};

class UserStore {
  private users = new Map<string, UserBalance>();

  set(userId: string, balance: number) {
    this.users.set(userId, { balance });
  }

  get(userId: string) {
    return this.users.get(userId);
  }

  updateBalance(userId: string, amount: number) {
    const user = this.users.get(userId);
    if (!user) return;

    user.balance += amount;
  }
}

export const userStore = new UserStore();
