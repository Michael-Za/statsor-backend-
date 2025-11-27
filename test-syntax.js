import { readFileSync } from 'fs';

try {
  // Read the file
  const content = readFileSync('./src/pages/CommandTable.tsx', 'utf8');
  
  // Check for balanced brackets
  let curlyBraces = 0;
  let squareBrackets = 0;
  let parentheses = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    switch (char) {
      case '{':
        curlyBraces++;
        break;
      case '}':
        curlyBraces--;
        break;
      case '[':
        squareBrackets++;
        break;
      case ']':
        squareBrackets--;
        break;
      case '(':
        parentheses++;
        break;
      case ')':
        parentheses--;
        break;
    }
  }
  
  console.log('Curly braces:', curlyBraces);
  console.log('Square brackets:', squareBrackets);
  console.log('Parentheses:', parentheses);
  
  if (curlyBraces !== 0 || squareBrackets !== 0 || parentheses !== 0) {
    console.log('Unbalanced brackets found!');
  } else {
    console.log('All brackets are balanced.');
  }
  
  // Check for unterminated regex patterns
  const regexPattern = /\/[^\/].*[^\\]\//g;
  const matches = content.match(regexPattern);
  if (matches) {
    console.log('Potential unterminated regex patterns found:', matches);
  } else {
    console.log('No unterminated regex patterns found.');
  }
  
} catch (error) {
  console.error('Error reading file:', error.message);
}