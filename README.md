# rollup-plugin-css-chunks

Output imported CSS files as chunks.

## Installation

```bash
npm install --save-dev rollup-plugin-css-chunks
```

## Usage

```js
// rollup.config.js
import css from 'rollup-plugin-css-chunks';

export default {
  input: 'src/main.js',
  output: {
    dir: 'public',
    format: 'esm'
  },
  plugins: [
    css({
      // just consume the CSS files
      ignore: false,
      // generate sourcemap
      sourcemap: false,
      // name pattern for emitted secondary chunks
      chunkFileNames: 'chunk-[hash].css'
      // name pattern for emitted entry chunks
      entryFileNames: '[name]-[hash].css',
    })
  ]
}
```

## License

MIT
