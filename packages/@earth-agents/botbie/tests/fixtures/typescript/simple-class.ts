/**
 * A simple User class for testing
 */
export class User {
  private id: string;
  private name: string;
  private email: string;

  constructor(id: string, name: string, email: string) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

  /**
   * Get the user's ID
   * @returns The user ID
   */
  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email;
  }

  /**
   * Update the user's email address
   * @param newEmail - The new email address
   */
  updateEmail(newEmail: string): void {
    if (this.validateEmail(newEmail)) {
      this.email = newEmail;
    } else {
      throw new Error('Invalid email format');
    }
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}