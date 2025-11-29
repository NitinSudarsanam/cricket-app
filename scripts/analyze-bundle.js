/**
 * Bundle Size Analysis Script
 * 
 * This script analyzes the Next.js build output and provides
 * insights into bundle sizes and optimization opportunities.
 * 
 * Usage: node scripts/analyze-bundle.js
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', '.next');
const BUILD_MANIFEST = path.join(BUILD_DIR, 'build-manifest.json');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function analyzeBundle() {
  console.log('\n📊 Bundle Size Analysis\n');
  console.log('='.repeat(60));

  // Check if build exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Read build manifest
  if (!fs.existsSync(BUILD_MANIFEST)) {
    console.error('❌ Build manifest not found. Run "npm run build" first.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(BUILD_MANIFEST, 'utf8'));

  // Analyze pages
  console.log('\n📄 Page Bundles:\n');
  
  const pages = Object.keys(manifest.pages);
  const pageSizes = [];

  pages.forEach(page => {
    const files = manifest.pages[page];
    let totalSize = 0;

    files.forEach(file => {
      const filePath = path.join(BUILD_DIR, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
    });

    pageSizes.push({ page, size: totalSize, files: files.length });
  });

  // Sort by size
  pageSizes.sort((a, b) => b.size - a.size);

  // Display top 10 largest pages
  console.log('Top 10 Largest Pages:');
  pageSizes.slice(0, 10).forEach((item, index) => {
    const sizeStr = formatBytes(item.size);
    const status = item.size > 500000 ? '⚠️' : '✅';
    console.log(`${status} ${index + 1}. ${item.page}`);
    console.log(`   Size: ${sizeStr} (${item.files} files)`);
  });

  // Calculate total size
  const totalSize = pageSizes.reduce((sum, item) => sum + item.size, 0);
  console.log(`\n📦 Total Bundle Size: ${formatBytes(totalSize)}`);

  // Recommendations
  console.log('\n💡 Recommendations:\n');

  const largePages = pageSizes.filter(p => p.size > 500000);
  if (largePages.length > 0) {
    console.log('⚠️  Large page bundles detected (>500KB):');
    largePages.forEach(p => {
      console.log(`   - ${p.page}: ${formatBytes(p.size)}`);
    });
    console.log('   Consider using dynamic imports for heavy components.');
  } else {
    console.log('✅ All page bundles are optimally sized (<500KB)');
  }

  // Check for common optimization opportunities
  console.log('\n🔍 Optimization Checklist:');
  console.log('   [ ] Use dynamic imports for admin components');
  console.log('   [ ] Use dynamic imports for draft components');
  console.log('   [ ] Optimize images with Next.js Image component');
  console.log('   [ ] Enable React Compiler (reactCompiler: true)');
  console.log('   [ ] Use code splitting for large libraries');
  console.log('   [ ] Remove unused dependencies');

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Analysis complete!\n');
}

// Run analysis
try {
  analyzeBundle();
} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
}
