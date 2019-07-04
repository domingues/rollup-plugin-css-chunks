# rollup-plugin-css-chunks changelog

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
