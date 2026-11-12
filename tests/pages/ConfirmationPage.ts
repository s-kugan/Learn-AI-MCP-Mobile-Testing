import type { Screen, Locator } from 'mobilewright';

/** Order confirmation screen shown after placing an order. */
export class ConfirmationPage {
  readonly title: Locator;
  readonly confirmationId: Locator;
  readonly amountPaid: Locator;

  constructor(screen: Screen) {
    this.title = screen.getByText('Order Placed Successfully!');
    this.confirmationId = screen.getByText(/^QA-[A-Z0-9]{8}$/);
    this.amountPaid = screen.getByText(/^Amount Paid:/);
  }
}
