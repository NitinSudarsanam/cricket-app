import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const workflowsDir = resolve(__dirname, '../../../.github/workflows');

describe('GitHub Actions workflows', () => {
  const files = readdirSync(workflowsDir).filter((file) => file.endsWith('.yml'));

  it('has workflow files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s runs from the repository root', (file) => {
    const contents = readFileSync(resolve(workflowsDir, file), 'utf8');
    expect(contents).not.toMatch(/working-directory:\s*cricket-app/);
    expect(contents).not.toMatch(/cricket-app\/package-lock\.json/);
    expect(contents).toMatch(/cache-dependency-path:\s*package-lock\.json/);
    expect(contents).not.toMatch(/if:.*secrets\./);
  });

  it('commits package-lock.json so npm ci works', () => {
    const gitignore = readFileSync(resolve(__dirname, '../../../.gitignore'), 'utf8');
    expect(gitignore).not.toMatch(/^\s*\/package-lock\.json\s*$/m);
    expect(gitignore).not.toMatch(/^\s*package-lock\.json\s*$/m);
  });
});
