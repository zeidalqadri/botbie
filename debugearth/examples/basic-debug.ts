import { createDebugEarth } from '../src';

// Create a new DebugEarth instance
const debugEarth = createDebugEarth({
  verbose: true,
  logLevel: 'debug'
});

// Example 1: Debug a simple error
async function debugSimpleError() {
  console.log('\n=== Example 1: Simple Error ===\n');
  
  const session = await debugEarth.startDebugging('Function returns undefined instead of expected value');
  
  // Simulate the buggy code
  function getUserData(id: number) {
    const users = {
      1: { name: 'Alice', age: 30 },
      2: { name: 'Bob', age: 25 }
    };
    
    // Bug: accessing with wrong type
    return users[id as any];
  }
  
  try {
    // This will fail
    const user = getUserData(3);
    console.log(user.name); // This will throw
  } catch (error) {
    console.error('Error caught:', error);
  }
  
  // Analyze the bug
  const rootCause = await debugEarth.analyze(session.id);
  
  if (rootCause) {
    console.log('\n✅ Root cause found and solution provided!');
  }
  
  debugEarth.endSession(session.id);
}

// Example 2: Debug performance issue
async function debugPerformanceIssue() {
  console.log('\n=== Example 2: Performance Issue ===\n');
  
  const session = await debugEarth.startDebugging('Application becomes slow after running for a while');
  
  // Simulate memory leak
  const leakyArray: any[] = [];
  let counter = 0;
  
  const interval = setInterval(() => {
    // Memory leak - array keeps growing
    for (let i = 0; i < 1000; i++) {
      leakyArray.push({
        id: counter++,
        data: new Array(1000).fill('x'),
        timestamp: new Date()
      });
    }
    
    console.log(`Iteration ${counter / 1000}, array size: ${leakyArray.length}`);
    
    if (counter > 5000) {
      clearInterval(interval);
      
      // Analyze the performance issue
      debugEarth.analyze(session.id).then(rootCause => {
        if (rootCause) {
          console.log('\n✅ Performance issue identified!');
        }
        debugEarth.endSession(session.id);
      });
    }
  }, 100);
}

// Example 3: Debug async error
async function debugAsyncError() {
  console.log('\n=== Example 3: Async Error ===\n');
  
  const session = await debugEarth.startDebugging('API call fails intermittently');
  
  // Simulate flaky API
  async function fetchUserData(id: number): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Randomly fail
    if (Math.random() > 0.5) {
      throw new Error('Network timeout: Failed to fetch user data');
    }
    
    return { id, name: 'User ' + id };
  }
  
  // Try multiple times
  for (let i = 0; i < 5; i++) {
    try {
      const user = await fetchUserData(i);
      console.log('Success:', user);
    } catch (error) {
      console.error('Failed:', error);
    }
  }
  
  // Analyze the pattern
  const rootCause = await debugEarth.analyze(session.id);
  
  if (rootCause) {
    console.log('\n✅ Async issue pattern identified!');
  }
  
  debugEarth.endSession(session.id);
}

// Run examples
async function runExamples() {
  await debugSimpleError();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await debugPerformanceIssue();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await debugAsyncError();
}

runExamples().catch(console.error);