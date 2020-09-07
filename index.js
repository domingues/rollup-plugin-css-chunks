const path = require('path');
const crypto = require('crypto');
const { createFilter } = require('rollup-pluginutils');
const { encode, decode } = require('sourcemap-codec');

function hash(content) {
	return crypto.createHmac('sha256', content)
		.digest('hex')
		.substr(0, 8);
}

function makeFileName(name, hash, pattern) {
	return pattern.replace('[name]', name).replace('[hash]', hash);
}

module.exports = function svelte(options = {}) {
	const filter = createFilter(/\.css$/i, []);

	const defaultPluginOptions = {
		injectImports: false,
		ignore: false,
		sourcemap: false,
		chunkFileNames: '[name]-[hash].css',
		entryFileNames: '[name].css',
	};

	const pluginOptions = Object.assign({}, defaultPluginOptions);
	Object.keys(options).forEach(key => {
		if (!(key in defaultPluginOptions))
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
			if (pluginOptions.ignore!==false) return '';

			const m = code.match(/\/\*#\W*sourceMappingURL=data:application\/json;charset=utf-8;base64,([a-zA-Z0-9+/]+)\W*\*\//);
			if (m!==null) {
				data.css[id] = code.replace(m[0], '').trim();
				if (pluginOptions.sourcemap) {
					try {
						data.map[id] = JSON.parse(Buffer.from(m[1], 'base64').toString('utf-8').trim());
					} finally { // eslint-disable-line
					}
				}
			} else {
				data.css[id] = code;
			}

			return {code: '', moduleSideEffects: 'no-treeshake'};
		},

		generateBundle(options, bundle) {
			if (pluginOptions.ignore!==false) return;

			for (const chunk of Object.values(bundle)) {
				if (chunk.type==='asset') continue;

				let code = '';

				if (pluginOptions.injectImports) {
					for (const c of chunk.imports) {
						if (bundle[c]) {
							code += bundle[c].imports.filter(filter)
								.map(f => `@import '${f}';`).join('');
						}
					}
				}

				const sources = [];
				const sourcesContent = [];
				const mappings = [];
				for (const f of Object.keys(chunk.modules).filter(filter)) {
					if (data.map[f]) {
						const i = sources.length;
						sources.push(path.relative(options.dir, data.map[f].sources[0]));
						sourcesContent.push(...data.map[f].sourcesContent);
						const decoded = decode(data.map[f].mappings);
						if (i===0) {
							decoded[0].forEach(segment => {
								segment[0] += code.length;
							});
						}
						if (i>0) {
							decoded.forEach(line => {
								line.forEach(segment => {
									segment[1] = i;
								});
							});
						}
						mappings.push(...decoded);
					} else if (pluginOptions.sourcemap) {
						sources.push('');
						sourcesContent.push('');
						mappings.push(...(new Array(data.css[f].split(/\r\n|\r|\n/).length).fill([])));
					}
					code += data.css[f] + '\n';
				}

				if (code==='') continue;

				let css_file_name;
				if (chunk.facadeModuleId) {
					const name = path.basename(chunk.facadeModuleId).split('.').slice(0, -1).join('.');
					css_file_name = makeFileName(name, hash(code), pluginOptions.entryFileNames);
				} else {
					css_file_name = makeFileName('chunk', hash(code), pluginOptions.chunkFileNames);
				}

				let map = null;
				if (mappings.length>0) {
					const map_file_name = css_file_name + '.map';
					map = {
						version: 3,
						file: css_file_name,
						sources: sources,
						sourcesContent: sourcesContent,
						names: [],
						mappings: encode(mappings)
					};
					code += `/*# sourceMappingURL=${encodeURIComponent(map_file_name)} */`;
					this.emitFile({
						type: 'asset',
						fileName: map_file_name,
						source: JSON.stringify(map, null)
					});
				}
				this.emitFile({
					type: 'asset',
					fileName: css_file_name,
					source: code
				});

				chunk.imports.push(css_file_name);
			}
		}
	};
};
