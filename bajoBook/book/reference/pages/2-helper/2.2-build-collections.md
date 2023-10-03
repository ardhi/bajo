---
title: async function buildCollections()
---

A function helper to collect and format data from a plugin's config entries.

###### Parameters:

| Name | Type | Default Value | Description |
| ---- | ---- | ------------- | ----------- |
| ```options``` | object | ```{}``` ||
| &nbsp;&nbsp;&nbsp;&nbsp;```plugin``` | string | _Autodetect_ | Plugin name from which collections are gathered |
| &nbsp;&nbsp;&nbsp;&nbsp;```handler``` | function || Extraction function handler. _Required_ |
| &nbsp;&nbsp;&nbsp;&nbsp;```dupChecks``` | array | ```[]``` | Array of keys to check for duplications. If none is provided, ignore duplication checks |
| &nbsp;&nbsp;&nbsp;&nbsp;```container``` | string | ```connections``` | Plugin's config key used as container |

###### Returns:

```array```
