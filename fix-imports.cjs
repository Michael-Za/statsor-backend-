const fs = require('fs');
const path = require('path');

// Function to convert absolute import to relative import
function convertToRelativeImport(filePath, importPath) {
  if (!importPath.startsWith('@/')) return importPath;
  
  const targetPath = importPath.replace('@/', 'src/');
  const fileDir = path.dirname(filePath);
  const relativePath = path.relative(fileDir, targetPath).replace(/\\/g, '/');
  
  return relativePath.startsWith('.') ? relativePath : './' + relativePath;
}

// Function to process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    const lines = content.split('\n');
    const processedLines = lines.map(line => {
      const importMatch = line.match(/^(\s*import\s+.*?from\s+['"])(@\/[^'"]+)(['"].*?)$/);
      if (importMatch) {
        const [, prefix, importPath, suffix] = importMatch;
        const newImportPath = convertToRelativeImport(filePath, importPath);
        if (newImportPath !== importPath) {
          modified = true;
          return prefix + newImportPath + suffix;
        }
      }
      return line;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, processedLines.join('\n'), 'utf8');
      console.log(`Fixed imports in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to process...`);

let fixedCount = 0;
for (const file of files) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\nCompleted! Fixed imports in ${fixedCount} files.`);