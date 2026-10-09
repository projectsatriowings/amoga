import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

export function loadFrontendCatalogue(relativePath, arrayExportName) {
  const fullPath = path.join(rootDir, relativePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace import image statements with string paths
  // e.g. import soupHero from '../../../assets/images/food-soups-hero.jpg';
  content = content.replace(/import\s+(\w+)\s+from\s+['"](.*?\.(?:jpg|png|webp))['"];?/g, (_, varName, importPath) => {
    // Normalise to web asset path /src/assets/images/...
    const baseName = path.basename(importPath);
    return `const ${varName} = '/src/assets/images/${baseName}';`;
  });

  // Replace export const [NAME] = with export default
  content = content.replace(new RegExp(`export\\s+const\\s+${arrayExportName}\\s*=`), 'const __DATA = ');
  
  // Truncate any helper function exports after the array definition
  const arrayEnd = content.indexOf('];');
  if (arrayEnd !== -1) {
    content = content.substring(0, arrayEnd + 2) + '\nexport default __DATA;\n';
  }

  // Write temporary file in server directory
  const tempFile = path.join(__dirname, `__temp_${arrayExportName}.mjs`);
  fs.writeFileSync(tempFile, content);

  return { tempFile };
}
