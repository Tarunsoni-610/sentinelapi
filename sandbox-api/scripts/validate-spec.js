'use strict';
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');

SwaggerParser.validate(path.join(__dirname, '..', 'openapi.yaml'))
  .then((api) => {
    const ops = Object.values(api.paths).reduce((n, p) => n + Object.keys(p).length, 0);
    console.log(`OK  OpenAPI valid: "${api.info.title}" v${api.info.version} - ${Object.keys(api.paths).length} paths, ${ops} operations`);
  })
  .catch((e) => { console.error('FAIL  ' + e.message); process.exit(1); });
  