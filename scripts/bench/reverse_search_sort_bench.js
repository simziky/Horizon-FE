// Benchmark client-side sorting used in ReverseSearchTable
// Mimics sorting by 'profit_margin', 'roi_percentage', and 'buybox_price'

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  const num = Math.random() * (max - min) + min;
  return parseFloat(num.toFixed(decimals));
}

function randomCurrency() {
  const currencies = ['$', '£', '€'];
  return currencies[randomInt(0, currencies.length - 1)];
}

function generatePriceString() {
  return `${randomCurrency()}${randomFloat(5, 500).toFixed(2)}`;
}

function generateProduct(id) {
  // A minimal shape matching ReverseSearchData fields used in sorting
  const buyboxPriceChoice = Math.random();
  const amazonPriceChoice = Math.random();

  return {
    profit_margin: randomFloat(-20, 80, 1),
    roi_percentage: randomFloat(0, 200, 1),
    target_fees: `${randomInt(5, 40)}%`,
    price: buyboxPriceChoice < 0.5 ? generatePriceString() : undefined,
    buybox_price: buyboxPriceChoice >= 0.5 ? generatePriceString() : undefined,
    amazon_product: amazonPriceChoice < 0.5
      ? {
          price: generatePriceString(),
          buybox_price: generatePriceString(),
          metrics: { number_of_sellers: randomInt(1, 50) },
        }
      : undefined,
    scraped_product: {
      id: `prod-${id}`,
      name: `Product ${id}`,
      image: 'https://via.placeholder.com/64',
      store: { name: 'MockStore', logo: '' },
    },
  };
}

function generateProducts(n) {
  const arr = new Array(n);
  for (let i = 0; i < n; i++) arr[i] = generateProduct(i + 1);
  return arr;
}

function getNumericPrice(price) {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    const numericValue = parseFloat(price.replace(/[$£€,]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
  }
  return 0;
}

function sortProducts(products, sortColumn, sortDirection) {
  const arr = [...products];
  arr.sort((a, b) => {
    let aValue = 0;
    let bValue = 0;
    if (sortColumn === 'buybox_price') {
      const aPriceValue = a.price || a.buybox_price || a.amazon_product?.price || a.amazon_product?.buybox_price || 0;
      const bPriceValue = b.price || b.buybox_price || b.amazon_product?.price || b.amazon_product?.buybox_price || 0;
      aValue = getNumericPrice(aPriceValue);
      bValue = getNumericPrice(bPriceValue);
    } else {
      aValue = typeof a[sortColumn] === 'number' ? a[sortColumn] : 0;
      bValue = typeof b[sortColumn] === 'number' ? b[sortColumn] : 0;
    }
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });
  return arr;
}

function benchOnce(n, sortColumn, sortDirection) {
  const products = generateProducts(n);
  const start = performance.now();
  sortProducts(products, sortColumn, sortDirection);
  const end = performance.now();
  return {
    n,
    sortColumn,
    sortDirection,
    durationMs: +(end - start).toFixed(3),
  };
}

function benchAll(nValues) {
  const scenarios = [
    ['profit_margin', 'asc'],
    ['profit_margin', 'desc'],
    ['roi_percentage', 'asc'],
    ['roi_percentage', 'desc'],
    ['buybox_price', 'asc'],
    ['buybox_price', 'desc'],
  ];
  const results = [];
  for (const n of nValues) {
    for (const [col, dir] of scenarios) {
      results.push(benchOnce(n, col, dir));
    }
  }
  return results;
}

function formatResults(results) {
  const lines = [];
  lines.push('ReverseSearchTable sort benchmark results');
  for (const r of results) {
    lines.push(
      `n=${r.n}, column=${r.sortColumn}, direction=${r.sortDirection} -> ${r.durationMs}ms`
    );
  }
  return lines.join('\n');
}

async function main() {
  // Warm-up
  benchOnce(1000, 'profit_margin', 'desc');

  const nValues = [1000, 5000, 10000];
  const results = benchAll(nValues);
  console.log(formatResults(results));
  const mem = process.memoryUsage();
  console.log('\nMemory usage (MB):', {
    rss: +(mem.rss / (1024 * 1024)).toFixed(2),
    heapTotal: +(mem.heapTotal / (1024 * 1024)).toFixed(2),
    heapUsed: +(mem.heapUsed / (1024 * 1024)).toFixed(2),
  });
}

main();

