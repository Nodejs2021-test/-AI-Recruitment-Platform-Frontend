import fs from 'node:fs';
import path from 'node:path';

const binDir = path.resolve('node_modules', '.bin');
if (fs.existsSync(binDir)) {
  for (const file of fs.readdirSync(binDir)) {
    if (file.endsWith('.cmd')) {
      const fullPath = path.join(binDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('SET dp0=%~dp0')) {
        fs.writeFileSync(fullPath, content.replace(/SET dp0=%~dp0/g, 'SET "dp0=%~dp0"'));
      }
    }
  }
}
