import { DebugStrategy, DebugSession, DebugAttempt } from '../types';
import { createSessionLogger } from '../utils/logger';
import { CorrelationContext } from '../utils/correlator';

export class UISurgeon implements DebugStrategy {
  name = 'UI Surgeon';
  description = 'Visual debugging by creating temporary UI elements and inspecting DOM state';
  
  private correlator = CorrelationContext.getInstance();
  private debugElements: HTMLElement[] = [];
  
  canHandle(_session: DebugSession): boolean {
    // Only handle if we're in a browser environment
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
  
  async execute(session: DebugSession): Promise<DebugAttempt> {
    const logger = createSessionLogger(session.id);
    logger.info(`🔬 UI Surgeon preparing visual debugging tools!`);
    
    const attemptId = this.correlator.generateId();
    const actions: string[] = [];
    
    try {
      // Create debug overlay
      const overlay = this.createDebugOverlay(session);
      actions.push('Created debug overlay');
      
      // Add visual indicators to problematic elements
      const problematicElements = this.identifyProblematicElements(session);
      actions.push(`Identified ${problematicElements.length} potentially problematic elements`);
      
      problematicElements.forEach(el => {
        this.addVisualIndicator(el);
      });
      actions.push('Added visual indicators to problematic elements');
      
      // Create DOM inspector
      this.createDOMInspector(overlay, session);
      actions.push('Created interactive DOM inspector');
      
      // Add event monitor
      this.createEventMonitor(overlay, session);
      actions.push('Created real-time event monitor');
      
      // Create performance visualizer
      this.createPerformanceVisualizer(overlay, session);
      actions.push('Created performance visualizer');
      
      // Add user instructions
      this.addUserInstructions(overlay);
      actions.push('Added user interaction instructions');
      
      logger.info('✨ Visual debugging tools ready! Check the debug overlay on your page.');
      
      return {
        id: attemptId,
        strategy: this.name,
        timestamp: new Date(),
        actions,
        result: 'Visual debugging tools deployed successfully',
        success: true
      };
      
    } catch (error) {
      logger.error(`UI Surgeon encountered an error: ${error}`);
      return {
        id: attemptId,
        strategy: this.name,
        timestamp: new Date(),
        actions,
        result: `Error during visual debugging: ${error}`,
        success: false
      };
    }
  }
  
  private createDebugOverlay(session: DebugSession): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'debugearth-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 350px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 15px;
      border: 2px solid #00ff00;
      border-radius: 5px;
      overflow-y: auto;
      z-index: 999999;
      box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
    `;
    
    const header = document.createElement('h3');
    header.textContent = '🌍 DebugEarth Visual Debugger';
    header.style.cssText = 'margin: 0 0 10px 0; color: #00ff00;';
    overlay.appendChild(header);
    
    const sessionInfo = document.createElement('div');
    sessionInfo.textContent = `Session: ${session.id.substring(0, 8)}`;
    sessionInfo.style.cssText = 'font-size: 10px; opacity: 0.7; margin-bottom: 10px;';
    overlay.appendChild(sessionInfo);
    
    document.body.appendChild(overlay);
    this.debugElements.push(overlay);
    
    return overlay;
  }
  
  private identifyProblematicElements(session: DebugSession): Element[] {
    const problematic: Element[] = [];
    
    // Find elements with errors in their event listeners
    document.querySelectorAll('*').forEach(el => {
      // Check for elements with error classes
      if (el.classList.toString().toLowerCase().includes('error')) {
        problematic.push(el);
      }
      
      // Check for hidden elements that might be causing issues
      const computed = window.getComputedStyle(el);
      if (computed.display === 'none' && el.id) {
        problematic.push(el);
      }
      
      // Check for elements with invalid attributes
      if (el.hasAttribute('href') && el.getAttribute('href') === '#') {
        problematic.push(el);
      }
    });
    
    // Find elements mentioned in error messages
    const errorLogs = session.evidence.filter(e => 
      e.type === 'console' && e.data.level === 'error'
    );
    
    errorLogs.forEach(log => {
      const message = JSON.stringify(log.data);
      // Extract element IDs or classes from error messages
      const idMatch = message.match(/#([\w-]+)/g);
      const classMatch = message.match(/\.([\w-]+)/g);
      
      if (idMatch) {
        idMatch.forEach(id => {
          const el = document.querySelector(id);
          if (el && !problematic.includes(el)) {
            problematic.push(el);
          }
        });
      }
      
      if (classMatch) {
        classMatch.forEach(cls => {
          document.querySelectorAll(cls).forEach(el => {
            if (!problematic.includes(el)) {
              problematic.push(el);
            }
          });
        });
      }
    });
    
    return problematic;
  }
  
  private addVisualIndicator(element: Element): void {
    const indicator = document.createElement('div');
    const rect = element.getBoundingClientRect();
    
    indicator.style.cssText = `
      position: fixed;
      top: ${rect.top - 5}px;
      left: ${rect.left - 5}px;
      width: ${rect.width + 10}px;
      height: ${rect.height + 10}px;
      border: 2px dashed #ff0000;
      background: rgba(255, 0, 0, 0.1);
      pointer-events: none;
      z-index: 999998;
      animation: pulse 2s infinite;
    `;
    
    // Add animation
    if (!document.querySelector('#debugearth-styles')) {
      const style = document.createElement('style');
      style.id = 'debugearth-styles';
      style.textContent = `
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .debugearth-highlight {
          outline: 3px solid #00ff00 !important;
          outline-offset: 2px;
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(indicator);
    this.debugElements.push(indicator);
    
    // Add tooltip with element info
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: fixed;
      top: ${rect.top - 30}px;
      left: ${rect.left}px;
      background: #000;
      color: #0f0;
      padding: 5px;
      font-size: 10px;
      border: 1px solid #0f0;
      z-index: 999999;
      white-space: nowrap;
    `;
    tooltip.textContent = `${element.tagName}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className : ''}`;
    
    document.body.appendChild(tooltip);
    this.debugElements.push(tooltip);
  }
  
  private createDOMInspector(overlay: HTMLElement, session: DebugSession): void {
    const inspector = document.createElement('div');
    inspector.style.cssText = 'margin: 10px 0; padding: 10px; border: 1px solid #0f0;';
    
    const title = document.createElement('h4');
    title.textContent = '🔍 DOM Inspector';
    title.style.cssText = 'margin: 0 0 5px 0;';
    inspector.appendChild(title);
    
    const info = document.createElement('div');
    info.textContent = 'Click any element to inspect';
    info.style.cssText = 'font-size: 11px; opacity: 0.8;';
    inspector.appendChild(info);
    
    const details = document.createElement('pre');
    details.style.cssText = 'margin: 5px 0; font-size: 10px; overflow-x: auto;';
    inspector.appendChild(details);
    
    // Add click handler
    document.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      
      // Remove previous highlights
      document.querySelectorAll('.debugearth-highlight').forEach(el => {
        el.classList.remove('debugearth-highlight');
      });
      
      // Highlight clicked element
      target.classList.add('debugearth-highlight');
      
      // Show element details
      const elementInfo = {
        tag: target.tagName,
        id: target.id,
        classes: Array.from(target.classList),
        attributes: Array.from(target.attributes).map(attr => ({
          name: attr.name,
          value: attr.value
        })),
        computedStyles: {
          display: window.getComputedStyle(target).display,
          position: window.getComputedStyle(target).position,
          visibility: window.getComputedStyle(target).visibility,
          zIndex: window.getComputedStyle(target).zIndex
        },
        dimensions: {
          width: target.offsetWidth,
          height: target.offsetHeight,
          top: target.offsetTop,
          left: target.offsetLeft
        }
      };
      
      details.textContent = JSON.stringify(elementInfo, null, 2);
      
      // Log to session
      session.evidence.push({
        id: this.correlator.generateId(),
        type: 'ui',
        timestamp: new Date(),
        data: {
          action: 'element-inspected',
          element: elementInfo
        },
        context: {
          sessionId: session.id
        }
      });
    }, true);
    
    overlay.appendChild(inspector);
  }
  
  private createEventMonitor(overlay: HTMLElement, _session: DebugSession): void {
    const monitor = document.createElement('div');
    monitor.style.cssText = 'margin: 10px 0; padding: 10px; border: 1px solid #0f0;';
    
    const title = document.createElement('h4');
    title.textContent = '📡 Event Monitor';
    title.style.cssText = 'margin: 0 0 5px 0;';
    monitor.appendChild(title);
    
    const eventList = document.createElement('div');
    eventList.style.cssText = 'max-height: 150px; overflow-y: auto; font-size: 10px;';
    monitor.appendChild(eventList);
    
    // Monitor common events
    const eventsToMonitor = ['click', 'change', 'submit', 'focus', 'blur', 'error'];
    
    eventsToMonitor.forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        const eventInfo = document.createElement('div');
        eventInfo.style.cssText = 'margin: 2px 0; padding: 2px; background: rgba(0,255,0,0.1);';
        eventInfo.textContent = `${new Date().toLocaleTimeString()} - ${eventType} on ${(e.target as Element).tagName}`;
        
        eventList.insertBefore(eventInfo, eventList.firstChild);
        
        // Keep only last 20 events
        while (eventList.children.length > 20) {
          eventList.removeChild(eventList.lastChild!);
        }
      }, true);
    });
    
    overlay.appendChild(monitor);
  }
  
  private createPerformanceVisualizer(overlay: HTMLElement, _session: DebugSession): void {
    const visualizer = document.createElement('div');
    visualizer.style.cssText = 'margin: 10px 0; padding: 10px; border: 1px solid #0f0;';
    
    const title = document.createElement('h4');
    title.textContent = '📊 Performance Monitor';
    title.style.cssText = 'margin: 0 0 5px 0;';
    visualizer.appendChild(title);
    
    const metrics = document.createElement('div');
    metrics.style.cssText = 'font-size: 11px;';
    visualizer.appendChild(metrics);
    
    // Update performance metrics
    setInterval(() => {
      if ((performance as any).memory) {
        const memoryInfo = `
          Heap Used: ${Math.round((performance as any).memory.usedJSHeapSize / 1048576)}MB
          Heap Total: ${Math.round((performance as any).memory.totalJSHeapSize / 1048576)}MB
          Heap Limit: ${Math.round((performance as any).memory.jsHeapSizeLimit / 1048576)}MB
        `;
        metrics.textContent = memoryInfo;
      }
    }, 1000);
    
    overlay.appendChild(visualizer);
  }
  
  private addUserInstructions(overlay: HTMLElement): void {
    const instructions = document.createElement('div');
    instructions.style.cssText = 'margin-top: 10px; padding: 10px; border: 1px solid #0f0; font-size: 11px;';
    instructions.innerHTML = `
      <strong>🎮 Instructions:</strong><br>
      • Click any element to inspect<br>
      • Red borders = potential issues<br>
      • Check console for detailed logs<br>
      • Press ESC to close debugger
    `;
    
    overlay.appendChild(instructions);
    
    // Add ESC key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.cleanup();
      }
    });
  }
  
  cleanup(): void {
    this.debugElements.forEach(el => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    this.debugElements = [];
    
    // Remove highlights
    document.querySelectorAll('.debugearth-highlight').forEach(el => {
      el.classList.remove('debugearth-highlight');
    });
  }
}