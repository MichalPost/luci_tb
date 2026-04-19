'use strict';

const ALLOWED_ROOTS = ['/etc', '/tmp', '/overlay', '/mnt'];

/**
 * Validates that a path is within one of the allowed root directories.
 * Prevents path traversal attacks.
 * @param {string} p - The path to validate
 * @returns {string} The resolved absolute path
 * @throws {{ code: string, message: string }} If path is outside allowed roots
 */
function validatePath(p) {
  const resolved = require('path').resolve(p);
  if (!ALLOWED_ROOTS.some(root => resolved === root || resolved.startsWith(root + '/'))) {
    throw { code: 'EPERM', message: 'Path not allowed' };
  }
  return resolved;
}

/**
 * Writes a JSON object to stdout followed by a newline.
 * @param {object} obj - The object to serialize and output
 */
function out(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

/**
 * Reads all data from stdin and parses it as JSON.
 * @returns {Promise<object>} Parsed JSON object from stdin
 */
function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    process.stdin.on('error', reject);
  });
}

/**
 * Main dispatcher for rpcd list/call commands.
 * @param {function(): object} listFn - Returns the method signatures object for 'list'
 * @param {function(string, object): Promise<object>|object} callFn - Handles method calls
 */
function rpcdMain(listFn, callFn) {
  const cmd = process.argv[2];

  if (cmd === 'list') {
    out(listFn());
  } else if (cmd === 'call') {
    const method = process.argv[3];
    readStdin().then(params => {
      return Promise.resolve(callFn(method, params));
    }).then(result => {
      out(result);
    }).catch(err => {
      out({ result: 'error', error: err.code || err.message || String(err) });
    });
  } else {
    out({ result: 'error', error: 'Unknown command: ' + cmd });
  }
}

module.exports = { validatePath, out, readStdin, rpcdMain };
