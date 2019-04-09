const path = require('path');
const { createFilter } = require('rollup-pluginutils');
const { encode, decode } = require('sourcemap-codec');

const pluginOptions = {
	sourcemap: true
};

module.exports = function svelte(options = {}) {
	const filter = createFilter(['**/*.css'], []);

	Object.keys(options).forEach(key => {
		if (!(key in pluginOptions))
			throw new Error(`unknown option ${key}`);
		pluginOptions[key] = options[key];
	});

	const data = {
		css: {},
		map: {}
	};

	return {
		name: 'css',

		transform(code, id) {
			if (!filter(id)) return null;

			const m = code.match(/\/\*#\W*sourceMappingURL=data:application\/json;charset=utf-8;base64,([a-zA-Z0-9+/]+)\W*\*\//);
			if (m!==null) {
				data.css[id] = code.replace(m[0], '').trim();
				if (pluginOptions.sourcemap) {
					try {
						data.map[id] = JSON.parse(Buffer.from(m[1], 'base64').toString('ascii').trim());
					} finally {} // eslint-disable-line
				}
			}

			return '';
		},

		generateBundle(options, bundle) {
			const extToCss = f => (f.replace(path.extname(f), '.css'));

			function bundleAsset(dest, data) {
				bundle[dest] = {
					fileName: dest,
					isAsset: true,
					source: data
				};
			}

			for (const chunk of Object.values(bundle)) {
				const css_name = extToCss(chunk.fileName);
				const map_name = css_name+'.map';
				const imports = chunk.imports.map(extToCss);

				const contents = Object.keys(chunk.modules)
					.filter(f => path.extname(f)==='.css');

				let css_code = imports.map(f => `@import '${f}';`).join('');
				const map = {
					version: 3,
					file: css_name,
					sources: [],
					sourcesContent: [],
					names: [],
					mappings: []
				};
				for (const f of contents) {
					if (pluginOptions.sourcemap && data.map[f]!==undefined) {
						const i = map.sources.length;
						map.sources.push(path.relative(options.dir, data.map[f].sources[0]));
						map.sourcesContent.push(...data.map[f].sourcesContent);
						const mappings = decode(data.map[f].mappings);
						if (i === 0) {
							mappings[0].forEach(segment => {
								segment[0] += css_code.length;
							});
						}
						if (i > 0) {
							mappings.forEach(line => {
								line.forEach(segment => {
									segment[1] = i;
								});
							});
						}
						map.mappings.push(...mappings);
					}
					css_code += data.css[f] + '\n';
				}
				if (pluginOptions.sourcemap) {
					map.mappings = encode(map.mappings);
					css_code += `/*# sourceMappingURL=${encodeURIComponent(map_name)} */`;
					bundleAsset(map_name, JSON.stringify(map, null));
				}
				bundleAsset(css_name, css_code);
			}
		}
	};
};
