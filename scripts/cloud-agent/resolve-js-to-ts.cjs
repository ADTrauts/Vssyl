/**
 * Cloud Agent only: under ts-node-dev, ESM-style `*.js` import specifiers fail
 * because source files are still `*.ts`. Production `tsc` emits real `.js` files,
 * so those imports work there. This hook remaps missing `.js` requires to `.ts`
 * without changing application source.
 */
'use strict';

const Module = require('module');
const fs = require('fs');
const path = require('path');

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveJsToTs(request, parent, isMain, options) {
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (err) {
    if (typeof request !== 'string' || !request.endsWith('.js')) {
      throw err;
    }

    const tsRequest = `${request.slice(0, -3)}.ts`;
    try {
      return originalResolveFilename.call(this, tsRequest, parent, isMain, options);
    } catch {
      // Fall through — try absolute sibling resolution from the parent module.
    }

    if (parent && typeof parent.filename === 'string' && request.startsWith('.')) {
      const absTs = path.resolve(path.dirname(parent.filename), tsRequest);
      if (fs.existsSync(absTs)) {
        try {
          return originalResolveFilename.call(this, absTs, parent, isMain, options);
        } catch {
          // rethrow original
        }
      }
    }

    throw err;
  }
};
