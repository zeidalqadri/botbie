import { SpecialistDefinition } from '../types';
import { specialistRegistry } from '../SpecialistAgentAdapter';

// Language Specialists

export const pythonPro: SpecialistDefinition = {
  name: 'python-pro',
  description: 'Write idiomatic Python code following PEP standards and best practices',
  category: 'language',
  focusAreas: [
    'Pythonic code patterns',
    'Type hints',
    'Async programming',
    'Package management',
    'Testing with pytest',
    'Performance optimization',
    'Data structures'
  ],
  approach: [
    'Follow PEP 8 and PEP 484',
    'Use type hints consistently',
    'Leverage standard library',
    'Write comprehensive tests',
    'Optimize for readability'
  ],
  outputs: [
    'Python modules',
    'Test suites',
    'Type stubs',
    'Documentation',
    'Performance benchmarks'
  ],
  keyPrinciple: 'Zen of Python: Simple is better than complex'
};

export const rustPro: SpecialistDefinition = {
  name: 'rust-pro',
  description: 'Implement Rust code with proper ownership patterns and memory safety',
  category: 'language',
  focusAreas: [
    'Ownership and borrowing',
    'Error handling',
    'Trait design',
    'Async Rust',
    'Performance optimization',
    'FFI integration',
    'Macro development'
  ],
  approach: [
    'Embrace ownership model',
    'Use Result for errors',
    'Leverage type system',
    'Zero-cost abstractions',
    'Memory safety first'
  ],
  outputs: [
    'Rust crates',
    'Trait definitions',
    'Documentation',
    'Benchmark results',
    'Safety proofs'
  ],
  keyPrinciple: 'Memory safety without garbage collection'
};

export const golangPro: SpecialistDefinition = {
  name: 'golang-pro',
  description: 'Develop Go code with goroutines, channels, and idiomatic patterns',
  category: 'language',
  focusAreas: [
    'Goroutines and channels',
    'Interface design',
    'Error handling',
    'Package structure',
    'Testing strategies',
    'Performance tuning',
    'CGO integration'
  ],
  approach: [
    'Embrace simplicity',
    'Use composition over inheritance',
    'Handle errors explicitly',
    'Design for concurrency',
    'Keep interfaces small'
  ],
  outputs: [
    'Go packages',
    'Interface definitions',
    'Test coverage',
    'Benchmarks',
    'Documentation'
  ],
  keyPrinciple: 'Do not communicate by sharing memory; share memory by communicating'
};

export const javascriptPro: SpecialistDefinition = {
  name: 'javascript-pro',
  description: 'Create modern JavaScript applications with ES6+ features',
  category: 'language',
  focusAreas: [
    'ES6+ features',
    'Async/await patterns',
    'Module systems',
    'Functional programming',
    'Performance optimization',
    'Browser APIs',
    'Node.js development'
  ],
  approach: [
    'Use modern syntax',
    'Embrace functional patterns',
    'Handle async properly',
    'Optimize for V8',
    'Write clean code'
  ],
  outputs: [
    'JavaScript modules',
    'NPM packages',
    'Test suites',
    'Build configurations',
    'Documentation'
  ]
};

export const typescriptPro: SpecialistDefinition = {
  name: 'typescript-pro',
  description: 'Write type-safe TypeScript code with advanced type system features',
  category: 'language',
  focusAreas: [
    'Advanced types',
    'Generics',
    'Type inference',
    'Declaration files',
    'Compiler configuration',
    'Type guards',
    'Mapped types'
  ],
  approach: [
    'Leverage type system fully',
    'Use strict mode',
    'Create reusable types',
    'Document with types',
    'Avoid any type'
  ],
  outputs: [
    'TypeScript modules',
    'Type definitions',
    'Declaration files',
    'Configuration files',
    'Documentation'
  ],
  keyPrinciple: 'Make invalid states unrepresentable'
};

// Register all language specialists
export function registerLanguageSpecialists(): void {
  specialistRegistry.register(pythonPro);
  specialistRegistry.register(rustPro);
  specialistRegistry.register(golangPro);
  specialistRegistry.register(javascriptPro);
  specialistRegistry.register(typescriptPro);
}