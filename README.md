# rollup-plugin-css-chunks

Output imported CSS files as chunks. The chunks will have the same base filename as the js chunk.

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
      sourcemap: true
    })
  ]
}
```

## License

MIT
