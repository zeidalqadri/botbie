// Example file with various code quality issues for Botbie to detect

// Issue: God class with too many responsibilities
export class UserManager {
  private users: any[] = [];
  private logs: string[] = [];
  private cache: Map<string, any> = new Map();
  private db: any;
  private emailService: any;
  private smsService: any;
  private analyticsService: any;
  
  // Issue: Too many parameters
  constructor(db: any, email: any, sms: any, analytics: any, logger: any, config: any, monitor: any) {
    this.db = db;
    this.emailService = email;
    this.smsService = sms;
    this.analyticsService = analytics;
  }
  
  // Issue: Long function with high complexity
  async processUser(userId: string, action: string, data: any) {
    let result;
    
    // Issue: Magic numbers
    if (userId.length < 5) {
      throw new Error('Invalid user ID');
    }
    
    // Issue: Deeply nested code (callback hell simulation)
    if (action === 'create') {
      if (data.email) {
        if (data.password) {
          if (data.password.length > 8) {
            // Issue: No error handling
            const user = await this.db.createUser(data);
            this.cache.set(userId, user);
            
            // Issue: Console.log in production code
            console.log('User created:', user);
            
            // Issue: Duplicate code
            this.logs.push(`Created user ${userId}`);
            await this.emailService.sendWelcome(user.email);
            await this.analyticsService.track('user_created', { userId });
            
            result = user;
          } else {
            throw new Error('Password too short');
          }
        } else {
          throw new Error('Password required');
        }
      } else {
        throw new Error('Email required');
      }
    } else if (action === 'update') {
      const user = await this.db.getUser(userId);
      
      // Issue: Mutation of parameters
      data.updatedAt = Date.now();
      
      const updated = await this.db.updateUser(userId, data);
      this.cache.delete(userId);
      
      // Issue: Duplicate code
      this.logs.push(`Updated user ${userId}`);
      await this.emailService.sendUpdate(user.email);
      await this.analyticsService.track('user_updated', { userId });
      
      result = updated;
    } else if (action === 'delete') {
      // Issue: No validation
      await this.db.deleteUser(userId);
      this.cache.delete(userId);
      
      // Issue: Magic number
      if (this.logs.length > 1000) {
        this.logs = [];
      }
      
      result = { deleted: true };
    }
    
    return result;
  }
  
  // Issue: Unused function
  private validateEmail(email: string): boolean {
    // Issue: Complex regex without explanation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  // Issue: Function doing too many things
  async generateReport() {
    const users = await this.db.getAllUsers();
    const activeUsers = users.filter((u: any) => u.active);
    const inactiveUsers = users.filter((u: any) => !u.active);
    
    let report = 'User Report\n';
    report += '===========\n';
    report += `Total: ${users.length}\n`;
    report += `Active: ${activeUsers.length}\n`;
    report += `Inactive: ${inactiveUsers.length}\n`;
    
    // Issue: Inefficient loop
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const orders = await this.db.getOrdersForUser(user.id);
      report += `${user.name}: ${orders.length} orders\n`;
    }
    
    return report;
  }
  
  // More methods that shouldn't be in this class...
  async sendNewsletter() { /* ... */ }
  async backupDatabase() { /* ... */ }
  async cleanupOldLogs() { /* ... */ }
  async migrateData() { /* ... */ }
  async generateInvoice() { /* ... */ }
  async processPayment() { /* ... */ }
  async sendSMS() { /* ... */ }
  async updateAnalytics() { /* ... */ }
  async validateAddress() { /* ... */ }
  async calculateTax() { /* ... */ }
  async exportToCSV() { /* ... */ }
  async importFromExcel() { /* ... */ }
}

// Issue: Global variable
let globalCounter = 0;

// Issue: Function with side effects
function incrementCounter() {
  globalCounter++;
  return globalCounter;
}

// Issue: Circular dependency potential
export class OrderService {
  constructor(private userManager: UserManager) {}
  
  async createOrder(userId: string, items: any[]) {
    // This creates a circular dependency if UserManager uses OrderService
  }
}

// Issue: Missing error handling
export async function riskyOperation() {
  const data = await fetch('https://api.example.com/data');
  return data.json(); // What if this fails?
}

// Issue: Duplicate code (similar to processUser)
export async function processOrder(orderId: string, action: string) {
  if (action === 'create') {
    console.log('Creating order:', orderId);
    // Similar pattern to processUser
  } else if (action === 'update') {
    console.log('Updating order:', orderId);
    // Similar pattern to processUser
  }
}