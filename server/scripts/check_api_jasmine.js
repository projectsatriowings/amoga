async function main() {
  const res = await fetch('http://localhost:5001/api/products?collection=food&limit=100');
  const json = await res.json();
  const jasmine = json.data.filter(p => p.name.includes('Jasmine'));
  console.log('Jasmine in public API:', JSON.stringify(jasmine, null, 2));
}

main().catch(console.error);
