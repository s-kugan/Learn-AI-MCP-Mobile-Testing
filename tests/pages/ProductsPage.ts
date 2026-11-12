import type { Screen, Locator } from 'mobilewright';

/** Product list with the cart icon in the top bar. */
export class ProductsPage {
  // Cart icon has the accessibility label "Cart"
  // (getByText falls back to the label when an element has no text).
  readonly cartIcon: Locator;

  constructor(private readonly screen: Screen) {
    this.cartIcon = screen.getByText('Cart');
  }

  greeting(name: string): Locator {
    return this.screen.getByText(`Hi ${name}, happy shopping!`);
  }

  cartBadge(count: number): Locator {
    return this.screen.getByText(String(count));
  }

  /** Each product card has the accessibility label "product_<name>". */
  addToCartButton(product: string): Locator {
    return this.screen.getByText(`product_${product}`).getByRole('button', { name: 'ADD' });
  }

  async addToCart(...products: string[]): Promise<void> {
    for (const product of products) {
      await this.addToCartButton(product).tap();
    }
  }

  async openCart(): Promise<void> {
    await this.cartIcon.tap();
  }
}
