const fs = require('fs');
const path = require('path');

const jsDir = __dirname;
const adminDir = path.join(jsDir, 'admin');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We want to replace instances like: onclick="functionName(${var.id})"
    // with: onclick="functionName('${var.id}')"
    // Also handling when it has arguments after like: onclick="functionName(${var.id}, this)"
    
    // Pattern: 
    // onclick="anyWord(${any.id})" => onclick="anyWord('${any.id}')"
    // onclick="anyWord(${any.id}, => onclick="anyWord('${any.id}',
    
    content = content.replace(/onclick="([a-zA-Z0-9_]+)\(\$\{([a-zA-Z0-9_.]+)\}(,|\))/g, "onclick=\"$1('${$2}'$3");

    // Fix chatbotAddCart(${p.id}) etc that might be caught
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.js') && file !== 'fix_quotes.js') {
            fixFile(fullPath);
        }
    }
}

scanDir(jsDir);
