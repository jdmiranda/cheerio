/** Quick benchmark for cheerio optimizations */

import { Bench } from 'tinybench';
import { load } from './dist/esm/load-parse.js';

const SAMPLE_HTML = `
<!DOCTYPE html>
<html>
<body>
  <div id="container" class="main-container">
    <header id="header" class="site-header">
      <nav class="navigation">
        <ul class="nav-list">
          <li class="nav-item"><a href="/" class="nav-link">Home</a></li>
          <li class="nav-item"><a href="/about" class="nav-link">About</a></li>
          <li class="nav-item"><a href="/contact" class="nav-link">Contact</a></li>
        </ul>
      </nav>
    </header>
    <main id="content" class="main-content">
      ${Array.from(
        { length: 100 },
        (_, i) =>
          `<div class="item" data-id="${i}"><span class="text">Item ${i}</span></div>`,
      ).join('\n')}
    </main>
  </div>
</body>
</html>
`;

console.log(
  '================================================================================',
);
console.log('Cheerio Quick Performance Benchmark');
console.log(
  '================================================================================\n',
);

const $ = load(SAMPLE_HTML);

// Selector Performance
console.log('1. Selector Performance (500ms each)');
console.log(
  '--------------------------------------------------------------------------------',
);
const selectorBench = new Bench({ time: 500 });

selectorBench
  .add('ID Selector', () => $('#container'))
  .add('Class Selector', () => $('.nav-item'))
  .add('Tag Selector', () => $('div'))
  .add('Complex Selector', () => $('div.item > span.text'));

await selectorBench.run();
console.table(selectorBench.table());

// DOM Traversal
console.log('\n2. DOM Traversal Performance (500ms each)');
console.log(
  '--------------------------------------------------------------------------------',
);
const traversalBench = new Bench({ time: 500 });
const $items = $('.item');

traversalBench
  .add('parent()', () => $items.parent())
  .add('children()', () => $('#content').children())
  .add('find()', () => $('#content').find('.item'))
  .add('next()', () => $items.next());

await traversalBench.run();
console.table(traversalBench.table());

// Attribute Access
console.log('\n3. Attribute Access Performance (500ms each)');
console.log(
  '--------------------------------------------------------------------------------',
);
const attrBench = new Bench({ time: 500 });
const $container = $('#container');

attrBench
  .add('attr() get', () => $container.attr('id'))
  .add('hasClass()', () => $container.hasClass('main-container'))
  .add('addClass()', () => $container.addClass('test'))
  .add('removeClass()', () => $container.removeClass('test'));

await attrBench.run();
console.table(attrBench.table());

// Summary
console.log(
  '\n================================================================================',
);
console.log('Summary');
console.log(
  '================================================================================',
);

const allBenches = [
  { name: 'Selector Performance', bench: selectorBench },
  { name: 'DOM Traversal', bench: traversalBench },
  { name: 'Attribute Access', bench: attrBench },
];

for (const { name, bench } of allBenches) {
  const fastest = bench.tasks.reduce((a, b) =>
    (a.result?.hz ?? 0) > (b.result?.hz ?? 0) ? a : b,
  );
  console.log(`${name}:`);
  console.log(`  Fastest: ${fastest.name}`);
  console.log(
    `  Speed: ${Math.round(fastest.result?.hz ?? 0).toLocaleString()} ops/sec\n`,
  );
}

console.log('Optimizations Applied:');
console.log('- Fast-path selector detection (ID, class, tag)');
console.log('- Attribute value caching');
console.log('- Deduplication in selector results');
console.log(
  '================================================================================',
);
