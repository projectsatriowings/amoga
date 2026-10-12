export async function load(url, context, nextLoad) {
  if (url.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i)) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(url)};`,
    };
  }
  return nextLoad(url, context);
}
