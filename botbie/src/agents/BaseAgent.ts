import { v4 as uuidv4 } from 'uuid';

export abstract class BaseAgent {
  public readonly id: string;
  public status: 'active' | 'inactive' | 'error' = 'inactive';

  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly capabilities: string[]
  ) {
    this.id = uuidv4();
  }

  abstract initialize(): Promise<void>;
  abstract execute(task: any): Promise<any>;
  abstract shutdown(): Promise<void>;

  async activate(): Promise<void> {
    try {
      await this.initialize();
      this.status = 'active';
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  async deactivate(): Promise<void> {
    try {
      await this.shutdown();
      this.status = 'inactive';
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }
}