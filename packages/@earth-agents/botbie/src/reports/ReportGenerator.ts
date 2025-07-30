import { CodeHealthReport } from '../Botbie';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import chalk from 'chalk';

export class ReportGenerator {
  async generateReport(report: CodeHealthReport, outputPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `botbie-report-${timestamp}`;
    
    // Generate both HTML and Markdown reports
    const htmlReport = this.generateHTMLReport(report);
    const markdownReport = this.generateMarkdownReport(report);
    
    // Determine output directory
    const outputDir = outputPath || path.join(process.cwd(), '.botbie', 'reports');
    mkdirSync(outputDir, { recursive: true });
    
    // Save reports
    const htmlPath = path.join(outputDir, `${fileName}.html`);
    const mdPath = path.join(outputDir, `${fileName}.md`);
    
    writeFileSync(htmlPath, htmlReport);
    writeFileSync(mdPath, markdownReport);
    
    console.log(chalk.green(`\n📄 Reports generated:`));
    console.log(`  HTML: ${htmlPath}`);
    console.log(`  Markdown: ${mdPath}`);
    
    return htmlPath;
  }
  
  private generateHTMLReport(report: CodeHealthReport): string {
    const scoreClass = report.summary.qualityScore >= 80 ? 'good' : 
                      report.summary.qualityScore >= 60 ? 'warning' : 'error';
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>Botbie Code Health Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        h1 {
            color: #2c3e50;
            margin: 0 0 20px 0;
        }
        .score {
            font-size: 48px;
            font-weight: bold;
            margin: 20px 0;
        }
        .score.good { color: #27ae60; }
        .score.warning { color: #f39c12; }
        .score.error { color: #e74c3c; }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .metric {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .metric-value {
            font-size: 32px;
            font-weight: bold;
            color: #2c3e50;
        }
        .metric-label {
            color: #7f8c8d;
            margin-top: 5px;
        }
        .section {
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .issue {
            border-left: 4px solid;
            padding: 15px;
            margin: 15px 0;
            background: #f8f9fa;
        }
        .issue.critical { border-color: #e74c3c; }
        .issue.high { border-color: #f39c12; }
        .issue.medium { border-color: #3498db; }
        .issue.low { border-color: #95a5a6; }
        .issue-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .severity {
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        .severity.critical { background: #e74c3c; }
        .severity.high { background: #f39c12; }
        .severity.medium { background: #3498db; }
        .severity.low { background: #95a5a6; }
        .suggestion {
            margin-top: 10px;
            padding: 10px;
            background: #e8f4f8;
            border-radius: 4px;
            font-size: 14px;
        }
        .file-path {
            font-family: monospace;
            font-size: 12px;
            color: #7f8c8d;
        }
        .timestamp {
            color: #7f8c8d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 Botbie Code Health Report</h1>
        <div class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</div>
        <div class="score ${scoreClass}">${report.summary.qualityScore.toFixed(1)}/100</div>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-value">${report.summary.totalFiles}</div>
            <div class="metric-label">Total Files</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.totalIssues}</div>
            <div class="metric-label">Total Issues</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.criticalIssues}</div>
            <div class="metric-label">Critical Issues</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.metrics.technicalDebt}h</div>
            <div class="metric-label">Technical Debt</div>
        </div>
    </div>
    
    <div class="section">
        <h2>📊 Project Metrics</h2>
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${report.metrics.linesOfCode.toLocaleString()}</div>
                <div class="metric-label">Lines of Code</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.metrics.complexityScore.toFixed(1)}</div>
                <div class="metric-label">Avg Complexity</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.metrics.maintainabilityIndex.toFixed(1)}</div>
                <div class="metric-label">Maintainability</div>
            </div>
        </div>
    </div>
    
    ${report.issues.length > 0 ? `
    <div class="section">
        <h2>🔍 Issues Found</h2>
        ${report.issues.map(issue => `
            <div class="issue ${issue.severity}">
                <div class="issue-header">
                    <strong>${issue.description}</strong>
                    <span class="severity ${issue.severity}">${issue.severity.toUpperCase()}</span>
                </div>
                ${issue.file ? `<div class="file-path">${issue.file}${issue.line ? `:${issue.line}` : ''}</div>` : ''}
                ${issue.suggestion ? `<div class="suggestion">💡 ${issue.suggestion}</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${report.suggestions.length > 0 ? `
    <div class="section">
        <h2>💡 Suggestions</h2>
        ${report.suggestions.map(suggestion => `
            <div class="issue medium">
                <strong>${suggestion.description}</strong>
                <div style="margin-top: 10px;">
                    Impact: <strong>${suggestion.impact}</strong> | 
                    Effort: <strong>${suggestion.effort}</strong>
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>`;
  }
  
  private generateMarkdownReport(report: CodeHealthReport): string {
    return `# 🤖 Botbie Code Health Report

Generated: ${new Date(report.timestamp).toLocaleString()}

## Summary

**Quality Score: ${report.summary.qualityScore.toFixed(1)}/100**

| Metric | Value |
|--------|-------|
| Total Files | ${report.summary.totalFiles} |
| Total Issues | ${report.summary.totalIssues} |
| Critical Issues | ${report.summary.criticalIssues} |
| Technical Debt | ${report.metrics.technicalDebt} hours |

## Project Metrics

| Metric | Value |
|--------|-------|
| Lines of Code | ${report.metrics.linesOfCode.toLocaleString()} |
| Average Complexity | ${report.metrics.complexityScore.toFixed(1)} |
| Maintainability Index | ${report.metrics.maintainabilityIndex.toFixed(1)} |

${report.issues.length > 0 ? `
## Issues Found

${report.issues.map(issue => `
### [${issue.severity.toUpperCase()}] ${issue.description}

${issue.file ? `**File:** \`${issue.file}${issue.line ? `:${issue.line}` : ''}\`\n` : ''}
${issue.suggestion ? `**Suggestion:** ${issue.suggestion}\n` : ''}
${issue.autoFixAvailable ? '✅ Auto-fix available\n' : ''}
`).join('\n---\n')}
` : ''}

${report.suggestions.length > 0 ? `
## Improvement Suggestions

${report.suggestions.map(suggestion => `
### ${suggestion.description}

- **Impact:** ${suggestion.impact}
- **Effort:** ${suggestion.effort}
`).join('\n')}
` : ''}

---

*Report generated by Botbie - Your proactive code quality guardian*
`;
  }
}