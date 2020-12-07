import path from 'path';
import crypto from 'crypto';
import {
    NormalizedOutputOptions,
    OutputBundle,
    OutputChunk,
    PluginContext,
    PluginImpl,
    SourceMap,
    SourceMapInput
} from 'rollup';
import {createFilter} from 'rollup-pluginutils';
import {encode, decode} from 'sourcemap-codec';
import {readFileSync} from "fs";

function hash(content: string) {
    return crypto.createHmac('sha256', content)
        .digest('hex')
        .substr(0, 8);
}

function makeFileName(name: string, hashed: string, pattern: string) {
    return pattern.replace('[name]', name).replace('[hash]', hashed);
}

interface PluginOptions {
    injectImports: boolean;
    ignore: boolean;
    sourcemap: boolean;
    chunkFileNames: string;
    entryFileNames: string;
}

interface InputPluginOptions {
    injectImports?: boolean;
    ignore?: boolean;
    sourcemap?: boolean;
    chunkFileNames?: string;
    entryFileNames?: string;
}

const cssChunks: PluginImpl<InputPluginOptions> = function (options = {}) {
    const filter = createFilter(/\.css$/i, []);

    const defaultPluginOptions: PluginOptions = {
        injectImports: false,
        ignore: false,
        sourcemap: false,
        chunkFileNames: '[name]-[hash].css',
        entryFileNames: '[name].css',
    };

    Object.keys(options).forEach(key => {
        if (!(key in defaultPluginOptions))
            throw new Error(`unknown option ${key}`);
    });
    const pluginOptions: PluginOptions = Object.assign({}, defaultPluginOptions, options);

    const data: {
        css: Record<string, string>,
        map: Record<string, SourceMap>
    } = {
        css: {},
        map: {}
    };

    return {
        name: 'css',

        load(id: string) {
            if (!filter(id)) return null;

            let code = readFileSync(id, 'utf8')
            let map: SourceMapInput = null

            let m = code.match(/\/\*#\W*sourceMappingURL=data:application\/json;charset=utf-8;base64,([a-zA-Z0-9+/]+)\W*\*\//);
            if (m !== null) {
                code = code.replace(m[0], '').trim();
                try {
                    map = JSON.parse(Buffer.from(m[1], 'base64').toString('utf-8').trim());
                } catch (err) {
                    console.warn(`Could not load css map file of ${id}.\n  ${err}`);
                }
            }
            m = code.match(/\/\*#\W*sourceMappingURL=([^\\/]+)\W*\*\//);
            if (m !== null) {
                code = code.replace(m[0], '').trim();
                try {
                    map = readFileSync(path.resolve(id, '..', m[1].trim()), 'utf8');
                } catch (err) {
                    console.warn(`Could not load css map file of ${id}.\n  ${err}`);
                }
            }

            return {code, map}
        },

        transform(code: string, id: string) {
            if (!filter(id)) return null;

            data.css[id] = code;
            data.map[id] = this.getCombinedSourcemap();

            return {code: '', meta: {transformedByCSSChunks: true}};
        },

        generateBundle(this: PluginContext, generateBundleOpts: NormalizedOutputOptions, bundle: OutputBundle) {
            if (pluginOptions.ignore !== false) return;

            if (!generateBundleOpts.dir) {
                this.warn('No directory provided. Skipping CSS generation');
                return;
            }

            for (const chunk of Object.values(bundle).reverse()) {
                if (chunk.type === 'asset') continue;

                let code = '';

                if (pluginOptions.injectImports) {
                    for (const c of chunk.imports) {
                        if (bundle[c]) {
                            code += (<OutputChunk>bundle[c]).imports.filter(filter)
                                .map(f => `@import '${f}';`).join('');
                        }
                    }
                    if (code != '')
                        code += '\n';
                }

                const css_modules: string[] = []
                for (const f of Object.keys(chunk.modules)) {
                    this.getModuleInfo(f)?.importedIds
                        ?.filter(v => this.getModuleInfo(v)?.meta.transformedByCSSChunks == true)
                        .forEach(v => css_modules.push(v))
                }

                const sources = [];
                const sourcesContent = [];
                const mappings = [];
                for (const f of css_modules) {
                    if (pluginOptions.sourcemap) {
                        const i = sources.length;
                        sources.push(...data.map[f].sources.map(
                            source => path.relative(generateBundleOpts.dir ? generateBundleOpts.dir : '', source)));
                        sourcesContent.push(...data.map[f].sourcesContent);
                        const decoded = decode(data.map[f].mappings);
                        if (i === 0) {
                            decoded[0].forEach(segment => {
                                segment[0] += code.length;
                            });
                        }
                        if (i > 0) {
                            decoded.forEach(line => {
                                line.forEach(segment => {
                                    segment[1] = i;
                                });
                            });
                        }
                        mappings.push(...decoded);
                    }
                    code += data.css[f] + '\n';
                }

                if (code === '') continue;

                const css_file_name = makeFileName(chunk.name, hash(code),
                    chunk.isEntry ? pluginOptions.entryFileNames : pluginOptions.chunkFileNames);

                let map = null;
                if (pluginOptions.sourcemap) {
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

export default cssChunks;
