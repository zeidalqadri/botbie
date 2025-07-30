# /earth:workflow

🔗 **Unified Earth Agents Workflows** - Intelligent cross-agent orchestration

I orchestrate intelligent workflows that combine the power of both Botbie (proactive) and DebugEarth (reactive) for comprehensive code health management.

## Usage

**Run Workflow:**
```
/earth:workflow [type] [path]
```

**With Arguments:**
```
/earth:workflow $ARGUMENTS
```
Use $ARGUMENTS to specify workflow type and parameters

## Available Workflows

### 🛡️ **Preventive Workflow**
```
/earth:workflow preventive [path]
```

**Purpose:** Proactive quality analysis to prevent bugs before they happen

**Process:**
1. **Botbie Analysis** - Comprehensive code quality assessment
2. **Risk Assessment** - Identify high-risk code patterns
3. **Critical Issue Detection** - Find security vulnerabilities and potential crashes
4. **Preventive Recommendations** - Suggest improvements to avoid future bugs
5. **Quality Gates** - Set standards for code health

**Best For:**
- Pre-commit quality checks
- Code review preparation
- New feature development
- Team onboarding and standards

### 🔍 **Detective Workflow**
```
/earth:workflow detective [path]
```

**Purpose:** Reactive investigation when issues are already occurring

**Process:**
1. **Botbie Pre-Analysis** - Understanding current code quality
2. **DebugEarth Investigation** - Deep root cause analysis
3. **Cross-Agent Correlation** - Connect quality issues to runtime bugs
4. **Pattern Recognition** - Identify similar problems across codebase
5. **Solution Strategy** - Comprehensive fix recommendations

**Best For:**
- Production bug investigation
- Performance issue debugging
- Post-incident analysis
- Complex problem solving

### 🎯 **Comprehensive Workflow**
```
/earth:workflow comprehensive [path]
```

**Purpose:** Complete end-to-end code health assessment

**Process:**
1. **Full Spectrum Analysis** - Both preventive and detective approaches
2. **Cross-Agent Collaboration** - Real-time insight sharing
3. **Learning Integration** - Apply historical patterns and learnings
4. **Priority Matrix** - Rank issues by impact and effort
5. **Implementation Roadmap** - Structured improvement plan

**Best For:**
- Major refactoring projects
- Codebase health audits
- Team productivity optimization
- Architecture reviews

## Intelligent Workflow Selection

### 🤖 **AI-Powered Recommendations**
I analyze your project characteristics to recommend the optimal workflow:

- **Project Size** - Different approaches for small vs. large codebases
- **Historical Patterns** - Learn from past analysis results
- **Issue Severity** - Escalate automatically when critical issues found
- **Team Context** - Adapt to your team's working patterns

### 📊 **Context-Aware Decisions**
- **Git History** - Analyze commit patterns and bug frequencies
- **Code Metrics** - Consider complexity, coverage, and maintainability
- **Runtime Data** - Integrate error logs and performance metrics
- **Team Feedback** - Learn from developer input and preferences

## Workflow Features

### 🔄 **Real-Time Collaboration**
- **Live Insight Sharing** - Agents communicate during analysis
- **Dynamic Adaptation** - Workflows adjust based on findings
- **Conflict Resolution** - Handle contradictory insights intelligently
- **Priority Updates** - Re-prioritize as new information emerges

### 📈 **Progress Tracking**
- **Visual Progress** - Real-time workflow status updates
- **Milestone Tracking** - Clear checkpoints and achievements
- **Time Estimation** - Predicted completion times
- **Quality Metrics** - Continuous health scoring

### 🎛️ **Customization Options**
- **Severity Filters** - Focus on specific issue types
- **Agent Preferences** - Emphasize Botbie or DebugEarth
- **Output Formats** - Choose JSON, Markdown, or HTML reports
- **Integration Points** - Connect with CI/CD, Git hooks, IDEs

## Cross-Agent Learning

### 📚 **Pattern Recognition**
- **Bug-Quality Correlation** - Link code quality issues to runtime bugs
- **Performance-Complexity** - Connect code complexity to performance problems
- **Recurring Issues** - Identify frequently occurring patterns
- **Fix Effectiveness** - Track solution success rates

### 🔄 **Feedback Loops**
- **Continuous Improvement** - Workflows get smarter over time
- **Team Adaptation** - Learn team-specific patterns and preferences
- **Success Tracking** - Measure and optimize workflow effectiveness
- **Strategy Evolution** - Adapt approaches based on results

## Example Workflow Sessions

### Preventive Example
```
/earth:workflow preventive ./src

🛡️ Starting Preventive Workflow for ./src

Step 1: Botbie Quality Analysis
✅ Analyzed 45 files, Quality Score: 78/100
⚠️  Found 3 critical issues, 12 high priority issues

Step 2: Risk Assessment  
🎯 High-risk patterns identified:
- Complex authentication logic (security risk)
- Unbounded loops in data processing
- Missing error handling in API calls

Step 3: Preventive Recommendations
💡 Recommendations to prevent future bugs:
- Add input validation to prevent injection attacks
- Implement circuit breakers for external APIs
- Add monitoring for performance bottlenecks

🚨 Critical issues detected! 
Recommendation: Run detective workflow to investigate further
Command: /earth:workflow detective ./src
```

### Detective Example
```
/earth:workflow detective ./api

🔍 Starting Detective Workflow for ./api

Step 1: Botbie Pre-Analysis
📊 Code quality context established
🔍 Found 8 medium-priority issues in authentication module

Step 2: DebugEarth Investigation
🌍 Starting systematic debugging analysis
🕵️ Tracing error patterns in user login flows
📈 Performance bottlenecks identified in session management

Step 3: Cross-Agent Correlation
🔗 Connecting quality issues to runtime problems:
- Complex conditional logic correlates with auth failures
- Missing error boundaries cause user session crashes
- Inefficient database queries match reported slowdowns

Step 4: Root Cause Analysis
🎯 Root cause found: Race condition in session validation
📐 Mathematical proof: Concurrent requests create timing conflicts
✅ Solution: Implement proper locking mechanism

Session complete! Bug mystery solved! 🎉
```

## Integration Commands

### Session Management
- `/earth:workflow status` - Show active workflow status
- `/earth:workflow history` - View past workflow results
- `/earth:workflow insights` - Access cross-agent insights from workflows

### Learning System
- `/earth:workflow patterns` - View learned patterns from workflows
- `/earth:workflow feedback <rating>` - Rate workflow effectiveness
- `/earth:workflow optimize` - Apply learned optimizations

## Quick Commands

- `workflow preventive` - Proactive quality analysis
- `workflow detective` - Reactive issue investigation  
- `workflow comprehensive` - Full spectrum analysis
- `workflow smart` - AI-recommended workflow selection

Ready to orchestrate intelligent code health workflows? Let's ensure your codebase is both clean and bug-free! 🚀

*Which workflow would you like to run today?*