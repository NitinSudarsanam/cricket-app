/**
 * Production Readiness Check Script
 * 
 * This script verifies that the application is ready for production deployment
 * by checking configuration, dependencies, and build status.
 * 
 * Usage: node scripts/check-production-ready.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let hasErrors = false;
let hasWarnings = false;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkPassed(message) {
  log(`PASS ${message}`, colors.green);
}

function checkFailed(message) {
  log(`FAIL ${message}`, colors.red);
  hasErrors = true;
}

function checkWarning(message) {
  log(`WARN  ${message}`, colors.yellow);
  hasWarnings = true;
}

function checkInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

console.log('\n' + '='.repeat(70));
log('Production Readiness Check', colors.blue);
console.log('='.repeat(70) + '\n');

// Check 1: Required files exist
log('\nChecking required files...', colors.blue);

const requiredFiles = [
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'tsconfig.json',
  '.env.example',
  'prisma/schema.prisma',
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    checkPassed(`${file} exists`);
  } else {
    checkFailed(`${file} is missing`);
  }
});

// Check 2: Environment variables documented
log('\nChecking environment configuration...', colors.blue);

if (fs.existsSync('.env.example')) {
  const envExample = fs.readFileSync('.env.example', 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'PUSHER_APP_ID',
    'PUSHER_KEY',
    'PUSHER_SECRET',
    'PUSHER_CLUSTER',
    'NEXT_PUBLIC_PUSHER_KEY',
    'NEXT_PUBLIC_PUSHER_CLUSTER',
    'ADMIN_SECRET',
  ];

  requiredVars.forEach(varName => {
    if (envExample.includes(varName)) {
      checkPassed(`${varName} documented in .env.example`);
    } else {
      checkFailed(`${varName} missing from .env.example`);
    }
  });
} else {
  checkFailed('.env.example not found');
}

// Check 3: .env not committed
log('\nChecking security...', colors.blue);

if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('.env')) {
    checkPassed('.env files are gitignored');
  } else {
    checkFailed('.env files are NOT gitignored - security risk!');
  }
} else {
  checkWarning('.gitignore not found');
}

// Check 4: Dependencies
log('\nChecking dependencies...', colors.blue);

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = [
    'next',
    'react',
    'react-dom',
    '@prisma/client',
    'pusher',
    'pusher-js',
    'zustand',
  ];

  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      checkPassed(`${dep} installed`);
    } else {
      checkFailed(`${dep} missing from dependencies`);
    }
  });

  // Check for security vulnerabilities
  checkInfo('Running security audit...');
  try {
    execSync('npm audit --audit-level=high', { stdio: 'pipe' });
    checkPassed('No high-severity vulnerabilities found');
  } catch (error) {
    checkWarning('Security vulnerabilities detected - run "npm audit" for details');
  }
} catch (error) {
  checkFailed('Error reading package.json');
}

// Check 5: TypeScript configuration
log('\nChecking TypeScript configuration...', colors.blue);

try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  
  if (tsconfig.compilerOptions) {
    checkPassed('TypeScript configured');
    
    if (tsconfig.compilerOptions.strict) {
      checkPassed('Strict mode enabled');
    } else {
      checkWarning('Strict mode not enabled - consider enabling for better type safety');
    }
  }
} catch (error) {
  checkFailed('Error reading tsconfig.json');
}

// Check 6: Build test
log('\nChecking build...', colors.blue);

try {
  checkInfo('Running production build (this may take a minute)...');
  execSync('npm run build', { stdio: 'pipe' });
  checkPassed('Production build successful');
} catch (error) {
  checkFailed('Production build failed - fix build errors before deploying');
  console.error(error.stdout?.toString() || error.message);
}

// Check 7: Next.js configuration
log('\nChecking Next.js configuration...', colors.blue);

try {
  const nextConfig = fs.readFileSync('next.config.ts', 'utf8');
  
  if (nextConfig.includes('reactCompiler: true')) {
    checkPassed('React Compiler enabled');
  } else {
    checkWarning('React Compiler not enabled - consider enabling for better performance');
  }

  if (nextConfig.includes('images:')) {
    checkPassed('Image optimization configured');
  } else {
    checkWarning('Image optimization not configured');
  }

  if (nextConfig.includes('swcMinify')) {
    checkPassed('SWC minification configured');
  } else {
    checkWarning('SWC minification not configured');
  }
} catch (error) {
  checkFailed('Error reading next.config.ts');
}

// Check 8: Database schema
log('\nChecking database configuration...', colors.blue);

if (fs.existsSync('prisma/schema.prisma')) {
  checkPassed('Prisma schema exists');
  
  try {
    execSync('npx prisma validate', { stdio: 'pipe' });
    checkPassed('Prisma schema is valid');
  } catch (error) {
    checkFailed('Prisma schema validation failed');
  }
} else {
  checkFailed('Prisma schema not found');
}

// Check 9: Documentation
log('\nChecking documentation...', colors.blue);

const docs = [
  'README.md',
  'DEPLOYMENT.md',
  'DEPLOYMENT_CHECKLIST.md',
];

docs.forEach(doc => {
  if (fs.existsSync(doc)) {
    checkPassed(`${doc} exists`);
  } else {
    checkWarning(`${doc} not found - consider adding documentation`);
  }
});

// Summary
console.log('\n' + '='.repeat(70));
log('Summary', colors.blue);
console.log('='.repeat(70) + '\n');

if (hasErrors) {
  log('Production readiness check FAILED', colors.red);
  log('Please fix the errors above before deploying to production.', colors.red);
  process.exit(1);
} else if (hasWarnings) {
  log('Production readiness check passed with warnings', colors.yellow);
  log('Consider addressing the warnings above for optimal production deployment.', colors.yellow);
  process.exit(0);
} else {
  log('Production readiness check PASSED', colors.green);
  log('Your application is ready for production deployment!', colors.green);
  process.exit(0);
}
