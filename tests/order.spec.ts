import { test, expect } from '@mobilewright/test';
import { ProfilePage } from './pages/ProfilePage';
import { ProductsPage } from './pages/ProductsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ConfirmationPage } from './pages/ConfirmationPage';

// Happy path: place an order with a coupon (QA Shop).
// The app must already be installed on the device (see PHONE-SETUP.md > INSTALL THE TEST APP).
test.use({ bundleId: 'com.qademo.qashop' });

const customer = {
  name: 'Michael',
  email: 'michaelqa@mailinator.com',
  country: 'India',
  interest: 'Electronics',
  address: '221B MG Road',
  coupon: 'QA20',
};

test('place an order with a coupon', async ({ screen }) => {
  // Each step reads the view tree from the device; over Wi-Fi that takes a while.
  test.setTimeout(180_000);

  const profile = new ProfilePage(screen);
  const products = new ProductsPage(screen);
  const cart = new CartPage(screen);
  const checkout = new CheckoutPage(screen);
  const confirmation = new ConfirmationPage(screen);

  // 1. Profile form.
  await profile.fillProfile(customer);
  await profile.submit();
  await expect(profile.welcomeMessage(customer.name)).toBeVisible();
  await expect(profile.shopNowButton).toBeVisible();

  // 2. Products.
  await profile.shopNow();
  await expect(products.greeting(customer.name)).toBeVisible();

  // 3. Add two products.
  await products.addToCart('Wireless Headphones', 'Smart Watch');
  await expect(products.cartBadge(2)).toBeVisible();

  // 4. Cart: 79.99 + 129.00
  await products.openCart();
  await expect(cart.total('$208.99')).toBeVisible();

  // 5. Checkout.
  await cart.proceedToCheckout();
  await expect(checkout.grandTotal('$208.99')).toBeVisible();

  // 6. Coupon and address.
  await checkout.applyCoupon(customer.coupon);
  await expect(checkout.couponApplied(20)).toBeVisible();
  await expect(checkout.grandTotal('$167.19')).toBeVisible(); // 208.99 x 0.8
  await checkout.enterAddress(customer.address);

  // 7. Place the order.
  await checkout.placeOrder();

  // Order confirmation screen.
  await expect(confirmation.title).toBeVisible();
  await expect(confirmation.confirmationId).toBeVisible();
  await expect(confirmation.amountPaid).toHaveText('Amount Paid: $167.19 (after 20% off)');
});
