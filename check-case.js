import fs from 'fs';
import path from 'path';

function walk(dir) {
  const files = fs.readdirSync(dir);
  let results = [];
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) results = results.concat(walk(fullPath));
    else results.push(fullPath);
  }
  return results;
}

function normalize(p) {
  return p.replace(/\\/g, '/'); // padroniza barras
}

function checkCase(root) {
  const allFiles = walk(root).map(normalize);
  const jsFiles = allFiles.filter(f => f.endsWith('.js') || f.endsWith('.jsx'));
  let errors = 0;

  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const regex = /import\s+.*\s+from\s+['"](.*)['"]/g;
    let match;
    while ((match = regex.exec(content))) {
      let importPath = match[1];
      if (importPath.startsWith('.') || importPath.startsWith('/')) {
        const absPath = path.resolve(path.dirname(file), importPath);
        const dir = path.dirname(absPath);
        const base = path.basename(absPath);
        if (fs.existsSync(dir)) {
          const filesInDir = fs.readdirSync(dir);
          const found = filesInDir.find(f => f === base);
          if (!found) {
            console.log(`⚠️ Case mismatch in import in file: ${file}`);
            console.log(`   -> import: ${importPath}`);
            errors++;
          }
        }
      }
    }
  }
  if (errors === 0) console.log('✅ Todos os imports estão com case correto!');
  else console.log(`❌ ${errors} imports com problemas de case encontrados.`);
}

checkCase('./src'); // verifica só a pasta src