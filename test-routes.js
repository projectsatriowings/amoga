import http from 'http';

const routes = [
  // Core Gatekeeper
  '/',

  // Phase 3 Food Storefront & Catalogue
  '/food',
  '/food/products',
  '/food/products?category=soups',
  '/food/products?category=millets',
  '/food/products?category=podis',
  '/food/products?category=spices',
  '/food/products?q=moringa',
  '/food/products/lemon-coriander-leaves-soup',
  '/food/products/creamy-garlic-mushroom-soup',
  '/food/products/unknown-nonexistent-soup-recipe',

  // Dedicated Tea Storefront & Catalogue
  '/tea',
  '/tea/products',
  '/tea/products?q=hibiscus',
  '/tea/products/hibiscus-tea',
  '/tea/products/butterfly-blue-pea-tea',
  '/tea/products/cinnamon-tea',
  '/tea/products/sarsaparilla-tea',
  '/tea/products/moringa-leaf-tea',

  // Phase 4 Heritage Sarees Storefront & Catalogue
  '/sarees',
  '/sarees/products',
  '/sarees/products?category=silk',
  '/sarees/products?category=traditional',
  '/sarees/products?category=festive',
  '/sarees/products?category=wedding',
  '/sarees/products?category=contemporary',
  '/sarees/products?q=zari',
  '/sarees/products?q=kanchipuram&category=silk',
  '/sarees/products/kanchipuram-pure-silk',
  '/sarees/products/banarasi-silk',
  '/sarees/products/tissue-silk',
  '/sarees/products/soft-silk',
  '/sarees/products/chanderi-handloom-silk',
  '/sarees/products/nonexistent-saree-slug-test',

  // Phase 5 Silver Jewellery Storefront & Catalogue
  '/jewellery',
  '/jewellery/products',
  '/jewellery/products?category=rings',
  '/jewellery/products?category=necklaces',
  '/jewellery/products?category=earrings',
  '/jewellery/products?category=bracelets',
  '/jewellery/products?category=traditional',
  '/jewellery/products?q=silver',
  '/jewellery/products?category=rings&q=aurora',

  // Phase 5 Jewellery Product Details (Verified Pieces & Unknown Fallback)
  '/jewellery/products/aurora-ring',
  '/jewellery/products/lumiere-necklace',
  '/jewellery/products/solstice-ring',
  '/jewellery/products/verite-bar-necklace',
  '/jewellery/products/leaf-ring',
  '/jewellery/products/lumiere-solitaire-ring',
  '/jewellery/products/solstice-stud-earrings',
  '/jewellery/products/aurora-cuff-bracelet',
  '/jewellery/products/celeste-silver-hoops',
  '/jewellery/products/unknown-product-test',

  // Phase 6 Unified Cart, Checkout & Simulated Confirmation
  '/cart',
  '/checkout',
  '/checkout/review',
  '/order-confirmation/AMOGA-DEMO-TEST1',
  '/order-confirmation/UNKNOWN-ID',

  // Brand Asset
  '/amoga-logo.png',
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    http.get(`http://localhost:5173${route}`, (res) => {
      resolve({ route, status: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', (err) => {
      resolve({ route, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing Vite dev server routes for Amoga E-Commerce (Phases 1-5):');
  let failures = 0;
  for (const r of routes) {
    const res = await checkRoute(r);
    console.log(`[HTTP ${res.status}] ${res.route} (${res.contentType || res.error})`);
    if (res.status !== 200) {
      failures++;
    }
  }
  console.log(`\nCompleted verification. Total routes tested: ${routes.length}. Failures: ${failures}`);
  if (failures > 0) process.exit(1);
}

run();
