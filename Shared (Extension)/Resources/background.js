/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/uuid/dist/cjs-browser/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/index.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.version = exports.validate = exports.v7 = exports.v6ToV1 = exports.v6 = exports.v5 = exports.v4 = exports.v3 = exports.v1ToV6 = exports.v1 = exports.stringify = exports.parse = exports.NIL = exports.MAX = void 0;
var max_js_1 = __webpack_require__(/*! ./max.js */ "./node_modules/uuid/dist/cjs-browser/max.js");
Object.defineProperty(exports, "MAX", ({ enumerable: true, get: function () { return max_js_1.default; } }));
var nil_js_1 = __webpack_require__(/*! ./nil.js */ "./node_modules/uuid/dist/cjs-browser/nil.js");
Object.defineProperty(exports, "NIL", ({ enumerable: true, get: function () { return nil_js_1.default; } }));
var parse_js_1 = __webpack_require__(/*! ./parse.js */ "./node_modules/uuid/dist/cjs-browser/parse.js");
Object.defineProperty(exports, "parse", ({ enumerable: true, get: function () { return parse_js_1.default; } }));
var stringify_js_1 = __webpack_require__(/*! ./stringify.js */ "./node_modules/uuid/dist/cjs-browser/stringify.js");
Object.defineProperty(exports, "stringify", ({ enumerable: true, get: function () { return stringify_js_1.default; } }));
var v1_js_1 = __webpack_require__(/*! ./v1.js */ "./node_modules/uuid/dist/cjs-browser/v1.js");
Object.defineProperty(exports, "v1", ({ enumerable: true, get: function () { return v1_js_1.default; } }));
var v1ToV6_js_1 = __webpack_require__(/*! ./v1ToV6.js */ "./node_modules/uuid/dist/cjs-browser/v1ToV6.js");
Object.defineProperty(exports, "v1ToV6", ({ enumerable: true, get: function () { return v1ToV6_js_1.default; } }));
var v3_js_1 = __webpack_require__(/*! ./v3.js */ "./node_modules/uuid/dist/cjs-browser/v3.js");
Object.defineProperty(exports, "v3", ({ enumerable: true, get: function () { return v3_js_1.default; } }));
var v4_js_1 = __webpack_require__(/*! ./v4.js */ "./node_modules/uuid/dist/cjs-browser/v4.js");
Object.defineProperty(exports, "v4", ({ enumerable: true, get: function () { return v4_js_1.default; } }));
var v5_js_1 = __webpack_require__(/*! ./v5.js */ "./node_modules/uuid/dist/cjs-browser/v5.js");
Object.defineProperty(exports, "v5", ({ enumerable: true, get: function () { return v5_js_1.default; } }));
var v6_js_1 = __webpack_require__(/*! ./v6.js */ "./node_modules/uuid/dist/cjs-browser/v6.js");
Object.defineProperty(exports, "v6", ({ enumerable: true, get: function () { return v6_js_1.default; } }));
var v6ToV1_js_1 = __webpack_require__(/*! ./v6ToV1.js */ "./node_modules/uuid/dist/cjs-browser/v6ToV1.js");
Object.defineProperty(exports, "v6ToV1", ({ enumerable: true, get: function () { return v6ToV1_js_1.default; } }));
var v7_js_1 = __webpack_require__(/*! ./v7.js */ "./node_modules/uuid/dist/cjs-browser/v7.js");
Object.defineProperty(exports, "v7", ({ enumerable: true, get: function () { return v7_js_1.default; } }));
var validate_js_1 = __webpack_require__(/*! ./validate.js */ "./node_modules/uuid/dist/cjs-browser/validate.js");
Object.defineProperty(exports, "validate", ({ enumerable: true, get: function () { return validate_js_1.default; } }));
var version_js_1 = __webpack_require__(/*! ./version.js */ "./node_modules/uuid/dist/cjs-browser/version.js");
Object.defineProperty(exports, "version", ({ enumerable: true, get: function () { return version_js_1.default; } }));


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/max.js":
/*!***************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/max.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports["default"] = 'ffffffff-ffff-ffff-ffff-ffffffffffff';


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/md5.js":
/*!***************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/md5.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function md5(bytes) {
    const words = uint8ToUint32(bytes);
    const md5Bytes = wordsToMd5(words, bytes.length * 8);
    return uint32ToUint8(md5Bytes);
}
function uint32ToUint8(input) {
    const bytes = new Uint8Array(input.length * 4);
    for (let i = 0; i < input.length * 4; i++) {
        bytes[i] = (input[i >> 2] >>> ((i % 4) * 8)) & 0xff;
    }
    return bytes;
}
function getOutputLength(inputLength8) {
    return (((inputLength8 + 64) >>> 9) << 4) + 14 + 1;
}
function wordsToMd5(x, len) {
    const xpad = new Uint32Array(getOutputLength(len)).fill(0);
    xpad.set(x);
    xpad[len >> 5] |= 0x80 << len % 32;
    xpad[xpad.length - 1] = len;
    x = xpad;
    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;
    for (let i = 0; i < x.length; i += 16) {
        const olda = a;
        const oldb = b;
        const oldc = c;
        const oldd = d;
        a = md5ff(a, b, c, d, x[i], 7, -680876936);
        d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
        b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
        a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = md5gg(b, c, d, a, x[i], 20, -373897302);
        a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
        a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
        d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = md5hh(d, a, b, c, x[i], 11, -358537222);
        c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
        a = md5ii(a, b, c, d, x[i], 6, -198630844);
        d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
        a = safeAdd(a, olda);
        b = safeAdd(b, oldb);
        c = safeAdd(c, oldc);
        d = safeAdd(d, oldd);
    }
    return Uint32Array.of(a, b, c, d);
}
function uint8ToUint32(input) {
    if (input.length === 0) {
        return new Uint32Array();
    }
    const output = new Uint32Array(getOutputLength(input.length * 8)).fill(0);
    for (let i = 0; i < input.length; i++) {
        output[i >> 2] |= (input[i] & 0xff) << ((i % 4) * 8);
    }
    return output;
}
function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
}
function bitRotateLeft(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
}
function md5cmn(q, a, b, x, s, t) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}
function md5ff(a, b, c, d, x, s, t) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
}
function md5gg(a, b, c, d, x, s, t) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
}
function md5hh(a, b, c, d, x, s, t) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5ii(a, b, c, d, x, s, t) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}
exports["default"] = md5;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/native.js":
/*!******************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/native.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
exports["default"] = { randomUUID };


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/nil.js":
/*!***************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/nil.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports["default"] = '00000000-0000-0000-0000-000000000000';


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/parse.js":
/*!*****************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/parse.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const validate_js_1 = __webpack_require__(/*! ./validate.js */ "./node_modules/uuid/dist/cjs-browser/validate.js");
function parse(uuid) {
    if (!(0, validate_js_1.default)(uuid)) {
        throw TypeError('Invalid UUID');
    }
    let v;
    return Uint8Array.of((v = parseInt(uuid.slice(0, 8), 16)) >>> 24, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff, (v = parseInt(uuid.slice(9, 13), 16)) >>> 8, v & 0xff, (v = parseInt(uuid.slice(14, 18), 16)) >>> 8, v & 0xff, (v = parseInt(uuid.slice(19, 23), 16)) >>> 8, v & 0xff, ((v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000) & 0xff, (v / 0x100000000) & 0xff, (v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
}
exports["default"] = parse;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/regex.js":
/*!*****************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/regex.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports["default"] = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/rng.js":
/*!***************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/rng.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
let getRandomValues;
const rnds8 = new Uint8Array(16);
function rng() {
    if (!getRandomValues) {
        if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
            throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
        getRandomValues = crypto.getRandomValues.bind(crypto);
    }
    return getRandomValues(rnds8);
}
exports["default"] = rng;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/sha1.js":
/*!****************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/sha1.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function f(s, x, y, z) {
    switch (s) {
        case 0:
            return (x & y) ^ (~x & z);
        case 1:
            return x ^ y ^ z;
        case 2:
            return (x & y) ^ (x & z) ^ (y & z);
        case 3:
            return x ^ y ^ z;
    }
}
function ROTL(x, n) {
    return (x << n) | (x >>> (32 - n));
}
function sha1(bytes) {
    const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
    const H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
    const newBytes = new Uint8Array(bytes.length + 1);
    newBytes.set(bytes);
    newBytes[bytes.length] = 0x80;
    bytes = newBytes;
    const l = bytes.length / 4 + 2;
    const N = Math.ceil(l / 16);
    const M = new Array(N);
    for (let i = 0; i < N; ++i) {
        const arr = new Uint32Array(16);
        for (let j = 0; j < 16; ++j) {
            arr[j] =
                (bytes[i * 64 + j * 4] << 24) |
                    (bytes[i * 64 + j * 4 + 1] << 16) |
                    (bytes[i * 64 + j * 4 + 2] << 8) |
                    bytes[i * 64 + j * 4 + 3];
        }
        M[i] = arr;
    }
    M[N - 1][14] = ((bytes.length - 1) * 8) / Math.pow(2, 32);
    M[N - 1][14] = Math.floor(M[N - 1][14]);
    M[N - 1][15] = ((bytes.length - 1) * 8) & 0xffffffff;
    for (let i = 0; i < N; ++i) {
        const W = new Uint32Array(80);
        for (let t = 0; t < 16; ++t) {
            W[t] = M[i][t];
        }
        for (let t = 16; t < 80; ++t) {
            W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
        }
        let a = H[0];
        let b = H[1];
        let c = H[2];
        let d = H[3];
        let e = H[4];
        for (let t = 0; t < 80; ++t) {
            const s = Math.floor(t / 20);
            const T = (ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t]) >>> 0;
            e = d;
            d = c;
            c = ROTL(b, 30) >>> 0;
            b = a;
            a = T;
        }
        H[0] = (H[0] + a) >>> 0;
        H[1] = (H[1] + b) >>> 0;
        H[2] = (H[2] + c) >>> 0;
        H[3] = (H[3] + d) >>> 0;
        H[4] = (H[4] + e) >>> 0;
    }
    return Uint8Array.of(H[0] >> 24, H[0] >> 16, H[0] >> 8, H[0], H[1] >> 24, H[1] >> 16, H[1] >> 8, H[1], H[2] >> 24, H[2] >> 16, H[2] >> 8, H[2], H[3] >> 24, H[3] >> 16, H[3] >> 8, H[3], H[4] >> 24, H[4] >> 16, H[4] >> 8, H[4]);
}
exports["default"] = sha1;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/stringify.js":
/*!*********************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/stringify.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.unsafeStringify = void 0;
const validate_js_1 = __webpack_require__(/*! ./validate.js */ "./node_modules/uuid/dist/cjs-browser/validate.js");
const byteToHex = [];
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] +
        byteToHex[arr[offset + 1]] +
        byteToHex[arr[offset + 2]] +
        byteToHex[arr[offset + 3]] +
        '-' +
        byteToHex[arr[offset + 4]] +
        byteToHex[arr[offset + 5]] +
        '-' +
        byteToHex[arr[offset + 6]] +
        byteToHex[arr[offset + 7]] +
        '-' +
        byteToHex[arr[offset + 8]] +
        byteToHex[arr[offset + 9]] +
        '-' +
        byteToHex[arr[offset + 10]] +
        byteToHex[arr[offset + 11]] +
        byteToHex[arr[offset + 12]] +
        byteToHex[arr[offset + 13]] +
        byteToHex[arr[offset + 14]] +
        byteToHex[arr[offset + 15]]).toLowerCase();
}
exports.unsafeStringify = unsafeStringify;
function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    if (!(0, validate_js_1.default)(uuid)) {
        throw TypeError('Stringified UUID is invalid');
    }
    return uuid;
}
exports["default"] = stringify;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/v1.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/v1.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.updateV1State = void 0;
const rng_js_1 = __webpack_require__(/*! ./rng.js */ "./node_modules/uuid/dist/cjs-browser/rng.js");
const stringify_js_1 = __webpack_require__(/*! ./stringify.js */ "./node_modules/uuid/dist/cjs-browser/stringify.js");
const _state = {};
function v1(options, buf, offset) {
    let bytes;
    const isV6 = options?._v6 ?? false;
    if (options) {
        const optionsKeys = Object.keys(options);
        if (optionsKeys.length === 1 && optionsKeys[0] === '_v6') {
            options = undefined;
        }
    }
    if (options) {
        bytes = v1Bytes(options.random ?? options.rng?.() ?? (0, rng_js_1.default)(), options.msecs, options.nsecs, options.clockseq, options.node, buf, offset);
    }
    else {
        const now = Date.now();
        const rnds = (0, rng_js_1.default)();
        updateV1State(_state, now, rnds);
        bytes = v1Bytes(rnds, _state.msecs, _state.nsecs, isV6 ? undefined : _state.clockseq, isV6 ? undefined : _state.node, buf, offset);
    }
    return buf ?? (0, stringify_js_1.unsafeStringify)(bytes);
}
function updateV1State(state, now, rnds) {
    state.msecs ??= -Infinity;
    state.nsecs ??= 0;
    if (now === state.msecs) {
        state.nsecs++;
        if (state.nsecs >= 10000) {
            state.node = undefined;
            state.nsecs = 0;
        }
    }
    else if (now > state.msecs) {
        state.nsecs = 0;
    }
    else if (now < state.msecs) {
        state.node = undefined;
    }
    if (!state.node) {
        state.node = rnds.slice(10, 16);
        state.node[0] |= 0x01;
        state.clockseq = ((rnds[8] << 8) | rnds[9]) & 0x3fff;
    }
    state.msecs = now;
    return state;
}
exports.updateV1State = updateV1State;
function v1Bytes(rnds, msecs, nsecs, clockseq, node, buf, offset = 0) {
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    if (!buf) {
        buf = new Uint8Array(16);
        offset = 0;
    }
    else {
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
    }
    msecs ??= Date.now();
    nsecs ??= 0;
    clockseq ??= ((rnds[8] << 8) | rnds[9]) & 0x3fff;
    node ??= rnds.slice(10, 16);
    msecs += 12219292800000;
    const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    buf[offset++] = (tl >>> 24) & 0xff;
    buf[offset++] = (tl >>> 16) & 0xff;
    buf[offset++] = (tl >>> 8) & 0xff;
    buf[offset++] = tl & 0xff;
    const tmh = ((msecs / 0x100000000) * 10000) & 0xfffffff;
    buf[offset++] = (tmh >>> 8) & 0xff;
    buf[offset++] = tmh & 0xff;
    buf[offset++] = ((tmh >>> 24) & 0xf) | 0x10;
    buf[offset++] = (tmh >>> 16) & 0xff;
    buf[offset++] = (clockseq >>> 8) | 0x80;
    buf[offset++] = clockseq & 0xff;
    for (let n = 0; n < 6; ++n) {
        buf[offset++] = node[n];
    }
    return buf;
}
exports["default"] = v1;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/v1ToV6.js":
/*!******************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/v1ToV6.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const parse_js_1 = __webpack_require__(/*! ./parse.js */ "./node_modules/uuid/dist/cjs-browser/parse.js");
const stringify_js_1 = __webpack_require__(/*! ./stringify.js */ "./node_modules/uuid/dist/cjs-browser/stringify.js");
function v1ToV6(uuid) {
    const v1Bytes = typeof uuid === 'string' ? (0, parse_js_1.default)(uuid) : uuid;
    const v6Bytes = _v1ToV6(v1Bytes);
    return typeof uuid === 'string' ? (0, stringify_js_1.unsafeStringify)(v6Bytes) : v6Bytes;
}
exports["default"] = v1ToV6;
function _v1ToV6(v1Bytes) {
    return Uint8Array.of(((v1Bytes[6] & 0x0f) << 4) | ((v1Bytes[7] >> 4) & 0x0f), ((v1Bytes[7] & 0x0f) << 4) | ((v1Bytes[4] & 0xf0) >> 4), ((v1Bytes[4] & 0x0f) << 4) | ((v1Bytes[5] & 0xf0) >> 4), ((v1Bytes[5] & 0x0f) << 4) | ((v1Bytes[0] & 0xf0) >> 4), ((v1Bytes[0] & 0x0f) << 4) | ((v1Bytes[1] & 0xf0) >> 4), ((v1Bytes[1] & 0x0f) << 4) | ((v1Bytes[2] & 0xf0) >> 4), 0x60 | (v1Bytes[2] & 0x0f), v1Bytes[3], v1Bytes[8], v1Bytes[9], v1Bytes[10], v1Bytes[11], v1Bytes[12], v1Bytes[13], v1Bytes[14], v1Bytes[15]);
}


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/v3.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/v3.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.URL = exports.DNS = void 0;
const md5_js_1 = __webpack_require__(/*! ./md5.js */ "./node_modules/uuid/dist/cjs-browser/md5.js");
const v35_js_1 = __webpack_require__(/*! ./v35.js */ "./node_modules/uuid/dist/cjs-browser/v35.js");
var v35_js_2 = __webpack_require__(/*! ./v35.js */ "./node_modules/uuid/dist/cjs-browser/v35.js");
Object.defineProperty(exports, "DNS", ({ enumerable: true, get: function () { return v35_js_2.DNS; } }));
Object.defineProperty(exports, "URL", ({ enumerable: true, get: function () { return v35_js_2.URL; } }));
function v3(value, namespace, buf, offset) {
    return (0, v35_js_1.default)(0x30, md5_js_1.default, value, namespace, buf, offset);
}
v3.DNS = v35_js_1.DNS;
v3.URL = v35_js_1.URL;
exports["default"] = v3;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/v35.js":
/*!***************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/v35.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.URL = exports.DNS = exports.stringToBytes = void 0;
const parse_js_1 = __webpack_require__(/*! ./parse.js */ "./node_modules/uuid/dist/cjs-browser/parse.js");
const stringify_js_1 = __webpack_require__(/*! ./stringify.js */ "./node_modules/uuid/dist/cjs-browser/stringify.js");
function stringToBytes(str) {
    str = unescape(encodeURIComponent(str));
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; ++i) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
}
exports.stringToBytes = stringToBytes;
exports.DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
exports.URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
function v35(version, hash, value, namespace, buf, offset) {
    const valueBytes = typeof value === 'string' ? stringToBytes(value) : value;
    const namespaceBytes = typeof namespace === 'string' ? (0, parse_js_1.default)(namespace) : namespace;
    if (typeof namespace === 'string') {
        namespace = (0, parse_js_1.default)(namespace);
    }
    if (namespace?.length !== 16) {
        throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
    }
    let bytes = new Uint8Array(16 + valueBytes.length);
    bytes.set(namespaceBytes);
    bytes.set(valueBytes, namespaceBytes.length);
    bytes = hash(bytes);
    bytes[6] = (bytes[6] & 0x0f) | version;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    if (buf) {
        offset = offset || 0;
        for (let i = 0; i < 16; ++i) {
            buf[offset + i] = bytes[i];
        }
        return buf;
    }
    return (0, stringify_js_1.unsafeStringify)(bytes);
}
exports["default"] = v35;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/v4.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/v4.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const native_js_1 = __webpack_require__(/*! ./native.js */ "./node_modules/uuid/dist/cjs-browser/native.js");
const rng_js_1 = __webpack_require__(/*! ./rng.js */ "./node_modules/uuid/dist/cjs-browser/rng.js");
const stringify_js_1 = __webpack_require__(/*! ./stringify.js */ "./node_modules/uuid/dist/cjs-browser/stringify.js");
function v4(options, buf, offset) {
    if (native_js_1.default.randomUUID && !buf && !options) {
        return native_js_1.default.randomUUID();
    }
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? (0, rng_js_1.default)();
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;
    if (buf) {
        offset = offset || 0;
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
        for (let i = 0; i < 16; ++i) {
            buf[offset + i] = rnds[i];
        }
        return buf;
    }
    return (0, stringify_js_1.unsafeStringify)(rnds);
}
exports["default"] = v4;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/v5.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/v5.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.URL = exports.DNS = void 0;
const sha1_js_1 = __webpack_require__(/*! ./sha1.js */ "./node_modules/uuid/dist/cjs-browser/sha1.js");
const v35_js_1 = __webpack_require__(/*! ./v35.js */ "./node_modules/uuid/dist/cjs-browser/v35.js");
var v35_js_2 = __webpack_require__(/*! ./v35.js */ "./node_modules/uuid/dist/cjs-browser/v35.js");
Object.defineProperty(exports, "DNS", ({ enumerable: true, get: function () { return v35_js_2.DNS; } }));
Object.defineProperty(exports, "URL", ({ enumerable: true, get: function () { return v35_js_2.URL; } }));
function v5(value, namespace, buf, offset) {
    return (0, v35_js_1.default)(0x50, sha1_js_1.default, value, namespace, buf, offset);
}
v5.DNS = v35_js_1.DNS;
v5.URL = v35_js_1.URL;
exports["default"] = v5;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/v6.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/v6.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const stringify_js_1 = __webpack_require__(/*! ./stringify.js */ "./node_modules/uuid/dist/cjs-browser/stringify.js");
const v1_js_1 = __webpack_require__(/*! ./v1.js */ "./node_modules/uuid/dist/cjs-browser/v1.js");
const v1ToV6_js_1 = __webpack_require__(/*! ./v1ToV6.js */ "./node_modules/uuid/dist/cjs-browser/v1ToV6.js");
function v6(options, buf, offset) {
    options ??= {};
    offset ??= 0;
    let bytes = (0, v1_js_1.default)({ ...options, _v6: true }, new Uint8Array(16));
    bytes = (0, v1ToV6_js_1.default)(bytes);
    if (buf) {
        for (let i = 0; i < 16; i++) {
            buf[offset + i] = bytes[i];
        }
        return buf;
    }
    return (0, stringify_js_1.unsafeStringify)(bytes);
}
exports["default"] = v6;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/v6ToV1.js":
/*!******************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/v6ToV1.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const parse_js_1 = __webpack_require__(/*! ./parse.js */ "./node_modules/uuid/dist/cjs-browser/parse.js");
const stringify_js_1 = __webpack_require__(/*! ./stringify.js */ "./node_modules/uuid/dist/cjs-browser/stringify.js");
function v6ToV1(uuid) {
    const v6Bytes = typeof uuid === 'string' ? (0, parse_js_1.default)(uuid) : uuid;
    const v1Bytes = _v6ToV1(v6Bytes);
    return typeof uuid === 'string' ? (0, stringify_js_1.unsafeStringify)(v1Bytes) : v1Bytes;
}
exports["default"] = v6ToV1;
function _v6ToV1(v6Bytes) {
    return Uint8Array.of(((v6Bytes[3] & 0x0f) << 4) | ((v6Bytes[4] >> 4) & 0x0f), ((v6Bytes[4] & 0x0f) << 4) | ((v6Bytes[5] & 0xf0) >> 4), ((v6Bytes[5] & 0x0f) << 4) | (v6Bytes[6] & 0x0f), v6Bytes[7], ((v6Bytes[1] & 0x0f) << 4) | ((v6Bytes[2] & 0xf0) >> 4), ((v6Bytes[2] & 0x0f) << 4) | ((v6Bytes[3] & 0xf0) >> 4), 0x10 | ((v6Bytes[0] & 0xf0) >> 4), ((v6Bytes[0] & 0x0f) << 4) | ((v6Bytes[1] & 0xf0) >> 4), v6Bytes[8], v6Bytes[9], v6Bytes[10], v6Bytes[11], v6Bytes[12], v6Bytes[13], v6Bytes[14], v6Bytes[15]);
}


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/v7.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/v7.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.updateV7State = void 0;
const rng_js_1 = __webpack_require__(/*! ./rng.js */ "./node_modules/uuid/dist/cjs-browser/rng.js");
const stringify_js_1 = __webpack_require__(/*! ./stringify.js */ "./node_modules/uuid/dist/cjs-browser/stringify.js");
const _state = {};
function v7(options, buf, offset) {
    let bytes;
    if (options) {
        bytes = v7Bytes(options.random ?? options.rng?.() ?? (0, rng_js_1.default)(), options.msecs, options.seq, buf, offset);
    }
    else {
        const now = Date.now();
        const rnds = (0, rng_js_1.default)();
        updateV7State(_state, now, rnds);
        bytes = v7Bytes(rnds, _state.msecs, _state.seq, buf, offset);
    }
    return buf ?? (0, stringify_js_1.unsafeStringify)(bytes);
}
function updateV7State(state, now, rnds) {
    state.msecs ??= -Infinity;
    state.seq ??= 0;
    if (now > state.msecs) {
        state.seq = (rnds[6] << 23) | (rnds[7] << 16) | (rnds[8] << 8) | rnds[9];
        state.msecs = now;
    }
    else {
        state.seq = (state.seq + 1) | 0;
        if (state.seq === 0) {
            state.msecs++;
        }
    }
    return state;
}
exports.updateV7State = updateV7State;
function v7Bytes(rnds, msecs, seq, buf, offset = 0) {
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    if (!buf) {
        buf = new Uint8Array(16);
        offset = 0;
    }
    else {
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
    }
    msecs ??= Date.now();
    seq ??= ((rnds[6] * 0x7f) << 24) | (rnds[7] << 16) | (rnds[8] << 8) | rnds[9];
    buf[offset++] = (msecs / 0x10000000000) & 0xff;
    buf[offset++] = (msecs / 0x100000000) & 0xff;
    buf[offset++] = (msecs / 0x1000000) & 0xff;
    buf[offset++] = (msecs / 0x10000) & 0xff;
    buf[offset++] = (msecs / 0x100) & 0xff;
    buf[offset++] = msecs & 0xff;
    buf[offset++] = 0x70 | ((seq >>> 28) & 0x0f);
    buf[offset++] = (seq >>> 20) & 0xff;
    buf[offset++] = 0x80 | ((seq >>> 14) & 0x3f);
    buf[offset++] = (seq >>> 6) & 0xff;
    buf[offset++] = ((seq << 2) & 0xff) | (rnds[10] & 0x03);
    buf[offset++] = rnds[11];
    buf[offset++] = rnds[12];
    buf[offset++] = rnds[13];
    buf[offset++] = rnds[14];
    buf[offset++] = rnds[15];
    return buf;
}
exports["default"] = v7;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/validate.js":
/*!********************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/validate.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const regex_js_1 = __webpack_require__(/*! ./regex.js */ "./node_modules/uuid/dist/cjs-browser/regex.js");
function validate(uuid) {
    return typeof uuid === 'string' && regex_js_1.default.test(uuid);
}
exports["default"] = validate;


/***/ }),

/***/ "./node_modules/uuid/dist/cjs-browser/version.js":
/*!*******************************************************!*\
  !*** ./node_modules/uuid/dist/cjs-browser/version.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const validate_js_1 = __webpack_require__(/*! ./validate.js */ "./node_modules/uuid/dist/cjs-browser/validate.js");
function version(uuid) {
    if (!(0, validate_js_1.default)(uuid)) {
        throw TypeError('Invalid UUID');
    }
    return parseInt(uuid.slice(14, 15), 16);
}
exports["default"] = version;


/***/ }),

/***/ "./src/background/background.js":
/*!**************************************!*\
  !*** ./src/background/background.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const DictionaryService = __webpack_require__(/*! ../services/dictionary-service */ "./src/services/dictionary-service.js");
const StorageManager = __webpack_require__(/*! ../services/storage */ "./src/services/storage.js");
const {
  MessageTypes,
  handleMessage
} = __webpack_require__(/*! ./message-handler */ "./src/background/message-handler.js");
const dictionaryData = __webpack_require__(/*! ../data/dictionary.json */ "./src/data/dictionary.json");

// Initialize services
const dictionary = new DictionaryService(dictionaryData);
const storage = StorageManager;

// Service instances to pass to message handler
const services = {
  dictionary,
  storage
};

/**
 * Handle installation event
 */
browser.runtime.onInstalled.addListener(async () => {
  console.log('VocabDict extension installed');

  // Initialize default vocabulary list if none exists
  const lists = await storage.get('vocab_lists');
  if (!lists || lists.length === 0) {
    const VocabularyList = __webpack_require__(/*! ../services/vocabulary-list */ "./src/services/vocabulary-list.js");
    const defaultList = new VocabularyList('My Vocabulary', dictionary, true);
    await storage.set('vocab_lists', [defaultList.toJSON()]);
    console.log('Created default vocabulary list');
  }

  // Create context menu for macOS
  if (browser.contextMenus) {
    browser.contextMenus.create({
      id: 'lookup-vocabdict',
      title: 'Look up in VocabDict',
      contexts: ['selection']
    });
    console.log('Context menu created');
  }
});

/**
 * Handle context menu clicks
 */
if (browser.contextMenus && browser.contextMenus.onClicked) {
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'lookup-vocabdict' && info.selectionText) {
      console.log('Context menu clicked:', info.selectionText);

      // Look up the word
      const response = await handleMessage({
        type: MessageTypes.LOOKUP_WORD,
        word: info.selectionText
      }, services);

      // Store the lookup result in cache for popup to display
      if (response.success && response.data) {
        await storage.set('last_lookup', {
          word: info.selectionText,
          result: response.data,
          timestamp: new Date().toISOString()
        });

        // Open the extension popup to show the result
        if (browser.action && browser.action.openPopup) {
          browser.action.openPopup();
        }
      }
    }
  });
}

/**
 * Handle messages from popup and content scripts
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  // Handle the message asynchronously
  handleMessage(message, services).then(response => {
    console.log('Sending response:', response);
    sendResponse(response);
  }).catch(error => {
    console.error('Error handling message:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  });

  // Return true to indicate we'll send response asynchronously
  return true;
});

/**
 * Handle connections from popup for persistent communication
 */
browser.runtime.onConnect.addListener(port => {
  console.log('Port connected:', port.name);
  port.onMessage.addListener(async message => {
    try {
      const response = await handleMessage(message, services);
      port.postMessage(response);
    } catch (error) {
      port.postMessage({
        success: false,
        error: error.message
      });
    }
  });
  port.onDisconnect.addListener(() => {
    console.log('Port disconnected:', port.name);
  });
});

// Export for testing
module.exports = {
  services,
  dictionary,
  storage
};

/***/ }),

/***/ "./src/background/message-handler.js":
/*!*******************************************!*\
  !*** ./src/background/message-handler.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const VocabularyList = __webpack_require__(/*! ../services/vocabulary-list */ "./src/services/vocabulary-list.js");
const SpacedRepetition = __webpack_require__(/*! ../services/spaced-repetition */ "./src/services/spaced-repetition.js");
const MessageTypes = {
  LOOKUP_WORD: 'lookup_word',
  ADD_TO_LIST: 'add_to_list',
  GET_LISTS: 'get_lists',
  CREATE_LIST: 'create_list',
  UPDATE_WORD: 'update_word',
  GET_REVIEW_QUEUE: 'get_review_queue',
  SUBMIT_REVIEW: 'submit_review'
};

/**
 * Handle messages from popup or content script
 * @param {Object} message - Message object
 * @param {Object} services - Service instances (dictionary, storage)
 * @returns {Promise<Object>} Response object
 */
async function handleMessage(message, services) {
  const {
    dictionary,
    storage
  } = services;
  try {
    switch (message.type) {
      case MessageTypes.LOOKUP_WORD:
        {
          if (!message.word) {
            return {
              success: false,
              error: 'Word parameter is required'
            };
          }
          const result = dictionary.lookup(message.word);
          if (result) {
            return {
              success: true,
              data: result
            };
          }

          // Try fuzzy search using the fuzzy match method
          const suggestions = dictionary.fuzzyMatch(message.word, 5);
          if (suggestions.length > 0) {
            return {
              success: true,
              data: null,
              suggestions: suggestions
            };
          }
          return {
            success: false,
            error: 'Word not found'
          };
        }
      case MessageTypes.ADD_TO_LIST:
        {
          if (!message.word || !message.listId) {
            return {
              success: false,
              error: 'Word and listId are required'
            };
          }

          // Check if word exists in dictionary
          const wordData = dictionary.lookup(message.word);
          if (!wordData) {
            return {
              success: false,
              error: 'Word not found in dictionary'
            };
          }
          const lists = (await storage.get('vocab_lists')) || [];
          const listIndex = lists.findIndex(l => l.id === message.listId);
          if (listIndex === -1) {
            return {
              success: false,
              error: 'List not found'
            };
          }

          // Recreate VocabularyList instance
          const list = VocabularyList.fromJSON(lists[listIndex], dictionary);
          try {
            const wordEntry = list.addWord(message.word, message.metadata);
            lists[listIndex] = list.toJSON();
            await storage.set('vocab_lists', lists);
            return {
              success: true,
              data: wordEntry
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      case MessageTypes.GET_LISTS:
        {
          const lists = (await storage.get('vocab_lists')) || [];
          return {
            success: true,
            data: lists
          };
        }
      case MessageTypes.CREATE_LIST:
        {
          if (!message.name) {
            return {
              success: false,
              error: 'List name is required'
            };
          }
          const trimmedName = message.name.trim();
          if (!trimmedName) {
            return {
              success: false,
              error: 'List name cannot be empty'
            };
          }
          const lists = (await storage.get('vocab_lists')) || [];
          const newList = new VocabularyList(trimmedName, dictionary);
          lists.push(newList.toJSON());
          await storage.set('vocab_lists', lists);
          return {
            success: true,
            data: newList.toJSON()
          };
        }
      case MessageTypes.UPDATE_WORD:
        {
          if (!message.listId || !message.word || !message.updates) {
            return {
              success: false,
              error: 'ListId, word, and updates are required'
            };
          }
          const lists = (await storage.get('vocab_lists')) || [];
          const listIndex = lists.findIndex(l => l.id === message.listId);
          if (listIndex === -1) {
            return {
              success: false,
              error: 'List not found'
            };
          }
          const list = VocabularyList.fromJSON(lists[listIndex], dictionary);
          const updated = list.updateWord(message.word, message.updates);
          if (!updated) {
            return {
              success: false,
              error: 'Word not found in list'
            };
          }
          lists[listIndex] = list.toJSON();
          await storage.set('vocab_lists', lists);
          return {
            success: true,
            data: updated
          };
        }
      case MessageTypes.GET_REVIEW_QUEUE:
        {
          const lists = (await storage.get('vocab_lists')) || [];
          const maxWords = message.maxWords || 30;

          // Collect all words from all lists
          const allWords = [];
          for (const listData of lists) {
            const list = VocabularyList.fromJSON(listData, dictionary);
            const words = list.getWords();
            for (const word of words) {
              allWords.push({
                ...word,
                listId: listData.id,
                listName: listData.name
              });
            }
          }

          // Use SpacedRepetition service to get review queue
          const queue = SpacedRepetition.getReviewQueue(allWords, maxWords);
          return {
            success: true,
            data: queue
          };
        }
      case MessageTypes.SUBMIT_REVIEW:
        {
          if (!message.listId || !message.word || !message.reviewResult) {
            return {
              success: false,
              error: 'ListId, word, and reviewResult are required'
            };
          }
          const lists = (await storage.get('vocab_lists')) || [];
          const listIndex = lists.findIndex(l => l.id === message.listId);
          if (listIndex === -1) {
            return {
              success: false,
              error: 'List not found'
            };
          }
          const list = VocabularyList.fromJSON(lists[listIndex], dictionary);
          const wordData = list.getWord(message.word);
          if (!wordData) {
            return {
              success: false,
              error: 'Word not found in list'
            };
          }

          // Calculate intervals using SpacedRepetition service
          const currentInterval = SpacedRepetition.getCurrentInterval(wordData.lastReviewed);
          const nextInterval = SpacedRepetition.calculateNextReview(currentInterval, message.reviewResult);

          // Handle mastered words
          if (nextInterval === null) {
            // Remove from active reviews by setting nextReview to null
            const updates = {
              lastReviewed: new Date().toISOString(),
              nextReview: null,
              reviewHistory: [...(wordData.reviewHistory || []), {
                date: new Date().toISOString(),
                result: message.reviewResult,
                timeSpent: message.timeSpent || 0
              }]
            };
            list.updateWord(message.word, updates);
          } else {
            // Calculate next review date
            const nextReviewDate = SpacedRepetition.getNextReviewDate(nextInterval);
            const updates = {
              lastReviewed: new Date().toISOString(),
              nextReview: nextReviewDate.toISOString(),
              reviewHistory: [...(wordData.reviewHistory || []), {
                date: new Date().toISOString(),
                result: message.reviewResult,
                timeSpent: message.timeSpent || 0
              }]
            };
            list.updateWord(message.word, updates);
          }
          lists[listIndex] = list.toJSON();
          await storage.set('vocab_lists', lists);
          return {
            success: true,
            data: {
              nextInterval
            }
          };
        }
      default:
        return {
          success: false,
          error: `Unknown message type: ${message.type}`
        };
    }
  } catch (error) {
    console.error('Message handler error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
module.exports = {
  MessageTypes,
  handleMessage
};

/***/ }),

/***/ "./src/data/dictionary.json":
/*!**********************************!*\
  !*** ./src/data/dictionary.json ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"hello":{"word":"hello","pronunciation":"/həˈloʊ/","definitions":[{"partOfSpeech":"interjection","meaning":"used as a greeting or to begin a phone conversation","examples":["Hello, how are you?","She said hello to everyone in the room"]},{"partOfSpeech":"noun","meaning":"an utterance of \'hello\'; a greeting","examples":["She gave me a warm hello","We exchanged hellos"]}],"synonyms":["hi","greetings","hey","howdy"],"antonyms":["goodbye","farewell"]},"eloquent":{"word":"eloquent","pronunciation":"/ˈɛləkwənt/","definitions":[{"partOfSpeech":"adjective","meaning":"fluent or persuasive in speaking or writing","examples":["An eloquent speaker captivated the audience","Her eloquent prose moved everyone to tears"]}],"synonyms":["articulate","expressive","fluent","persuasive"],"antonyms":["inarticulate","incoherent"]},"serendipity":{"word":"serendipity","pronunciation":"/ˌsɛrənˈdɪpɪti/","definitions":[{"partOfSpeech":"noun","meaning":"the occurrence and development of events by chance in a happy or beneficial way","examples":["A fortunate stroke of serendipity brought them together","It was pure serendipity that we met at the café"]}],"synonyms":["chance","fortune","luck","happenstance"],"antonyms":["misfortune","bad luck"]},"ephemeral":{"word":"ephemeral","pronunciation":"/ɪˈfɛmərəl/","definitions":[{"partOfSpeech":"adjective","meaning":"lasting for a very short time","examples":["The beauty of cherry blossoms is ephemeral","Youth is ephemeral and should be cherished"]}],"synonyms":["transient","fleeting","momentary","brief"],"antonyms":["permanent","eternal","lasting"]},"ubiquitous":{"word":"ubiquitous","pronunciation":"/juˈbɪkwɪtəs/","definitions":[{"partOfSpeech":"adjective","meaning":"present, appearing, or found everywhere","examples":["Smartphones have become ubiquitous in modern society","The ubiquitous coffee shops on every corner"]}],"synonyms":["omnipresent","pervasive","universal","everywhere"],"antonyms":["rare","scarce","uncommon"]},"pragmatic":{"word":"pragmatic","pronunciation":"/præɡˈmætɪk/","definitions":[{"partOfSpeech":"adjective","meaning":"dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations","examples":["She took a pragmatic approach to solving the problem","His pragmatic nature helped in making quick decisions"]}],"synonyms":["practical","realistic","sensible","matter-of-fact"],"antonyms":["idealistic","impractical","unrealistic"]},"ambiguous":{"word":"ambiguous","pronunciation":"/æmˈbɪɡjuəs/","definitions":[{"partOfSpeech":"adjective","meaning":"open to more than one interpretation; having a double meaning","examples":["The contract contained ambiguous language","Her ambiguous response left us confused"]}],"synonyms":["unclear","vague","equivocal","uncertain"],"antonyms":["clear","definite","unambiguous","explicit"]},"resilient":{"word":"resilient","pronunciation":"/rɪˈzɪliənt/","definitions":[{"partOfSpeech":"adjective","meaning":"able to withstand or recover quickly from difficult conditions","examples":["She proved to be remarkably resilient after the setback","The resilient economy bounced back quickly"]}],"synonyms":["tough","strong","hardy","flexible"],"antonyms":["fragile","vulnerable","weak"]},"meticulous":{"word":"meticulous","pronunciation":"/mɪˈtɪkjələs/","definitions":[{"partOfSpeech":"adjective","meaning":"showing great attention to detail; very careful and precise","examples":["He kept meticulous records of all transactions","Her meticulous planning ensured the event\'s success"]}],"synonyms":["careful","precise","thorough","scrupulous"],"antonyms":["careless","sloppy","negligent"]},"enigmatic":{"word":"enigmatic","pronunciation":"/ˌɛnɪɡˈmætɪk/","definitions":[{"partOfSpeech":"adjective","meaning":"difficult to interpret or understand; mysterious","examples":["She gave an enigmatic smile","The artist\'s enigmatic paintings puzzled critics"]}],"synonyms":["mysterious","puzzling","cryptic","inscrutable"],"antonyms":["clear","obvious","straightforward"]},"profound":{"word":"profound","pronunciation":"/prəˈfaʊnd/","definitions":[{"partOfSpeech":"adjective","meaning":"very great or intense; having or showing great knowledge or insight","examples":["The book had a profound impact on her thinking","He shared profound wisdom gained from experience"]}],"synonyms":["deep","intense","significant","thoughtful"],"antonyms":["superficial","shallow","trivial"]},"eclectic":{"word":"eclectic","pronunciation":"/ɪˈklɛktɪk/","definitions":[{"partOfSpeech":"adjective","meaning":"deriving ideas, style, or taste from a broad and diverse range of sources","examples":["Her eclectic taste in music ranged from classical to hip-hop","The restaurant offers an eclectic menu"]}],"synonyms":["diverse","varied","mixed","heterogeneous"],"antonyms":["homogeneous","uniform","narrow"]},"paradigm":{"word":"paradigm","pronunciation":"/ˈpærəˌdaɪm/","definitions":[{"partOfSpeech":"noun","meaning":"a typical example or pattern of something; a model","examples":["The company\'s success became a paradigm for others to follow","We need a paradigm shift in our approach"]}],"synonyms":["model","pattern","example","standard"],"antonyms":["exception","anomaly"]},"juxtapose":{"word":"juxtapose","pronunciation":"/ˈdʒʌkstəˌpoʊz/","definitions":[{"partOfSpeech":"verb","meaning":"to place or deal with close together for contrasting effect","examples":["The artist juxtaposed light and dark colors","The film juxtaposes wealth and poverty"]}],"synonyms":["contrast","compare","place side by side"],"antonyms":["separate","isolate"]},"quintessential":{"word":"quintessential","pronunciation":"/ˌkwɪntɪˈsɛnʃəl/","definitions":[{"partOfSpeech":"adjective","meaning":"representing the most perfect or typical example of a quality or class","examples":["He was the quintessential gentleman","Paris is the quintessential romantic city"]}],"synonyms":["typical","ideal","perfect","classic"],"antonyms":["atypical","unusual","uncharacteristic"]},"eloquence":{"word":"eloquence","pronunciation":"/ˈɛləkwəns/","definitions":[{"partOfSpeech":"noun","meaning":"fluent or persuasive speaking or writing","examples":["She spoke with great eloquence at the ceremony","The eloquence of his arguments won the debate"]}],"synonyms":["articulateness","fluency","expressiveness"],"antonyms":["inarticulateness","incoherence"]},"perseverance":{"word":"perseverance","pronunciation":"/ˌpɜrsəˈvɪrəns/","definitions":[{"partOfSpeech":"noun","meaning":"persistence in doing something despite difficulty or delay in achieving success","examples":["His perseverance finally paid off","Success requires perseverance and dedication"]}],"synonyms":["persistence","determination","tenacity","steadfastness"],"antonyms":["giving up","quitting","surrender"]},"benevolent":{"word":"benevolent","pronunciation":"/bəˈnɛvələnt/","definitions":[{"partOfSpeech":"adjective","meaning":"well meaning and kindly","examples":["A benevolent smile crossed her face","The benevolent organization helps thousands of families"]}],"synonyms":["kind","charitable","generous","philanthropic"],"antonyms":["malevolent","cruel","mean"]},"cognizant":{"word":"cognizant","pronunciation":"/ˈkɒɡnɪzənt/","definitions":[{"partOfSpeech":"adjective","meaning":"having knowledge or being aware of","examples":["We must be cognizant of the risks involved","She was cognizant of her responsibilities"]}],"synonyms":["aware","conscious","mindful","informed"],"antonyms":["unaware","ignorant","oblivious"]},"dichotomy":{"word":"dichotomy","pronunciation":"/daɪˈkɒtəmi/","definitions":[{"partOfSpeech":"noun","meaning":"a division or contrast between two things that are represented as being opposed or entirely different","examples":["The dichotomy between theory and practice","There\'s a false dichotomy between work and play"]}],"synonyms":["division","separation","split","contrast"],"antonyms":["unity","similarity","agreement"]},"facetious":{"word":"facetious","pronunciation":"/fəˈsiːʃəs/","definitions":[{"partOfSpeech":"adjective","meaning":"treating serious issues with deliberately inappropriate humor","examples":["His facetious remarks during the meeting were inappropriate","Don\'t be facetious; this is a serious matter"]}],"synonyms":["flippant","glib","tongue-in-cheek","joking"],"antonyms":["serious","sincere","earnest"]},"gregarious":{"word":"gregarious","pronunciation":"/ɡrɪˈɡɛəriəs/","definitions":[{"partOfSpeech":"adjective","meaning":"fond of company; sociable","examples":["She\'s naturally gregarious and loves parties","His gregarious personality made him popular"]}],"synonyms":["sociable","outgoing","friendly","extroverted"],"antonyms":["unsociable","introverted","reclusive"]},"harbinger":{"word":"harbinger","pronunciation":"/ˈhɑrbɪndʒər/","definitions":[{"partOfSpeech":"noun","meaning":"a person or thing that announces or signals the approach of another","examples":["The first flowers are harbingers of spring","Dark clouds are harbingers of storms"]}],"synonyms":["herald","precursor","forerunner","omen"],"antonyms":["aftermath","consequence"]},"idiosyncrasy":{"word":"idiosyncrasy","pronunciation":"/ˌɪdiəˈsɪŋkrəsi/","definitions":[{"partOfSpeech":"noun","meaning":"a mode of behavior or way of thought peculiar to an individual","examples":["One of his idiosyncrasies is collecting vintage typewriters","Every writer has their own idiosyncrasies"]}],"synonyms":["quirk","peculiarity","eccentricity","oddity"],"antonyms":["conformity","normality"]},"jubilant":{"word":"jubilant","pronunciation":"/ˈdʒuːbɪlənt/","definitions":[{"partOfSpeech":"adjective","meaning":"feeling or expressing great happiness and triumph","examples":["The team was jubilant after their victory","Jubilant crowds filled the streets"]}],"synonyms":["joyful","exultant","triumphant","elated"],"antonyms":["miserable","dejected","despondent"]},"kaleidoscope":{"word":"kaleidoscope","pronunciation":"/kəˈlaɪdəˌskoʊp/","definitions":[{"partOfSpeech":"noun","meaning":"a constantly changing pattern or sequence of elements","examples":["The festival was a kaleidoscope of colors and sounds","Life is a kaleidoscope of experiences"]}],"synonyms":["variety","array","medley","mosaic"],"antonyms":["uniformity","monotony"]},"labyrinth":{"word":"labyrinth","pronunciation":"/ˈlæbərɪnθ/","definitions":[{"partOfSpeech":"noun","meaning":"a complicated irregular network of passages or paths; a maze","examples":["The old city was a labyrinth of narrow streets","He got lost in the labyrinth of bureaucracy"]}],"synonyms":["maze","network","tangle","web"],"antonyms":["straight path","direct route"]},"magnanimous":{"word":"magnanimous","pronunciation":"/mæɡˈnænɪməs/","definitions":[{"partOfSpeech":"adjective","meaning":"generous or forgiving, especially toward a rival or less powerful person","examples":["He was magnanimous in victory","Her magnanimous gesture touched everyone"]}],"synonyms":["generous","noble","charitable","benevolent"],"antonyms":["petty","mean-spirited","vindictive"]},"nebulous":{"word":"nebulous","pronunciation":"/ˈnɛbjələs/","definitions":[{"partOfSpeech":"adjective","meaning":"in the form of a cloud or haze; hazy; vague or ill-defined","examples":["The plan was still nebulous and needed clarification","He had only nebulous memories of his childhood"]}],"synonyms":["vague","unclear","hazy","indefinite"],"antonyms":["clear","definite","precise"]},"oblivious":{"word":"oblivious","pronunciation":"/əˈblɪviəs/","definitions":[{"partOfSpeech":"adjective","meaning":"not aware of or not concerned about what is happening around one","examples":["She was oblivious to the danger","He seemed oblivious to the commotion around him"]}],"synonyms":["unaware","unconscious","ignorant","inattentive"],"antonyms":["aware","conscious","alert","mindful"]},"panacea":{"word":"panacea","pronunciation":"/ˌpænəˈsiːə/","definitions":[{"partOfSpeech":"noun","meaning":"a solution or remedy for all difficulties or diseases","examples":["Technology is not a panacea for all our problems","There\'s no panacea for economic inequality"]}],"synonyms":["cure-all","universal remedy","magic bullet"],"antonyms":["poison","bane"]},"quandary":{"word":"quandary","pronunciation":"/ˈkwɒndəri/","definitions":[{"partOfSpeech":"noun","meaning":"a state of perplexity or uncertainty over what to do in a difficult situation","examples":["She was in a quandary about which job to accept","The ethical quandary faced by doctors"]}],"synonyms":["dilemma","predicament","difficulty","puzzle"],"antonyms":["certainty","solution"]},"recalcitrant":{"word":"recalcitrant","pronunciation":"/rɪˈkælsɪtrənt/","definitions":[{"partOfSpeech":"adjective","meaning":"having an obstinately uncooperative attitude toward authority or discipline","examples":["The recalcitrant student refused to follow the rules","Dealing with recalcitrant employees can be challenging"]}],"synonyms":["uncooperative","obstinate","stubborn","defiant"],"antonyms":["compliant","cooperative","obedient"]},"sanguine":{"word":"sanguine","pronunciation":"/ˈsæŋɡwɪn/","definitions":[{"partOfSpeech":"adjective","meaning":"optimistic or positive, especially in an apparently bad or difficult situation","examples":["He remained sanguine about the company\'s prospects","Her sanguine disposition helped during tough times"]}],"synonyms":["optimistic","positive","confident","hopeful"],"antonyms":["pessimistic","gloomy","negative"]},"taciturn":{"word":"taciturn","pronunciation":"/ˈtæsɪtɜrn/","definitions":[{"partOfSpeech":"adjective","meaning":"reserved or uncommunicative in speech; saying little","examples":["He was taciturn by nature, preferring to listen","The taciturn stranger barely spoke during dinner"]}],"synonyms":["quiet","silent","reserved","reticent"],"antonyms":["talkative","loquacious","garrulous"]},"ubiquity":{"word":"ubiquity","pronunciation":"/juːˈbɪkwɪti/","definitions":[{"partOfSpeech":"noun","meaning":"the fact of appearing everywhere or of being very common","examples":["The ubiquity of smartphones has changed society","Despite their ubiquity, these birds are rarely noticed"]}],"synonyms":["omnipresence","pervasiveness","prevalence"],"antonyms":["rarity","scarcity"]},"vicarious":{"word":"vicarious","pronunciation":"/vaɪˈkɛriəs/","definitions":[{"partOfSpeech":"adjective","meaning":"experienced in the imagination through the feelings or actions of another person","examples":["She lived vicariously through her children\'s adventures","Reading gives us vicarious experiences"]}],"synonyms":["indirect","secondhand","surrogate","derivative"],"antonyms":["direct","firsthand","personal"]},"whimsical":{"word":"whimsical","pronunciation":"/ˈwɪmzɪkəl/","definitions":[{"partOfSpeech":"adjective","meaning":"playfully quaint or fanciful, especially in an appealing and amusing way","examples":["The garden had a whimsical design with fairy statues","Her whimsical sense of humor delighted everyone"]}],"synonyms":["playful","fanciful","quirky","capricious"],"antonyms":["serious","practical","conventional"]},"xenophobia":{"word":"xenophobia","pronunciation":"/ˌzɛnəˈfoʊbiə/","definitions":[{"partOfSpeech":"noun","meaning":"dislike of or prejudice against people from other countries","examples":["The rise of xenophobia in politics is concerning","Education helps combat xenophobia"]}],"synonyms":["racism","bigotry","prejudice","nationalism"],"antonyms":["xenophilia","tolerance","acceptance"]},"yearning":{"word":"yearning","pronunciation":"/ˈjɜrnɪŋ/","definitions":[{"partOfSpeech":"noun","meaning":"a feeling of intense longing for something","examples":["She felt a yearning for her homeland","His yearning for adventure led him to travel"]}],"synonyms":["longing","desire","craving","hunger"],"antonyms":["satisfaction","contentment","indifference"]},"zealous":{"word":"zealous","pronunciation":"/ˈzɛləs/","definitions":[{"partOfSpeech":"adjective","meaning":"having or showing great energy or passion in pursuit of a cause or objective","examples":["She was zealous in her pursuit of justice","The zealous volunteers worked tirelessly"]}],"synonyms":["passionate","fervent","ardent","enthusiastic"],"antonyms":["apathetic","indifferent","lukewarm"]},"aesthetic":{"word":"aesthetic","pronunciation":"/ɛsˈθɛtɪk/","definitions":[{"partOfSpeech":"adjective","meaning":"concerned with beauty or the appreciation of beauty","examples":["The building has great aesthetic appeal","Her aesthetic sense is highly developed"]},{"partOfSpeech":"noun","meaning":"a set of principles underlying the work of a particular artist or artistic movement","examples":["The minimalist aesthetic dominated the design","They developed their own unique aesthetic"]}],"synonyms":["artistic","visual","beautiful","stylistic"],"antonyms":["unaesthetic","ugly","unappealing"]},"brevity":{"word":"brevity","pronunciation":"/ˈbrɛvɪti/","definitions":[{"partOfSpeech":"noun","meaning":"concise and exact use of words in writing or speech; shortness of time","examples":["The brevity of the speech was appreciated","Brevity is the soul of wit"]}],"synonyms":["conciseness","shortness","briefness","terseness"],"antonyms":["lengthiness","verbosity","long-windedness"]},"catalyst":{"word":"catalyst","pronunciation":"/ˈkætəlɪst/","definitions":[{"partOfSpeech":"noun","meaning":"a person or thing that precipitates an event or change","examples":["The protest was a catalyst for political reform","Her arrival was the catalyst for change"]}],"synonyms":["stimulus","trigger","spark","impetus"],"antonyms":["hindrance","impediment","deterrent"]},"diligent":{"word":"diligent","pronunciation":"/ˈdɪlɪdʒənt/","definitions":[{"partOfSpeech":"adjective","meaning":"having or showing care and conscientiousness in one\'s work or duties","examples":["She was a diligent student who never missed class","Diligent research revealed the truth"]}],"synonyms":["hardworking","industrious","assiduous","conscientious"],"antonyms":["lazy","negligent","careless"]},"euphemism":{"word":"euphemism","pronunciation":"/ˈjuːfəmɪzəm/","definitions":[{"partOfSpeech":"noun","meaning":"a mild or indirect word or expression substituted for one considered to be too harsh or blunt","examples":["\'Passed away\' is a euphemism for \'died\'","The company used euphemisms to soften the bad news"]}],"synonyms":["substitute","polite term","indirect expression"],"antonyms":["dysphemism","direct language"]},"fortitude":{"word":"fortitude","pronunciation":"/ˈfɔːrtɪtuːd/","definitions":[{"partOfSpeech":"noun","meaning":"courage in pain or adversity","examples":["She endured her illness with great fortitude","It takes fortitude to stand up for your beliefs"]}],"synonyms":["courage","bravery","strength","resilience"],"antonyms":["cowardice","weakness","timidity"]},"garrulous":{"word":"garrulous","pronunciation":"/ˈɡærələs/","definitions":[{"partOfSpeech":"adjective","meaning":"excessively talkative, especially on trivial matters","examples":["The garrulous neighbor talked for hours","He became garrulous after a few drinks"]}],"synonyms":["talkative","chatty","loquacious","verbose"],"antonyms":["taciturn","quiet","reserved"]},"hierarchy":{"word":"hierarchy","pronunciation":"/ˈhaɪərɑːrki/","definitions":[{"partOfSpeech":"noun","meaning":"a system in which members of an organization or society are ranked according to relative status or authority","examples":["The corporate hierarchy was clearly defined","He rose quickly through the hierarchy"]}],"synonyms":["ranking","order","structure","chain of command"],"antonyms":["equality","anarchy"]},"immutable":{"word":"immutable","pronunciation":"/ɪˈmjuːtəbəl/","definitions":[{"partOfSpeech":"adjective","meaning":"unchanging over time or unable to be changed","examples":["The laws of physics are immutable","His immutable principles guided his decisions"]}],"synonyms":["unchangeable","fixed","permanent","constant"],"antonyms":["mutable","changeable","variable"]},"juxtaposition":{"word":"juxtaposition","pronunciation":"/ˌdʒʌkstəpəˈzɪʃən/","definitions":[{"partOfSpeech":"noun","meaning":"the fact of two things being seen or placed close together with contrasting effect","examples":["The juxtaposition of wealth and poverty was striking","The artist used juxtaposition to create meaning"]}],"synonyms":["contrast","comparison","proximity","adjacency"],"antonyms":["separation","distance"]}}');

/***/ }),

/***/ "./src/services/dictionary-service.js":
/*!********************************************!*\
  !*** ./src/services/dictionary-service.js ***!
  \********************************************/
/***/ ((module) => {

class DictionaryService {
  constructor(dictionaryData) {
    this.data = {};
    // Normalize all keys to lowercase for case-insensitive lookup
    Object.keys(dictionaryData).forEach(key => {
      this.data[key.toLowerCase()] = dictionaryData[key];
    });
  }

  /**
   * Look up a word in the dictionary
   * @param {string} word - The word to look up
   * @returns {Object|null} The word entry or null if not found
   */
  lookup(word) {
    if (!word || typeof word !== 'string') {
      return null;
    }
    const normalizedWord = word.trim().toLowerCase();
    if (!normalizedWord) {
      return null;
    }
    return this.data[normalizedWord] || null;
  }

  /**
   * Find words with similar spelling using Levenshtein distance
   * @param {string} word - The word to match
   * @param {number} maxSuggestions - Maximum number of suggestions to return
   * @returns {Array} Array of suggested words
   */
  fuzzyMatch(word, maxSuggestions = 5) {
    if (!word || typeof word !== 'string') {
      return [];
    }
    const normalizedWord = word.trim().toLowerCase();
    if (!normalizedWord) {
      return [];
    }

    // Calculate Levenshtein distance
    const levenshtein = (a, b) => {
      const matrix = [];
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1,
            // substitution
            matrix[i][j - 1] + 1,
            // insertion
            matrix[i - 1][j] + 1 // deletion
            );
          }
        }
      }
      return matrix[b.length][a.length];
    };

    // Find words with low Levenshtein distance
    const suggestions = [];
    const maxDistance = Math.min(3, Math.floor(normalizedWord.length / 2));
    for (const dictWord in this.data) {
      const distance = levenshtein(normalizedWord, dictWord);
      if (distance > 0 && distance <= maxDistance) {
        suggestions.push({
          word: dictWord,
          distance
        });
      }
    }

    // Sort by distance and return top suggestions
    return suggestions.sort((a, b) => a.distance - b.distance).slice(0, maxSuggestions).map(s => s.word);
  }

  /**
   * Get all words in the dictionary
   * @returns {Array} Sorted array of all words
   */
  getAllWords() {
    return Object.keys(this.data).sort();
  }

  /**
   * Get words by part of speech
   * @param {string} partOfSpeech - The part of speech to filter by
   * @returns {Array} Array of words matching the part of speech
   */
  getWordsByPartOfSpeech(partOfSpeech) {
    if (!partOfSpeech || typeof partOfSpeech !== 'string') {
      return [];
    }
    const normalizedPos = partOfSpeech.toLowerCase();
    const results = [];
    for (const word in this.data) {
      const entry = this.data[word];
      const hasPartOfSpeech = entry.definitions.some(def => def.partOfSpeech.toLowerCase() === normalizedPos);
      if (hasPartOfSpeech) {
        results.push(word);
      }
    }
    return results.sort();
  }

  /**
   * Get a random word from the dictionary
   * @returns {Object} A random word entry
   */
  getRandomWord() {
    const words = Object.keys(this.data);
    const randomIndex = Math.floor(Math.random() * words.length);
    const randomWord = words[randomIndex];
    return this.data[randomWord];
  }

  /**
   * Search for words by definition content
   * @param {string} searchTerm - The term to search for in definitions
   * @returns {Array} Array of words containing the search term in their definitions
   */
  searchByDefinition(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return [];
    }
    const normalizedTerm = searchTerm.toLowerCase();
    const results = [];
    for (const word in this.data) {
      const entry = this.data[word];
      const hasMatch = entry.definitions.some(def => {
        const meaning = def.meaning.toLowerCase();
        const examples = def.examples.join(' ').toLowerCase();
        return meaning.includes(normalizedTerm) || examples.includes(normalizedTerm);
      });
      if (hasMatch) {
        results.push(word);
      }
    }
    return results.sort();
  }
}
module.exports = DictionaryService;

/***/ }),

/***/ "./src/services/spaced-repetition.js":
/*!*******************************************!*\
  !*** ./src/services/spaced-repetition.js ***!
  \*******************************************/
/***/ ((module) => {

/**
 * Spaced Repetition service for vocabulary learning
 */
class SpacedRepetition {
  /**
   * Calculate next review interval based on current interval and review result
   * @param {number} currentInterval - Current interval in days
   * @param {string} result - Review result: 'known', 'unknown', 'skipped', 'mastered'
   * @returns {number|null} Next interval in days, or null if mastered
   */
  static calculateNextReview(currentInterval, result) {
    const intervals = {
      known: {
        1: 3,
        3: 7,
        7: 14,
        14: 30,
        30: 60
      }
    };
    if (result === 'mastered') {
      return null; // Remove from active reviews
    }
    if (result === 'unknown') {
      return 1; // Reset to day 1
    }
    if (result === 'known') {
      return intervals.known[currentInterval] || currentInterval * 2;
    }

    // Skip doesn't change interval
    return currentInterval;
  }

  /**
   * Get words due for review from a collection
   * @param {Array} words - Array of word objects with nextReview property
   * @param {number} maxWords - Maximum words to return (default: 30)
   * @returns {Array} Words due for review, sorted by due date
   */
  static getReviewQueue(words, maxWords = 30) {
    const now = new Date();
    return words.filter(word => {
      // Only include words that have nextReview and it's due
      return word.nextReview && word.nextReview !== null && new Date(word.nextReview) <= now;
    }).sort((a, b) => {
      // Sort by nextReview date (oldest first)
      return new Date(a.nextReview) - new Date(b.nextReview);
    }).slice(0, maxWords);
  }

  /**
   * Calculate the current interval based on last review
   * @param {string|null} lastReviewed - ISO date string of last review
   * @returns {number} Current interval in days (minimum 1)
   */
  static getCurrentInterval(lastReviewed) {
    if (!lastReviewed) {
      return 1; // New word
    }
    const daysSinceLastReview = Math.ceil((new Date() - new Date(lastReviewed)) / 86400000);
    return Math.max(1, daysSinceLastReview);
  }

  /**
   * Calculate next review date based on current date and interval
   * @param {number} intervalDays - Interval in days
   * @returns {Date} Next review date
   */
  static getNextReviewDate(intervalDays) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate;
  }
}
module.exports = SpacedRepetition;

/***/ }),

/***/ "./src/services/storage.js":
/*!*********************************!*\
  !*** ./src/services/storage.js ***!
  \*********************************/
/***/ ((module) => {

/**
 * StorageManager - Handles all browser storage operations
 * Uses browser.storage.local for data persistence
 */
class StorageManager {
  /**
   * Get a value from storage by key
   * @param {string} key - The storage key
   * @returns {Promise<any>} The stored value or undefined
   */
  static async get(key) {
    const result = await browser.storage.local.get(key);
    return result[key];
  }

  /**
   * Set a value in storage
   * @param {string} key - The storage key
   * @param {any} value - The value to store
   * @returns {Promise<void>}
   */
  static async set(key, value) {
    await browser.storage.local.set({
      [key]: value
    });
  }

  /**
   * Update a value in storage
   * @param {string} key - The storage key
   * @param {Function} updateFn - Function that receives current value and returns new value
   * @returns {Promise<any>} The updated value
   */
  static async update(key, updateFn) {
    const current = await this.get(key);
    const updated = updateFn(current);
    await this.set(key, updated);
    return updated;
  }

  /**
   * Remove a value from storage
   * @param {string} key - The storage key
   * @returns {Promise<void>}
   */
  static async remove(key) {
    await browser.storage.local.remove(key);
  }

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  static async clear() {
    await browser.storage.local.clear();
  }

  /**
   * Get all stored data
   * @returns {Promise<Object>} All stored data
   */
  static async getAll() {
    return await browser.storage.local.get(null);
  }
}
module.exports = StorageManager;

/***/ }),

/***/ "./src/services/vocabulary-list.js":
/*!*****************************************!*\
  !*** ./src/services/vocabulary-list.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  v4: uuidv4
} = __webpack_require__(/*! uuid */ "./node_modules/uuid/dist/cjs-browser/index.js");
class VocabularyList {
  constructor(name, dictionary, isDefault = false) {
    if (!dictionary) {
      throw new Error('Dictionary is required');
    }
    this.id = uuidv4();
    this.name = name;
    this.created = new Date().toISOString();
    this.isDefault = isDefault;
    this.words = {}; // Key: word (lowercase), Value: user-specific data
    this.dictionary = dictionary;
  }

  /**
   * Add a word to the vocabulary list
   * @param {string} wordText - The word to add
   * @param {Object} metadata - Optional metadata (difficulty, customNotes)
   * @returns {Object} The word entry with user data
   */
  addWord(wordText, metadata = {}) {
    const normalizedWord = wordText.trim().toLowerCase();

    // Check if word exists in dictionary
    const dictionaryEntry = this.dictionary.lookup(wordText);
    if (!dictionaryEntry) {
      throw new Error('Word not found in dictionary');
    }

    // Check if word already exists in list
    if (this.words[normalizedWord]) {
      throw new Error('Word already exists in list');
    }

    // Create user-specific data for this word
    const userWordData = {
      word: dictionaryEntry.word,
      // Use the correct case from dictionary
      dateAdded: new Date().toISOString(),
      difficulty: metadata.difficulty || 'medium',
      customNotes: metadata.customNotes || '',
      lastReviewed: null,
      nextReview: new Date(Date.now() + 86400000).toISOString(),
      // Default: review tomorrow
      reviewHistory: []
    };
    this.words[normalizedWord] = userWordData;
    return userWordData;
  }

  /**
   * Remove a word from the vocabulary list
   * @param {string} wordText - The word to remove
   * @returns {Object|null} The removed word data or null
   */
  removeWord(wordText) {
    const normalizedWord = wordText.trim().toLowerCase();
    if (!this.words[normalizedWord]) {
      return null;
    }
    const removed = this.words[normalizedWord];
    delete this.words[normalizedWord];
    return removed;
  }

  /**
   * Update user-specific properties of a word
   * @param {string} wordText - The word to update
   * @param {Object} updates - Properties to update
   * @returns {Object|null} The updated word data or null
   */
  updateWord(wordText, updates) {
    const normalizedWord = wordText.trim().toLowerCase();
    if (!this.words[normalizedWord]) {
      return null;
    }

    // Only update allowed properties
    const allowedProps = ['difficulty', 'customNotes', 'lastReviewed', 'nextReview', 'reviewHistory'];
    allowedProps.forEach(prop => {
      if (updates.hasOwnProperty(prop)) {
        this.words[normalizedWord][prop] = updates[prop];
      }
    });
    return this.words[normalizedWord];
  }

  /**
   * Get a word with full data (dictionary + user data)
   * @param {string} wordText - The word to get
   * @returns {Object|null} The complete word data or null
   */
  getWord(wordText) {
    const normalizedWord = wordText.trim().toLowerCase();
    if (!this.words[normalizedWord]) {
      return null;
    }

    // Get dictionary data
    const dictionaryData = this.dictionary.lookup(wordText);

    // Merge dictionary data with user data
    return {
      ...dictionaryData,
      ...this.words[normalizedWord]
    };
  }

  /**
   * Get all words with full data
   * @returns {Array} Array of complete word data
   */
  getWords() {
    return Object.values(this.words).map(userWordData => {
      const dictionaryData = this.dictionary.lookup(userWordData.word);
      return {
        ...dictionaryData,
        ...userWordData
      };
    });
  }

  /**
   * Sort words by various criteria
   * @param {string} criteria - Sort criteria (alphabetical, dateAdded, lastReviewed, difficulty)
   * @param {string} order - Sort order (asc, desc)
   * @returns {Array} Sorted array of words
   */
  sortBy(criteria, order = 'asc') {
    const words = this.getWords();
    const sortFunctions = {
      alphabetical: (a, b) => a.word.localeCompare(b.word),
      dateAdded: (a, b) => new Date(a.dateAdded) - new Date(b.dateAdded),
      lastReviewed: (a, b) => {
        // Put never-reviewed words at the end
        if (!a.lastReviewed && !b.lastReviewed) return 0;
        if (!a.lastReviewed) return 1;
        if (!b.lastReviewed) return -1;
        return new Date(a.lastReviewed) - new Date(b.lastReviewed);
      },
      difficulty: (a, b) => {
        const difficultyOrder = {
          easy: 1,
          medium: 2,
          hard: 3
        };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      }
    };
    if (criteria === 'lastReviewed') {
      // Special handling for lastReviewed to keep nulls at the end
      const reviewed = words.filter(w => w.lastReviewed);
      const notReviewed = words.filter(w => !w.lastReviewed);
      reviewed.sort((a, b) => {
        const comparison = new Date(a.lastReviewed) - new Date(b.lastReviewed);
        return order === 'desc' ? -comparison : comparison;
      });
      return [...reviewed, ...notReviewed];
    } else {
      const sortFn = sortFunctions[criteria] || sortFunctions.alphabetical;
      words.sort(sortFn);
      if (order === 'desc') {
        words.reverse();
      }
    }
    return words;
  }

  /**
   * Filter words by various criteria
   * @param {string} filterType - Filter type (difficulty, reviewStatus)
   * @param {string} filterValue - Filter value
   * @returns {Array} Filtered array of words
   */
  filterBy(filterType, filterValue) {
    const words = this.getWords();
    switch (filterType) {
      case 'difficulty':
        return words.filter(word => word.difficulty === filterValue);
      case 'reviewStatus':
        const now = new Date();
        switch (filterValue) {
          case 'due':
            return words.filter(word => word.nextReview && new Date(word.nextReview) <= now);
          case 'new':
            return words.filter(word => !word.lastReviewed);
          case 'reviewed':
            return words.filter(word => word.lastReviewed);
          default:
            return words;
        }
      default:
        return words;
    }
  }

  /**
   * Search for words in the list
   * @param {string} query - Search query
   * @returns {Array} Array of matching words
   */
  search(query) {
    const normalizedQuery = query.toLowerCase();
    const words = this.getWords();
    return words.filter(word => {
      // Search in word text
      if (word.word.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      // Search in definitions
      if (word.definitions.some(def => def.meaning.toLowerCase().includes(normalizedQuery) || def.examples.some(ex => ex.toLowerCase().includes(normalizedQuery)))) {
        return true;
      }

      // Search in custom notes
      if (word.customNotes && word.customNotes.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      return false;
    });
  }

  /**
   * Get statistics about the vocabulary list
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const words = this.getWords();
    const now = new Date();
    const stats = {
      totalWords: words.length,
      byDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      totalReviews: 0,
      wordsReviewed: 0,
      wordsDue: 0
    };
    words.forEach(word => {
      // Count by difficulty
      stats.byDifficulty[word.difficulty]++;

      // Count reviews
      if (word.reviewHistory && word.reviewHistory.length > 0) {
        stats.totalReviews += word.reviewHistory.length;
        stats.wordsReviewed++;
      }

      // Count due words
      if (word.nextReview && new Date(word.nextReview) <= now) {
        stats.wordsDue++;
      }
    });
    return stats;
  }

  /**
   * Convert to JSON for storage
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      created: this.created,
      isDefault: this.isDefault,
      words: this.words
    };
  }

  /**
   * Create from JSON
   * @param {Object} json - JSON data
   * @param {Object} dictionary - Dictionary instance
   * @returns {VocabularyList} New VocabularyList instance
   */
  static fromJSON(json, dictionary) {
    const list = new VocabularyList(json.name, dictionary, json.isDefault);
    list.id = json.id;
    list.created = json.created;
    list.words = json.words || {};
    return list;
  }
}
module.exports = VocabularyList;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/background/background.js");
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtFQUNFLE9BQU9kLFFBQVFBLENBQUNpSixJQUFJLEVBQUVyTixVQUFVLEVBQUU7SUFDaEMsTUFBTW1FLElBQUksR0FBRyxJQUFJdkQsY0FBYyxDQUFDeU0sSUFBSSxDQUFDdEssSUFBSSxFQUFFL0MsVUFBVSxFQUFFcU4sSUFBSSxDQUFDN0MsU0FBUyxDQUFDO0lBQ3RFckcsSUFBSSxDQUFDakQsRUFBRSxHQUFHbU0sSUFBSSxDQUFDbk0sRUFBRTtJQUNqQmlELElBQUksQ0FBQ3VHLE9BQU8sR0FBRzJDLElBQUksQ0FBQzNDLE9BQU87SUFDM0J2RyxJQUFJLENBQUNlLEtBQUssR0FBR21JLElBQUksQ0FBQ25JLEtBQUssSUFBSSxDQUFDLENBQUM7SUFDN0IsT0FBT2YsSUFBSTtFQUNiO0FBQ0Y7QUFFQWpCLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHdkMsY0FBYyxDOzs7Ozs7VUNyVC9CO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUV0QkE7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92b2NhYmRpY3QvLi9ub2RlX21vZHVsZXMvdXVpZC9kaXN0L2Nqcy1icm93c2VyL2luZGV4LmpzIiwid2VicGFjazovL3ZvY2FiZGljdC8uL25vZGVfbW9kdWxlcy91dWlkL2Rpc3QvY2pzLWJyb3dzZXIvbWF4LmpzIiwid2VicGFjazovL3ZvY2FiZGljdC8uL25vZGVfbW9kdWxlcy91dWlkL2Rpc3QvY2pzLWJyb3dzZXIvbWQ1LmpzIiwid2VicGFjazovL3ZvY2FiZGljdC8uL25vZGVfbW9kdWxlcy91dWlkL2Rpc3QvY2pzLWJyb3dzZXIvbmF0aXZlLmpzIiwid2VicGFjazovL3ZvY2FiZGljdC8uL25vZGVfbW9kdWxlcy91dWlkL2Rpc3QvY2pzLWJyb3dzZXIvbmlsLmpzIiwid2VicGFjazovL3ZvY2FiZGljdC8uL25vZGVfbW9kdWxlcy91dWlkL2Rpc3QvY2pzLWJyb3dzZXIvcGFyc2UuanMiLCJ3ZWJwYWNrOi8vdm9jYWJkaWN0Ly4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci9yZWdleC5qcyIsIndlYnBhY2s6Ly92b2NhYmRpY3QvLi9ub2RlX21vZHVsZXMvdXVpZC9kaXN0L2Nqcy1icm93c2VyL3JuZy5qcyIsIndlYnBhY2s6Ly92b2NhYmRpY3QvLi9ub2RlX21vZHVsZXMvdXVpZC9kaXN0L2Nqcy1icm93c2VyL3NoYTEuanMiLCJ3ZWJwYWNrOi8vdm9jYWJkaWN0Ly4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci9zdHJpbmdpZnkuanMiLCJ3ZWJwYWNrOi8vdm9jYWJkaWN0Ly4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci92MS5qcyIsIndlYnBhY2s6Ly92b2NhYmRpY3QvLi9ub2RlX21vZHVsZXMvdXVpZC9kaXN0L2Nqcy1icm93c2VyL3YxVG9WNi5qcyIsIndlYnBhY2s6Ly92b2NhYmRpY3QvLi9ub2RlX21vZHVsZXMvdXVpZC9kaXN0L2Nqcy1icm93c2VyL3YzLmpzIiwid2VicGFjazovL3ZvY2FiZGljdC8uL25vZGVfbW9kdWxlcy91dWlkL2Rpc3QvY2pzLWJyb3dzZXIvdjM1LmpzIiwid2VicGFjazovL3ZvY2FiZGljdC8uL25vZGVfbW9kdWxlcy91dWlkL2Rpc3QvY2pzLWJyb3dzZXIvdjQuanMiLCJ3ZWJwYWNrOi8vdm9jYWJkaWN0Ly4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci92NS5qcyIsIndlYnBhY2s6Ly92b2NhYmRpY3QvLi9ub2RlX21vZHVsZXMvdXVpZC9kaXN0L2Nqcy1icm93c2VyL3Y2LmpzIiwid2VicGFjazovL3ZvY2FiZGljdC8uL25vZGVfbW9kdWxlcy91dWlkL2Rpc3QvY2pzLWJyb3dzZXIvdjZUb1YxLmpzIiwid2VicGFjazovL3ZvY2FiZGljdC8uL25vZGVfbW9kdWxlcy91dWlkL2Rpc3QvY2pzLWJyb3dzZXIvdjcuanMiLCJ3ZWJwYWNrOi8vdm9jYWJkaWN0Ly4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci92YWxpZGF0ZS5qcyIsIndlYnBhY2s6Ly92b2NhYmRpY3QvLi9ub2RlX21vZHVsZXMvdXVpZC9kaXN0L2Nqcy1icm93c2VyL3ZlcnNpb24uanMiLCJ3ZWJwYWNrOi8vdm9jYWJkaWN0Ly4vc3JjL2JhY2tncm91bmQvYmFja2dyb3VuZC5qcyIsIndlYnBhY2s6Ly92b2NhYmRpY3QvLi9zcmMvYmFja2dyb3VuZC9tZXNzYWdlLWhhbmRsZXIuanMiLCJ3ZWJwYWNrOi8vdm9jYWJkaWN0Ly4vc3JjL3NlcnZpY2VzL2RpY3Rpb25hcnktc2VydmljZS5qcyIsIndlYnBhY2s6Ly92b2NhYmRpY3QvLi9zcmMvc2VydmljZXMvc3BhY2VkLXJlcGV0aXRpb24uanMiLCJ3ZWJwYWNrOi8vdm9jYWJkaWN0Ly4vc3JjL3NlcnZpY2VzL3N0b3JhZ2UuanMiLCJ3ZWJwYWNrOi8vdm9jYWJkaWN0Ly4vc3JjL3NlcnZpY2VzL3ZvY2FidWxhcnktbGlzdC5qcyIsIndlYnBhY2s6Ly92b2NhYmRpY3Qvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vdm9jYWJkaWN0L3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vdm9jYWJkaWN0L3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly92b2NhYmRpY3Qvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy52ZXJzaW9uID0gZXhwb3J0cy52YWxpZGF0ZSA9IGV4cG9ydHMudjcgPSBleHBvcnRzLnY2VG9WMSA9IGV4cG9ydHMudjYgPSBleHBvcnRzLnY1ID0gZXhwb3J0cy52NCA9IGV4cG9ydHMudjMgPSBleHBvcnRzLnYxVG9WNiA9IGV4cG9ydHMudjEgPSBleHBvcnRzLnN0cmluZ2lmeSA9IGV4cG9ydHMucGFyc2UgPSBleHBvcnRzLk5JTCA9IGV4cG9ydHMuTUFYID0gdm9pZCAwO1xudmFyIG1heF9qc18xID0gcmVxdWlyZShcIi4vbWF4LmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiTUFYXCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBtYXhfanNfMS5kZWZhdWx0OyB9IH0pO1xudmFyIG5pbF9qc18xID0gcmVxdWlyZShcIi4vbmlsLmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiTklMXCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBuaWxfanNfMS5kZWZhdWx0OyB9IH0pO1xudmFyIHBhcnNlX2pzXzEgPSByZXF1aXJlKFwiLi9wYXJzZS5qc1wiKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcInBhcnNlXCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBwYXJzZV9qc18xLmRlZmF1bHQ7IH0gfSk7XG52YXIgc3RyaW5naWZ5X2pzXzEgPSByZXF1aXJlKFwiLi9zdHJpbmdpZnkuanNcIik7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJzdHJpbmdpZnlcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHN0cmluZ2lmeV9qc18xLmRlZmF1bHQ7IH0gfSk7XG52YXIgdjFfanNfMSA9IHJlcXVpcmUoXCIuL3YxLmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwidjFcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHYxX2pzXzEuZGVmYXVsdDsgfSB9KTtcbnZhciB2MVRvVjZfanNfMSA9IHJlcXVpcmUoXCIuL3YxVG9WNi5qc1wiKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcInYxVG9WNlwiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdjFUb1Y2X2pzXzEuZGVmYXVsdDsgfSB9KTtcbnZhciB2M19qc18xID0gcmVxdWlyZShcIi4vdjMuanNcIik7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJ2M1wiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdjNfanNfMS5kZWZhdWx0OyB9IH0pO1xudmFyIHY0X2pzXzEgPSByZXF1aXJlKFwiLi92NC5qc1wiKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcInY0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB2NF9qc18xLmRlZmF1bHQ7IH0gfSk7XG52YXIgdjVfanNfMSA9IHJlcXVpcmUoXCIuL3Y1LmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwidjVcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHY1X2pzXzEuZGVmYXVsdDsgfSB9KTtcbnZhciB2Nl9qc18xID0gcmVxdWlyZShcIi4vdjYuanNcIik7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJ2NlwiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdjZfanNfMS5kZWZhdWx0OyB9IH0pO1xudmFyIHY2VG9WMV9qc18xID0gcmVxdWlyZShcIi4vdjZUb1YxLmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwidjZUb1YxXCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB2NlRvVjFfanNfMS5kZWZhdWx0OyB9IH0pO1xudmFyIHY3X2pzXzEgPSByZXF1aXJlKFwiLi92Ny5qc1wiKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcInY3XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB2N19qc18xLmRlZmF1bHQ7IH0gfSk7XG52YXIgdmFsaWRhdGVfanNfMSA9IHJlcXVpcmUoXCIuL3ZhbGlkYXRlLmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwidmFsaWRhdGVcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbGlkYXRlX2pzXzEuZGVmYXVsdDsgfSB9KTtcbnZhciB2ZXJzaW9uX2pzXzEgPSByZXF1aXJlKFwiLi92ZXJzaW9uLmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwidmVyc2lvblwiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdmVyc2lvbl9qc18xLmRlZmF1bHQ7IH0gfSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9ICdmZmZmZmZmZi1mZmZmLWZmZmYtZmZmZi1mZmZmZmZmZmZmZmYnO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBtZDUoYnl0ZXMpIHtcbiAgICBjb25zdCB3b3JkcyA9IHVpbnQ4VG9VaW50MzIoYnl0ZXMpO1xuICAgIGNvbnN0IG1kNUJ5dGVzID0gd29yZHNUb01kNSh3b3JkcywgYnl0ZXMubGVuZ3RoICogOCk7XG4gICAgcmV0dXJuIHVpbnQzMlRvVWludDgobWQ1Qnl0ZXMpO1xufVxuZnVuY3Rpb24gdWludDMyVG9VaW50OChpbnB1dCkge1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoaW5wdXQubGVuZ3RoICogNCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dC5sZW5ndGggKiA0OyBpKyspIHtcbiAgICAgICAgYnl0ZXNbaV0gPSAoaW5wdXRbaSA+PiAyXSA+Pj4gKChpICUgNCkgKiA4KSkgJiAweGZmO1xuICAgIH1cbiAgICByZXR1cm4gYnl0ZXM7XG59XG5mdW5jdGlvbiBnZXRPdXRwdXRMZW5ndGgoaW5wdXRMZW5ndGg4KSB7XG4gICAgcmV0dXJuICgoKGlucHV0TGVuZ3RoOCArIDY0KSA+Pj4gOSkgPDwgNCkgKyAxNCArIDE7XG59XG5mdW5jdGlvbiB3b3Jkc1RvTWQ1KHgsIGxlbikge1xuICAgIGNvbnN0IHhwYWQgPSBuZXcgVWludDMyQXJyYXkoZ2V0T3V0cHV0TGVuZ3RoKGxlbikpLmZpbGwoMCk7XG4gICAgeHBhZC5zZXQoeCk7XG4gICAgeHBhZFtsZW4gPj4gNV0gfD0gMHg4MCA8PCBsZW4gJSAzMjtcbiAgICB4cGFkW3hwYWQubGVuZ3RoIC0gMV0gPSBsZW47XG4gICAgeCA9IHhwYWQ7XG4gICAgbGV0IGEgPSAxNzMyNTg0MTkzO1xuICAgIGxldCBiID0gLTI3MTczMzg3OTtcbiAgICBsZXQgYyA9IC0xNzMyNTg0MTk0O1xuICAgIGxldCBkID0gMjcxNzMzODc4O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkgKz0gMTYpIHtcbiAgICAgICAgY29uc3Qgb2xkYSA9IGE7XG4gICAgICAgIGNvbnN0IG9sZGIgPSBiO1xuICAgICAgICBjb25zdCBvbGRjID0gYztcbiAgICAgICAgY29uc3Qgb2xkZCA9IGQ7XG4gICAgICAgIGEgPSBtZDVmZihhLCBiLCBjLCBkLCB4W2ldLCA3LCAtNjgwODc2OTM2KTtcbiAgICAgICAgZCA9IG1kNWZmKGQsIGEsIGIsIGMsIHhbaSArIDFdLCAxMiwgLTM4OTU2NDU4Nik7XG4gICAgICAgIGMgPSBtZDVmZihjLCBkLCBhLCBiLCB4W2kgKyAyXSwgMTcsIDYwNjEwNTgxOSk7XG4gICAgICAgIGIgPSBtZDVmZihiLCBjLCBkLCBhLCB4W2kgKyAzXSwgMjIsIC0xMDQ0NTI1MzMwKTtcbiAgICAgICAgYSA9IG1kNWZmKGEsIGIsIGMsIGQsIHhbaSArIDRdLCA3LCAtMTc2NDE4ODk3KTtcbiAgICAgICAgZCA9IG1kNWZmKGQsIGEsIGIsIGMsIHhbaSArIDVdLCAxMiwgMTIwMDA4MDQyNik7XG4gICAgICAgIGMgPSBtZDVmZihjLCBkLCBhLCBiLCB4W2kgKyA2XSwgMTcsIC0xNDczMjMxMzQxKTtcbiAgICAgICAgYiA9IG1kNWZmKGIsIGMsIGQsIGEsIHhbaSArIDddLCAyMiwgLTQ1NzA1OTgzKTtcbiAgICAgICAgYSA9IG1kNWZmKGEsIGIsIGMsIGQsIHhbaSArIDhdLCA3LCAxNzcwMDM1NDE2KTtcbiAgICAgICAgZCA9IG1kNWZmKGQsIGEsIGIsIGMsIHhbaSArIDldLCAxMiwgLTE5NTg0MTQ0MTcpO1xuICAgICAgICBjID0gbWQ1ZmYoYywgZCwgYSwgYiwgeFtpICsgMTBdLCAxNywgLTQyMDYzKTtcbiAgICAgICAgYiA9IG1kNWZmKGIsIGMsIGQsIGEsIHhbaSArIDExXSwgMjIsIC0xOTkwNDA0MTYyKTtcbiAgICAgICAgYSA9IG1kNWZmKGEsIGIsIGMsIGQsIHhbaSArIDEyXSwgNywgMTgwNDYwMzY4Mik7XG4gICAgICAgIGQgPSBtZDVmZihkLCBhLCBiLCBjLCB4W2kgKyAxM10sIDEyLCAtNDAzNDExMDEpO1xuICAgICAgICBjID0gbWQ1ZmYoYywgZCwgYSwgYiwgeFtpICsgMTRdLCAxNywgLTE1MDIwMDIyOTApO1xuICAgICAgICBiID0gbWQ1ZmYoYiwgYywgZCwgYSwgeFtpICsgMTVdLCAyMiwgMTIzNjUzNTMyOSk7XG4gICAgICAgIGEgPSBtZDVnZyhhLCBiLCBjLCBkLCB4W2kgKyAxXSwgNSwgLTE2NTc5NjUxMCk7XG4gICAgICAgIGQgPSBtZDVnZyhkLCBhLCBiLCBjLCB4W2kgKyA2XSwgOSwgLTEwNjk1MDE2MzIpO1xuICAgICAgICBjID0gbWQ1Z2coYywgZCwgYSwgYiwgeFtpICsgMTFdLCAxNCwgNjQzNzE3NzEzKTtcbiAgICAgICAgYiA9IG1kNWdnKGIsIGMsIGQsIGEsIHhbaV0sIDIwLCAtMzczODk3MzAyKTtcbiAgICAgICAgYSA9IG1kNWdnKGEsIGIsIGMsIGQsIHhbaSArIDVdLCA1LCAtNzAxNTU4NjkxKTtcbiAgICAgICAgZCA9IG1kNWdnKGQsIGEsIGIsIGMsIHhbaSArIDEwXSwgOSwgMzgwMTYwODMpO1xuICAgICAgICBjID0gbWQ1Z2coYywgZCwgYSwgYiwgeFtpICsgMTVdLCAxNCwgLTY2MDQ3ODMzNSk7XG4gICAgICAgIGIgPSBtZDVnZyhiLCBjLCBkLCBhLCB4W2kgKyA0XSwgMjAsIC00MDU1Mzc4NDgpO1xuICAgICAgICBhID0gbWQ1Z2coYSwgYiwgYywgZCwgeFtpICsgOV0sIDUsIDU2ODQ0NjQzOCk7XG4gICAgICAgIGQgPSBtZDVnZyhkLCBhLCBiLCBjLCB4W2kgKyAxNF0sIDksIC0xMDE5ODAzNjkwKTtcbiAgICAgICAgYyA9IG1kNWdnKGMsIGQsIGEsIGIsIHhbaSArIDNdLCAxNCwgLTE4NzM2Mzk2MSk7XG4gICAgICAgIGIgPSBtZDVnZyhiLCBjLCBkLCBhLCB4W2kgKyA4XSwgMjAsIDExNjM1MzE1MDEpO1xuICAgICAgICBhID0gbWQ1Z2coYSwgYiwgYywgZCwgeFtpICsgMTNdLCA1LCAtMTQ0NDY4MTQ2Nyk7XG4gICAgICAgIGQgPSBtZDVnZyhkLCBhLCBiLCBjLCB4W2kgKyAyXSwgOSwgLTUxNDAzNzg0KTtcbiAgICAgICAgYyA9IG1kNWdnKGMsIGQsIGEsIGIsIHhbaSArIDddLCAxNCwgMTczNTMyODQ3Myk7XG4gICAgICAgIGIgPSBtZDVnZyhiLCBjLCBkLCBhLCB4W2kgKyAxMl0sIDIwLCAtMTkyNjYwNzczNCk7XG4gICAgICAgIGEgPSBtZDVoaChhLCBiLCBjLCBkLCB4W2kgKyA1XSwgNCwgLTM3ODU1OCk7XG4gICAgICAgIGQgPSBtZDVoaChkLCBhLCBiLCBjLCB4W2kgKyA4XSwgMTEsIC0yMDIyNTc0NDYzKTtcbiAgICAgICAgYyA9IG1kNWhoKGMsIGQsIGEsIGIsIHhbaSArIDExXSwgMTYsIDE4MzkwMzA1NjIpO1xuICAgICAgICBiID0gbWQ1aGgoYiwgYywgZCwgYSwgeFtpICsgMTRdLCAyMywgLTM1MzA5NTU2KTtcbiAgICAgICAgYSA9IG1kNWhoKGEsIGIsIGMsIGQsIHhbaSArIDFdLCA0LCAtMTUzMDk5MjA2MCk7XG4gICAgICAgIGQgPSBtZDVoaChkLCBhLCBiLCBjLCB4W2kgKyA0XSwgMTEsIDEyNzI4OTMzNTMpO1xuICAgICAgICBjID0gbWQ1aGgoYywgZCwgYSwgYiwgeFtpICsgN10sIDE2LCAtMTU1NDk3NjMyKTtcbiAgICAgICAgYiA9IG1kNWhoKGIsIGMsIGQsIGEsIHhbaSArIDEwXSwgMjMsIC0xMDk0NzMwNjQwKTtcbiAgICAgICAgYSA9IG1kNWhoKGEsIGIsIGMsIGQsIHhbaSArIDEzXSwgNCwgNjgxMjc5MTc0KTtcbiAgICAgICAgZCA9IG1kNWhoKGQsIGEsIGIsIGMsIHhbaV0sIDExLCAtMzU4NTM3MjIyKTtcbiAgICAgICAgYyA9IG1kNWhoKGMsIGQsIGEsIGIsIHhbaSArIDNdLCAxNiwgLTcyMjUyMTk3OSk7XG4gICAgICAgIGIgPSBtZDVoaChiLCBjLCBkLCBhLCB4W2kgKyA2XSwgMjMsIDc2MDI5MTg5KTtcbiAgICAgICAgYSA9IG1kNWhoKGEsIGIsIGMsIGQsIHhbaSArIDldLCA0LCAtNjQwMzY0NDg3KTtcbiAgICAgICAgZCA9IG1kNWhoKGQsIGEsIGIsIGMsIHhbaSArIDEyXSwgMTEsIC00MjE4MTU4MzUpO1xuICAgICAgICBjID0gbWQ1aGgoYywgZCwgYSwgYiwgeFtpICsgMTVdLCAxNiwgNTMwNzQyNTIwKTtcbiAgICAgICAgYiA9IG1kNWhoKGIsIGMsIGQsIGEsIHhbaSArIDJdLCAyMywgLTk5NTMzODY1MSk7XG4gICAgICAgIGEgPSBtZDVpaShhLCBiLCBjLCBkLCB4W2ldLCA2LCAtMTk4NjMwODQ0KTtcbiAgICAgICAgZCA9IG1kNWlpKGQsIGEsIGIsIGMsIHhbaSArIDddLCAxMCwgMTEyNjg5MTQxNSk7XG4gICAgICAgIGMgPSBtZDVpaShjLCBkLCBhLCBiLCB4W2kgKyAxNF0sIDE1LCAtMTQxNjM1NDkwNSk7XG4gICAgICAgIGIgPSBtZDVpaShiLCBjLCBkLCBhLCB4W2kgKyA1XSwgMjEsIC01NzQzNDA1NSk7XG4gICAgICAgIGEgPSBtZDVpaShhLCBiLCBjLCBkLCB4W2kgKyAxMl0sIDYsIDE3MDA0ODU1NzEpO1xuICAgICAgICBkID0gbWQ1aWkoZCwgYSwgYiwgYywgeFtpICsgM10sIDEwLCAtMTg5NDk4NjYwNik7XG4gICAgICAgIGMgPSBtZDVpaShjLCBkLCBhLCBiLCB4W2kgKyAxMF0sIDE1LCAtMTA1MTUyMyk7XG4gICAgICAgIGIgPSBtZDVpaShiLCBjLCBkLCBhLCB4W2kgKyAxXSwgMjEsIC0yMDU0OTIyNzk5KTtcbiAgICAgICAgYSA9IG1kNWlpKGEsIGIsIGMsIGQsIHhbaSArIDhdLCA2LCAxODczMzEzMzU5KTtcbiAgICAgICAgZCA9IG1kNWlpKGQsIGEsIGIsIGMsIHhbaSArIDE1XSwgMTAsIC0zMDYxMTc0NCk7XG4gICAgICAgIGMgPSBtZDVpaShjLCBkLCBhLCBiLCB4W2kgKyA2XSwgMTUsIC0xNTYwMTk4MzgwKTtcbiAgICAgICAgYiA9IG1kNWlpKGIsIGMsIGQsIGEsIHhbaSArIDEzXSwgMjEsIDEzMDkxNTE2NDkpO1xuICAgICAgICBhID0gbWQ1aWkoYSwgYiwgYywgZCwgeFtpICsgNF0sIDYsIC0xNDU1MjMwNzApO1xuICAgICAgICBkID0gbWQ1aWkoZCwgYSwgYiwgYywgeFtpICsgMTFdLCAxMCwgLTExMjAyMTAzNzkpO1xuICAgICAgICBjID0gbWQ1aWkoYywgZCwgYSwgYiwgeFtpICsgMl0sIDE1LCA3MTg3ODcyNTkpO1xuICAgICAgICBiID0gbWQ1aWkoYiwgYywgZCwgYSwgeFtpICsgOV0sIDIxLCAtMzQzNDg1NTUxKTtcbiAgICAgICAgYSA9IHNhZmVBZGQoYSwgb2xkYSk7XG4gICAgICAgIGIgPSBzYWZlQWRkKGIsIG9sZGIpO1xuICAgICAgICBjID0gc2FmZUFkZChjLCBvbGRjKTtcbiAgICAgICAgZCA9IHNhZmVBZGQoZCwgb2xkZCk7XG4gICAgfVxuICAgIHJldHVybiBVaW50MzJBcnJheS5vZihhLCBiLCBjLCBkKTtcbn1cbmZ1bmN0aW9uIHVpbnQ4VG9VaW50MzIoaW5wdXQpIHtcbiAgICBpZiAoaW5wdXQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDMyQXJyYXkoKTtcbiAgICB9XG4gICAgY29uc3Qgb3V0cHV0ID0gbmV3IFVpbnQzMkFycmF5KGdldE91dHB1dExlbmd0aChpbnB1dC5sZW5ndGggKiA4KSkuZmlsbCgwKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG91dHB1dFtpID4+IDJdIHw9IChpbnB1dFtpXSAmIDB4ZmYpIDw8ICgoaSAlIDQpICogOCk7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG59XG5mdW5jdGlvbiBzYWZlQWRkKHgsIHkpIHtcbiAgICBjb25zdCBsc3cgPSAoeCAmIDB4ZmZmZikgKyAoeSAmIDB4ZmZmZik7XG4gICAgY29uc3QgbXN3ID0gKHggPj4gMTYpICsgKHkgPj4gMTYpICsgKGxzdyA+PiAxNik7XG4gICAgcmV0dXJuIChtc3cgPDwgMTYpIHwgKGxzdyAmIDB4ZmZmZik7XG59XG5mdW5jdGlvbiBiaXRSb3RhdGVMZWZ0KG51bSwgY250KSB7XG4gICAgcmV0dXJuIChudW0gPDwgY250KSB8IChudW0gPj4+ICgzMiAtIGNudCkpO1xufVxuZnVuY3Rpb24gbWQ1Y21uKHEsIGEsIGIsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gc2FmZUFkZChiaXRSb3RhdGVMZWZ0KHNhZmVBZGQoc2FmZUFkZChhLCBxKSwgc2FmZUFkZCh4LCB0KSksIHMpLCBiKTtcbn1cbmZ1bmN0aW9uIG1kNWZmKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1Y21uKChiICYgYykgfCAofmIgJiBkKSwgYSwgYiwgeCwgcywgdCk7XG59XG5mdW5jdGlvbiBtZDVnZyhhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIG1kNWNtbigoYiAmIGQpIHwgKGMgJiB+ZCksIGEsIGIsIHgsIHMsIHQpO1xufVxuZnVuY3Rpb24gbWQ1aGgoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgIHJldHVybiBtZDVjbW4oYiBeIGMgXiBkLCBhLCBiLCB4LCBzLCB0KTtcbn1cbmZ1bmN0aW9uIG1kNWlpKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1Y21uKGMgXiAoYiB8IH5kKSwgYSwgYiwgeCwgcywgdCk7XG59XG5leHBvcnRzLmRlZmF1bHQgPSBtZDU7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHJhbmRvbVVVSUQgPSB0eXBlb2YgY3J5cHRvICE9PSAndW5kZWZpbmVkJyAmJiBjcnlwdG8ucmFuZG9tVVVJRCAmJiBjcnlwdG8ucmFuZG9tVVVJRC5iaW5kKGNyeXB0byk7XG5leHBvcnRzLmRlZmF1bHQgPSB7IHJhbmRvbVVVSUQgfTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gJzAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCc7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHZhbGlkYXRlX2pzXzEgPSByZXF1aXJlKFwiLi92YWxpZGF0ZS5qc1wiKTtcbmZ1bmN0aW9uIHBhcnNlKHV1aWQpIHtcbiAgICBpZiAoISgwLCB2YWxpZGF0ZV9qc18xLmRlZmF1bHQpKHV1aWQpKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignSW52YWxpZCBVVUlEJyk7XG4gICAgfVxuICAgIGxldCB2O1xuICAgIHJldHVybiBVaW50OEFycmF5Lm9mKCh2ID0gcGFyc2VJbnQodXVpZC5zbGljZSgwLCA4KSwgMTYpKSA+Pj4gMjQsICh2ID4+PiAxNikgJiAweGZmLCAodiA+Pj4gOCkgJiAweGZmLCB2ICYgMHhmZiwgKHYgPSBwYXJzZUludCh1dWlkLnNsaWNlKDksIDEzKSwgMTYpKSA+Pj4gOCwgdiAmIDB4ZmYsICh2ID0gcGFyc2VJbnQodXVpZC5zbGljZSgxNCwgMTgpLCAxNikpID4+PiA4LCB2ICYgMHhmZiwgKHYgPSBwYXJzZUludCh1dWlkLnNsaWNlKDE5LCAyMyksIDE2KSkgPj4+IDgsIHYgJiAweGZmLCAoKHYgPSBwYXJzZUludCh1dWlkLnNsaWNlKDI0LCAzNiksIDE2KSkgLyAweDEwMDAwMDAwMDAwKSAmIDB4ZmYsICh2IC8gMHgxMDAwMDAwMDApICYgMHhmZiwgKHYgPj4+IDI0KSAmIDB4ZmYsICh2ID4+PiAxNikgJiAweGZmLCAodiA+Pj4gOCkgJiAweGZmLCB2ICYgMHhmZik7XG59XG5leHBvcnRzLmRlZmF1bHQgPSBwYXJzZTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gL14oPzpbMC05YS1mXXs4fS1bMC05YS1mXXs0fS1bMS04XVswLTlhLWZdezN9LVs4OWFiXVswLTlhLWZdezN9LVswLTlhLWZdezEyfXwwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDB8ZmZmZmZmZmYtZmZmZi1mZmZmLWZmZmYtZmZmZmZmZmZmZmZmKSQvaTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xubGV0IGdldFJhbmRvbVZhbHVlcztcbmNvbnN0IHJuZHM4ID0gbmV3IFVpbnQ4QXJyYXkoMTYpO1xuZnVuY3Rpb24gcm5nKCkge1xuICAgIGlmICghZ2V0UmFuZG9tVmFsdWVzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY3J5cHRvID09PSAndW5kZWZpbmVkJyB8fCAhY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKCkgbm90IHN1cHBvcnRlZC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS91dWlkanMvdXVpZCNnZXRyYW5kb212YWx1ZXMtbm90LXN1cHBvcnRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIGdldFJhbmRvbVZhbHVlcyA9IGNyeXB0by5nZXRSYW5kb21WYWx1ZXMuYmluZChjcnlwdG8pO1xuICAgIH1cbiAgICByZXR1cm4gZ2V0UmFuZG9tVmFsdWVzKHJuZHM4KTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IHJuZztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZihzLCB4LCB5LCB6KSB7XG4gICAgc3dpdGNoIChzKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIHJldHVybiAoeCAmIHkpIF4gKH54ICYgeik7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHJldHVybiB4IF4geSBeIHo7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiAoeCAmIHkpIF4gKHggJiB6KSBeICh5ICYgeik7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiB4IF4geSBeIHo7XG4gICAgfVxufVxuZnVuY3Rpb24gUk9UTCh4LCBuKSB7XG4gICAgcmV0dXJuICh4IDw8IG4pIHwgKHggPj4+ICgzMiAtIG4pKTtcbn1cbmZ1bmN0aW9uIHNoYTEoYnl0ZXMpIHtcbiAgICBjb25zdCBLID0gWzB4NWE4Mjc5OTksIDB4NmVkOWViYTEsIDB4OGYxYmJjZGMsIDB4Y2E2MmMxZDZdO1xuICAgIGNvbnN0IEggPSBbMHg2NzQ1MjMwMSwgMHhlZmNkYWI4OSwgMHg5OGJhZGNmZSwgMHgxMDMyNTQ3NiwgMHhjM2QyZTFmMF07XG4gICAgY29uc3QgbmV3Qnl0ZXMgPSBuZXcgVWludDhBcnJheShieXRlcy5sZW5ndGggKyAxKTtcbiAgICBuZXdCeXRlcy5zZXQoYnl0ZXMpO1xuICAgIG5ld0J5dGVzW2J5dGVzLmxlbmd0aF0gPSAweDgwO1xuICAgIGJ5dGVzID0gbmV3Qnl0ZXM7XG4gICAgY29uc3QgbCA9IGJ5dGVzLmxlbmd0aCAvIDQgKyAyO1xuICAgIGNvbnN0IE4gPSBNYXRoLmNlaWwobCAvIDE2KTtcbiAgICBjb25zdCBNID0gbmV3IEFycmF5KE4pO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTjsgKytpKSB7XG4gICAgICAgIGNvbnN0IGFyciA9IG5ldyBVaW50MzJBcnJheSgxNik7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTY7ICsraikge1xuICAgICAgICAgICAgYXJyW2pdID1cbiAgICAgICAgICAgICAgICAoYnl0ZXNbaSAqIDY0ICsgaiAqIDRdIDw8IDI0KSB8XG4gICAgICAgICAgICAgICAgICAgIChieXRlc1tpICogNjQgKyBqICogNCArIDFdIDw8IDE2KSB8XG4gICAgICAgICAgICAgICAgICAgIChieXRlc1tpICogNjQgKyBqICogNCArIDJdIDw8IDgpIHxcbiAgICAgICAgICAgICAgICAgICAgYnl0ZXNbaSAqIDY0ICsgaiAqIDQgKyAzXTtcbiAgICAgICAgfVxuICAgICAgICBNW2ldID0gYXJyO1xuICAgIH1cbiAgICBNW04gLSAxXVsxNF0gPSAoKGJ5dGVzLmxlbmd0aCAtIDEpICogOCkgLyBNYXRoLnBvdygyLCAzMik7XG4gICAgTVtOIC0gMV1bMTRdID0gTWF0aC5mbG9vcihNW04gLSAxXVsxNF0pO1xuICAgIE1bTiAtIDFdWzE1XSA9ICgoYnl0ZXMubGVuZ3RoIC0gMSkgKiA4KSAmIDB4ZmZmZmZmZmY7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBOOyArK2kpIHtcbiAgICAgICAgY29uc3QgVyA9IG5ldyBVaW50MzJBcnJheSg4MCk7XG4gICAgICAgIGZvciAobGV0IHQgPSAwOyB0IDwgMTY7ICsrdCkge1xuICAgICAgICAgICAgV1t0XSA9IE1baV1bdF07XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgdCA9IDE2OyB0IDwgODA7ICsrdCkge1xuICAgICAgICAgICAgV1t0XSA9IFJPVEwoV1t0IC0gM10gXiBXW3QgLSA4XSBeIFdbdCAtIDE0XSBeIFdbdCAtIDE2XSwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGEgPSBIWzBdO1xuICAgICAgICBsZXQgYiA9IEhbMV07XG4gICAgICAgIGxldCBjID0gSFsyXTtcbiAgICAgICAgbGV0IGQgPSBIWzNdO1xuICAgICAgICBsZXQgZSA9IEhbNF07XG4gICAgICAgIGZvciAobGV0IHQgPSAwOyB0IDwgODA7ICsrdCkge1xuICAgICAgICAgICAgY29uc3QgcyA9IE1hdGguZmxvb3IodCAvIDIwKTtcbiAgICAgICAgICAgIGNvbnN0IFQgPSAoUk9UTChhLCA1KSArIGYocywgYiwgYywgZCkgKyBlICsgS1tzXSArIFdbdF0pID4+PiAwO1xuICAgICAgICAgICAgZSA9IGQ7XG4gICAgICAgICAgICBkID0gYztcbiAgICAgICAgICAgIGMgPSBST1RMKGIsIDMwKSA+Pj4gMDtcbiAgICAgICAgICAgIGIgPSBhO1xuICAgICAgICAgICAgYSA9IFQ7XG4gICAgICAgIH1cbiAgICAgICAgSFswXSA9IChIWzBdICsgYSkgPj4+IDA7XG4gICAgICAgIEhbMV0gPSAoSFsxXSArIGIpID4+PiAwO1xuICAgICAgICBIWzJdID0gKEhbMl0gKyBjKSA+Pj4gMDtcbiAgICAgICAgSFszXSA9IChIWzNdICsgZCkgPj4+IDA7XG4gICAgICAgIEhbNF0gPSAoSFs0XSArIGUpID4+PiAwO1xuICAgIH1cbiAgICByZXR1cm4gVWludDhBcnJheS5vZihIWzBdID4+IDI0LCBIWzBdID4+IDE2LCBIWzBdID4+IDgsIEhbMF0sIEhbMV0gPj4gMjQsIEhbMV0gPj4gMTYsIEhbMV0gPj4gOCwgSFsxXSwgSFsyXSA+PiAyNCwgSFsyXSA+PiAxNiwgSFsyXSA+PiA4LCBIWzJdLCBIWzNdID4+IDI0LCBIWzNdID4+IDE2LCBIWzNdID4+IDgsIEhbM10sIEhbNF0gPj4gMjQsIEhbNF0gPj4gMTYsIEhbNF0gPj4gOCwgSFs0XSk7XG59XG5leHBvcnRzLmRlZmF1bHQgPSBzaGExO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLnVuc2FmZVN0cmluZ2lmeSA9IHZvaWQgMDtcbmNvbnN0IHZhbGlkYXRlX2pzXzEgPSByZXF1aXJlKFwiLi92YWxpZGF0ZS5qc1wiKTtcbmNvbnN0IGJ5dGVUb0hleCA9IFtdO1xuZm9yIChsZXQgaSA9IDA7IGkgPCAyNTY7ICsraSkge1xuICAgIGJ5dGVUb0hleC5wdXNoKChpICsgMHgxMDApLnRvU3RyaW5nKDE2KS5zbGljZSgxKSk7XG59XG5mdW5jdGlvbiB1bnNhZmVTdHJpbmdpZnkoYXJyLCBvZmZzZXQgPSAwKSB7XG4gICAgcmV0dXJuIChieXRlVG9IZXhbYXJyW29mZnNldCArIDBdXSArXG4gICAgICAgIGJ5dGVUb0hleFthcnJbb2Zmc2V0ICsgMV1dICtcbiAgICAgICAgYnl0ZVRvSGV4W2FycltvZmZzZXQgKyAyXV0gK1xuICAgICAgICBieXRlVG9IZXhbYXJyW29mZnNldCArIDNdXSArXG4gICAgICAgICctJyArXG4gICAgICAgIGJ5dGVUb0hleFthcnJbb2Zmc2V0ICsgNF1dICtcbiAgICAgICAgYnl0ZVRvSGV4W2FycltvZmZzZXQgKyA1XV0gK1xuICAgICAgICAnLScgK1xuICAgICAgICBieXRlVG9IZXhbYXJyW29mZnNldCArIDZdXSArXG4gICAgICAgIGJ5dGVUb0hleFthcnJbb2Zmc2V0ICsgN11dICtcbiAgICAgICAgJy0nICtcbiAgICAgICAgYnl0ZVRvSGV4W2FycltvZmZzZXQgKyA4XV0gK1xuICAgICAgICBieXRlVG9IZXhbYXJyW29mZnNldCArIDldXSArXG4gICAgICAgICctJyArXG4gICAgICAgIGJ5dGVUb0hleFthcnJbb2Zmc2V0ICsgMTBdXSArXG4gICAgICAgIGJ5dGVUb0hleFthcnJbb2Zmc2V0ICsgMTFdXSArXG4gICAgICAgIGJ5dGVUb0hleFthcnJbb2Zmc2V0ICsgMTJdXSArXG4gICAgICAgIGJ5dGVUb0hleFthcnJbb2Zmc2V0ICsgMTNdXSArXG4gICAgICAgIGJ5dGVUb0hleFthcnJbb2Zmc2V0ICsgMTRdXSArXG4gICAgICAgIGJ5dGVUb0hleFthcnJbb2Zmc2V0ICsgMTVdXSkudG9Mb3dlckNhc2UoKTtcbn1cbmV4cG9ydHMudW5zYWZlU3RyaW5naWZ5ID0gdW5zYWZlU3RyaW5naWZ5O1xuZnVuY3Rpb24gc3RyaW5naWZ5KGFyciwgb2Zmc2V0ID0gMCkge1xuICAgIGNvbnN0IHV1aWQgPSB1bnNhZmVTdHJpbmdpZnkoYXJyLCBvZmZzZXQpO1xuICAgIGlmICghKDAsIHZhbGlkYXRlX2pzXzEuZGVmYXVsdCkodXVpZCkpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdTdHJpbmdpZmllZCBVVUlEIGlzIGludmFsaWQnKTtcbiAgICB9XG4gICAgcmV0dXJuIHV1aWQ7XG59XG5leHBvcnRzLmRlZmF1bHQgPSBzdHJpbmdpZnk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMudXBkYXRlVjFTdGF0ZSA9IHZvaWQgMDtcbmNvbnN0IHJuZ19qc18xID0gcmVxdWlyZShcIi4vcm5nLmpzXCIpO1xuY29uc3Qgc3RyaW5naWZ5X2pzXzEgPSByZXF1aXJlKFwiLi9zdHJpbmdpZnkuanNcIik7XG5jb25zdCBfc3RhdGUgPSB7fTtcbmZ1bmN0aW9uIHYxKG9wdGlvbnMsIGJ1Ziwgb2Zmc2V0KSB7XG4gICAgbGV0IGJ5dGVzO1xuICAgIGNvbnN0IGlzVjYgPSBvcHRpb25zPy5fdjYgPz8gZmFsc2U7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uc0tleXMgPSBPYmplY3Qua2V5cyhvcHRpb25zKTtcbiAgICAgICAgaWYgKG9wdGlvbnNLZXlzLmxlbmd0aCA9PT0gMSAmJiBvcHRpb25zS2V5c1swXSA9PT0gJ192NicpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgYnl0ZXMgPSB2MUJ5dGVzKG9wdGlvbnMucmFuZG9tID8/IG9wdGlvbnMucm5nPy4oKSA/PyAoMCwgcm5nX2pzXzEuZGVmYXVsdCkoKSwgb3B0aW9ucy5tc2Vjcywgb3B0aW9ucy5uc2Vjcywgb3B0aW9ucy5jbG9ja3NlcSwgb3B0aW9ucy5ub2RlLCBidWYsIG9mZnNldCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICBjb25zdCBybmRzID0gKDAsIHJuZ19qc18xLmRlZmF1bHQpKCk7XG4gICAgICAgIHVwZGF0ZVYxU3RhdGUoX3N0YXRlLCBub3csIHJuZHMpO1xuICAgICAgICBieXRlcyA9IHYxQnl0ZXMocm5kcywgX3N0YXRlLm1zZWNzLCBfc3RhdGUubnNlY3MsIGlzVjYgPyB1bmRlZmluZWQgOiBfc3RhdGUuY2xvY2tzZXEsIGlzVjYgPyB1bmRlZmluZWQgOiBfc3RhdGUubm9kZSwgYnVmLCBvZmZzZXQpO1xuICAgIH1cbiAgICByZXR1cm4gYnVmID8/ICgwLCBzdHJpbmdpZnlfanNfMS51bnNhZmVTdHJpbmdpZnkpKGJ5dGVzKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZVYxU3RhdGUoc3RhdGUsIG5vdywgcm5kcykge1xuICAgIHN0YXRlLm1zZWNzID8/PSAtSW5maW5pdHk7XG4gICAgc3RhdGUubnNlY3MgPz89IDA7XG4gICAgaWYgKG5vdyA9PT0gc3RhdGUubXNlY3MpIHtcbiAgICAgICAgc3RhdGUubnNlY3MrKztcbiAgICAgICAgaWYgKHN0YXRlLm5zZWNzID49IDEwMDAwKSB7XG4gICAgICAgICAgICBzdGF0ZS5ub2RlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgc3RhdGUubnNlY3MgPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKG5vdyA+IHN0YXRlLm1zZWNzKSB7XG4gICAgICAgIHN0YXRlLm5zZWNzID0gMDtcbiAgICB9XG4gICAgZWxzZSBpZiAobm93IDwgc3RhdGUubXNlY3MpIHtcbiAgICAgICAgc3RhdGUubm9kZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKCFzdGF0ZS5ub2RlKSB7XG4gICAgICAgIHN0YXRlLm5vZGUgPSBybmRzLnNsaWNlKDEwLCAxNik7XG4gICAgICAgIHN0YXRlLm5vZGVbMF0gfD0gMHgwMTtcbiAgICAgICAgc3RhdGUuY2xvY2tzZXEgPSAoKHJuZHNbOF0gPDwgOCkgfCBybmRzWzldKSAmIDB4M2ZmZjtcbiAgICB9XG4gICAgc3RhdGUubXNlY3MgPSBub3c7XG4gICAgcmV0dXJuIHN0YXRlO1xufVxuZXhwb3J0cy51cGRhdGVWMVN0YXRlID0gdXBkYXRlVjFTdGF0ZTtcbmZ1bmN0aW9uIHYxQnl0ZXMocm5kcywgbXNlY3MsIG5zZWNzLCBjbG9ja3NlcSwgbm9kZSwgYnVmLCBvZmZzZXQgPSAwKSB7XG4gICAgaWYgKHJuZHMubGVuZ3RoIDwgMTYpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSYW5kb20gYnl0ZXMgbGVuZ3RoIG11c3QgYmUgPj0gMTYnKTtcbiAgICB9XG4gICAgaWYgKCFidWYpIHtcbiAgICAgICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoMTYpO1xuICAgICAgICBvZmZzZXQgPSAwO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKG9mZnNldCA8IDAgfHwgb2Zmc2V0ICsgMTYgPiBidWYubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgVVVJRCBieXRlIHJhbmdlICR7b2Zmc2V0fToke29mZnNldCArIDE1fSBpcyBvdXQgb2YgYnVmZmVyIGJvdW5kc2ApO1xuICAgICAgICB9XG4gICAgfVxuICAgIG1zZWNzID8/PSBEYXRlLm5vdygpO1xuICAgIG5zZWNzID8/PSAwO1xuICAgIGNsb2Nrc2VxID8/PSAoKHJuZHNbOF0gPDwgOCkgfCBybmRzWzldKSAmIDB4M2ZmZjtcbiAgICBub2RlID8/PSBybmRzLnNsaWNlKDEwLCAxNik7XG4gICAgbXNlY3MgKz0gMTIyMTkyOTI4MDAwMDA7XG4gICAgY29uc3QgdGwgPSAoKG1zZWNzICYgMHhmZmZmZmZmKSAqIDEwMDAwICsgbnNlY3MpICUgMHgxMDAwMDAwMDA7XG4gICAgYnVmW29mZnNldCsrXSA9ICh0bCA+Pj4gMjQpICYgMHhmZjtcbiAgICBidWZbb2Zmc2V0KytdID0gKHRsID4+PiAxNikgJiAweGZmO1xuICAgIGJ1ZltvZmZzZXQrK10gPSAodGwgPj4+IDgpICYgMHhmZjtcbiAgICBidWZbb2Zmc2V0KytdID0gdGwgJiAweGZmO1xuICAgIGNvbnN0IHRtaCA9ICgobXNlY3MgLyAweDEwMDAwMDAwMCkgKiAxMDAwMCkgJiAweGZmZmZmZmY7XG4gICAgYnVmW29mZnNldCsrXSA9ICh0bWggPj4+IDgpICYgMHhmZjtcbiAgICBidWZbb2Zmc2V0KytdID0gdG1oICYgMHhmZjtcbiAgICBidWZbb2Zmc2V0KytdID0gKCh0bWggPj4+IDI0KSAmIDB4ZikgfCAweDEwO1xuICAgIGJ1ZltvZmZzZXQrK10gPSAodG1oID4+PiAxNikgJiAweGZmO1xuICAgIGJ1ZltvZmZzZXQrK10gPSAoY2xvY2tzZXEgPj4+IDgpIHwgMHg4MDtcbiAgICBidWZbb2Zmc2V0KytdID0gY2xvY2tzZXEgJiAweGZmO1xuICAgIGZvciAobGV0IG4gPSAwOyBuIDwgNjsgKytuKSB7XG4gICAgICAgIGJ1ZltvZmZzZXQrK10gPSBub2RlW25dO1xuICAgIH1cbiAgICByZXR1cm4gYnVmO1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gdjE7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHBhcnNlX2pzXzEgPSByZXF1aXJlKFwiLi9wYXJzZS5qc1wiKTtcbmNvbnN0IHN0cmluZ2lmeV9qc18xID0gcmVxdWlyZShcIi4vc3RyaW5naWZ5LmpzXCIpO1xuZnVuY3Rpb24gdjFUb1Y2KHV1aWQpIHtcbiAgICBjb25zdCB2MUJ5dGVzID0gdHlwZW9mIHV1aWQgPT09ICdzdHJpbmcnID8gKDAsIHBhcnNlX2pzXzEuZGVmYXVsdCkodXVpZCkgOiB1dWlkO1xuICAgIGNvbnN0IHY2Qnl0ZXMgPSBfdjFUb1Y2KHYxQnl0ZXMpO1xuICAgIHJldHVybiB0eXBlb2YgdXVpZCA9PT0gJ3N0cmluZycgPyAoMCwgc3RyaW5naWZ5X2pzXzEudW5zYWZlU3RyaW5naWZ5KSh2NkJ5dGVzKSA6IHY2Qnl0ZXM7XG59XG5leHBvcnRzLmRlZmF1bHQgPSB2MVRvVjY7XG5mdW5jdGlvbiBfdjFUb1Y2KHYxQnl0ZXMpIHtcbiAgICByZXR1cm4gVWludDhBcnJheS5vZigoKHYxQnl0ZXNbNl0gJiAweDBmKSA8PCA0KSB8ICgodjFCeXRlc1s3XSA+PiA0KSAmIDB4MGYpLCAoKHYxQnl0ZXNbN10gJiAweDBmKSA8PCA0KSB8ICgodjFCeXRlc1s0XSAmIDB4ZjApID4+IDQpLCAoKHYxQnl0ZXNbNF0gJiAweDBmKSA8PCA0KSB8ICgodjFCeXRlc1s1XSAmIDB4ZjApID4+IDQpLCAoKHYxQnl0ZXNbNV0gJiAweDBmKSA8PCA0KSB8ICgodjFCeXRlc1swXSAmIDB4ZjApID4+IDQpLCAoKHYxQnl0ZXNbMF0gJiAweDBmKSA8PCA0KSB8ICgodjFCeXRlc1sxXSAmIDB4ZjApID4+IDQpLCAoKHYxQnl0ZXNbMV0gJiAweDBmKSA8PCA0KSB8ICgodjFCeXRlc1syXSAmIDB4ZjApID4+IDQpLCAweDYwIHwgKHYxQnl0ZXNbMl0gJiAweDBmKSwgdjFCeXRlc1szXSwgdjFCeXRlc1s4XSwgdjFCeXRlc1s5XSwgdjFCeXRlc1sxMF0sIHYxQnl0ZXNbMTFdLCB2MUJ5dGVzWzEyXSwgdjFCeXRlc1sxM10sIHYxQnl0ZXNbMTRdLCB2MUJ5dGVzWzE1XSk7XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuVVJMID0gZXhwb3J0cy5ETlMgPSB2b2lkIDA7XG5jb25zdCBtZDVfanNfMSA9IHJlcXVpcmUoXCIuL21kNS5qc1wiKTtcbmNvbnN0IHYzNV9qc18xID0gcmVxdWlyZShcIi4vdjM1LmpzXCIpO1xudmFyIHYzNV9qc18yID0gcmVxdWlyZShcIi4vdjM1LmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiRE5TXCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB2MzVfanNfMi5ETlM7IH0gfSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJVUkxcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHYzNV9qc18yLlVSTDsgfSB9KTtcbmZ1bmN0aW9uIHYzKHZhbHVlLCBuYW1lc3BhY2UsIGJ1Ziwgb2Zmc2V0KSB7XG4gICAgcmV0dXJuICgwLCB2MzVfanNfMS5kZWZhdWx0KSgweDMwLCBtZDVfanNfMS5kZWZhdWx0LCB2YWx1ZSwgbmFtZXNwYWNlLCBidWYsIG9mZnNldCk7XG59XG52My5ETlMgPSB2MzVfanNfMS5ETlM7XG52My5VUkwgPSB2MzVfanNfMS5VUkw7XG5leHBvcnRzLmRlZmF1bHQgPSB2MztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5VUkwgPSBleHBvcnRzLkROUyA9IGV4cG9ydHMuc3RyaW5nVG9CeXRlcyA9IHZvaWQgMDtcbmNvbnN0IHBhcnNlX2pzXzEgPSByZXF1aXJlKFwiLi9wYXJzZS5qc1wiKTtcbmNvbnN0IHN0cmluZ2lmeV9qc18xID0gcmVxdWlyZShcIi4vc3RyaW5naWZ5LmpzXCIpO1xuZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyhzdHIpIHtcbiAgICBzdHIgPSB1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoc3RyKSk7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShzdHIubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgICAgICBieXRlc1tpXSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIH1cbiAgICByZXR1cm4gYnl0ZXM7XG59XG5leHBvcnRzLnN0cmluZ1RvQnl0ZXMgPSBzdHJpbmdUb0J5dGVzO1xuZXhwb3J0cy5ETlMgPSAnNmJhN2I4MTAtOWRhZC0xMWQxLTgwYjQtMDBjMDRmZDQzMGM4JztcbmV4cG9ydHMuVVJMID0gJzZiYTdiODExLTlkYWQtMTFkMS04MGI0LTAwYzA0ZmQ0MzBjOCc7XG5mdW5jdGlvbiB2MzUodmVyc2lvbiwgaGFzaCwgdmFsdWUsIG5hbWVzcGFjZSwgYnVmLCBvZmZzZXQpIHtcbiAgICBjb25zdCB2YWx1ZUJ5dGVzID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHN0cmluZ1RvQnl0ZXModmFsdWUpIDogdmFsdWU7XG4gICAgY29uc3QgbmFtZXNwYWNlQnl0ZXMgPSB0eXBlb2YgbmFtZXNwYWNlID09PSAnc3RyaW5nJyA/ICgwLCBwYXJzZV9qc18xLmRlZmF1bHQpKG5hbWVzcGFjZSkgOiBuYW1lc3BhY2U7XG4gICAgaWYgKHR5cGVvZiBuYW1lc3BhY2UgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIG5hbWVzcGFjZSA9ICgwLCBwYXJzZV9qc18xLmRlZmF1bHQpKG5hbWVzcGFjZSk7XG4gICAgfVxuICAgIGlmIChuYW1lc3BhY2U/Lmxlbmd0aCAhPT0gMTYpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdOYW1lc3BhY2UgbXVzdCBiZSBhcnJheS1saWtlICgxNiBpdGVyYWJsZSBpbnRlZ2VyIHZhbHVlcywgMC0yNTUpJyk7XG4gICAgfVxuICAgIGxldCBieXRlcyA9IG5ldyBVaW50OEFycmF5KDE2ICsgdmFsdWVCeXRlcy5sZW5ndGgpO1xuICAgIGJ5dGVzLnNldChuYW1lc3BhY2VCeXRlcyk7XG4gICAgYnl0ZXMuc2V0KHZhbHVlQnl0ZXMsIG5hbWVzcGFjZUJ5dGVzLmxlbmd0aCk7XG4gICAgYnl0ZXMgPSBoYXNoKGJ5dGVzKTtcbiAgICBieXRlc1s2XSA9IChieXRlc1s2XSAmIDB4MGYpIHwgdmVyc2lvbjtcbiAgICBieXRlc1s4XSA9IChieXRlc1s4XSAmIDB4M2YpIHwgMHg4MDtcbiAgICBpZiAoYnVmKSB7XG4gICAgICAgIG9mZnNldCA9IG9mZnNldCB8fCAwO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyArK2kpIHtcbiAgICAgICAgICAgIGJ1ZltvZmZzZXQgKyBpXSA9IGJ5dGVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBidWY7XG4gICAgfVxuICAgIHJldHVybiAoMCwgc3RyaW5naWZ5X2pzXzEudW5zYWZlU3RyaW5naWZ5KShieXRlcyk7XG59XG5leHBvcnRzLmRlZmF1bHQgPSB2MzU7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IG5hdGl2ZV9qc18xID0gcmVxdWlyZShcIi4vbmF0aXZlLmpzXCIpO1xuY29uc3Qgcm5nX2pzXzEgPSByZXF1aXJlKFwiLi9ybmcuanNcIik7XG5jb25zdCBzdHJpbmdpZnlfanNfMSA9IHJlcXVpcmUoXCIuL3N0cmluZ2lmeS5qc1wiKTtcbmZ1bmN0aW9uIHY0KG9wdGlvbnMsIGJ1Ziwgb2Zmc2V0KSB7XG4gICAgaWYgKG5hdGl2ZV9qc18xLmRlZmF1bHQucmFuZG9tVVVJRCAmJiAhYnVmICYmICFvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBuYXRpdmVfanNfMS5kZWZhdWx0LnJhbmRvbVVVSUQoKTtcbiAgICB9XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgY29uc3Qgcm5kcyA9IG9wdGlvbnMucmFuZG9tID8/IG9wdGlvbnMucm5nPy4oKSA/PyAoMCwgcm5nX2pzXzEuZGVmYXVsdCkoKTtcbiAgICBpZiAocm5kcy5sZW5ndGggPCAxNikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JhbmRvbSBieXRlcyBsZW5ndGggbXVzdCBiZSA+PSAxNicpO1xuICAgIH1cbiAgICBybmRzWzZdID0gKHJuZHNbNl0gJiAweDBmKSB8IDB4NDA7XG4gICAgcm5kc1s4XSA9IChybmRzWzhdICYgMHgzZikgfCAweDgwO1xuICAgIGlmIChidWYpIHtcbiAgICAgICAgb2Zmc2V0ID0gb2Zmc2V0IHx8IDA7XG4gICAgICAgIGlmIChvZmZzZXQgPCAwIHx8IG9mZnNldCArIDE2ID4gYnVmLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYFVVSUQgYnl0ZSByYW5nZSAke29mZnNldH06JHtvZmZzZXQgKyAxNX0gaXMgb3V0IG9mIGJ1ZmZlciBib3VuZHNgKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyArK2kpIHtcbiAgICAgICAgICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHJuZHNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJ1ZjtcbiAgICB9XG4gICAgcmV0dXJuICgwLCBzdHJpbmdpZnlfanNfMS51bnNhZmVTdHJpbmdpZnkpKHJuZHMpO1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gdjQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuVVJMID0gZXhwb3J0cy5ETlMgPSB2b2lkIDA7XG5jb25zdCBzaGExX2pzXzEgPSByZXF1aXJlKFwiLi9zaGExLmpzXCIpO1xuY29uc3QgdjM1X2pzXzEgPSByZXF1aXJlKFwiLi92MzUuanNcIik7XG52YXIgdjM1X2pzXzIgPSByZXF1aXJlKFwiLi92MzUuanNcIik7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJETlNcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHYzNV9qc18yLkROUzsgfSB9KTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIlVSTFwiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdjM1X2pzXzIuVVJMOyB9IH0pO1xuZnVuY3Rpb24gdjUodmFsdWUsIG5hbWVzcGFjZSwgYnVmLCBvZmZzZXQpIHtcbiAgICByZXR1cm4gKDAsIHYzNV9qc18xLmRlZmF1bHQpKDB4NTAsIHNoYTFfanNfMS5kZWZhdWx0LCB2YWx1ZSwgbmFtZXNwYWNlLCBidWYsIG9mZnNldCk7XG59XG52NS5ETlMgPSB2MzVfanNfMS5ETlM7XG52NS5VUkwgPSB2MzVfanNfMS5VUkw7XG5leHBvcnRzLmRlZmF1bHQgPSB2NTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3Qgc3RyaW5naWZ5X2pzXzEgPSByZXF1aXJlKFwiLi9zdHJpbmdpZnkuanNcIik7XG5jb25zdCB2MV9qc18xID0gcmVxdWlyZShcIi4vdjEuanNcIik7XG5jb25zdCB2MVRvVjZfanNfMSA9IHJlcXVpcmUoXCIuL3YxVG9WNi5qc1wiKTtcbmZ1bmN0aW9uIHY2KG9wdGlvbnMsIGJ1Ziwgb2Zmc2V0KSB7XG4gICAgb3B0aW9ucyA/Pz0ge307XG4gICAgb2Zmc2V0ID8/PSAwO1xuICAgIGxldCBieXRlcyA9ICgwLCB2MV9qc18xLmRlZmF1bHQpKHsgLi4ub3B0aW9ucywgX3Y2OiB0cnVlIH0sIG5ldyBVaW50OEFycmF5KDE2KSk7XG4gICAgYnl0ZXMgPSAoMCwgdjFUb1Y2X2pzXzEuZGVmYXVsdCkoYnl0ZXMpO1xuICAgIGlmIChidWYpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgICAgICBidWZbb2Zmc2V0ICsgaV0gPSBieXRlc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYnVmO1xuICAgIH1cbiAgICByZXR1cm4gKDAsIHN0cmluZ2lmeV9qc18xLnVuc2FmZVN0cmluZ2lmeSkoYnl0ZXMpO1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gdjY7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHBhcnNlX2pzXzEgPSByZXF1aXJlKFwiLi9wYXJzZS5qc1wiKTtcbmNvbnN0IHN0cmluZ2lmeV9qc18xID0gcmVxdWlyZShcIi4vc3RyaW5naWZ5LmpzXCIpO1xuZnVuY3Rpb24gdjZUb1YxKHV1aWQpIHtcbiAgICBjb25zdCB2NkJ5dGVzID0gdHlwZW9mIHV1aWQgPT09ICdzdHJpbmcnID8gKDAsIHBhcnNlX2pzXzEuZGVmYXVsdCkodXVpZCkgOiB1dWlkO1xuICAgIGNvbnN0IHYxQnl0ZXMgPSBfdjZUb1YxKHY2Qnl0ZXMpO1xuICAgIHJldHVybiB0eXBlb2YgdXVpZCA9PT0gJ3N0cmluZycgPyAoMCwgc3RyaW5naWZ5X2pzXzEudW5zYWZlU3RyaW5naWZ5KSh2MUJ5dGVzKSA6IHYxQnl0ZXM7XG59XG5leHBvcnRzLmRlZmF1bHQgPSB2NlRvVjE7XG5mdW5jdGlvbiBfdjZUb1YxKHY2Qnl0ZXMpIHtcbiAgICByZXR1cm4gVWludDhBcnJheS5vZigoKHY2Qnl0ZXNbM10gJiAweDBmKSA8PCA0KSB8ICgodjZCeXRlc1s0XSA+PiA0KSAmIDB4MGYpLCAoKHY2Qnl0ZXNbNF0gJiAweDBmKSA8PCA0KSB8ICgodjZCeXRlc1s1XSAmIDB4ZjApID4+IDQpLCAoKHY2Qnl0ZXNbNV0gJiAweDBmKSA8PCA0KSB8ICh2NkJ5dGVzWzZdICYgMHgwZiksIHY2Qnl0ZXNbN10sICgodjZCeXRlc1sxXSAmIDB4MGYpIDw8IDQpIHwgKCh2NkJ5dGVzWzJdICYgMHhmMCkgPj4gNCksICgodjZCeXRlc1syXSAmIDB4MGYpIDw8IDQpIHwgKCh2NkJ5dGVzWzNdICYgMHhmMCkgPj4gNCksIDB4MTAgfCAoKHY2Qnl0ZXNbMF0gJiAweGYwKSA+PiA0KSwgKCh2NkJ5dGVzWzBdICYgMHgwZikgPDwgNCkgfCAoKHY2Qnl0ZXNbMV0gJiAweGYwKSA+PiA0KSwgdjZCeXRlc1s4XSwgdjZCeXRlc1s5XSwgdjZCeXRlc1sxMF0sIHY2Qnl0ZXNbMTFdLCB2NkJ5dGVzWzEyXSwgdjZCeXRlc1sxM10sIHY2Qnl0ZXNbMTRdLCB2NkJ5dGVzWzE1XSk7XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMudXBkYXRlVjdTdGF0ZSA9IHZvaWQgMDtcbmNvbnN0IHJuZ19qc18xID0gcmVxdWlyZShcIi4vcm5nLmpzXCIpO1xuY29uc3Qgc3RyaW5naWZ5X2pzXzEgPSByZXF1aXJlKFwiLi9zdHJpbmdpZnkuanNcIik7XG5jb25zdCBfc3RhdGUgPSB7fTtcbmZ1bmN0aW9uIHY3KG9wdGlvbnMsIGJ1Ziwgb2Zmc2V0KSB7XG4gICAgbGV0IGJ5dGVzO1xuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgIGJ5dGVzID0gdjdCeXRlcyhvcHRpb25zLnJhbmRvbSA/PyBvcHRpb25zLnJuZz8uKCkgPz8gKDAsIHJuZ19qc18xLmRlZmF1bHQpKCksIG9wdGlvbnMubXNlY3MsIG9wdGlvbnMuc2VxLCBidWYsIG9mZnNldCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICBjb25zdCBybmRzID0gKDAsIHJuZ19qc18xLmRlZmF1bHQpKCk7XG4gICAgICAgIHVwZGF0ZVY3U3RhdGUoX3N0YXRlLCBub3csIHJuZHMpO1xuICAgICAgICBieXRlcyA9IHY3Qnl0ZXMocm5kcywgX3N0YXRlLm1zZWNzLCBfc3RhdGUuc2VxLCBidWYsIG9mZnNldCk7XG4gICAgfVxuICAgIHJldHVybiBidWYgPz8gKDAsIHN0cmluZ2lmeV9qc18xLnVuc2FmZVN0cmluZ2lmeSkoYnl0ZXMpO1xufVxuZnVuY3Rpb24gdXBkYXRlVjdTdGF0ZShzdGF0ZSwgbm93LCBybmRzKSB7XG4gICAgc3RhdGUubXNlY3MgPz89IC1JbmZpbml0eTtcbiAgICBzdGF0ZS5zZXEgPz89IDA7XG4gICAgaWYgKG5vdyA+IHN0YXRlLm1zZWNzKSB7XG4gICAgICAgIHN0YXRlLnNlcSA9IChybmRzWzZdIDw8IDIzKSB8IChybmRzWzddIDw8IDE2KSB8IChybmRzWzhdIDw8IDgpIHwgcm5kc1s5XTtcbiAgICAgICAgc3RhdGUubXNlY3MgPSBub3c7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzdGF0ZS5zZXEgPSAoc3RhdGUuc2VxICsgMSkgfCAwO1xuICAgICAgICBpZiAoc3RhdGUuc2VxID09PSAwKSB7XG4gICAgICAgICAgICBzdGF0ZS5tc2VjcysrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdGF0ZTtcbn1cbmV4cG9ydHMudXBkYXRlVjdTdGF0ZSA9IHVwZGF0ZVY3U3RhdGU7XG5mdW5jdGlvbiB2N0J5dGVzKHJuZHMsIG1zZWNzLCBzZXEsIGJ1Ziwgb2Zmc2V0ID0gMCkge1xuICAgIGlmIChybmRzLmxlbmd0aCA8IDE2KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUmFuZG9tIGJ5dGVzIGxlbmd0aCBtdXN0IGJlID49IDE2Jyk7XG4gICAgfVxuICAgIGlmICghYnVmKSB7XG4gICAgICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChvZmZzZXQgPCAwIHx8IG9mZnNldCArIDE2ID4gYnVmLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYFVVSUQgYnl0ZSByYW5nZSAke29mZnNldH06JHtvZmZzZXQgKyAxNX0gaXMgb3V0IG9mIGJ1ZmZlciBib3VuZHNgKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBtc2VjcyA/Pz0gRGF0ZS5ub3coKTtcbiAgICBzZXEgPz89ICgocm5kc1s2XSAqIDB4N2YpIDw8IDI0KSB8IChybmRzWzddIDw8IDE2KSB8IChybmRzWzhdIDw8IDgpIHwgcm5kc1s5XTtcbiAgICBidWZbb2Zmc2V0KytdID0gKG1zZWNzIC8gMHgxMDAwMDAwMDAwMCkgJiAweGZmO1xuICAgIGJ1ZltvZmZzZXQrK10gPSAobXNlY3MgLyAweDEwMDAwMDAwMCkgJiAweGZmO1xuICAgIGJ1ZltvZmZzZXQrK10gPSAobXNlY3MgLyAweDEwMDAwMDApICYgMHhmZjtcbiAgICBidWZbb2Zmc2V0KytdID0gKG1zZWNzIC8gMHgxMDAwMCkgJiAweGZmO1xuICAgIGJ1ZltvZmZzZXQrK10gPSAobXNlY3MgLyAweDEwMCkgJiAweGZmO1xuICAgIGJ1ZltvZmZzZXQrK10gPSBtc2VjcyAmIDB4ZmY7XG4gICAgYnVmW29mZnNldCsrXSA9IDB4NzAgfCAoKHNlcSA+Pj4gMjgpICYgMHgwZik7XG4gICAgYnVmW29mZnNldCsrXSA9IChzZXEgPj4+IDIwKSAmIDB4ZmY7XG4gICAgYnVmW29mZnNldCsrXSA9IDB4ODAgfCAoKHNlcSA+Pj4gMTQpICYgMHgzZik7XG4gICAgYnVmW29mZnNldCsrXSA9IChzZXEgPj4+IDYpICYgMHhmZjtcbiAgICBidWZbb2Zmc2V0KytdID0gKChzZXEgPDwgMikgJiAweGZmKSB8IChybmRzWzEwXSAmIDB4MDMpO1xuICAgIGJ1ZltvZmZzZXQrK10gPSBybmRzWzExXTtcbiAgICBidWZbb2Zmc2V0KytdID0gcm5kc1sxMl07XG4gICAgYnVmW29mZnNldCsrXSA9IHJuZHNbMTNdO1xuICAgIGJ1ZltvZmZzZXQrK10gPSBybmRzWzE0XTtcbiAgICBidWZbb2Zmc2V0KytdID0gcm5kc1sxNV07XG4gICAgcmV0dXJuIGJ1Zjtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IHY3O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCByZWdleF9qc18xID0gcmVxdWlyZShcIi4vcmVnZXguanNcIik7XG5mdW5jdGlvbiB2YWxpZGF0ZSh1dWlkKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB1dWlkID09PSAnc3RyaW5nJyAmJiByZWdleF9qc18xLmRlZmF1bHQudGVzdCh1dWlkKTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IHZhbGlkYXRlO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCB2YWxpZGF0ZV9qc18xID0gcmVxdWlyZShcIi4vdmFsaWRhdGUuanNcIik7XG5mdW5jdGlvbiB2ZXJzaW9uKHV1aWQpIHtcbiAgICBpZiAoISgwLCB2YWxpZGF0ZV9qc18xLmRlZmF1bHQpKHV1aWQpKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignSW52YWxpZCBVVUlEJyk7XG4gICAgfVxuICAgIHJldHVybiBwYXJzZUludCh1dWlkLnNsaWNlKDE0LCAxNSksIDE2KTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IHZlcnNpb247XG4iLCJjb25zdCBEaWN0aW9uYXJ5U2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2VzL2RpY3Rpb25hcnktc2VydmljZScpO1xuY29uc3QgU3RvcmFnZU1hbmFnZXIgPSByZXF1aXJlKCcuLi9zZXJ2aWNlcy9zdG9yYWdlJyk7XG5jb25zdCB7IE1lc3NhZ2VUeXBlcywgaGFuZGxlTWVzc2FnZSB9ID0gcmVxdWlyZSgnLi9tZXNzYWdlLWhhbmRsZXInKTtcbmNvbnN0IGRpY3Rpb25hcnlEYXRhID0gcmVxdWlyZSgnLi4vZGF0YS9kaWN0aW9uYXJ5Lmpzb24nKTtcblxuLy8gSW5pdGlhbGl6ZSBzZXJ2aWNlc1xuY29uc3QgZGljdGlvbmFyeSA9IG5ldyBEaWN0aW9uYXJ5U2VydmljZShkaWN0aW9uYXJ5RGF0YSk7XG5jb25zdCBzdG9yYWdlID0gU3RvcmFnZU1hbmFnZXI7XG5cbi8vIFNlcnZpY2UgaW5zdGFuY2VzIHRvIHBhc3MgdG8gbWVzc2FnZSBoYW5kbGVyXG5jb25zdCBzZXJ2aWNlcyA9IHtcbiAgZGljdGlvbmFyeSxcbiAgc3RvcmFnZVxufTtcblxuLyoqXG4gKiBIYW5kbGUgaW5zdGFsbGF0aW9uIGV2ZW50XG4gKi9cbmJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcihhc3luYyAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdWb2NhYkRpY3QgZXh0ZW5zaW9uIGluc3RhbGxlZCcpO1xuICBcbiAgLy8gSW5pdGlhbGl6ZSBkZWZhdWx0IHZvY2FidWxhcnkgbGlzdCBpZiBub25lIGV4aXN0c1xuICBjb25zdCBsaXN0cyA9IGF3YWl0IHN0b3JhZ2UuZ2V0KCd2b2NhYl9saXN0cycpO1xuICBpZiAoIWxpc3RzIHx8IGxpc3RzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnN0IFZvY2FidWxhcnlMaXN0ID0gcmVxdWlyZSgnLi4vc2VydmljZXMvdm9jYWJ1bGFyeS1saXN0Jyk7XG4gICAgY29uc3QgZGVmYXVsdExpc3QgPSBuZXcgVm9jYWJ1bGFyeUxpc3QoJ015IFZvY2FidWxhcnknLCBkaWN0aW9uYXJ5LCB0cnVlKTtcbiAgICBhd2FpdCBzdG9yYWdlLnNldCgndm9jYWJfbGlzdHMnLCBbZGVmYXVsdExpc3QudG9KU09OKCldKTtcbiAgICBjb25zb2xlLmxvZygnQ3JlYXRlZCBkZWZhdWx0IHZvY2FidWxhcnkgbGlzdCcpO1xuICB9XG4gIFxuICAvLyBDcmVhdGUgY29udGV4dCBtZW51IGZvciBtYWNPU1xuICBpZiAoYnJvd3Nlci5jb250ZXh0TWVudXMpIHtcbiAgICBicm93c2VyLmNvbnRleHRNZW51cy5jcmVhdGUoe1xuICAgICAgaWQ6ICdsb29rdXAtdm9jYWJkaWN0JyxcbiAgICAgIHRpdGxlOiAnTG9vayB1cCBpbiBWb2NhYkRpY3QnLFxuICAgICAgY29udGV4dHM6IFsnc2VsZWN0aW9uJ11cbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygnQ29udGV4dCBtZW51IGNyZWF0ZWQnKTtcbiAgfVxufSk7XG5cbi8qKlxuICogSGFuZGxlIGNvbnRleHQgbWVudSBjbGlja3NcbiAqL1xuaWYgKGJyb3dzZXIuY29udGV4dE1lbnVzICYmIGJyb3dzZXIuY29udGV4dE1lbnVzLm9uQ2xpY2tlZCkge1xuICBicm93c2VyLmNvbnRleHRNZW51cy5vbkNsaWNrZWQuYWRkTGlzdGVuZXIoYXN5bmMgKGluZm8sIHRhYikgPT4ge1xuICAgIGlmIChpbmZvLm1lbnVJdGVtSWQgPT09ICdsb29rdXAtdm9jYWJkaWN0JyAmJiBpbmZvLnNlbGVjdGlvblRleHQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdDb250ZXh0IG1lbnUgY2xpY2tlZDonLCBpbmZvLnNlbGVjdGlvblRleHQpO1xuICAgICAgXG4gICAgICAvLyBMb29rIHVwIHRoZSB3b3JkXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGhhbmRsZU1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBNZXNzYWdlVHlwZXMuTE9PS1VQX1dPUkQsXG4gICAgICAgIHdvcmQ6IGluZm8uc2VsZWN0aW9uVGV4dFxuICAgICAgfSwgc2VydmljZXMpO1xuICAgICAgXG4gICAgICAvLyBTdG9yZSB0aGUgbG9va3VwIHJlc3VsdCBpbiBjYWNoZSBmb3IgcG9wdXAgdG8gZGlzcGxheVxuICAgICAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MgJiYgcmVzcG9uc2UuZGF0YSkge1xuICAgICAgICBhd2FpdCBzdG9yYWdlLnNldCgnbGFzdF9sb29rdXAnLCB7XG4gICAgICAgICAgd29yZDogaW5mby5zZWxlY3Rpb25UZXh0LFxuICAgICAgICAgIHJlc3VsdDogcmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIE9wZW4gdGhlIGV4dGVuc2lvbiBwb3B1cCB0byBzaG93IHRoZSByZXN1bHRcbiAgICAgICAgaWYgKGJyb3dzZXIuYWN0aW9uICYmIGJyb3dzZXIuYWN0aW9uLm9wZW5Qb3B1cCkge1xuICAgICAgICAgIGJyb3dzZXIuYWN0aW9uLm9wZW5Qb3B1cCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBIYW5kbGUgbWVzc2FnZXMgZnJvbSBwb3B1cCBhbmQgY29udGVudCBzY3JpcHRzXG4gKi9cbmJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdSZWNlaXZlZCBtZXNzYWdlOicsIG1lc3NhZ2UpO1xuICBcbiAgLy8gSGFuZGxlIHRoZSBtZXNzYWdlIGFzeW5jaHJvbm91c2x5XG4gIGhhbmRsZU1lc3NhZ2UobWVzc2FnZSwgc2VydmljZXMpXG4gICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1NlbmRpbmcgcmVzcG9uc2U6JywgcmVzcG9uc2UpO1xuICAgICAgc2VuZFJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICB9KVxuICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBoYW5kbGluZyBtZXNzYWdlOicsIGVycm9yKTtcbiAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICB9KTtcbiAgXG4gIC8vIFJldHVybiB0cnVlIHRvIGluZGljYXRlIHdlJ2xsIHNlbmQgcmVzcG9uc2UgYXN5bmNocm9ub3VzbHlcbiAgcmV0dXJuIHRydWU7XG59KTtcblxuLyoqXG4gKiBIYW5kbGUgY29ubmVjdGlvbnMgZnJvbSBwb3B1cCBmb3IgcGVyc2lzdGVudCBjb21tdW5pY2F0aW9uXG4gKi9cbmJyb3dzZXIucnVudGltZS5vbkNvbm5lY3QuYWRkTGlzdGVuZXIoKHBvcnQpID0+IHtcbiAgY29uc29sZS5sb2coJ1BvcnQgY29ubmVjdGVkOicsIHBvcnQubmFtZSk7XG4gIFxuICBwb3J0Lm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihhc3luYyAobWVzc2FnZSkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGhhbmRsZU1lc3NhZ2UobWVzc2FnZSwgc2VydmljZXMpO1xuICAgICAgcG9ydC5wb3N0TWVzc2FnZShyZXNwb25zZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHBvcnQucG9zdE1lc3NhZ2UoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgfVxuICB9KTtcbiAgXG4gIHBvcnQub25EaXNjb25uZWN0LmFkZExpc3RlbmVyKCgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnUG9ydCBkaXNjb25uZWN0ZWQ6JywgcG9ydC5uYW1lKTtcbiAgfSk7XG59KTtcblxuLy8gRXhwb3J0IGZvciB0ZXN0aW5nXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2VydmljZXMsXG4gIGRpY3Rpb25hcnksXG4gIHN0b3JhZ2Vcbn07IiwiY29uc3QgVm9jYWJ1bGFyeUxpc3QgPSByZXF1aXJlKCcuLi9zZXJ2aWNlcy92b2NhYnVsYXJ5LWxpc3QnKTtcbmNvbnN0IFNwYWNlZFJlcGV0aXRpb24gPSByZXF1aXJlKCcuLi9zZXJ2aWNlcy9zcGFjZWQtcmVwZXRpdGlvbicpO1xuXG5jb25zdCBNZXNzYWdlVHlwZXMgPSB7XG4gIExPT0tVUF9XT1JEOiAnbG9va3VwX3dvcmQnLFxuICBBRERfVE9fTElTVDogJ2FkZF90b19saXN0JyxcbiAgR0VUX0xJU1RTOiAnZ2V0X2xpc3RzJyxcbiAgQ1JFQVRFX0xJU1Q6ICdjcmVhdGVfbGlzdCcsXG4gIFVQREFURV9XT1JEOiAndXBkYXRlX3dvcmQnLFxuICBHRVRfUkVWSUVXX1FVRVVFOiAnZ2V0X3Jldmlld19xdWV1ZScsXG4gIFNVQk1JVF9SRVZJRVc6ICdzdWJtaXRfcmV2aWV3J1xufTtcblxuLyoqXG4gKiBIYW5kbGUgbWVzc2FnZXMgZnJvbSBwb3B1cCBvciBjb250ZW50IHNjcmlwdFxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgLSBNZXNzYWdlIG9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IHNlcnZpY2VzIC0gU2VydmljZSBpbnN0YW5jZXMgKGRpY3Rpb25hcnksIHN0b3JhZ2UpXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3Q+fSBSZXNwb25zZSBvYmplY3RcbiAqL1xuYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShtZXNzYWdlLCBzZXJ2aWNlcykge1xuICBjb25zdCB7IGRpY3Rpb25hcnksIHN0b3JhZ2UgfSA9IHNlcnZpY2VzO1xuXG4gIHRyeSB7XG4gICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcbiAgICAgIGNhc2UgTWVzc2FnZVR5cGVzLkxPT0tVUF9XT1JEOiB7XG4gICAgICAgIGlmICghbWVzc2FnZS53b3JkKSB7XG4gICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnV29yZCBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQnIH07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXN1bHQgPSBkaWN0aW9uYXJ5Lmxvb2t1cChtZXNzYWdlLndvcmQpO1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcmVzdWx0IH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUcnkgZnV6enkgc2VhcmNoIHVzaW5nIHRoZSBmdXp6eSBtYXRjaCBtZXRob2RcbiAgICAgICAgY29uc3Qgc3VnZ2VzdGlvbnMgPSBkaWN0aW9uYXJ5LmZ1enp5TWF0Y2gobWVzc2FnZS53b3JkLCA1KTtcbiAgICAgICAgaWYgKHN1Z2dlc3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsIFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgICAgIHN1Z2dlc3Rpb25zOiBzdWdnZXN0aW9uc1xuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdXb3JkIG5vdCBmb3VuZCcgfTtcbiAgICAgIH1cblxuICAgICAgY2FzZSBNZXNzYWdlVHlwZXMuQUREX1RPX0xJU1Q6IHtcbiAgICAgICAgaWYgKCFtZXNzYWdlLndvcmQgfHwgIW1lc3NhZ2UubGlzdElkKSB7XG4gICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnV29yZCBhbmQgbGlzdElkIGFyZSByZXF1aXJlZCcgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGlmIHdvcmQgZXhpc3RzIGluIGRpY3Rpb25hcnlcbiAgICAgICAgY29uc3Qgd29yZERhdGEgPSBkaWN0aW9uYXJ5Lmxvb2t1cChtZXNzYWdlLndvcmQpO1xuICAgICAgICBpZiAoIXdvcmREYXRhKSB7XG4gICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnV29yZCBub3QgZm91bmQgaW4gZGljdGlvbmFyeScgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxpc3RzID0gYXdhaXQgc3RvcmFnZS5nZXQoJ3ZvY2FiX2xpc3RzJykgfHwgW107XG4gICAgICAgIGNvbnN0IGxpc3RJbmRleCA9IGxpc3RzLmZpbmRJbmRleChsID0+IGwuaWQgPT09IG1lc3NhZ2UubGlzdElkKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChsaXN0SW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTGlzdCBub3QgZm91bmQnIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZWNyZWF0ZSBWb2NhYnVsYXJ5TGlzdCBpbnN0YW5jZVxuICAgICAgICBjb25zdCBsaXN0ID0gVm9jYWJ1bGFyeUxpc3QuZnJvbUpTT04obGlzdHNbbGlzdEluZGV4XSwgZGljdGlvbmFyeSk7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHdvcmRFbnRyeSA9IGxpc3QuYWRkV29yZChtZXNzYWdlLndvcmQsIG1lc3NhZ2UubWV0YWRhdGEpO1xuICAgICAgICAgIGxpc3RzW2xpc3RJbmRleF0gPSBsaXN0LnRvSlNPTigpO1xuICAgICAgICAgIGF3YWl0IHN0b3JhZ2Uuc2V0KCd2b2NhYl9saXN0cycsIGxpc3RzKTtcbiAgICAgICAgICBcbiAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB3b3JkRW50cnkgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjYXNlIE1lc3NhZ2VUeXBlcy5HRVRfTElTVFM6IHtcbiAgICAgICAgY29uc3QgbGlzdHMgPSBhd2FpdCBzdG9yYWdlLmdldCgndm9jYWJfbGlzdHMnKSB8fCBbXTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogbGlzdHMgfTtcbiAgICAgIH1cblxuICAgICAgY2FzZSBNZXNzYWdlVHlwZXMuQ1JFQVRFX0xJU1Q6IHtcbiAgICAgICAgaWYgKCFtZXNzYWdlLm5hbWUpIHtcbiAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdMaXN0IG5hbWUgaXMgcmVxdWlyZWQnIH07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0cmltbWVkTmFtZSA9IG1lc3NhZ2UubmFtZS50cmltKCk7XG4gICAgICAgIGlmICghdHJpbW1lZE5hbWUpIHtcbiAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdMaXN0IG5hbWUgY2Fubm90IGJlIGVtcHR5JyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGlzdHMgPSBhd2FpdCBzdG9yYWdlLmdldCgndm9jYWJfbGlzdHMnKSB8fCBbXTtcbiAgICAgICAgY29uc3QgbmV3TGlzdCA9IG5ldyBWb2NhYnVsYXJ5TGlzdCh0cmltbWVkTmFtZSwgZGljdGlvbmFyeSk7XG4gICAgICAgIFxuICAgICAgICBsaXN0cy5wdXNoKG5ld0xpc3QudG9KU09OKCkpO1xuICAgICAgICBhd2FpdCBzdG9yYWdlLnNldCgndm9jYWJfbGlzdHMnLCBsaXN0cyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBuZXdMaXN0LnRvSlNPTigpIH07XG4gICAgICB9XG5cbiAgICAgIGNhc2UgTWVzc2FnZVR5cGVzLlVQREFURV9XT1JEOiB7XG4gICAgICAgIGlmICghbWVzc2FnZS5saXN0SWQgfHwgIW1lc3NhZ2Uud29yZCB8fCAhbWVzc2FnZS51cGRhdGVzKSB7XG4gICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTGlzdElkLCB3b3JkLCBhbmQgdXBkYXRlcyBhcmUgcmVxdWlyZWQnIH07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsaXN0cyA9IGF3YWl0IHN0b3JhZ2UuZ2V0KCd2b2NhYl9saXN0cycpIHx8IFtdO1xuICAgICAgICBjb25zdCBsaXN0SW5kZXggPSBsaXN0cy5maW5kSW5kZXgobCA9PiBsLmlkID09PSBtZXNzYWdlLmxpc3RJZCk7XG4gICAgICAgIFxuICAgICAgICBpZiAobGlzdEluZGV4ID09PSAtMSkge1xuICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0xpc3Qgbm90IGZvdW5kJyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGlzdCA9IFZvY2FidWxhcnlMaXN0LmZyb21KU09OKGxpc3RzW2xpc3RJbmRleF0sIGRpY3Rpb25hcnkpO1xuICAgICAgICBjb25zdCB1cGRhdGVkID0gbGlzdC51cGRhdGVXb3JkKG1lc3NhZ2Uud29yZCwgbWVzc2FnZS51cGRhdGVzKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghdXBkYXRlZCkge1xuICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1dvcmQgbm90IGZvdW5kIGluIGxpc3QnIH07XG4gICAgICAgIH1cblxuICAgICAgICBsaXN0c1tsaXN0SW5kZXhdID0gbGlzdC50b0pTT04oKTtcbiAgICAgICAgYXdhaXQgc3RvcmFnZS5zZXQoJ3ZvY2FiX2xpc3RzJywgbGlzdHMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogdXBkYXRlZCB9O1xuICAgICAgfVxuXG4gICAgICBjYXNlIE1lc3NhZ2VUeXBlcy5HRVRfUkVWSUVXX1FVRVVFOiB7XG4gICAgICAgIGNvbnN0IGxpc3RzID0gYXdhaXQgc3RvcmFnZS5nZXQoJ3ZvY2FiX2xpc3RzJykgfHwgW107XG4gICAgICAgIGNvbnN0IG1heFdvcmRzID0gbWVzc2FnZS5tYXhXb3JkcyB8fCAzMDtcbiAgICAgICAgXG4gICAgICAgIC8vIENvbGxlY3QgYWxsIHdvcmRzIGZyb20gYWxsIGxpc3RzXG4gICAgICAgIGNvbnN0IGFsbFdvcmRzID0gW107XG4gICAgICAgIFxuICAgICAgICBmb3IgKGNvbnN0IGxpc3REYXRhIG9mIGxpc3RzKSB7XG4gICAgICAgICAgY29uc3QgbGlzdCA9IFZvY2FidWxhcnlMaXN0LmZyb21KU09OKGxpc3REYXRhLCBkaWN0aW9uYXJ5KTtcbiAgICAgICAgICBjb25zdCB3b3JkcyA9IGxpc3QuZ2V0V29yZHMoKTtcbiAgICAgICAgICBcbiAgICAgICAgICBmb3IgKGNvbnN0IHdvcmQgb2Ygd29yZHMpIHtcbiAgICAgICAgICAgIGFsbFdvcmRzLnB1c2goe1xuICAgICAgICAgICAgICAuLi53b3JkLFxuICAgICAgICAgICAgICBsaXN0SWQ6IGxpc3REYXRhLmlkLFxuICAgICAgICAgICAgICBsaXN0TmFtZTogbGlzdERhdGEubmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBVc2UgU3BhY2VkUmVwZXRpdGlvbiBzZXJ2aWNlIHRvIGdldCByZXZpZXcgcXVldWVcbiAgICAgICAgY29uc3QgcXVldWUgPSBTcGFjZWRSZXBldGl0aW9uLmdldFJldmlld1F1ZXVlKGFsbFdvcmRzLCBtYXhXb3Jkcyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBxdWV1ZSB9O1xuICAgICAgfVxuXG4gICAgICBjYXNlIE1lc3NhZ2VUeXBlcy5TVUJNSVRfUkVWSUVXOiB7XG4gICAgICAgIGlmICghbWVzc2FnZS5saXN0SWQgfHwgIW1lc3NhZ2Uud29yZCB8fCAhbWVzc2FnZS5yZXZpZXdSZXN1bHQpIHtcbiAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdMaXN0SWQsIHdvcmQsIGFuZCByZXZpZXdSZXN1bHQgYXJlIHJlcXVpcmVkJyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGlzdHMgPSBhd2FpdCBzdG9yYWdlLmdldCgndm9jYWJfbGlzdHMnKSB8fCBbXTtcbiAgICAgICAgY29uc3QgbGlzdEluZGV4ID0gbGlzdHMuZmluZEluZGV4KGwgPT4gbC5pZCA9PT0gbWVzc2FnZS5saXN0SWQpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGxpc3RJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdMaXN0IG5vdCBmb3VuZCcgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxpc3QgPSBWb2NhYnVsYXJ5TGlzdC5mcm9tSlNPTihsaXN0c1tsaXN0SW5kZXhdLCBkaWN0aW9uYXJ5KTtcbiAgICAgICAgY29uc3Qgd29yZERhdGEgPSBsaXN0LmdldFdvcmQobWVzc2FnZS53b3JkKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghd29yZERhdGEpIHtcbiAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdXb3JkIG5vdCBmb3VuZCBpbiBsaXN0JyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGludGVydmFscyB1c2luZyBTcGFjZWRSZXBldGl0aW9uIHNlcnZpY2VcbiAgICAgICAgY29uc3QgY3VycmVudEludGVydmFsID0gU3BhY2VkUmVwZXRpdGlvbi5nZXRDdXJyZW50SW50ZXJ2YWwod29yZERhdGEubGFzdFJldmlld2VkKTtcbiAgICAgICAgY29uc3QgbmV4dEludGVydmFsID0gU3BhY2VkUmVwZXRpdGlvbi5jYWxjdWxhdGVOZXh0UmV2aWV3KGN1cnJlbnRJbnRlcnZhbCwgbWVzc2FnZS5yZXZpZXdSZXN1bHQpO1xuICAgICAgICBcbiAgICAgICAgLy8gSGFuZGxlIG1hc3RlcmVkIHdvcmRzXG4gICAgICAgIGlmIChuZXh0SW50ZXJ2YWwgPT09IG51bGwpIHtcbiAgICAgICAgICAvLyBSZW1vdmUgZnJvbSBhY3RpdmUgcmV2aWV3cyBieSBzZXR0aW5nIG5leHRSZXZpZXcgdG8gbnVsbFxuICAgICAgICAgIGNvbnN0IHVwZGF0ZXMgPSB7XG4gICAgICAgICAgICBsYXN0UmV2aWV3ZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIG5leHRSZXZpZXc6IG51bGwsXG4gICAgICAgICAgICByZXZpZXdIaXN0b3J5OiBbLi4uKHdvcmREYXRhLnJldmlld0hpc3RvcnkgfHwgW10pLCB7XG4gICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgcmVzdWx0OiBtZXNzYWdlLnJldmlld1Jlc3VsdCxcbiAgICAgICAgICAgICAgdGltZVNwZW50OiBtZXNzYWdlLnRpbWVTcGVudCB8fCAwXG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH07XG4gICAgICAgICAgXG4gICAgICAgICAgbGlzdC51cGRhdGVXb3JkKG1lc3NhZ2Uud29yZCwgdXBkYXRlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIG5leHQgcmV2aWV3IGRhdGVcbiAgICAgICAgICBjb25zdCBuZXh0UmV2aWV3RGF0ZSA9IFNwYWNlZFJlcGV0aXRpb24uZ2V0TmV4dFJldmlld0RhdGUobmV4dEludGVydmFsKTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCB1cGRhdGVzID0ge1xuICAgICAgICAgICAgbGFzdFJldmlld2VkOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBuZXh0UmV2aWV3OiBuZXh0UmV2aWV3RGF0ZS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgcmV2aWV3SGlzdG9yeTogWy4uLih3b3JkRGF0YS5yZXZpZXdIaXN0b3J5IHx8IFtdKSwge1xuICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgIHJlc3VsdDogbWVzc2FnZS5yZXZpZXdSZXN1bHQsXG4gICAgICAgICAgICAgIHRpbWVTcGVudDogbWVzc2FnZS50aW1lU3BlbnQgfHwgMFxuICAgICAgICAgICAgfV1cbiAgICAgICAgICB9O1xuICAgICAgICAgIFxuICAgICAgICAgIGxpc3QudXBkYXRlV29yZChtZXNzYWdlLndvcmQsIHVwZGF0ZXMpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsaXN0c1tsaXN0SW5kZXhdID0gbGlzdC50b0pTT04oKTtcbiAgICAgICAgYXdhaXQgc3RvcmFnZS5zZXQoJ3ZvY2FiX2xpc3RzJywgbGlzdHMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogeyBuZXh0SW50ZXJ2YWwgfSB9O1xuICAgICAgfVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBVbmtub3duIG1lc3NhZ2UgdHlwZTogJHttZXNzYWdlLnR5cGV9YCB9O1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdNZXNzYWdlIGhhbmRsZXIgZXJyb3I6JywgZXJyb3IpO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBNZXNzYWdlVHlwZXMsXG4gIGhhbmRsZU1lc3NhZ2Vcbn07IiwiY2xhc3MgRGljdGlvbmFyeVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihkaWN0aW9uYXJ5RGF0YSkge1xuICAgIHRoaXMuZGF0YSA9IHt9O1xuICAgIC8vIE5vcm1hbGl6ZSBhbGwga2V5cyB0byBsb3dlcmNhc2UgZm9yIGNhc2UtaW5zZW5zaXRpdmUgbG9va3VwXG4gICAgT2JqZWN0LmtleXMoZGljdGlvbmFyeURhdGEpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIHRoaXMuZGF0YVtrZXkudG9Mb3dlckNhc2UoKV0gPSBkaWN0aW9uYXJ5RGF0YVtrZXldO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExvb2sgdXAgYSB3b3JkIGluIHRoZSBkaWN0aW9uYXJ5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3b3JkIC0gVGhlIHdvcmQgdG8gbG9vayB1cFxuICAgKiBAcmV0dXJucyB7T2JqZWN0fG51bGx9IFRoZSB3b3JkIGVudHJ5IG9yIG51bGwgaWYgbm90IGZvdW5kXG4gICAqL1xuICBsb29rdXAod29yZCkge1xuICAgIGlmICghd29yZCB8fCB0eXBlb2Ygd29yZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCBub3JtYWxpemVkV29yZCA9IHdvcmQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKCFub3JtYWxpemVkV29yZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzLmRhdGFbbm9ybWFsaXplZFdvcmRdIHx8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogRmluZCB3b3JkcyB3aXRoIHNpbWlsYXIgc3BlbGxpbmcgdXNpbmcgTGV2ZW5zaHRlaW4gZGlzdGFuY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdvcmQgLSBUaGUgd29yZCB0byBtYXRjaFxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4U3VnZ2VzdGlvbnMgLSBNYXhpbXVtIG51bWJlciBvZiBzdWdnZXN0aW9ucyB0byByZXR1cm5cbiAgICogQHJldHVybnMge0FycmF5fSBBcnJheSBvZiBzdWdnZXN0ZWQgd29yZHNcbiAgICovXG4gIGZ1enp5TWF0Y2god29yZCwgbWF4U3VnZ2VzdGlvbnMgPSA1KSB7XG4gICAgaWYgKCF3b3JkIHx8IHR5cGVvZiB3b3JkICE9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCBub3JtYWxpemVkV29yZCA9IHdvcmQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKCFub3JtYWxpemVkV29yZCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBcbiAgICAvLyBDYWxjdWxhdGUgTGV2ZW5zaHRlaW4gZGlzdGFuY2VcbiAgICBjb25zdCBsZXZlbnNodGVpbiA9IChhLCBiKSA9PiB7XG4gICAgICBjb25zdCBtYXRyaXggPSBbXTtcbiAgICAgIFxuICAgICAgaWYgKGEubGVuZ3RoID09PSAwKSByZXR1cm4gYi5sZW5ndGg7XG4gICAgICBpZiAoYi5sZW5ndGggPT09IDApIHJldHVybiBhLmxlbmd0aDtcbiAgICAgIFxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gYi5sZW5ndGg7IGkrKykge1xuICAgICAgICBtYXRyaXhbaV0gPSBbaV07XG4gICAgICB9XG4gICAgICBcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDw9IGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgbWF0cml4WzBdW2pdID0gajtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gYi5sZW5ndGg7IGkrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBhLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgaWYgKGIuY2hhckF0KGkgLSAxKSA9PT0gYS5jaGFyQXQoaiAtIDEpKSB7XG4gICAgICAgICAgICBtYXRyaXhbaV1bal0gPSBtYXRyaXhbaSAtIDFdW2ogLSAxXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWF0cml4W2ldW2pdID0gTWF0aC5taW4oXG4gICAgICAgICAgICAgIG1hdHJpeFtpIC0gMV1baiAtIDFdICsgMSwgLy8gc3Vic3RpdHV0aW9uXG4gICAgICAgICAgICAgIG1hdHJpeFtpXVtqIC0gMV0gKyAxLCAgICAgLy8gaW5zZXJ0aW9uXG4gICAgICAgICAgICAgIG1hdHJpeFtpIC0gMV1bal0gKyAxICAgICAgLy8gZGVsZXRpb25cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiBtYXRyaXhbYi5sZW5ndGhdW2EubGVuZ3RoXTtcbiAgICB9O1xuICAgIFxuICAgIC8vIEZpbmQgd29yZHMgd2l0aCBsb3cgTGV2ZW5zaHRlaW4gZGlzdGFuY2VcbiAgICBjb25zdCBzdWdnZXN0aW9ucyA9IFtdO1xuICAgIGNvbnN0IG1heERpc3RhbmNlID0gTWF0aC5taW4oMywgTWF0aC5mbG9vcihub3JtYWxpemVkV29yZC5sZW5ndGggLyAyKSk7XG4gICAgXG4gICAgZm9yIChjb25zdCBkaWN0V29yZCBpbiB0aGlzLmRhdGEpIHtcbiAgICAgIGNvbnN0IGRpc3RhbmNlID0gbGV2ZW5zaHRlaW4obm9ybWFsaXplZFdvcmQsIGRpY3RXb3JkKTtcbiAgICAgIGlmIChkaXN0YW5jZSA+IDAgJiYgZGlzdGFuY2UgPD0gbWF4RGlzdGFuY2UpIHtcbiAgICAgICAgc3VnZ2VzdGlvbnMucHVzaCh7IHdvcmQ6IGRpY3RXb3JkLCBkaXN0YW5jZSB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gU29ydCBieSBkaXN0YW5jZSBhbmQgcmV0dXJuIHRvcCBzdWdnZXN0aW9uc1xuICAgIHJldHVybiBzdWdnZXN0aW9uc1xuICAgICAgLnNvcnQoKGEsIGIpID0+IGEuZGlzdGFuY2UgLSBiLmRpc3RhbmNlKVxuICAgICAgLnNsaWNlKDAsIG1heFN1Z2dlc3Rpb25zKVxuICAgICAgLm1hcChzID0+IHMud29yZCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCB3b3JkcyBpbiB0aGUgZGljdGlvbmFyeVxuICAgKiBAcmV0dXJucyB7QXJyYXl9IFNvcnRlZCBhcnJheSBvZiBhbGwgd29yZHNcbiAgICovXG4gIGdldEFsbFdvcmRzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmRhdGEpLnNvcnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgd29yZHMgYnkgcGFydCBvZiBzcGVlY2hcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhcnRPZlNwZWVjaCAtIFRoZSBwYXJ0IG9mIHNwZWVjaCB0byBmaWx0ZXIgYnlcbiAgICogQHJldHVybnMge0FycmF5fSBBcnJheSBvZiB3b3JkcyBtYXRjaGluZyB0aGUgcGFydCBvZiBzcGVlY2hcbiAgICovXG4gIGdldFdvcmRzQnlQYXJ0T2ZTcGVlY2gocGFydE9mU3BlZWNoKSB7XG4gICAgaWYgKCFwYXJ0T2ZTcGVlY2ggfHwgdHlwZW9mIHBhcnRPZlNwZWVjaCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgXG4gICAgY29uc3Qgbm9ybWFsaXplZFBvcyA9IHBhcnRPZlNwZWVjaC50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IHdvcmQgaW4gdGhpcy5kYXRhKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IHRoaXMuZGF0YVt3b3JkXTtcbiAgICAgIGNvbnN0IGhhc1BhcnRPZlNwZWVjaCA9IGVudHJ5LmRlZmluaXRpb25zLnNvbWUoXG4gICAgICAgIGRlZiA9PiBkZWYucGFydE9mU3BlZWNoLnRvTG93ZXJDYXNlKCkgPT09IG5vcm1hbGl6ZWRQb3NcbiAgICAgICk7XG4gICAgICBpZiAoaGFzUGFydE9mU3BlZWNoKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh3b3JkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHJlc3VsdHMuc29ydCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHJhbmRvbSB3b3JkIGZyb20gdGhlIGRpY3Rpb25hcnlcbiAgICogQHJldHVybnMge09iamVjdH0gQSByYW5kb20gd29yZCBlbnRyeVxuICAgKi9cbiAgZ2V0UmFuZG9tV29yZCgpIHtcbiAgICBjb25zdCB3b3JkcyA9IE9iamVjdC5rZXlzKHRoaXMuZGF0YSk7XG4gICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB3b3Jkcy5sZW5ndGgpO1xuICAgIGNvbnN0IHJhbmRvbVdvcmQgPSB3b3Jkc1tyYW5kb21JbmRleF07XG4gICAgcmV0dXJuIHRoaXMuZGF0YVtyYW5kb21Xb3JkXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWFyY2ggZm9yIHdvcmRzIGJ5IGRlZmluaXRpb24gY29udGVudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2VhcmNoVGVybSAtIFRoZSB0ZXJtIHRvIHNlYXJjaCBmb3IgaW4gZGVmaW5pdGlvbnNcbiAgICogQHJldHVybnMge0FycmF5fSBBcnJheSBvZiB3b3JkcyBjb250YWluaW5nIHRoZSBzZWFyY2ggdGVybSBpbiB0aGVpciBkZWZpbml0aW9uc1xuICAgKi9cbiAgc2VhcmNoQnlEZWZpbml0aW9uKHNlYXJjaFRlcm0pIHtcbiAgICBpZiAoIXNlYXJjaFRlcm0gfHwgdHlwZW9mIHNlYXJjaFRlcm0gIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IG5vcm1hbGl6ZWRUZXJtID0gc2VhcmNoVGVybS50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IHdvcmQgaW4gdGhpcy5kYXRhKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IHRoaXMuZGF0YVt3b3JkXTtcbiAgICAgIGNvbnN0IGhhc01hdGNoID0gZW50cnkuZGVmaW5pdGlvbnMuc29tZShkZWYgPT4ge1xuICAgICAgICBjb25zdCBtZWFuaW5nID0gZGVmLm1lYW5pbmcudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3QgZXhhbXBsZXMgPSBkZWYuZXhhbXBsZXMuam9pbignICcpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHJldHVybiBtZWFuaW5nLmluY2x1ZGVzKG5vcm1hbGl6ZWRUZXJtKSB8fCBleGFtcGxlcy5pbmNsdWRlcyhub3JtYWxpemVkVGVybSk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgaWYgKGhhc01hdGNoKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh3b3JkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHJlc3VsdHMuc29ydCgpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRGljdGlvbmFyeVNlcnZpY2U7IiwiLyoqXG4gKiBTcGFjZWQgUmVwZXRpdGlvbiBzZXJ2aWNlIGZvciB2b2NhYnVsYXJ5IGxlYXJuaW5nXG4gKi9cbmNsYXNzIFNwYWNlZFJlcGV0aXRpb24ge1xuICAvKipcbiAgICogQ2FsY3VsYXRlIG5leHQgcmV2aWV3IGludGVydmFsIGJhc2VkIG9uIGN1cnJlbnQgaW50ZXJ2YWwgYW5kIHJldmlldyByZXN1bHRcbiAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRJbnRlcnZhbCAtIEN1cnJlbnQgaW50ZXJ2YWwgaW4gZGF5c1xuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVzdWx0IC0gUmV2aWV3IHJlc3VsdDogJ2tub3duJywgJ3Vua25vd24nLCAnc2tpcHBlZCcsICdtYXN0ZXJlZCdcbiAgICogQHJldHVybnMge251bWJlcnxudWxsfSBOZXh0IGludGVydmFsIGluIGRheXMsIG9yIG51bGwgaWYgbWFzdGVyZWRcbiAgICovXG4gIHN0YXRpYyBjYWxjdWxhdGVOZXh0UmV2aWV3KGN1cnJlbnRJbnRlcnZhbCwgcmVzdWx0KSB7XG4gICAgY29uc3QgaW50ZXJ2YWxzID0ge1xuICAgICAga25vd246IHtcbiAgICAgICAgMTogMyxcbiAgICAgICAgMzogNyxcbiAgICAgICAgNzogMTQsXG4gICAgICAgIDE0OiAzMCxcbiAgICAgICAgMzA6IDYwXG4gICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBpZiAocmVzdWx0ID09PSAnbWFzdGVyZWQnKSB7XG4gICAgICByZXR1cm4gbnVsbDsgLy8gUmVtb3ZlIGZyb20gYWN0aXZlIHJldmlld3NcbiAgICB9XG4gICAgXG4gICAgaWYgKHJlc3VsdCA9PT0gJ3Vua25vd24nKSB7XG4gICAgICByZXR1cm4gMTsgLy8gUmVzZXQgdG8gZGF5IDFcbiAgICB9XG4gICAgXG4gICAgaWYgKHJlc3VsdCA9PT0gJ2tub3duJykge1xuICAgICAgcmV0dXJuIGludGVydmFscy5rbm93bltjdXJyZW50SW50ZXJ2YWxdIHx8IGN1cnJlbnRJbnRlcnZhbCAqIDI7XG4gICAgfVxuICAgIFxuICAgIC8vIFNraXAgZG9lc24ndCBjaGFuZ2UgaW50ZXJ2YWxcbiAgICByZXR1cm4gY3VycmVudEludGVydmFsO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHdvcmRzIGR1ZSBmb3IgcmV2aWV3IGZyb20gYSBjb2xsZWN0aW9uXG4gICAqIEBwYXJhbSB7QXJyYXl9IHdvcmRzIC0gQXJyYXkgb2Ygd29yZCBvYmplY3RzIHdpdGggbmV4dFJldmlldyBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4V29yZHMgLSBNYXhpbXVtIHdvcmRzIHRvIHJldHVybiAoZGVmYXVsdDogMzApXG4gICAqIEByZXR1cm5zIHtBcnJheX0gV29yZHMgZHVlIGZvciByZXZpZXcsIHNvcnRlZCBieSBkdWUgZGF0ZVxuICAgKi9cbiAgc3RhdGljIGdldFJldmlld1F1ZXVlKHdvcmRzLCBtYXhXb3JkcyA9IDMwKSB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBcbiAgICByZXR1cm4gd29yZHNcbiAgICAgIC5maWx0ZXIod29yZCA9PiB7XG4gICAgICAgIC8vIE9ubHkgaW5jbHVkZSB3b3JkcyB0aGF0IGhhdmUgbmV4dFJldmlldyBhbmQgaXQncyBkdWVcbiAgICAgICAgcmV0dXJuIHdvcmQubmV4dFJldmlldyAmJiBcbiAgICAgICAgICAgICAgIHdvcmQubmV4dFJldmlldyAhPT0gbnVsbCAmJiBcbiAgICAgICAgICAgICAgIG5ldyBEYXRlKHdvcmQubmV4dFJldmlldykgPD0gbm93O1xuICAgICAgfSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIC8vIFNvcnQgYnkgbmV4dFJldmlldyBkYXRlIChvbGRlc3QgZmlyc3QpXG4gICAgICAgIHJldHVybiBuZXcgRGF0ZShhLm5leHRSZXZpZXcpIC0gbmV3IERhdGUoYi5uZXh0UmV2aWV3KTtcbiAgICAgIH0pXG4gICAgICAuc2xpY2UoMCwgbWF4V29yZHMpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2FsY3VsYXRlIHRoZSBjdXJyZW50IGludGVydmFsIGJhc2VkIG9uIGxhc3QgcmV2aWV3XG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bGx9IGxhc3RSZXZpZXdlZCAtIElTTyBkYXRlIHN0cmluZyBvZiBsYXN0IHJldmlld1xuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBDdXJyZW50IGludGVydmFsIGluIGRheXMgKG1pbmltdW0gMSlcbiAgICovXG4gIHN0YXRpYyBnZXRDdXJyZW50SW50ZXJ2YWwobGFzdFJldmlld2VkKSB7XG4gICAgaWYgKCFsYXN0UmV2aWV3ZWQpIHtcbiAgICAgIHJldHVybiAxOyAvLyBOZXcgd29yZFxuICAgIH1cbiAgICBcbiAgICBjb25zdCBkYXlzU2luY2VMYXN0UmV2aWV3ID0gTWF0aC5jZWlsKFxuICAgICAgKG5ldyBEYXRlKCkgLSBuZXcgRGF0ZShsYXN0UmV2aWV3ZWQpKSAvIDg2NDAwMDAwXG4gICAgKTtcbiAgICBcbiAgICByZXR1cm4gTWF0aC5tYXgoMSwgZGF5c1NpbmNlTGFzdFJldmlldyk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgbmV4dCByZXZpZXcgZGF0ZSBiYXNlZCBvbiBjdXJyZW50IGRhdGUgYW5kIGludGVydmFsXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbnRlcnZhbERheXMgLSBJbnRlcnZhbCBpbiBkYXlzXG4gICAqIEByZXR1cm5zIHtEYXRlfSBOZXh0IHJldmlldyBkYXRlXG4gICAqL1xuICBzdGF0aWMgZ2V0TmV4dFJldmlld0RhdGUoaW50ZXJ2YWxEYXlzKSB7XG4gICAgY29uc3QgbmV4dERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIG5leHREYXRlLnNldERhdGUobmV4dERhdGUuZ2V0RGF0ZSgpICsgaW50ZXJ2YWxEYXlzKTtcbiAgICByZXR1cm4gbmV4dERhdGU7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTcGFjZWRSZXBldGl0aW9uOyIsIi8qKlxuICogU3RvcmFnZU1hbmFnZXIgLSBIYW5kbGVzIGFsbCBicm93c2VyIHN0b3JhZ2Ugb3BlcmF0aW9uc1xuICogVXNlcyBicm93c2VyLnN0b3JhZ2UubG9jYWwgZm9yIGRhdGEgcGVyc2lzdGVuY2VcbiAqL1xuY2xhc3MgU3RvcmFnZU1hbmFnZXIge1xuICAvKipcbiAgICogR2V0IGEgdmFsdWUgZnJvbSBzdG9yYWdlIGJ5IGtleVxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gVGhlIHN0b3JhZ2Uga2V5XG4gICAqIEByZXR1cm5zIHtQcm9taXNlPGFueT59IFRoZSBzdG9yZWQgdmFsdWUgb3IgdW5kZWZpbmVkXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZ2V0KGtleSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQoa2V5KTtcbiAgICByZXR1cm4gcmVzdWx0W2tleV07XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgdmFsdWUgaW4gc3RvcmFnZVxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gVGhlIHN0b3JhZ2Uga2V5XG4gICAqIEBwYXJhbSB7YW55fSB2YWx1ZSAtIFRoZSB2YWx1ZSB0byBzdG9yZVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIHN0YXRpYyBhc3luYyBzZXQoa2V5LCB2YWx1ZSkge1xuICAgIGF3YWl0IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQoeyBba2V5XTogdmFsdWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGEgdmFsdWUgaW4gc3RvcmFnZVxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gVGhlIHN0b3JhZ2Uga2V5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHVwZGF0ZUZuIC0gRnVuY3Rpb24gdGhhdCByZWNlaXZlcyBjdXJyZW50IHZhbHVlIGFuZCByZXR1cm5zIG5ldyB2YWx1ZVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxhbnk+fSBUaGUgdXBkYXRlZCB2YWx1ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHVwZGF0ZShrZXksIHVwZGF0ZUZuKSB7XG4gICAgY29uc3QgY3VycmVudCA9IGF3YWl0IHRoaXMuZ2V0KGtleSk7XG4gICAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUZuKGN1cnJlbnQpO1xuICAgIGF3YWl0IHRoaXMuc2V0KGtleSwgdXBkYXRlZCk7XG4gICAgcmV0dXJuIHVwZGF0ZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGEgdmFsdWUgZnJvbSBzdG9yYWdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBUaGUgc3RvcmFnZSBrZXlcbiAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBzdGF0aWMgYXN5bmMgcmVtb3ZlKGtleSkge1xuICAgIGF3YWl0IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5yZW1vdmUoa2V5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciBhbGwgc3RvcmFnZVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIHN0YXRpYyBhc3luYyBjbGVhcigpIHtcbiAgICBhd2FpdCBicm93c2VyLnN0b3JhZ2UubG9jYWwuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIHN0b3JlZCBkYXRhXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdD59IEFsbCBzdG9yZWQgZGF0YVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGdldEFsbCgpIHtcbiAgICByZXR1cm4gYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldChudWxsKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0b3JhZ2VNYW5hZ2VyOyIsImNvbnN0IHsgdjQ6IHV1aWR2NCB9ID0gcmVxdWlyZSgndXVpZCcpO1xuXG5jbGFzcyBWb2NhYnVsYXJ5TGlzdCB7XG4gIGNvbnN0cnVjdG9yKG5hbWUsIGRpY3Rpb25hcnksIGlzRGVmYXVsdCA9IGZhbHNlKSB7XG4gICAgaWYgKCFkaWN0aW9uYXJ5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RpY3Rpb25hcnkgaXMgcmVxdWlyZWQnKTtcbiAgICB9XG4gICAgXG4gICAgdGhpcy5pZCA9IHV1aWR2NCgpO1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5jcmVhdGVkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIHRoaXMuaXNEZWZhdWx0ID0gaXNEZWZhdWx0O1xuICAgIHRoaXMud29yZHMgPSB7fTsgLy8gS2V5OiB3b3JkIChsb3dlcmNhc2UpLCBWYWx1ZTogdXNlci1zcGVjaWZpYyBkYXRhXG4gICAgdGhpcy5kaWN0aW9uYXJ5ID0gZGljdGlvbmFyeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSB3b3JkIHRvIHRoZSB2b2NhYnVsYXJ5IGxpc3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdvcmRUZXh0IC0gVGhlIHdvcmQgdG8gYWRkXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBtZXRhZGF0YSAtIE9wdGlvbmFsIG1ldGFkYXRhIChkaWZmaWN1bHR5LCBjdXN0b21Ob3RlcylcbiAgICogQHJldHVybnMge09iamVjdH0gVGhlIHdvcmQgZW50cnkgd2l0aCB1c2VyIGRhdGFcbiAgICovXG4gIGFkZFdvcmQod29yZFRleHQsIG1ldGFkYXRhID0ge30pIHtcbiAgICBjb25zdCBub3JtYWxpemVkV29yZCA9IHdvcmRUZXh0LnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgIFxuICAgIC8vIENoZWNrIGlmIHdvcmQgZXhpc3RzIGluIGRpY3Rpb25hcnlcbiAgICBjb25zdCBkaWN0aW9uYXJ5RW50cnkgPSB0aGlzLmRpY3Rpb25hcnkubG9va3VwKHdvcmRUZXh0KTtcbiAgICBpZiAoIWRpY3Rpb25hcnlFbnRyeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdXb3JkIG5vdCBmb3VuZCBpbiBkaWN0aW9uYXJ5Jyk7XG4gICAgfVxuICAgIFxuICAgIC8vIENoZWNrIGlmIHdvcmQgYWxyZWFkeSBleGlzdHMgaW4gbGlzdFxuICAgIGlmICh0aGlzLndvcmRzW25vcm1hbGl6ZWRXb3JkXSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdXb3JkIGFscmVhZHkgZXhpc3RzIGluIGxpc3QnKTtcbiAgICB9XG4gICAgXG4gICAgLy8gQ3JlYXRlIHVzZXItc3BlY2lmaWMgZGF0YSBmb3IgdGhpcyB3b3JkXG4gICAgY29uc3QgdXNlcldvcmREYXRhID0ge1xuICAgICAgd29yZDogZGljdGlvbmFyeUVudHJ5LndvcmQsIC8vIFVzZSB0aGUgY29ycmVjdCBjYXNlIGZyb20gZGljdGlvbmFyeVxuICAgICAgZGF0ZUFkZGVkOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBkaWZmaWN1bHR5OiBtZXRhZGF0YS5kaWZmaWN1bHR5IHx8ICdtZWRpdW0nLFxuICAgICAgY3VzdG9tTm90ZXM6IG1ldGFkYXRhLmN1c3RvbU5vdGVzIHx8ICcnLFxuICAgICAgbGFzdFJldmlld2VkOiBudWxsLFxuICAgICAgbmV4dFJldmlldzogbmV3IERhdGUoRGF0ZS5ub3coKSArIDg2NDAwMDAwKS50b0lTT1N0cmluZygpLCAvLyBEZWZhdWx0OiByZXZpZXcgdG9tb3Jyb3dcbiAgICAgIHJldmlld0hpc3Rvcnk6IFtdXG4gICAgfTtcbiAgICBcbiAgICB0aGlzLndvcmRzW25vcm1hbGl6ZWRXb3JkXSA9IHVzZXJXb3JkRGF0YTtcbiAgICByZXR1cm4gdXNlcldvcmREYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIHdvcmQgZnJvbSB0aGUgdm9jYWJ1bGFyeSBsaXN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3b3JkVGV4dCAtIFRoZSB3b3JkIHRvIHJlbW92ZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fG51bGx9IFRoZSByZW1vdmVkIHdvcmQgZGF0YSBvciBudWxsXG4gICAqL1xuICByZW1vdmVXb3JkKHdvcmRUZXh0KSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZFdvcmQgPSB3b3JkVGV4dC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBcbiAgICBpZiAoIXRoaXMud29yZHNbbm9ybWFsaXplZFdvcmRdKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgcmVtb3ZlZCA9IHRoaXMud29yZHNbbm9ybWFsaXplZFdvcmRdO1xuICAgIGRlbGV0ZSB0aGlzLndvcmRzW25vcm1hbGl6ZWRXb3JkXTtcbiAgICByZXR1cm4gcmVtb3ZlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdXNlci1zcGVjaWZpYyBwcm9wZXJ0aWVzIG9mIGEgd29yZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gd29yZFRleHQgLSBUaGUgd29yZCB0byB1cGRhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IHVwZGF0ZXMgLSBQcm9wZXJ0aWVzIHRvIHVwZGF0ZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fG51bGx9IFRoZSB1cGRhdGVkIHdvcmQgZGF0YSBvciBudWxsXG4gICAqL1xuICB1cGRhdGVXb3JkKHdvcmRUZXh0LCB1cGRhdGVzKSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZFdvcmQgPSB3b3JkVGV4dC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBcbiAgICBpZiAoIXRoaXMud29yZHNbbm9ybWFsaXplZFdvcmRdKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgXG4gICAgLy8gT25seSB1cGRhdGUgYWxsb3dlZCBwcm9wZXJ0aWVzXG4gICAgY29uc3QgYWxsb3dlZFByb3BzID0gWydkaWZmaWN1bHR5JywgJ2N1c3RvbU5vdGVzJywgJ2xhc3RSZXZpZXdlZCcsICduZXh0UmV2aWV3JywgJ3Jldmlld0hpc3RvcnknXTtcbiAgICBhbGxvd2VkUHJvcHMuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgIGlmICh1cGRhdGVzLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgIHRoaXMud29yZHNbbm9ybWFsaXplZFdvcmRdW3Byb3BdID0gdXBkYXRlc1twcm9wXTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gdGhpcy53b3Jkc1tub3JtYWxpemVkV29yZF07XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgd29yZCB3aXRoIGZ1bGwgZGF0YSAoZGljdGlvbmFyeSArIHVzZXIgZGF0YSlcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdvcmRUZXh0IC0gVGhlIHdvcmQgdG8gZ2V0XG4gICAqIEByZXR1cm5zIHtPYmplY3R8bnVsbH0gVGhlIGNvbXBsZXRlIHdvcmQgZGF0YSBvciBudWxsXG4gICAqL1xuICBnZXRXb3JkKHdvcmRUZXh0KSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZFdvcmQgPSB3b3JkVGV4dC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBcbiAgICBpZiAoIXRoaXMud29yZHNbbm9ybWFsaXplZFdvcmRdKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgXG4gICAgLy8gR2V0IGRpY3Rpb25hcnkgZGF0YVxuICAgIGNvbnN0IGRpY3Rpb25hcnlEYXRhID0gdGhpcy5kaWN0aW9uYXJ5Lmxvb2t1cCh3b3JkVGV4dCk7XG4gICAgXG4gICAgLy8gTWVyZ2UgZGljdGlvbmFyeSBkYXRhIHdpdGggdXNlciBkYXRhXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmRpY3Rpb25hcnlEYXRhLFxuICAgICAgLi4udGhpcy53b3Jkc1tub3JtYWxpemVkV29yZF1cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgd29yZHMgd2l0aCBmdWxsIGRhdGFcbiAgICogQHJldHVybnMge0FycmF5fSBBcnJheSBvZiBjb21wbGV0ZSB3b3JkIGRhdGFcbiAgICovXG4gIGdldFdvcmRzKCkge1xuICAgIHJldHVybiBPYmplY3QudmFsdWVzKHRoaXMud29yZHMpLm1hcCh1c2VyV29yZERhdGEgPT4ge1xuICAgICAgY29uc3QgZGljdGlvbmFyeURhdGEgPSB0aGlzLmRpY3Rpb25hcnkubG9va3VwKHVzZXJXb3JkRGF0YS53b3JkKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLmRpY3Rpb25hcnlEYXRhLFxuICAgICAgICAuLi51c2VyV29yZERhdGFcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU29ydCB3b3JkcyBieSB2YXJpb3VzIGNyaXRlcmlhXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjcml0ZXJpYSAtIFNvcnQgY3JpdGVyaWEgKGFscGhhYmV0aWNhbCwgZGF0ZUFkZGVkLCBsYXN0UmV2aWV3ZWQsIGRpZmZpY3VsdHkpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmRlciAtIFNvcnQgb3JkZXIgKGFzYywgZGVzYylcbiAgICogQHJldHVybnMge0FycmF5fSBTb3J0ZWQgYXJyYXkgb2Ygd29yZHNcbiAgICovXG4gIHNvcnRCeShjcml0ZXJpYSwgb3JkZXIgPSAnYXNjJykge1xuICAgIGNvbnN0IHdvcmRzID0gdGhpcy5nZXRXb3JkcygpO1xuICAgIFxuICAgIGNvbnN0IHNvcnRGdW5jdGlvbnMgPSB7XG4gICAgICBhbHBoYWJldGljYWw6IChhLCBiKSA9PiBhLndvcmQubG9jYWxlQ29tcGFyZShiLndvcmQpLFxuICAgICAgZGF0ZUFkZGVkOiAoYSwgYikgPT4gbmV3IERhdGUoYS5kYXRlQWRkZWQpIC0gbmV3IERhdGUoYi5kYXRlQWRkZWQpLFxuICAgICAgbGFzdFJldmlld2VkOiAoYSwgYikgPT4ge1xuICAgICAgICAvLyBQdXQgbmV2ZXItcmV2aWV3ZWQgd29yZHMgYXQgdGhlIGVuZFxuICAgICAgICBpZiAoIWEubGFzdFJldmlld2VkICYmICFiLmxhc3RSZXZpZXdlZCkgcmV0dXJuIDA7XG4gICAgICAgIGlmICghYS5sYXN0UmV2aWV3ZWQpIHJldHVybiAxO1xuICAgICAgICBpZiAoIWIubGFzdFJldmlld2VkKSByZXR1cm4gLTE7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZShhLmxhc3RSZXZpZXdlZCkgLSBuZXcgRGF0ZShiLmxhc3RSZXZpZXdlZCk7XG4gICAgICB9LFxuICAgICAgZGlmZmljdWx0eTogKGEsIGIpID0+IHtcbiAgICAgICAgY29uc3QgZGlmZmljdWx0eU9yZGVyID0geyBlYXN5OiAxLCBtZWRpdW06IDIsIGhhcmQ6IDMgfTtcbiAgICAgICAgcmV0dXJuIGRpZmZpY3VsdHlPcmRlclthLmRpZmZpY3VsdHldIC0gZGlmZmljdWx0eU9yZGVyW2IuZGlmZmljdWx0eV07XG4gICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBpZiAoY3JpdGVyaWEgPT09ICdsYXN0UmV2aWV3ZWQnKSB7XG4gICAgICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciBsYXN0UmV2aWV3ZWQgdG8ga2VlcCBudWxscyBhdCB0aGUgZW5kXG4gICAgICBjb25zdCByZXZpZXdlZCA9IHdvcmRzLmZpbHRlcih3ID0+IHcubGFzdFJldmlld2VkKTtcbiAgICAgIGNvbnN0IG5vdFJldmlld2VkID0gd29yZHMuZmlsdGVyKHcgPT4gIXcubGFzdFJldmlld2VkKTtcbiAgICAgIFxuICAgICAgcmV2aWV3ZWQuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICBjb25zdCBjb21wYXJpc29uID0gbmV3IERhdGUoYS5sYXN0UmV2aWV3ZWQpIC0gbmV3IERhdGUoYi5sYXN0UmV2aWV3ZWQpO1xuICAgICAgICByZXR1cm4gb3JkZXIgPT09ICdkZXNjJyA/IC1jb21wYXJpc29uIDogY29tcGFyaXNvbjtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICByZXR1cm4gWy4uLnJldmlld2VkLCAuLi5ub3RSZXZpZXdlZF07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNvcnRGbiA9IHNvcnRGdW5jdGlvbnNbY3JpdGVyaWFdIHx8IHNvcnRGdW5jdGlvbnMuYWxwaGFiZXRpY2FsO1xuICAgICAgd29yZHMuc29ydChzb3J0Rm4pO1xuICAgICAgXG4gICAgICBpZiAob3JkZXIgPT09ICdkZXNjJykge1xuICAgICAgICB3b3Jkcy5yZXZlcnNlKCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB3b3JkcztcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWx0ZXIgd29yZHMgYnkgdmFyaW91cyBjcml0ZXJpYVxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsdGVyVHlwZSAtIEZpbHRlciB0eXBlIChkaWZmaWN1bHR5LCByZXZpZXdTdGF0dXMpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWx0ZXJWYWx1ZSAtIEZpbHRlciB2YWx1ZVxuICAgKiBAcmV0dXJucyB7QXJyYXl9IEZpbHRlcmVkIGFycmF5IG9mIHdvcmRzXG4gICAqL1xuICBmaWx0ZXJCeShmaWx0ZXJUeXBlLCBmaWx0ZXJWYWx1ZSkge1xuICAgIGNvbnN0IHdvcmRzID0gdGhpcy5nZXRXb3JkcygpO1xuICAgIFxuICAgIHN3aXRjaCAoZmlsdGVyVHlwZSkge1xuICAgICAgY2FzZSAnZGlmZmljdWx0eSc6XG4gICAgICAgIHJldHVybiB3b3Jkcy5maWx0ZXIod29yZCA9PiB3b3JkLmRpZmZpY3VsdHkgPT09IGZpbHRlclZhbHVlKTtcbiAgICAgICAgXG4gICAgICBjYXNlICdyZXZpZXdTdGF0dXMnOlxuICAgICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBzd2l0Y2ggKGZpbHRlclZhbHVlKSB7XG4gICAgICAgICAgY2FzZSAnZHVlJzpcbiAgICAgICAgICAgIHJldHVybiB3b3Jkcy5maWx0ZXIod29yZCA9PiBcbiAgICAgICAgICAgICAgd29yZC5uZXh0UmV2aWV3ICYmIG5ldyBEYXRlKHdvcmQubmV4dFJldmlldykgPD0gbm93XG4gICAgICAgICAgICApO1xuICAgICAgICAgIGNhc2UgJ25ldyc6XG4gICAgICAgICAgICByZXR1cm4gd29yZHMuZmlsdGVyKHdvcmQgPT4gIXdvcmQubGFzdFJldmlld2VkKTtcbiAgICAgICAgICBjYXNlICdyZXZpZXdlZCc6XG4gICAgICAgICAgICByZXR1cm4gd29yZHMuZmlsdGVyKHdvcmQgPT4gd29yZC5sYXN0UmV2aWV3ZWQpO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gd29yZHM7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gd29yZHM7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaCBmb3Igd29yZHMgaW4gdGhlIGxpc3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IC0gU2VhcmNoIHF1ZXJ5XG4gICAqIEByZXR1cm5zIHtBcnJheX0gQXJyYXkgb2YgbWF0Y2hpbmcgd29yZHNcbiAgICovXG4gIHNlYXJjaChxdWVyeSkge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRRdWVyeSA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3Qgd29yZHMgPSB0aGlzLmdldFdvcmRzKCk7XG4gICAgXG4gICAgcmV0dXJuIHdvcmRzLmZpbHRlcih3b3JkID0+IHtcbiAgICAgIC8vIFNlYXJjaCBpbiB3b3JkIHRleHRcbiAgICAgIGlmICh3b3JkLndvcmQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhub3JtYWxpemVkUXVlcnkpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBTZWFyY2ggaW4gZGVmaW5pdGlvbnNcbiAgICAgIGlmICh3b3JkLmRlZmluaXRpb25zLnNvbWUoZGVmID0+IFxuICAgICAgICBkZWYubWVhbmluZy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKG5vcm1hbGl6ZWRRdWVyeSkgfHxcbiAgICAgICAgZGVmLmV4YW1wbGVzLnNvbWUoZXggPT4gZXgudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhub3JtYWxpemVkUXVlcnkpKVxuICAgICAgKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gU2VhcmNoIGluIGN1c3RvbSBub3Rlc1xuICAgICAgaWYgKHdvcmQuY3VzdG9tTm90ZXMgJiYgd29yZC5jdXN0b21Ob3Rlcy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKG5vcm1hbGl6ZWRRdWVyeSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgc3RhdGlzdGljcyBhYm91dCB0aGUgdm9jYWJ1bGFyeSBsaXN0XG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFN0YXRpc3RpY3Mgb2JqZWN0XG4gICAqL1xuICBnZXRTdGF0aXN0aWNzKCkge1xuICAgIGNvbnN0IHdvcmRzID0gdGhpcy5nZXRXb3JkcygpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgXG4gICAgY29uc3Qgc3RhdHMgPSB7XG4gICAgICB0b3RhbFdvcmRzOiB3b3Jkcy5sZW5ndGgsXG4gICAgICBieURpZmZpY3VsdHk6IHtcbiAgICAgICAgZWFzeTogMCxcbiAgICAgICAgbWVkaXVtOiAwLFxuICAgICAgICBoYXJkOiAwXG4gICAgICB9LFxuICAgICAgdG90YWxSZXZpZXdzOiAwLFxuICAgICAgd29yZHNSZXZpZXdlZDogMCxcbiAgICAgIHdvcmRzRHVlOiAwXG4gICAgfTtcbiAgICBcbiAgICB3b3Jkcy5mb3JFYWNoKHdvcmQgPT4ge1xuICAgICAgLy8gQ291bnQgYnkgZGlmZmljdWx0eVxuICAgICAgc3RhdHMuYnlEaWZmaWN1bHR5W3dvcmQuZGlmZmljdWx0eV0rKztcbiAgICAgIFxuICAgICAgLy8gQ291bnQgcmV2aWV3c1xuICAgICAgaWYgKHdvcmQucmV2aWV3SGlzdG9yeSAmJiB3b3JkLnJldmlld0hpc3RvcnkubGVuZ3RoID4gMCkge1xuICAgICAgICBzdGF0cy50b3RhbFJldmlld3MgKz0gd29yZC5yZXZpZXdIaXN0b3J5Lmxlbmd0aDtcbiAgICAgICAgc3RhdHMud29yZHNSZXZpZXdlZCsrO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBDb3VudCBkdWUgd29yZHNcbiAgICAgIGlmICh3b3JkLm5leHRSZXZpZXcgJiYgbmV3IERhdGUod29yZC5uZXh0UmV2aWV3KSA8PSBub3cpIHtcbiAgICAgICAgc3RhdHMud29yZHNEdWUrKztcbiAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gc3RhdHM7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCB0byBKU09OIGZvciBzdG9yYWdlXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IEpTT04gcmVwcmVzZW50YXRpb25cbiAgICovXG4gIHRvSlNPTigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICBjcmVhdGVkOiB0aGlzLmNyZWF0ZWQsXG4gICAgICBpc0RlZmF1bHQ6IHRoaXMuaXNEZWZhdWx0LFxuICAgICAgd29yZHM6IHRoaXMud29yZHNcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBmcm9tIEpTT05cbiAgICogQHBhcmFtIHtPYmplY3R9IGpzb24gLSBKU09OIGRhdGFcbiAgICogQHBhcmFtIHtPYmplY3R9IGRpY3Rpb25hcnkgLSBEaWN0aW9uYXJ5IGluc3RhbmNlXG4gICAqIEByZXR1cm5zIHtWb2NhYnVsYXJ5TGlzdH0gTmV3IFZvY2FidWxhcnlMaXN0IGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUpTT04oanNvbiwgZGljdGlvbmFyeSkge1xuICAgIGNvbnN0IGxpc3QgPSBuZXcgVm9jYWJ1bGFyeUxpc3QoanNvbi5uYW1lLCBkaWN0aW9uYXJ5LCBqc29uLmlzRGVmYXVsdCk7XG4gICAgbGlzdC5pZCA9IGpzb24uaWQ7XG4gICAgbGlzdC5jcmVhdGVkID0ganNvbi5jcmVhdGVkO1xuICAgIGxpc3Qud29yZHMgPSBqc29uLndvcmRzIHx8IHt9O1xuICAgIHJldHVybiBsaXN0O1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVm9jYWJ1bGFyeUxpc3Q7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2JhY2tncm91bmQvYmFja2dyb3VuZC5qc1wiKTtcbiIsIiJdLCJuYW1lcyI6WyJEaWN0aW9uYXJ5U2VydmljZSIsInJlcXVpcmUiLCJTdG9yYWdlTWFuYWdlciIsIk1lc3NhZ2VUeXBlcyIsImhhbmRsZU1lc3NhZ2UiLCJkaWN0aW9uYXJ5RGF0YSIsImRpY3Rpb25hcnkiLCJzdG9yYWdlIiwic2VydmljZXMiLCJicm93c2VyIiwicnVudGltZSIsIm9uSW5zdGFsbGVkIiwiYWRkTGlzdGVuZXIiLCJjb25zb2xlIiwibG9nIiwibGlzdHMiLCJnZXQiLCJsZW5ndGgiLCJWb2NhYnVsYXJ5TGlzdCIsImRlZmF1bHRMaXN0Iiwic2V0IiwidG9KU09OIiwiY29udGV4dE1lbnVzIiwiY3JlYXRlIiwiaWQiLCJ0aXRsZSIsImNvbnRleHRzIiwib25DbGlja2VkIiwiaW5mbyIsInRhYiIsIm1lbnVJdGVtSWQiLCJzZWxlY3Rpb25UZXh0IiwicmVzcG9uc2UiLCJ0eXBlIiwiTE9PS1VQX1dPUkQiLCJ3b3JkIiwic3VjY2VzcyIsImRhdGEiLCJyZXN1bHQiLCJ0aW1lc3RhbXAiLCJEYXRlIiwidG9JU09TdHJpbmciLCJhY3Rpb24iLCJvcGVuUG9wdXAiLCJvbk1lc3NhZ2UiLCJtZXNzYWdlIiwic2VuZGVyIiwic2VuZFJlc3BvbnNlIiwidGhlbiIsImNhdGNoIiwiZXJyb3IiLCJvbkNvbm5lY3QiLCJwb3J0IiwibmFtZSIsInBvc3RNZXNzYWdlIiwib25EaXNjb25uZWN0IiwibW9kdWxlIiwiZXhwb3J0cyIsIlNwYWNlZFJlcGV0aXRpb24iLCJBRERfVE9fTElTVCIsIkdFVF9MSVNUUyIsIkNSRUFURV9MSVNUIiwiVVBEQVRFX1dPUkQiLCJHRVRfUkVWSUVXX1FVRVVFIiwiU1VCTUlUX1JFVklFVyIsImxvb2t1cCIsInN1Z2dlc3Rpb25zIiwiZnV6enlNYXRjaCIsImxpc3RJZCIsIndvcmREYXRhIiwibGlzdEluZGV4IiwiZmluZEluZGV4IiwibCIsImxpc3QiLCJmcm9tSlNPTiIsIndvcmRFbnRyeSIsImFkZFdvcmQiLCJtZXRhZGF0YSIsInRyaW1tZWROYW1lIiwidHJpbSIsIm5ld0xpc3QiLCJwdXNoIiwidXBkYXRlcyIsInVwZGF0ZWQiLCJ1cGRhdGVXb3JkIiwibWF4V29yZHMiLCJhbGxXb3JkcyIsImxpc3REYXRhIiwid29yZHMiLCJnZXRXb3JkcyIsImxpc3ROYW1lIiwicXVldWUiLCJnZXRSZXZpZXdRdWV1ZSIsInJldmlld1Jlc3VsdCIsImdldFdvcmQiLCJjdXJyZW50SW50ZXJ2YWwiLCJnZXRDdXJyZW50SW50ZXJ2YWwiLCJsYXN0UmV2aWV3ZWQiLCJuZXh0SW50ZXJ2YWwiLCJjYWxjdWxhdGVOZXh0UmV2aWV3IiwibmV4dFJldmlldyIsInJldmlld0hpc3RvcnkiLCJkYXRlIiwidGltZVNwZW50IiwibmV4dFJldmlld0RhdGUiLCJnZXROZXh0UmV2aWV3RGF0ZSIsImNvbnN0cnVjdG9yIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJ0b0xvd2VyQ2FzZSIsIm5vcm1hbGl6ZWRXb3JkIiwibWF4U3VnZ2VzdGlvbnMiLCJsZXZlbnNodGVpbiIsImEiLCJiIiwibWF0cml4IiwiaSIsImoiLCJjaGFyQXQiLCJNYXRoIiwibWluIiwibWF4RGlzdGFuY2UiLCJmbG9vciIsImRpY3RXb3JkIiwiZGlzdGFuY2UiLCJzb3J0Iiwic2xpY2UiLCJtYXAiLCJzIiwiZ2V0QWxsV29yZHMiLCJnZXRXb3Jkc0J5UGFydE9mU3BlZWNoIiwicGFydE9mU3BlZWNoIiwibm9ybWFsaXplZFBvcyIsInJlc3VsdHMiLCJlbnRyeSIsImhhc1BhcnRPZlNwZWVjaCIsImRlZmluaXRpb25zIiwic29tZSIsImRlZiIsImdldFJhbmRvbVdvcmQiLCJyYW5kb21JbmRleCIsInJhbmRvbSIsInJhbmRvbVdvcmQiLCJzZWFyY2hCeURlZmluaXRpb24iLCJzZWFyY2hUZXJtIiwibm9ybWFsaXplZFRlcm0iLCJoYXNNYXRjaCIsIm1lYW5pbmciLCJleGFtcGxlcyIsImpvaW4iLCJpbmNsdWRlcyIsImludGVydmFscyIsImtub3duIiwibm93IiwiZmlsdGVyIiwiZGF5c1NpbmNlTGFzdFJldmlldyIsImNlaWwiLCJtYXgiLCJpbnRlcnZhbERheXMiLCJuZXh0RGF0ZSIsInNldERhdGUiLCJnZXREYXRlIiwibG9jYWwiLCJ2YWx1ZSIsInVwZGF0ZSIsInVwZGF0ZUZuIiwiY3VycmVudCIsInJlbW92ZSIsImNsZWFyIiwiZ2V0QWxsIiwidjQiLCJ1dWlkdjQiLCJpc0RlZmF1bHQiLCJFcnJvciIsImNyZWF0ZWQiLCJ3b3JkVGV4dCIsImRpY3Rpb25hcnlFbnRyeSIsInVzZXJXb3JkRGF0YSIsImRhdGVBZGRlZCIsImRpZmZpY3VsdHkiLCJjdXN0b21Ob3RlcyIsInJlbW92ZVdvcmQiLCJyZW1vdmVkIiwiYWxsb3dlZFByb3BzIiwicHJvcCIsImhhc093blByb3BlcnR5IiwidmFsdWVzIiwic29ydEJ5IiwiY3JpdGVyaWEiLCJvcmRlciIsInNvcnRGdW5jdGlvbnMiLCJhbHBoYWJldGljYWwiLCJsb2NhbGVDb21wYXJlIiwiZGlmZmljdWx0eU9yZGVyIiwiZWFzeSIsIm1lZGl1bSIsImhhcmQiLCJyZXZpZXdlZCIsInciLCJub3RSZXZpZXdlZCIsImNvbXBhcmlzb24iLCJzb3J0Rm4iLCJyZXZlcnNlIiwiZmlsdGVyQnkiLCJmaWx0ZXJUeXBlIiwiZmlsdGVyVmFsdWUiLCJzZWFyY2giLCJxdWVyeSIsIm5vcm1hbGl6ZWRRdWVyeSIsImV4IiwiZ2V0U3RhdGlzdGljcyIsInN0YXRzIiwidG90YWxXb3JkcyIsImJ5RGlmZmljdWx0eSIsInRvdGFsUmV2aWV3cyIsIndvcmRzUmV2aWV3ZWQiLCJ3b3Jkc0R1ZSIsImpzb24iXSwic291cmNlUm9vdCI6IiJ9