const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript and TSX files in src directory
const files = glob.sync('src/**/*.{ts,tsx}', { cwd: __dirname });

console.log(`🔍 Found ${files.length} TypeScript files to clean...`);

let totalRemovedLogs = 0;
let filesModified = 0;

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Count console.log statements before
  const beforeCount = (content.match(/console\.log\(/g) || []).length;
  
  if (beforeCount === 0) return;
  
  // Remove console.log statements but preserve console.error and console.warn
  // This regex matches console.log(...) statements including multiline ones
  content = content.replace(/^\s*console\.log\([^;]*\);?\s*$/gm, '');
  
  // Also remove console.log statements that are part of larger expressions
  content = content.replace(/console\.log\([^)]*(?:\([^)]*\)[^)]*)*\)[;,]?\s*/g, '');
  
  // Clean up any empty lines that were left behind
  content = content.replace(/^\s*\n/gm, '\n');
  
  // Count console.log statements after
  const afterCount = (content.match(/console\.log\(/g) || []).length;
  const removedCount = beforeCount - afterCount;
  
  if (removedCount > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}: Removed ${removedCount} console.log statements`);
    totalRemovedLogs += removedCount;
    filesModified++;
  }
});

console.log(`\n🎉 Cleanup completed!`);
console.log(`📊 Files modified: ${filesModified}`);
console.log(`🗑️  Total console.log statements removed: ${totalRemovedLogs}`);
console.log(`✅ console.error and console.warn statements preserved`);

if (totalRemovedLogs === 0) {
  console.log(`\n💡 No console.log statements found to remove.`);
} else {
  console.log(`\n💡 The codebase is now clean and ready for production!`);
}
