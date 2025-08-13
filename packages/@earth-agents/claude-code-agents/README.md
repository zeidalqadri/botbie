# Earth Agents Claude Code Slash Commands

This directory contains Claude Code slash command agents that bring Earth Agents workflow capabilities directly to your Claude Code environment.

## 🚀 Available Agents

### Workflow-Based Agents
- **`/performance-optimization`** - Comprehensive performance analysis and optimization
- **`/security-audit`** - Enterprise security pipeline with OWASP compliance
- **`/legacy-modernization`** - Transform legacy applications to modern architecture
- **`/ai-code-review`** - Intelligent automated code review with expert feedback
- **`/rapid-prototyping`** - Quick idea-to-prototype development

### Specialist-Focused Agents
- **`/ui-design`** - Modern UI/UX design with accessibility expertise
- **`/backend-architecture`** - Scalable backend system architecture and API design
- **`/debug-analysis`** - Deep debugging and system analysis

## 📦 Installation

### Option 1: Copy to Claude Code Agents Directory

Find your Claude Code agents directory and copy the `.md` files:

```bash
# Find Claude Code installation
claude --version

# Copy agents to Claude Code agents directory
cp *.md ~/.claude/agents/
# or
cp *.md /path/to/claude/agents/
```

### Option 2: Symlink for Development

Create symbolic links to keep agents updated with your Earth Agents repository:

```bash
# Navigate to Claude Code agents directory
cd ~/.claude/agents/

# Create symlinks to Earth Agents slash commands
ln -s /path/to/earth-agents/claude-code-agents/*.md .
```

### Option 3: Manual Installation

Copy individual agent files manually:

1. Navigate to your Claude Code agents directory
2. Copy the desired `.md` files from this directory
3. Restart Claude Code or reload the agent list

## 💡 Usage

After installation, use the agents by typing `/` followed by the agent name in Claude Code:

### Performance Optimization
```
/performance-optimization

"Optimize the performance of my React application - bundle size is 2MB and Core Web Vitals are poor"
```

### Security Audit
```
/security-audit

"Perform OWASP Top 10 security audit on our Node.js API with PostgreSQL database"
```

### UI Design
```
/ui-design

"Design a responsive dashboard interface for analytics with accessibility compliance"
```

### Backend Architecture  
```
/backend-architecture

"Design a scalable microservices architecture for an e-commerce platform"
```

### Code Review
```
/ai-code-review

"Review this pull request for security issues and performance implications"
```

### Legacy Modernization
```
/legacy-modernization

"Modernize our jQuery application to React with TypeScript and modern tooling"
```

### Rapid Prototyping
```
/rapid-prototyping

"Create a task management app prototype for team collaboration - need demo ready"
```

### Debug Analysis
```
/debug-analysis

"Investigate why our API response times increased from 200ms to 2s this week"
```

## 🎯 Agent Capabilities

Each agent brings specialist expertise from the Earth Agents ecosystem:

### Specialist Integration
- **Performance Engineer** - Code analysis, bottleneck identification
- **Security Auditor** - Vulnerability assessment, OWASP compliance  
- **UI/UX Designer** - Interface design, accessibility compliance
- **Backend Architect** - System design, scalability planning
- **Senior Code Reviewer** - Quality analysis, best practices
- **Debug Specialist** - Complex issue investigation

### Advanced Features
- **Multi-perspective Analysis** - Multiple specialist viewpoints
- **Actionable Recommendations** - Specific implementation steps
- **Compliance Validation** - WCAG, OWASP, PCI-DSS standards
- **Performance Metrics** - Measurable improvement targets
- **Code Generation** - Implementation examples and fixes
- **Documentation** - Comprehensive guides and checklists

## 📊 Example Outputs

### Performance Optimization Results
```
🚀 PERFORMANCE OPTIMIZATION RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PERFORMANCE IMPROVEMENTS:
├─ Bundle Size: 2.1MB → 847KB (-60%)
├─ First Contentful Paint: 3.2s → 1.1s (-66%)
├─ Largest Contentful Paint: 4.8s → 1.9s (-60%)
└─ Cumulative Layout Shift: 0.25 → 0.04 (-84%)

🎯 CORE WEB VITALS: ✅ All metrics now pass
💡 OPTIMIZATION TECHNIQUES APPLIED:
├─ Code splitting with React.lazy()
├─ Tree-shaking and dead code elimination
├─ Image optimization with WebP format
└─ Critical CSS inlining
```

### Security Audit Results
```
🔒 SECURITY AUDIT RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 SECURITY SCORE: 94/100 (Target: 95+)
🚨 CRITICAL ISSUES: 0 found ✅
⚠️  HIGH PRIORITY: 2 found
📋 MEDIUM PRIORITY: 5 found

🔍 OWASP TOP 10 COMPLIANCE:
├─ A01 Broken Access Control: ✅ PASS
├─ A02 Cryptographic Failures: ⚠️  PARTIAL
├─ A03 Injection: ✅ PASS
└─ A04 Insecure Design: ✅ PASS

💡 TOP RECOMMENDATIONS:
├─ Implement Content Security Policy headers
├─ Add rate limiting to authentication endpoints
└─ Update bcrypt to latest version for password hashing
```

## 🔧 Customization

### Modify Agent Behavior

Edit the `.md` files to customize agent behavior:

```yaml
---
name: your-custom-agent
description: Your custom agent description
---

Your custom system prompt and instructions...
```

### Add Custom Specialists

Extend agents with additional specialist expertise by modifying the focus areas and approach sections.

### Integration with Workflows

These agents can trigger full Earth Agents workflows when more comprehensive analysis is needed.

## 🤝 Contributing

To contribute new agents or improve existing ones:

1. Create or modify `.md` files following the established pattern
2. Test agents in Claude Code environment
3. Update documentation and examples
4. Submit pull request with changes

## 📚 Related Documentation

- [Earth Agents Specialists](../specialists/README.md) - Complete specialist system documentation
- [Workflow Templates](../workflows/templates/) - Full workflow definitions
- [Integration Guides](../specialists/docs/integration-guides.md) - Detailed integration patterns

## 🆘 Troubleshooting

### Agent Not Appearing
1. Verify `.md` file is in correct agents directory
2. Check file permissions (should be readable)
3. Restart Claude Code or reload agents
4. Verify YAML front matter is properly formatted

### Agent Not Working as Expected
1. Check system prompt formatting and syntax
2. Verify specialist references and capabilities
3. Test with simpler prompts first
4. Review agent logs if available

### Performance Issues
1. Some agents perform complex analysis - expect longer response times
2. Agents may invoke multiple specialists in parallel
3. Large codebases may require more processing time
4. Consider using specific focus areas to narrow scope

---

*Transform your Claude Code experience with Earth Agents specialist expertise! These slash commands bring enterprise-level capabilities directly to your development workflow.* 🌍🤖✨