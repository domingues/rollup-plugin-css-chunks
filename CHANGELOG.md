# rollup-plugin-css-chunks changelog

## 2.0.3 (03/03/2021)

* fix: invalid RegEx ([#21](https://github.com/domingues/rollup-plugin-css-chunks/pull/21));

## 2.0.2 (10/12/2020)

* fix: peerDependencies specification (#17);

## 2.0.1 (07/12/2020)

* fix: url-join missing from dependencies (#13);

## 2.0.0 (07/12/2020)

* feat: load source map file of `sourceMappingURL`;
* feat: return CSS chunk public URL;
* fix: no-treeshake causing inclusion of dead CSS and "phantom" js modules (#7);

## 1.2.9 (30/11/2020)

* build: add type definitions.

## 1.2.8 (21/09/2020)

* Fix build.

## 1.2.7 (20/09/2020)

* Fix `entryFileNames`;
* Use TypeScript.

## 1.2.6 (09/09/2020)

* Use the chunk name rather than `chunk`.

## 1.2.5 (08/09/2020)

* Fix `@import` injection.

## 1.2.4 (07/09/2020)

* Add support to Rollup 2 ([#2](https://github.com/domingues/rollup-plugin-css-chunks/pull/2));
* Fix Rollup 2 deprecation warning [[#3](https://github.com/domingues/rollup-plugin-css-chunks/issues/3)].

## 1.2.3 (12/08/2019)

* Fix bug when parsing sourcemaps with non ASCII characters.

## 1.2.2 (08/07/2019)

* Fix bug that generates source maps even when disabled.

## 1.2.1 (04/07/2019)

* Don't break source maps when imported CSS files don't have them.

## 1.2.0 (21/05/2019)

* Move imports from `bundle[].assetImports` to `bundle[].imports`.

## 1.1.3 (11/04/2019)

* Fixed bug when find assets chunks;
* Readme updated.

## 1.1.2 (10/04/2019)

* Change `bundle[].assetsImports` to `bundle[].assetImports`.

## 1.1.1 (10/04/2019)

* Readme updated.

## 1.1.0 (10/04/2019)

* Chunks file names based on their own content hash;
* Options to set entry point and chunk file names structure;
* Option to just consume CSS files, and don't produce any output;
* Injection of `@import` directives are now disable by default;
* Fix bug when files don't have source map data;
* Inserted CSS imports on `bundle[].assetsImports` rollup bundle field.

## 1.0.0 (09/04/2019)

* First release.
