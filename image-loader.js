export async function load(url, context, nextLoad) {
  if (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.svg') || url.endsWith('.jpeg') || url.endsWith('.webp') || url.endsWith('.avif')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(url)};`,
    };
  }
  return nextLoad(url, context);
}
