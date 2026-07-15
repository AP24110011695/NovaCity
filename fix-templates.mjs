import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (let file of list) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      walk(file, files);
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        files.push(file);
      }
    }
  }
  return files;
}

let modifiedCount = 0;
const files = walk(path.join(process.cwd(), 'src'));
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const newContent = content.replace(/\\`/g, '`').replace(/\\\$\{/g, '${');
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Modified:', file);
    modifiedCount++;
  }
});
console.log('Total files modified:', modifiedCount);
