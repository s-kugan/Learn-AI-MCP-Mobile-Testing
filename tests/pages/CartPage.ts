import type { Screen, Locator } from 'mobilewright';

/** "My Cart" screen. */
export class CartPage {
  readonly checkoutButton: Locator;

  constructor(private readonly screen: Screen) {
    this.checkoutButton = screen.getByRole('button', { name: 'PROCEED TO CHECKOUT' });
  }

  total(amount: string): Locator {
    return this.screen.getByText(`Total: ${amount}`);
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.tap();
  }
}
