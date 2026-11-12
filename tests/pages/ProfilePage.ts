import type { Screen, Locator } from 'mobilewright';

export interface Profile {
  name: string;
  email: string;
  country: string;
  interest: string;
}

/** First screen: "Tell us about yourself" form. */
export class ProfilePage {
  // Empty fields expose no accessible name (Android hint text is not reported),
  // so they are picked by their order on screen: Name, Email, Phone.
  readonly nameField: Locator;
  readonly emailField: Locator;
  readonly countryDropdown: Locator;
  readonly submitButton: Locator;
  readonly shopNowButton: Locator;

  constructor(private readonly screen: Screen) {
    this.nameField = screen.getByRole('textfield').nth(0);
    this.emailField = screen.getByRole('textfield').nth(1);
    this.countryDropdown = screen.getByText('Select Country');
    this.submitButton = screen.getByRole('button', { name: 'SUBMIT' });
    this.shopNowButton = screen.getByRole('button', { name: 'SHOP NOW' });
  }

  interestCheckbox(interest: string): Locator {
    return this.screen.getByRole('checkbox', { name: interest });
  }

  welcomeMessage(name: string): Locator {
    return this.screen.getByText(`Welcome ${name}!`, { exact: false });
  }

  async fillProfile(profile: Profile): Promise<void> {
    await this.nameField.fill(profile.name);
    await this.emailField.fill(profile.email);
    await this.screen.keyboard.hide();
    await this.countryDropdown.tap();
    await this.screen.getByText(profile.country).tap();
    await this.interestCheckbox(profile.interest).check();
  }

  async submit(): Promise<void> {
    await this.submitButton.tap();
  }

  async shopNow(): Promise<void> {
    await this.shopNowButton.tap();
  }
}
