import { describe, it, expect } from 'vitest';
import { validatePromptLength, MAX_PROMPT_LINES } from '../src/utils/prompt-loader.js';

describe('Prompt Loader', () => {
  describe('validatePromptLength', () => {
    it('should not warn for prompts under 200 lines', () => {
      const content = Array(150).fill('line').join('\n');
      const consoleSpy = { warnings: [] as string[] };
      const originalWarn = console.warn;
      console.warn = (msg: string) => consoleSpy.warnings.push(msg);

      validatePromptLength(content, 'test.md');

      console.warn = originalWarn;
      expect(consoleSpy.warnings.length).toBe(0);
    });

    it('should warn for prompts exceeding 200 lines', () => {
      const content = Array(250).fill('line').join('\n');
      const consoleSpy = { warnings: [] as string[] };
      const originalWarn = console.warn;
      console.warn = (msg: string) => consoleSpy.warnings.push(msg);

      validatePromptLength(content, 'test.md');

      console.warn = originalWarn;
      expect(consoleSpy.warnings.length).toBe(1);
      expect(consoleSpy.warnings[0]).toContain('test.md');
      expect(consoleSpy.warnings[0]).toContain('250 lines');
      expect(consoleSpy.warnings[0]).toContain(`${MAX_PROMPT_LINES} line limit`);
    });

    it('should warn at exactly 201 lines', () => {
      const content = Array(201).fill('line').join('\n');
      const consoleSpy = { warnings: [] as string[] };
      const originalWarn = console.warn;
      console.warn = (msg: string) => consoleSpy.warnings.push(msg);

      validatePromptLength(content, 'boundary.md');

      console.warn = originalWarn;
      expect(consoleSpy.warnings.length).toBe(1);
    });

    it('should not warn at exactly 200 lines', () => {
      const content = Array(200).fill('line').join('\n');
      const consoleSpy = { warnings: [] as string[] };
      const originalWarn = console.warn;
      console.warn = (msg: string) => consoleSpy.warnings.push(msg);

      validatePromptLength(content, 'boundary.md');

      console.warn = originalWarn;
      expect(consoleSpy.warnings.length).toBe(0);
    });

    it('should handle empty content', () => {
      const content = '';
      const consoleSpy = { warnings: [] as string[] };
      const originalWarn = console.warn;
      console.warn = (msg: string) => consoleSpy.warnings.push(msg);

      validatePromptLength(content, 'empty.md');

      console.warn = originalWarn;
      expect(consoleSpy.warnings.length).toBe(0);
    });
  });
});
