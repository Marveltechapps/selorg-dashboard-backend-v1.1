/**
 * Script to replace console statements with logger calls
 * This is a helper script - run manually to batch replace console statements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all JS files with console statements
const files = execSync('find src -name "*.js" -type f -exec grep -l "console\\." {} \\;', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f);

console.log(`Found ${files.length} files with console statements`);

// For each file, we need to:
// 1. Check if logger is imported, if not add it
// 2. Replace console.error with logger.error (structured format)
// 3. Replace console.log with logger.info
// 4. Replace console.warn with logger.warn
// 5. Replace console.info with logger.info
// 6. Replace console.debug with logger.debug

files.forEach(file => {
  if (!file) return;
  
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if logger is imported
  const hasLogger = content.includes("require('../../core/utils/logger')") || 
                    content.includes('require("../core/utils/logger")') ||
                    content.includes("require('./core/utils/logger')") ||
                    content.includes("require('../../../core/utils/logger')") ||
                    content.includes("require('../../../../core/utils/logger')");
  
  // Determine logger import path based on file location
  if (!hasLogger && content.includes('console.')) {
    const depth = file.split('/').length - 2; // Subtract 'src' and filename
    let loggerPath = '../'.repeat(depth) + 'core/utils/logger';
    if (depth === 0) loggerPath = './core/utils/logger';
    if (depth === 1) loggerPath = '../core/utils/logger';
    if (depth === 2) loggerPath = '../../core/utils/logger';
    if (depth === 3) loggerPath = '../../../core/utils/logger';
    if (depth === 4) loggerPath = '../../../../core/utils/logger';
    
    // Find the last require statement to add logger after it
    const requireMatches = content.match(/const .+ = require\(.+\);/g);
    if (requireMatches && requireMatches.length > 0) {
      const lastRequire = requireMatches[requireMatches.length - 1];
      const lastRequireIndex = content.lastIndexOf(lastRequire);
      const insertIndex = lastRequireIndex + lastRequire.length;
      content = content.slice(0, insertIndex) + `\nconst logger = require('${loggerPath}');` + content.slice(insertIndex);
      modified = true;
    }
  }
  
  // Replace console.error('message:', error) with logger.error('message', { error: error.message, stack: error.stack })
  content = content.replace(/console\.error\((['"`])([^'"`]+):\s*,\s*(\w+)\)/g, (match, quote, message, errorVar) => {
    modified = true;
    return `logger.error(${quote}${message.trim()}${quote}, { error: ${errorVar}.message, stack: ${errorVar}.stack })`;
  });
  
  // Replace console.error('message') with logger.error('message')
  content = content.replace(/console\.error\(/g, () => {
    modified = true;
    return 'logger.error(';
  });
  
  // Replace console.log with logger.info
  content = content.replace(/console\.log\(/g, () => {
    modified = true;
    return 'logger.info(';
  });
  
  // Replace console.warn with logger.warn
  content = content.replace(/console\.warn\(/g, () => {
    modified = true;
    return 'logger.warn(';
  });
  
  // Replace console.info with logger.info
  content = content.replace(/console\.info\(/g, () => {
    modified = true;
    return 'logger.info(';
  });
  
  // Replace console.debug with logger.debug
  content = content.replace(/console\.debug\(/g, () => {
    modified = true;
    return 'logger.debug(';
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});

console.log('Done!');
