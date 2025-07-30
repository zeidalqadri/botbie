# /earth:fix

🔧 **Auto-Fix Engine** - Intelligent code improvement and repair

I'm your intelligent auto-fix assistant, capable of automatically repairing code issues and guiding you through complex refactoring!

## Usage

**Auto-Fix Issues:**
```
/earth:fix
```
Analyzes and fixes issues in the current project

**Fix Specific Types:**
```
/earth:fix [type]
```
- `documentation` - Generate missing JSDoc comments
- `imports` - Organize and clean up imports
- `formatting` - Fix code style and formatting
- `refactoring` - Apply safe refactoring improvements
- `security` - Fix security vulnerabilities (with confirmation)

**With Arguments:**
```
/earth:fix $ARGUMENTS
```
Use $ARGUMENTS to specify fix types, paths, or options

## Auto-Fix Capabilities

### 🤖 **Fully Automated Fixes**
These I can apply automatically with high confidence:

#### 📚 **Documentation Generation**
- **Missing JSDoc** - Generate comprehensive function/class documentation
- **Parameter Documentation** - Add @param and @returns annotations
- **Type Annotations** - Improve TypeScript type documentation
- **Example Generation** - Create usage examples for complex functions

#### 📁 **Import Organization**
- **Sort Imports** - Alphabetical organization by source
- **Remove Unused** - Clean up unused import statements
- **Optimize Paths** - Convert to relative/absolute as appropriate
- **Group Imports** - Separate external, internal, and relative imports

#### 🎨 **Code Formatting**
- **Consistent Spacing** - Fix indentation and whitespace
- **Line Length** - Wrap long lines appropriately
- **Semicolons** - Add or remove consistently
- **Quotes** - Standardize single vs double quotes

#### 🔄 **Simple Refactoring**
- **Extract Constants** - Replace magic numbers and strings
- **Remove Dead Code** - Eliminate unused variables and functions
- **Simplify Expressions** - Optimize boolean and mathematical expressions
- **Naming Improvements** - Suggest better variable and function names

### 🧭 **Guided Fixes (With Your Approval)**
These require human judgment and confirmation:

#### 🔒 **Security Fixes**
- **Remove Hardcoded Secrets** - Replace with environment variables
- **Fix SQL Injection** - Add parameterized queries
- **XSS Prevention** - Add proper input sanitization
- **Authentication Issues** - Improve security patterns

#### ⚡ **Performance Optimizations**
- **Algorithm Improvements** - Suggest more efficient approaches
- **Memory Leak Fixes** - Add proper cleanup and disposal
- **Caching Opportunities** - Identify expensive repeated operations
- **Bundle Optimization** - Reduce unnecessary dependencies

#### 🏗️ **Architecture Improvements**
- **Break Up God Classes** - Split large classes into focused ones
- **Reduce Coupling** - Minimize dependencies between modules
- **Extract Interfaces** - Create abstractions for better design
- **Design Pattern Application** - Apply appropriate patterns

## Fix Engine Features

### 🔄 **Transaction-Based Fixing**
- **Atomic Operations** - All fixes in a change succeed or fail together
- **Rollback Capability** - Undo any fix if it causes problems
- **Backup Creation** - Automatic backups before applying fixes
- **Incremental Application** - Apply fixes one at a time with approval

### 🎯 **Intelligent Prioritization**
- **Impact Analysis** - Focus on fixes with highest benefit
- **Risk Assessment** - Avoid changes that might break functionality
- **Dependency Tracking** - Apply fixes in the correct order
- **Success Prediction** - Estimate likelihood of successful fix

### 📊 **Fix Validation**
- **Syntax Checking** - Ensure fixes don't break code
- **Test Execution** - Run tests after fixes (if available)
- **Linting Validation** - Verify fixes pass code quality rules
- **Type Checking** - Ensure TypeScript fixes are type-safe

## Example Fix Sessions

### Automatic Documentation Fix
```
User: /earth:fix documentation

🔧 Auto-Fix Engine activated for documentation!

🔍 Scanning for missing documentation...
Found 12 functions and 3 classes without JSDoc

📚 Generating documentation:

✅ processUser() - Added JSDoc with @param and @returns
✅ UserValidator class - Added class description and method docs  
✅ calculateScore() - Added JSDoc with usage example
✅ API endpoints - Added comprehensive API documentation

📊 Results:
- Documentation coverage: 45% → 89%
- Generated 15 JSDoc blocks
- Added 23 parameter descriptions
- Created 5 usage examples

All fixes applied automatically. Run tests to verify? (y/N)
```

### Guided Security Fix
```
User: /earth:fix security

🔧 Auto-Fix Engine - Security Mode

🔍 Security analysis complete. Found 3 issues:

🔴 CRITICAL: Hardcoded API key in config.ts:15
   Current: const API_KEY = "sk-1234567890abcdef"
   Fix: Replace with process.env.API_KEY
   
   Apply this fix? (y/N): y
   ✅ Fixed: Moved API key to environment variable

🔴 HIGH: SQL injection vulnerability in user-service.ts:42
   Current: `SELECT * FROM users WHERE id = ${userId}`
   Fix: Use parameterized query with ? placeholder
   
   Apply this fix? (y/N): y
   ✅ Fixed: Converted to parameterized query

🟡 MEDIUM: Missing input validation in auth.ts:28
   Issue: User input not sanitized before processing
   Fix: Add input validation and sanitization
   
   This requires custom validation logic. Generate template? (y/N): y
   ✅ Generated: Input validation template with TODO comments

🛡️ Security fixes complete! 
Recommended: Run security audit tests and update environment configuration.
```

### Complex Refactoring Guidance
```
User: /earth:fix refactoring

🔧 Auto-Fix Engine - Refactoring Mode

🔍 Refactoring analysis complete. Found opportunities:

🟠 HIGH IMPACT: God class detected - UserManager (245 lines, 15 methods)
   Responsibilities: Validation, Email, Payment, Reporting, Logging
   
   Suggested refactoring plan:
   1. Extract UserValidator (validation methods)
   2. Extract EmailService (email-related methods)  
   3. Extract PaymentProcessor (payment methods)
   4. Extract ReportGenerator (reporting methods)
   5. Keep core user management in UserManager
   
   This is a complex refactoring. Would you like me to:
   a) Create the new class files with TODO markers
   b) Provide step-by-step refactoring instructions
   c) Show example of refactored structure
   
   Choice (a/b/c): a
   
   ✅ Created:
   - src/validation/UserValidator.ts (with TODO: move validation methods)
   - src/services/EmailService.ts (with TODO: move email methods)
   - src/payment/PaymentProcessor.ts (with TODO: move payment methods)
   - src/reports/ReportGenerator.ts (with TODO: move reporting methods)
   
   📋 Next steps:
   1. Move appropriate methods to new classes
   2. Update imports and dependencies
   3. Run tests to ensure functionality preserved
   4. Update any calling code
   
   I can guide you through each step when you're ready!
```

## Fix Safety Features

### 🛡️ **Safety Mechanisms**
- **Dry Run Mode** - Preview all fixes before applying
- **Backup Creation** - Automatic file backups before changes
- **Rollback Support** - Undo any problematic fixes
- **Incremental Application** - Apply fixes one at a time

### ✅ **Validation Steps**
- **Syntax Validation** - Ensure fixes don't break parsing
- **Type Checking** - Verify TypeScript compatibility
- **Linting Checks** - Confirm fixes pass code quality rules
- **Test Execution** - Run available tests after fixes

### 📊 **Fix Tracking**
- **Change Log** - Record of all applied fixes
- **Success Metrics** - Track fix success rates
- **Rollback History** - Maintain undo capabilities
- **Learning Integration** - Improve fix suggestions over time

## Integration with Earth Agents

### 🤖 **Botbie Integration**
- **Analysis-Driven Fixes** - Fix issues found during quality analysis
- **Priority-Based Application** - Focus on critical and high-impact issues
- **Learning Feedback** - Improve analysis based on fix outcomes

### 🌍 **DebugEarth Integration**
- **Bug-Preventive Fixes** - Apply fixes that prevent common debugging scenarios
- **Root Cause Elimination** - Fix underlying issues that cause multiple bugs
- **Pattern-Breaking Fixes** - Interrupt problematic code patterns

### 💡 **Learning Engine**
- **Success Pattern Recognition** - Learn which fixes work best
- **Team Preference Learning** - Adapt to team coding styles
- **Effectiveness Tracking** - Measure long-term impact of fixes

## Fix Commands

### Basic Operations
- `fix` - Analyze and fix all applicable issues
- `fix --dry-run` - Preview fixes without applying
- `fix --rollback` - Undo the last set of fixes
- `fix --backup` - Create manual backup before fixes

### Specific Fix Types
- `fix documentation` - Generate missing documentation
- `fix imports` - Organize and clean imports
- `fix formatting` - Apply consistent code formatting
- `fix security` - Address security vulnerabilities
- `fix performance` - Apply performance optimizations

### Advanced Options
- `fix --interactive` - Review each fix before applying
- `fix --aggressive` - Apply more extensive refactoring
- `fix --conservative` - Only apply safest fixes
- `fix --custom-rules` - Use project-specific fix rules

Ready to automatically improve your code quality? Let's fix those issues systematically and safely! 🚀

*What would you like me to fix first?*