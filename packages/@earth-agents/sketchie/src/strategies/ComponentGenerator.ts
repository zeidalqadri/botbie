import { Strategy, StrategyResult, logger } from '@earth-agents/core';
import {
  UIComponent,
  ComponentGenerationOptions,
  PropDefinition,
  StyleDefinition,
  ComponentType
} from '../types';
import { SketchieConfig } from '../Sketchie';
import * as prettier from 'prettier';
import chalk from 'chalk';

export class ComponentGenerator implements Strategy {
  name = 'Component Generator';
  description = 'Generates TypeScript/React components from UI specifications';
  
  constructor(private config: SketchieConfig) {}
  
  canHandle(context: any): boolean {
    return context.components?.length > 0 || context.command === 'generate-component';
  }
  
  async execute(context: any): Promise<StrategyResult> {
    const { components, options } = context;
    
    if (!components || components.length === 0) {
      return {
        success: false,
        data: { error: 'No components to generate' }
      };
    }
    
    try {
      console.log(chalk.cyan(`🏗️  Generating ${components.length} components...`));
      
      const framework = options?.framework || this.config.defaultFramework || 'react';
      const styling = options?.styling || this.config.defaultStyling || 'styled-components';
      const typescript = options?.typescript !== false;
      
      const generatedComponents = await Promise.all(
        components.map(async (component: UIComponent) => {
          const code = await this.generateComponent(component, {
            framework,
            styling,
            typescript,
            testing: options?.testing || false,
            storybook: options?.storybook || false,
            accessibility: options?.accessibility !== false
          });
          
          return {
            ...component,
            ...code
          };
        })
      );
      
      console.log(chalk.green(`✓ Generated ${generatedComponents.length} components`));
      
      return {
        success: true,
        data: {
          components: generatedComponents,
          generatedCode: {
            typescript: generatedComponents.map(c => c.typescript).join('\n\n'),
            jsx: generatedComponents.map(c => c.jsx).join('\n\n'),
            css: generatedComponents.map(c => c.css).join('\n\n')
          }
        }
      };
      
    } catch (error) {
      logger.error('Component generation failed:', error);
      return {
        success: false,
        data: { error: error.message }
      };
    }
  }
  
  private async generateComponent(
    component: UIComponent,
    options: ComponentGenerationOptions
  ): Promise<any> {
    let code: any = {};
    
    switch (options.framework) {
      case 'react':
        code = await this.generateReactComponent(component, options);
        break;
      case 'vue':
        code = await this.generateVueComponent(component, options);
        break;
      case 'angular':
        code = await this.generateAngularComponent(component, options);
        break;
      case 'webcomponents':
        code = await this.generateWebComponent(component, options);
        break;
    }
    
    // Format code with Prettier
    if (code.typescript) {
      code.typescript = await this.formatCode(code.typescript, 'typescript');
    }
    if (code.jsx) {
      code.jsx = await this.formatCode(code.jsx, 'typescript');
    }
    if (code.css) {
      code.css = await this.formatCode(code.css, 'css');
    }
    
    return code;
  }
  
  private async generateReactComponent(
    component: UIComponent,
    options: ComponentGenerationOptions
  ): Promise<any> {
    const componentName = this.toPascalCase(component.name);
    const props = this.generatePropsInterface(component.props, componentName);
    const imports = this.generateImports(component, options);
    const styles = await this.generateStyles(component, options);
    const jsxContent = this.generateJSX(component, options);
    
    const typescript = `
${imports}

${props}

${options.styling === 'styled-components' ? styles.styledComponents : ''}

export const ${componentName}: React.FC<${componentName}Props> = ({
  ${this.generatePropsDestructuring(component.props)}
}) => {
  ${this.generateHooks(component)}
  
  return (
    ${jsxContent}
  );
};

${this.generateDefaultProps(component, componentName)}
`;

    const jsx = options.typescript ? undefined : typescript.replace(/: [^=,\)]+/g, '');
    
    const result: any = { typescript };
    if (jsx) result.jsx = jsx;
    if (options.styling === 'css' || options.styling === 'scss') {
      result.css = styles.css;
    }
    
    if (options.testing) {
      result.tests = await this.generateTests(component, componentName);
    }
    
    if (options.storybook) {
      result.stories = await this.generateStorybook(component, componentName);
    }
    
    return result;
  }
  
  private generatePropsInterface(props: PropDefinition[], componentName: string): string {
    if (!props || props.length === 0) {
      return `export interface ${componentName}Props {}`;
    }
    
    const propsString = props
      .map(prop => {
        const optional = prop.required ? '' : '?';
        const description = prop.description ? `\n  /** ${prop.description} */\n  ` : '';
        return `${description}${prop.name}${optional}: ${prop.type};`;
      })
      .join('\n  ');
    
    return `export interface ${componentName}Props {\n  ${propsString}\n}`;
  }
  
  private generateImports(component: UIComponent, options: ComponentGenerationOptions): string {
    const imports: string[] = ["import React from 'react';"];
    
    if (options.styling === 'styled-components') {
      imports.push("import styled from 'styled-components';");
    }
    
    if (options.styling === 'emotion') {
      imports.push("import styled from '@emotion/styled';");
    }
    
    // Add imports based on component type
    if (component.type === 'form') {
      imports.push("import { useState } from 'react';");
    }
    
    return imports.join('\n');
  }
  
  private async generateStyles(
    component: UIComponent,
    options: ComponentGenerationOptions
  ): Promise<any> {
    const styles = component.styles || {};
    
    if (options.styling === 'styled-components' || options.styling === 'emotion') {
      return {
        styledComponents: this.generateStyledComponents(component, styles)
      };
    }
    
    if (options.styling === 'tailwind') {
      return {
        tailwind: this.generateTailwindClasses(styles)
      };
    }
    
    // CSS/SCSS
    return {
      css: this.generateCSS(component, styles)
    };
  }
  
  private generateStyledComponents(component: UIComponent, styles: StyleDefinition): string {
    const componentName = this.toPascalCase(component.name);
    const baseElement = this.getBaseElement(component.type);
    
    const cssProperties = this.stylesToCSS(styles);
    
    return `
const Styled${componentName} = styled.${baseElement}\`
  ${cssProperties}
  
  ${styles.responsive ? this.generateResponsiveStyles(styles.responsive) : ''}
\`;`;
  }
  
  private stylesToCSS(styles: StyleDefinition): string {
    const css: string[] = [];
    
    if (styles.layout) {
      Object.entries(styles.layout).forEach(([key, value]) => {
        const cssKey = this.camelToKebab(key);
        css.push(`${cssKey}: ${value};`);
      });
    }
    
    if (styles.typography) {
      Object.entries(styles.typography).forEach(([key, value]) => {
        const cssKey = this.camelToKebab(key);
        css.push(`${cssKey}: ${value};`);
      });
    }
    
    if (styles.colors) {
      if (styles.colors.background) css.push(`background-color: ${styles.colors.background};`);
      if (styles.colors.text) css.push(`color: ${styles.colors.text};`);
      if (styles.colors.border) css.push(`border-color: ${styles.colors.border};`);
    }
    
    if (styles.effects) {
      Object.entries(styles.effects).forEach(([key, value]) => {
        const cssKey = this.camelToKebab(key);
        css.push(`${cssKey}: ${value};`);
      });
    }
    
    return css.join('\n  ');
  }
  
  private generateResponsiveStyles(responsive: any[]): string {
    return responsive
      .map(({ breakpoint, styles }) => {
        const cssProperties = this.stylesToCSS(styles);
        return `
  @media (min-width: ${breakpoint}) {
    ${cssProperties}
  }`;
      })
      .join('\n');
  }
  
  private generateTailwindClasses(styles: StyleDefinition): string {
    const classes: string[] = [];
    
    // Map styles to Tailwind classes
    if (styles.layout?.display === 'flex') classes.push('flex');
    if (styles.layout?.flexDirection === 'column') classes.push('flex-col');
    if (styles.layout?.justifyContent === 'center') classes.push('justify-center');
    if (styles.layout?.alignItems === 'center') classes.push('items-center');
    
    // Add more mappings as needed
    
    return classes.join(' ');
  }
  
  private generateCSS(component: UIComponent, styles: StyleDefinition): string {
    const className = `.${this.toKebabCase(component.name)}`;
    const cssProperties = this.stylesToCSS(styles);
    
    return `
${className} {
  ${cssProperties}
}

${styles.responsive ? this.generateResponsiveCSSRules(className, styles.responsive) : ''}
`;
  }
  
  private generateResponsiveCSSRules(className: string, responsive: any[]): string {
    return responsive
      .map(({ breakpoint, styles }) => {
        const cssProperties = this.stylesToCSS(styles);
        return `
@media (min-width: ${breakpoint}) {
  ${className} {
    ${cssProperties}
  }
}`;
      })
      .join('\n');
  }
  
  private generateJSX(component: UIComponent, options: ComponentGenerationOptions): string {
    const componentName = this.toPascalCase(component.name);
    const styledName = options.styling === 'styled-components' ? `Styled${componentName}` : 'div';
    const className = options.styling === 'tailwind' 
      ? `className="${this.generateTailwindClasses(component.styles || {})}"`
      : options.styling === 'css' || options.styling === 'scss'
      ? `className="${this.toKebabCase(component.name)}"`
      : '';
    
    const accessibility = this.generateAccessibilityAttributes(component);
    const eventHandlers = this.generateEventHandlers(component);
    
    return `
    <${styledName}
      ${className}
      ${accessibility}
      ${eventHandlers}
    >
      ${this.generateChildren(component)}
    </${styledName}>
  `;
  }
  
  private generateAccessibilityAttributes(component: UIComponent): string {
    if (!component.accessibility) return '';
    
    const attrs: string[] = [];
    const { role, ariaLabel, ariaDescribedBy, tabIndex } = component.accessibility;
    
    if (role) attrs.push(`role="${role}"`);
    if (ariaLabel) attrs.push(`aria-label="${ariaLabel}"`);
    if (ariaDescribedBy) attrs.push(`aria-describedby="${ariaDescribedBy}"`);
    if (tabIndex !== undefined) attrs.push(`tabIndex={${tabIndex}}`);
    
    return attrs.join('\n      ');
  }
  
  private generateEventHandlers(component: UIComponent): string {
    const handlers: string[] = [];
    
    // Add event handlers based on component type
    if (component.type === 'button') {
      handlers.push('onClick={onClick}');
    }
    
    if (component.type === 'input') {
      handlers.push('onChange={(e) => onChange(e.target.value)}');
      handlers.push('value={value}');
    }
    
    return handlers.join('\n      ');
  }
  
  private generateChildren(component: UIComponent): string {
    if (component.children && component.children.length > 0) {
      return component.children
        .map(child => this.generateChildComponent(child))
        .join('\n      ');
    }
    
    if (component.type === 'button' || component.type === 'text') {
      return '{children}';
    }
    
    return '';
  }
  
  private generateChildComponent(child: UIComponent): string {
    // Simplified child component generation
    return `<${this.toPascalCase(child.name)} />`;
  }
  
  private generatePropsDestructuring(props: PropDefinition[]): string {
    if (!props || props.length === 0) return '';
    
    const propNames = props.map(p => {
      if (p.defaultValue !== undefined) {
        return `${p.name} = ${JSON.stringify(p.defaultValue)}`;
      }
      return p.name;
    });
    
    return propNames.join(',\n  ');
  }
  
  private generateHooks(component: UIComponent): string {
    const hooks: string[] = [];
    
    if (component.type === 'form') {
      hooks.push('const [formData, setFormData] = useState({});');
    }
    
    return hooks.join('\n  ');
  }
  
  private generateDefaultProps(component: UIComponent, componentName: string): string {
    const defaultProps = component.props?.filter(p => p.defaultValue !== undefined);
    
    if (!defaultProps || defaultProps.length === 0) return '';
    
    const defaults = defaultProps
      .map(p => `  ${p.name}: ${JSON.stringify(p.defaultValue)}`)
      .join(',\n');
    
    return `
${componentName}.defaultProps = {
${defaults}
};`;
  }
  
  private async generateTests(component: UIComponent, componentName: string): Promise<string> {
    return `
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${componentName} } from './${componentName}';

describe('${componentName}', () => {
  it('renders correctly', () => {
    render(<${componentName} />);
    expect(screen.getByRole('${component.accessibility?.role || 'region'}')).toBeInTheDocument();
  });
  
  ${component.type === 'button' ? `
  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<${componentName} onClick={handleClick}>Click me</${componentName}>);
    
    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });` : ''}
  
  ${component.accessibility ? `
  it('meets accessibility standards', () => {
    const { container } = render(<${componentName} />);
    expect(container.firstChild).toHaveAttribute('aria-label');
  });` : ''}
});`;
  }
  
  private async generateStorybook(component: UIComponent, componentName: string): Promise<string> {
    return `
import type { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from './${componentName}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    ${this.generateStorybookArgTypes(component.props)}
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ${this.generateStorybookDefaultArgs(component.props)}
  },
};

${component.type === 'button' ? `
export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};` : ''}`;
  }
  
  private generateStorybookArgTypes(props?: PropDefinition[]): string {
    if (!props) return '';
    
    return props
      .map(prop => `${prop.name}: { control: '${this.getStorybookControl(prop.type)}' }`)
      .join(',\n    ');
  }
  
  private generateStorybookDefaultArgs(props?: PropDefinition[]): string {
    if (!props) return '';
    
    return props
      .filter(p => p.defaultValue !== undefined)
      .map(p => `${p.name}: ${JSON.stringify(p.defaultValue)}`)
      .join(',\n    ');
  }
  
  private getStorybookControl(type: string): string {
    if (type === 'boolean') return 'boolean';
    if (type === 'number') return 'number';
    if (type.includes('|')) return 'select';
    return 'text';
  }
  
  private async generateVueComponent(
    component: UIComponent,
    options: ComponentGenerationOptions
  ): Promise<any> {
    // TODO: Implement Vue component generation
    return { typescript: '// Vue component generation not yet implemented' };
  }
  
  private async generateAngularComponent(
    component: UIComponent,
    options: ComponentGenerationOptions
  ): Promise<any> {
    // TODO: Implement Angular component generation
    return { typescript: '// Angular component generation not yet implemented' };
  }
  
  private async generateWebComponent(
    component: UIComponent,
    options: ComponentGenerationOptions
  ): Promise<any> {
    // TODO: Implement Web Component generation
    return { typescript: '// Web Component generation not yet implemented' };
  }
  
  private async formatCode(code: string, parser: string): Promise<string> {
    try {
      return prettier.format(code, {
        parser,
        singleQuote: true,
        trailingComma: 'es5',
        tabWidth: 2,
        semi: true,
      });
    } catch (error) {
      logger.warn('Code formatting failed:', error);
      return code;
    }
  }
  
  private getBaseElement(type: ComponentType): string {
    const elementMap: Record<ComponentType, string> = {
      button: 'button',
      input: 'input',
      form: 'form',
      card: 'article',
      list: 'ul',
      navigation: 'nav',
      layout: 'div',
      text: 'p',
      image: 'img',
      custom: 'div'
    };
    
    return elementMap[type] || 'div';
  }
  
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
  
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
  
  private camelToKebab(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}