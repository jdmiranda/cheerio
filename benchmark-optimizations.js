/**
 * Comprehensive benchmark suite for cheerio optimizations
 *
 * Tests:
 *
 * - Selector performance (ID, class, tag, complex)
 * - DOM traversal speed
 * - Attribute access ops/sec
 * - Load + query performance
 */

import { Bench } from 'tinybench';
import { load } from './dist/esm/load-parse.js';

// Sample HTML for benchmarking
const SAMPLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
</head>
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
      <article class="post">
        <h1 class="post-title">Article Title</h1>
        <p class="post-body">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        <div class="post-meta">
          <span class="author">John Doe</span>
          <span class="date">2025-10-03</span>
        </div>
      </article>
      ${'<div class="item"><span class="text">Item</span></div>'.repeat(100)}
    </main>
    <aside id="sidebar" class="sidebar">
      <div class="widget">
        <h3 class="widget-title">Recent Posts</h3>
        <ul class="widget-list">
          ${Array.from(
            { length: 20 },
            (_, i) =>
              `<li class="widget-item"><a href="/post-${i}" class="widget-link">Post ${i}</a></li>`,
          ).join('\n')}
        </ul>
      </div>
    </aside>
    <footer id="footer" class="site-footer">
      <p class="copyright">&copy; 2025 Test Site</p>
    </footer>
  </div>
</body>
</html>
`;

console.log('='.repeat(80));
console.log('Cheerio Performance Benchmark Suite');
console.log('='.repeat(80));
console.log('');

// Benchmark 1: Selector Performance
console.log('1. Selector Performance Tests');
console.log('-'.repeat(80));

const selectorBench = new Bench({ time: 1000 });
const $ = load(SAMPLE_HTML);

selectorBench
  .add('ID Selector (#container)', () => {
    $('#container');
  })
  .add('Class Selector (.nav-item)', () => {
    $('.nav-item');
  })
  .add('Tag Selector (div)', () => {
    $('div');
  })
  .add('Complex Selector (div.item > span.text)', () => {
    $('div.item > span.text');
  })
  .add('Multiple Classes (.post.article)', () => {
    $('.post-title');
  })
  .add('Descendant Selector (ul li)', () => {
    $('ul li');
  });

await selectorBench.run();
console.table(selectorBench.table());
console.log('');

// Benchmark 2: DOM Traversal Speed
console.log('2. DOM Traversal Performance');
console.log('-'.repeat(80));

const traversalBench = new Bench({ time: 1000 });
const $items = $('.item');
const $navList = $('.nav-list');

traversalBench
  .add('parent()', () => {
    $items.parent();
  })
  .add('children()', () => {
    $navList.children();
  })
  .add('next()', () => {
    $items.next();
  })
  .add('prev()', () => {
    $items.prev();
  })
  .add('siblings()', () => {
    $items.siblings();
  })
  .add('find()', () => {
    $('#content').find('.item');
  })
  .add('closest()', () => {
    $('.nav-link').closest('ul');
  });

await traversalBench.run();
console.table(traversalBench.table());
console.log('');

// Benchmark 3: Attribute Access
console.log('3. Attribute Access Performance');
console.log('-'.repeat(80));

const attrBench = new Bench({ time: 1000 });
const $links = $('a.nav-link');
const $container = $('#container');

attrBench
  .add('attr() - get single', () => {
    $container.attr('id');
  })
  .add('attr() - get multiple', () => {
    $links.attr('href');
  })
  .add('attr() - set single', () => {
    $container.attr('data-test', 'value');
  })
  .add('hasClass()', () => {
    $container.hasClass('main-container');
  })
  .add('addClass()', () => {
    $container.addClass('new-class');
  })
  .add('removeClass()', () => {
    $container.removeClass('new-class');
  });

await attrBench.run();
console.table(attrBench.table());
console.log('');

// Benchmark 4: Load + Query Performance
console.log('4. Load + Query Performance');
console.log('-'.repeat(80));

const loadBench = new Bench({ time: 1000 });

loadBench
  .add('load() + simple query', () => {
    const $ = load(SAMPLE_HTML);
    $('#container');
  })
  .add('load() + complex query', () => {
    const $ = load(SAMPLE_HTML);
    $('div.item > span.text');
  })
  .add('load() + multiple queries', () => {
    const $ = load(SAMPLE_HTML);
    $('#header');
    $('.nav-item');
    $('div');
  });

await loadBench.run();
console.table(loadBench.table());
console.log('');

// Benchmark 5: Text Content Operations
console.log('5. Text Content Operations');
console.log('-'.repeat(80));

const textBench = new Bench({ time: 1000 });
const $article = $('.post');
const $title = $('.post-title');

textBench
  .add('text() - get', () => {
    $article.text();
  })
  .add('text() - get repeated', () => {
    $title.text();
    $title.text();
    $title.text();
  })
  .add('html() - get', () => {
    $article.html();
  });

await textBench.run();
console.table(textBench.table());
console.log('');

// Benchmark 6: Chained Operations
console.log('6. Chained Operations Performance');
console.log('-'.repeat(80));

const chainBench = new Bench({ time: 1000 });

chainBench
  .add('Simple chain', () => {
    $('#content').find('.item').first();
  })
  .add('Complex chain', () => {
    $('#content').find('.item').parent().children().filter('.item').eq(5);
  })
  .add('Multiple traversals', () => {
    $('.nav-item').parent().parent().siblings().find('a');
  });

await chainBench.run();
console.table(chainBench.table());
console.log('');

// Summary
console.log('='.repeat(80));
console.log('Benchmark Summary');
console.log('='.repeat(80));

const allBenches = [
  { name: 'Selector Performance', bench: selectorBench },
  { name: 'DOM Traversal', bench: traversalBench },
  { name: 'Attribute Access', bench: attrBench },
  { name: 'Load + Query', bench: loadBench },
  { name: 'Text Content', bench: textBench },
  { name: 'Chained Operations', bench: chainBench },
];

for (const { name, bench } of allBenches) {
  const fastest = bench.tasks.reduce((a, b) =>
    (a.result?.hz ?? 0) > (b.result?.hz ?? 0) ? a : b,
  );
  const slowest = bench.tasks.reduce((a, b) =>
    (a.result?.hz ?? 0) < (b.result?.hz ?? 0) ? a : b,
  );

  console.log(`${name}:`);
  console.log(
    `  Fastest: ${fastest.name} - ${(fastest.result?.hz ?? 0).toFixed(0)} ops/sec`,
  );
  console.log(
    `  Slowest: ${slowest.name} - ${(slowest.result?.hz ?? 0).toFixed(0)} ops/sec`,
  );
  console.log('');
}

console.log('='.repeat(80));
console.log('Benchmark Complete!');
console.log('='.repeat(80));
