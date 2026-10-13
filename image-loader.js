export async function load(url, context, nextLoad) {
  if (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.svg') || url.endsWith('.jpeg')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(url)};`,
    };
  }
  return nextLoad(url, context);
}
