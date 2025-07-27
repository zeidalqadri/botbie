# 🚀 DebugEarth VS Code Extension Deployment Guide

This guide covers how to package, test, and deploy the DebugEarth VS Code extension.

## Prerequisites

- Node.js and npm installed
- VS Code installed
- `vsce` (Visual Studio Code Extension manager) installed globally

```bash
npm install -g vsce
```

## Development Testing

### 1. Local Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Open in VS Code and press F5 to launch Extension Development Host
```

### 2. Manual Testing Checklist

Follow the [TESTING.md](./TESTING.md) guide for comprehensive testing:

- ✅ Extension loads without errors
- ✅ All commands work correctly  
- ✅ Tree views populate and refresh
- ✅ Debug panel functions properly
- ✅ Evidence collection works
- ✅ Root cause analysis runs
- ✅ Configuration settings apply

## Packaging

### 1. Pre-package Validation

```bash
# Ensure clean compilation
npm run compile

# Check for TypeScript errors
npx tsc --noEmit

# Verify package.json is correct
cat package.json | jq '.main, .engines, .categories'
```

### 2. Create VSIX Package

```bash
# Package the extension
vsce package

# This creates: debugearth-vscode-1.0.0.vsix
```

### 3. Validate Package

```bash
# List package contents
vsce ls

# Check package size (should be reasonable)
ls -lah *.vsix
```

## Installation Testing

### 1. Install from VSIX

```bash
# Install locally for testing
code --install-extension debugearth-vscode-1.0.0.vsix
```

### 2. Test Installation

1. **Restart VS Code**
2. **Verify Extension Appears** in Extensions panel
3. **Test Core Functionality** according to testing checklist
4. **Check for Errors** in Developer Console

### 3. Uninstall for Clean Testing

```bash
# Uninstall extension
code --uninstall-extension debugearth.debugearth-vscode
```

## Publishing Options

### Option 1: VS Code Marketplace

#### Prerequisites
- Microsoft account
- Azure DevOps organization  
- Publisher account on VS Code Marketplace

#### Steps
```bash
# Create publisher (one-time setup)
vsce create-publisher your-publisher-name

# Login to publisher account
vsce login your-publisher-name

# Publish to marketplace
vsce publish
```

#### Marketplace Requirements
- ✅ Unique extension name
- ✅ Description and tags
- ✅ README with screenshots
- ✅ Icon (128x128 PNG)
- ✅ License file
- ✅ Repository URL
- ✅ Version following semver

### Option 2: GitHub Releases

1. **Create GitHub Release**
   - Tag version (e.g., `v1.0.0`)
   - Upload VSIX file as release asset
   - Include changelog and installation instructions

2. **Installation Instructions**
   ```bash
   # Download VSIX from GitHub releases
   # Install manually in VS Code
   code --install-extension debugearth-vscode-1.0.0.vsix
   ```

### Option 3: Private Distribution

1. **Share VSIX File** directly with users
2. **Provide Installation Instructions**
3. **Include Setup Guide** and documentation

## CI/CD Pipeline (Future)

### GitHub Actions Example

```yaml
name: Build and Test Extension

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - run: npm install
    - run: npm run compile
    - run: npm run lint
    
    - name: Package Extension
      run: |
        npm install -g vsce
        vsce package
    
    - name: Upload VSIX
      uses: actions/upload-artifact@v3
      with:
        name: extension-vsix
        path: '*.vsix'
```

## Version Management

### Semantic Versioning

- **Major (1.0.0)**: Breaking changes
- **Minor (1.1.0)**: New features
- **Patch (1.0.1)**: Bug fixes

### Version Update Process

1. **Update package.json version**
2. **Update CHANGELOG.md**
3. **Commit changes**
4. **Create git tag**
5. **Package and publish**

```bash
# Update version
npm version patch  # or minor, major

# Package new version
vsce package

# Publish if using marketplace
vsce publish
```

## Pre-publication Checklist

### Code Quality
- ✅ TypeScript compilation without errors
- ✅ No console errors in extension
- ✅ Code follows VS Code extension guidelines
- ✅ Proper error handling implemented

### Documentation
- ✅ README.md complete with examples
- ✅ CHANGELOG.md updated
- ✅ Testing guide available
- ✅ API documentation accurate

### Package Configuration
- ✅ package.json metadata complete
- ✅ Correct VS Code engine version
- ✅ All contribution points defined
- ✅ Dependencies properly listed

### Assets
- ✅ Extension icon (PNG, 128x128)
- ✅ Screenshots for marketplace
- ✅ License file included
- ✅ .vscodeignore configured

### Testing
- ✅ Manual testing completed
- ✅ Extension works in clean VS Code
- ✅ No conflicts with other extensions
- ✅ Performance acceptable

## Marketplace Best Practices

### Description
- Clear, concise description
- Key features highlighted
- Use cases explained
- Screenshots included

### Keywords
- "debug", "debugging"
- "root-cause-analysis"
- "developer-tools"
- "error-tracking"

### Categories
- "Debuggers"
- "Other"

### Icon Design
- 128x128 PNG format
- Clear, recognizable symbol
- Consistent with DebugEarth branding
- Readable at small sizes

## Support and Maintenance

### User Feedback
- Monitor marketplace reviews
- Track GitHub issues
- Respond to user questions
- Collect feature requests

### Updates
- Regular bug fixes
- VS Code API compatibility
- DebugEarth core updates
- Performance improvements

### Documentation
- Keep README updated
- Maintain examples
- Update troubleshooting guide
- Provide migration guides

---

**Deployment Status**: Ready for packaging and testing  
**Next Steps**: Manual testing → Package → Publish  
**Maintenance**: Regular updates and user support