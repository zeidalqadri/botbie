export * from './types';
export * from './WorkflowCatalog';
export * from './WorkflowCustomizer';
export * from './WorkflowExecutor';

// Re-export commonly used items
export { WorkflowCatalog } from './WorkflowCatalog';
export { WorkflowCustomizer } from './WorkflowCustomizer';
export { WorkflowExecutor } from './WorkflowExecutor';

// Workflow template loader
export async function loadWorkflowTemplate(templateId: string): Promise<any> {
  const catalog = new WorkflowCatalog();
  await catalog.initialize();
  return catalog.getTemplate(templateId);
}

// Quick workflow execution
export async function executeWorkflow(
  templateId: string,
  inputs: Record<string, any>,
  customization?: any
): Promise<any> {
  const catalog = new WorkflowCatalog();
  await catalog.initialize();
  
  let template = catalog.getTemplate(templateId);
  if (!template) {
    throw new Error(`Workflow template not found: ${templateId}`);
  }
  
  // Apply customization if provided
  if (customization) {
    template = WorkflowCustomizer.customize(template, customization);
  }
  
  // Execute workflow
  const executor = new WorkflowExecutor(template, inputs);
  return executor.execute();
}