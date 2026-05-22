const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('d:/TiMiFood/public/admin.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const labels = document.querySelectorAll('label[for]');
let missingIds = [];
let nameMatches = [];

labels.forEach(label => {
    const forAttr = label.getAttribute('for');
    if (!forAttr) return;

    const elById = document.getElementById(forAttr);
    if (!elById) {
        missingIds.push({ for: forAttr, text: label.textContent.trim() });
    }

    const elByName = document.querySelector(`[name="${forAttr}"]`);
    if (elByName && !elById) {
        nameMatches.push({ for: forAttr, name: elByName.getAttribute('name') });
    } else if (elByName && elById && elByName !== elById) {
        // Wait, if it matches name and id but they are different elements, that's weird.
    }
});

console.log("Labels pointing to non-existent IDs:");
console.log(missingIds);

console.log("\nLabels pointing to names instead of IDs:");
console.log(nameMatches);
