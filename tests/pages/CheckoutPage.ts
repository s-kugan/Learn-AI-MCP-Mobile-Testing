import type { Screen, Locator } from 'mobilewright';

/** Checkout screen: delivery details, payment, coupon and grand total. */
export class CheckoutPage {
  // Empty fields expose no accessible name, so they are picked by their
  // order on screen: Address, City, Coupon.
  readonly addressField: Locator;
  readonly couponField: Locator;
  readonly applyCouponButton: Locator;
  readonly placeOrderButton: Locator;

  constructor(private readonly screen: Screen) {
    this.addressField = screen.getByRole('textfield').nth(0);
    this.couponField = screen.getByRole('textfield').nth(2);
    this.applyCouponButton = screen.getByRole('button', { name: 'APPLY' });
    this.placeOrderButton = screen.getByRole('button', { name: 'PLACE ORDER' });
  }

  grandTotal(amount: string): Locator {
    return this.screen.getByText(`Grand Total: ${amount}`);
  }

  couponApplied(percent: number): Locator {
    return this.screen.getByText(`Coupon applied: ${percent}% off`);
  }

  async applyCoupon(code: string): Promise<void> {
    await this.couponField.fill(code);
    // Close the keyboard first, otherwise the tap on APPLY can be lost.
    await this.screen.keyboard.hide();
    await this.applyCouponButton.tap();
  }

  async enterAddress(address: string): Promise<void> {
    await this.addressField.fill(address);
    await this.screen.keyboard.hide();
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.tap();
  }
}
