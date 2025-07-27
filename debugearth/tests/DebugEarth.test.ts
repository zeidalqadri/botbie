import { createDebugEarth, DebugEarth } from '../src';

describe('DebugEarth', () => {
  let debugEarth: DebugEarth;
  
  beforeEach(() => {
    debugEarth = createDebugEarth({
      verbose: false,
      logLevel: 'error'
    });
  });
  
  describe('Session Management', () => {
    test('should create a new debug session', async () => {
      const session = await debugEarth.startDebugging('Test bug description');
      
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.bugDescription).toBe('Test bug description');
      expect(session.status).toBe('active');
      expect(session.evidence).toEqual([]);
      expect(session.hypotheses).toEqual([]);
    });
    
    test('should retrieve existing session', async () => {
      const session = await debugEarth.startDebugging('Test bug');
      const retrieved = debugEarth.getSession(session.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(session.id);
    });
    
    test('should end session', async () => {
      const session = await debugEarth.startDebugging('Test bug');
      debugEarth.endSession(session.id);
      
      const retrieved = debugEarth.getSession(session.id);
      expect(retrieved).toBeUndefined();
    });
  });
  
  describe('Evidence Collection', () => {
    test('should add evidence to session', async () => {
      const session = await debugEarth.startDebugging('Test bug');
      
      await debugEarth.addEvidence(session.id, 'console', {
        level: 'error',
        message: 'Test error message'
      });
      
      const updatedSession = debugEarth.getSession(session.id);
      expect(updatedSession?.evidence).toHaveLength(1);
      expect(updatedSession?.evidence[0].type).toBe('console');
    });
    
    test('should collect evidence automatically', async () => {
      const session = await debugEarth.startDebugging('Test bug');
      
      // Trigger a console error
      console.error('Automatic error collection test');
      
      // Wait a bit for evidence collection
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updatedSession = debugEarth.getSession(session.id);
      expect(updatedSession?.evidence.length).toBeGreaterThan(0);
    });
  });
  
  describe('Root Cause Analysis', () => {
    test('should analyze simple error', async () => {
      const session = await debugEarth.startDebugging('Type error in function');
      
      // Add stack trace evidence
      await debugEarth.addEvidence(session.id, 'stack-trace', {
        message: 'TypeError: Cannot read property "name" of undefined',
        stack: `TypeError: Cannot read property 'name' of undefined
          at getUserName (test.js:10:15)
          at processUser (test.js:20:10)
          at main (test.js:30:5)`
      });
      
      // Add console evidence
      await debugEarth.addEvidence(session.id, 'console', {
        level: 'error',
        message: 'User object is undefined'
      });
      
      const rootCause = await debugEarth.analyze(session.id);
      
      expect(rootCause).toBeDefined();
      expect(rootCause?.description).toContain('undefined');
    });
    
    test('should handle no root cause found', async () => {
      const session = await debugEarth.startDebugging('Unknown bug');
      
      // Analyze with no evidence
      const rootCause = await debugEarth.analyze(session.id);
      
      expect(rootCause).toBeNull();
      expect(session.status).toBe('exploring');
    });
  });
  
  describe('Debugging Strategies', () => {
    test('should run applicable strategies', async () => {
      const session = await debugEarth.startDebugging('Performance issue');
      
      // Add performance evidence
      await debugEarth.addEvidence(session.id, 'performance', {
        memory: {
          heapUsed: 900 * 1024 * 1024,
          heapTotal: 1000 * 1024 * 1024
        },
        cpu: {
          usage: 85
        }
      });
      
      await debugEarth.runStrategies(session.id);
      
      const updatedSession = debugEarth.getSession(session.id);
      expect(updatedSession?.attempts.length).toBeGreaterThan(0);
    });
  });
  
  describe('Configuration', () => {
    test('should respect configuration options', () => {
      const customDebugEarth = createDebugEarth({
        maxAttempts: 5,
        verbose: false,
        logLevel: 'warn'
      });
      
      expect(customDebugEarth).toBeDefined();
    });
    
    test('should trigger webhooks', async () => {
      let evidenceHook = jest.fn();
      let hypothesisHook = jest.fn();
      let rootCauseHook = jest.fn();
      
      const hookedDebugEarth = createDebugEarth({
        verbose: false,
        webhooks: {
          onEvidence: evidenceHook,
          onHypothesis: hypothesisHook,
          onRootCause: rootCauseHook
        }
      });
      
      const session = await hookedDebugEarth.startDebugging('Test bug');
      
      await hookedDebugEarth.addEvidence(session.id, 'console', {
        message: 'Test'
      });
      
      expect(evidenceHook).not.toHaveBeenCalled(); // Manual evidence doesn't trigger webhook
      
      // Add stack trace to generate hypotheses
      await hookedDebugEarth.addEvidence(session.id, 'stack-trace', {
        message: 'TypeError: Test error',
        stack: 'at test.js:1:1'
      });
      
      await hookedDebugEarth.analyze(session.id);
      
      expect(hypothesisHook).toHaveBeenCalled();
    });
  });
});