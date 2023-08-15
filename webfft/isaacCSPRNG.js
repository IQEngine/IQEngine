/*///////////////////////////////////////////////////////////////////////////////////////////////////
isaacCSPRNG 1.1
/////////////////////////////////////////////////////////////////////////////////////////////////////
https://github.com/macmcmeans/isaacCSPRNG/blob/master/isaacCSPRNG-1.1.js
/////////////////////////////////////////////////////////////////////////////////////////////////////
This is a derivative work copyright (c) 2018, William P. "Mac" McMeans, under BSD license.
Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of isaacCSPRNG nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
Original work copyright (c) 2012 Yves-Marie K. Rinquin, under MIT license.
https://github.com/rubycon/isaac.js
///////////////////////////////////////////////////////////////////////////////////////////////////*/
isaacCSPRNG = function (specifiedSeed) {
  return (function (userSeed) {
    "use strict";

    /* private: internal states */
    var m = new Array(256), // internal memory
      acc = 0, // accumulator
      brs = 0, // last result
      cnt = 0, // counter
      r = new Array(256), // result array
      gnt = 0; // generation counter
    var _version = "1.1";

    ////////////////////////////////////////////////////
    /* initial random seed */

    // seed( Math.random() * 0xffffffff ); // 4294967295

    var internalSeed,
      uinta = new Uint32Array(2),
      defaultInternalSeed = new Array();
    window.crypto.getRandomValues(uinta);
    defaultInternalSeed = uinta[0] + uinta[1];

    internalSeed = userSeed || defaultInternalSeed;

    seed(internalSeed);
    ////////////////////////////////////////////////////

    /* private: 32-bit integer safe adder */
    function _add(x, y) {
      var lsb = (x & 0xffff) + (y & 0xffff),
        msb = (x >>> 16) + (y >>> 16) + (lsb >>> 16);
      return (msb << 16) | (lsb & 0xffff);
    }

    /* private:  return data converted from hex string */
    function _hexDecode(data) {
      var j,
        hexes = data.match(/.{1,4}/g) || [],
        back = "";
      for (j = 0; j < hexes.length; j++) {
        back += String.fromCharCode(parseInt(hexes[j], 16));
      }

      return back;
    }

    /* private: return data converted to hex string */
    function _hexEncode(data) {
      var hex, i;

      var result = "";
      for (i = 0; i < data.length; i++) {
        hex = data.charCodeAt(i).toString(16);
        result += ("000" + hex).slice(-4);
      }

      return result;
    }

    /* private: return the CSPRNG _internals in an object (for get/set) */
    function _internals() {
      return {
        a: acc,
        b: brs,
        c: cnt,
        m: m,
        r: r,
        g: gnt
      };
    }

    /* private: check if number is integer */
    function _isInteger(n) {
      return parseInt(n) === n;
    }

    /* private: convert string to integer array */
    /* js string (ucs-2/utf16) to a 32-bit integer (utf-8 chars, little-endian) array */
    function _toIntArray(string) {
      var w1,
        w2,
        u,
        r4 = [],
        r = [],
        i = 0,
        s = string + "\0\0\0", // pad string to avoid discarding last chars
        l = s.length - 1;
      while (i < l) {
        w1 = s.charCodeAt(i++);
        w2 = s.charCodeAt(i + 1);

        // 0x0000 - 0x007f code point: basic ascii
        if (w1 < 0x0080) {
          r4.push(w1);
        }

        // 0x0080 - 0x07ff code point
        else if (w1 < 0x0800) {
          r4.push(((w1 >>> 6) & 0x1f) | 0xc0);
          r4.push(((w1 >>> 0) & 0x3f) | 0x80);
        }

        // 0x0800 - 0xd7ff / 0xe000 - 0xffff code point
        else if ((w1 & 0xf800) != 0xd800) {
          r4.push(((w1 >>> 12) & 0x0f) | 0xe0);
          r4.push(((w1 >>> 6) & 0x3f) | 0x80);
          r4.push(((w1 >>> 0) & 0x3f) | 0x80);
        }

        // 0xd800 - 0xdfff surrogate / 0x10ffff - 0x10000 code point
        else if ((w1 & 0xfc00) == 0xd800 && (w2 & 0xfc00) == 0xdc00) {
          u = ((w2 & 0x3f) | ((w1 & 0x3f) << 10)) + 0x10000;
          r4.push(((u >>> 18) & 0x07) | 0xf0);
          r4.push(((u >>> 12) & 0x3f) | 0x80);
          r4.push(((u >>> 6) & 0x3f) | 0x80);
          r4.push(((u >>> 0) & 0x3f) | 0x80);
          i++;
        } else {
          // invalid char
        }

        /* _add integer (four utf-8 value) to array */
        if (r4.length > 3) {
          // little endian
          r.push((r4.shift() << 0) | (r4.shift() << 8) | (r4.shift() << 16) | (r4.shift() << 24));
        }
      }

      return r;
    }

    /* private: return a Vernam (XOR) transform of msg */
    function _vernam(msg) {
      var out = "";

      for (var i = 0; i < msg.length; i++) {
        var ra = range(33, 126);
        out += String.fromCharCode(ra ^ msg.charCodeAt(i));
      }

      return out;
    }

    /* public: return an array of amount elements consisting of unsigned random integers in the range [0, 255] */
    function bytes(amount) {
      var out = new Array(amount);

      for (var i = 0; i < amount; i++) {
        out[i] = range(255);
      }

      return out;
    }

    /* public: return a string of length (safe) characters consisting of random 7-bit ASCII graphemes */
    function chars(length) {
      //var str = " ~`'\"_-+={}[]<>/\\,.:;?|!@#$%^&*()0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
      var str = " ~`_-+={}[]<>/,.:;?|!@#$%^&*()0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        out = "";
      for (var i = 0; i < length; i++) {
        out += str[range(0, str.length - 1)];
      }

      return out;
    }

    /* public: return vernam transform on ciphertext string data/hex string data */
    function decipher(key, msg, flag) {
      seed(key);

      if (Number(flag) === 1) {
        return _vernam(_hexDecode(msg));
      } else {
        return _vernam(msg);
      }
    }

    /* public: return a 53-bit fraction in the range [0, 1] */
    function double() {
      return random() + ((random() * 0x200000) | 0) * 1.1102230246251565e-16; // 2^-53
    }

    /* public: return vernam transform on plaintext string data/hex string data */
    function encipher(key, msg, flag) {
      seed(key);

      if (Number(flag) === 1) {
        return _hexEncode(_vernam(msg));
      } else {
        return _vernam(msg);
      }
    }

    /* public: export object describing CSPRNG internal state */
    function get() {
      return JSON.stringify(_internals());
    }

    /* public: return an unsigned random integer in the range [0, 2^32] */
    function int32() {
      var _r = rand();
      return _r < 0 ? -_r : _r;
    }

    /* public: expose internals */
    function internals() {
      return {
        a: acc,
        b: brs,
        c: cnt,
        m: m,
        r: r
      };
    }

    /* public: isaac generator, n = number of runs */
    function prng(n) {
      var i, x, y;

      n = n && typeof n === "number" ? Math.abs(Math.floor(n)) : 1;

      while (n--) {
        cnt = _add(cnt, 1);
        brs = _add(brs, cnt);

        for (i = 0; i < 256; i++) {
          switch (i & 3) {
            case 0:
              acc ^= acc << 13;
              break;
            case 1:
              acc ^= acc >>> 6;
              break;
            case 2:
              acc ^= acc << 2;
              break;
            case 3:
              acc ^= acc >>> 16;
              break;
          }

          acc = _add(m[(i + 128) & 0xff], acc);
          x = m[i];
          m[i] = y = _add(m[(x >>> 2) & 0xff], _add(acc, brs));
          r[i] = brs = _add(m[(y >>> 10) & 0xff], x);
        }
      }
    }

    /* public: return a signed random integer in the range [-2^31, 2^31] */
    function rand() {
      if (!gnt--) {
        prng();
        gnt = 255;
      }

      return r[gnt];
    }

    /* public: return a 32-bit fraction in the range [0, 1] */
    function random() {
      return 0.5 + rand() * 2.3283064365386963e-10; // 2^-32
    }

    /* public: return inclusive range */
    function range() {
      var loBound, hiBound;

      if (arguments.length === 1) {
        loBound = 0;
        hiBound = arguments[0];
      } else {
        loBound = arguments[0];
        hiBound = arguments[1];
      }

      if (arguments[0] > arguments[1]) {
        loBound = arguments[1];
        hiBound = arguments[0];
      }

      // return integer
      if (_isInteger(loBound) && _isInteger(hiBound)) {
        return Math.floor(random() * (hiBound - loBound + 1)) + loBound;

        // return float
      } else {
        return random() * (hiBound - loBound) + loBound;
      }
    }

    /* public: zeroize the CSPRNG */
    function reset() {
      acc = brs = cnt = 0;

      for (var i = 0; i < 256; ++i) {
        m[i] = r[i] = 0;
      }

      gnt = 0;
    }

    /* public: seeding function */
    function seed(seed) {
      var a, b, c, d, e, f, g, h, i;

      /* seeding the seeds of love */
      a =
        b =
        c =
        d =
        e =
        f =
        g =
        h =
          /* the golden ratio ( 2654435769 ), 
                see https://stackoverflow.com/questions/4948780/magic-number-in-boosthash-combine 
                */
          0x9e3779b9;

      if (seed && typeof seed === "string") {
        seed = _toIntArray(seed);
      }

      if (seed && typeof seed === "number") {
        seed = [seed];
      }

      if (seed instanceof Array) {
        reset();

        for (i = 0; i < seed.length; i++) {
          r[i & 0xff] += typeof seed[i] === "number" ? seed[i] : 0;
        }
      }

      /* private: seed mixer */
      function _seed_mix() {
        a ^= b << 11;
        d = _add(d, a);
        b = _add(b, c);
        b ^= c >>> 2;
        e = _add(e, b);
        c = _add(c, d);
        c ^= d << 8;
        f = _add(f, c);
        d = _add(d, e);
        d ^= e >>> 16;
        g = _add(g, d);
        e = _add(e, f);
        e ^= f << 10;
        h = _add(h, e);
        f = _add(f, g);
        f ^= g >>> 4;
        a = _add(a, f);
        g = _add(g, h);
        g ^= h << 8;
        b = _add(b, g);
        h = _add(h, a);
        h ^= a >>> 9;
        c = _add(c, h);
        a = _add(a, b);
      }

      /* scramble it */
      for (i = 0; i < 4; i++) {
        _seed_mix();
      }

      for (i = 0; i < 256; i += 8) {
        /* use all the information in the seed */
        if (seed) {
          a = _add(a, r[i + 0]);
          b = _add(b, r[i + 1]);
          c = _add(c, r[i + 2]);
          d = _add(d, r[i + 3]);
          e = _add(e, r[i + 4]);
          f = _add(f, r[i + 5]);
          g = _add(g, r[i + 6]);
          h = _add(h, r[i + 7]);
        }

        _seed_mix();

        /* fill in m[] with messy stuff */
        m[i + 0] = a;
        m[i + 1] = b;
        m[i + 2] = c;
        m[i + 3] = d;
        m[i + 4] = e;
        m[i + 5] = f;
        m[i + 6] = g;
        m[i + 7] = h;
      }

      /* do a second pass to make all of the seed affect all of m[] */
      if (seed) {
        for (i = 0; i < 256; i += 8) {
          a = _add(a, m[i + 0]);
          b = _add(b, m[i + 1]);
          c = _add(c, m[i + 2]);
          d = _add(d, m[i + 3]);
          e = _add(e, m[i + 4]);
          f = _add(f, m[i + 5]);
          g = _add(g, m[i + 6]);
          h = _add(h, m[i + 7]);

          _seed_mix();

          /* fill in m[] with messy stuff (again) */
          m[i + 0] = a;
          m[i + 1] = b;
          m[i + 2] = c;
          m[i + 3] = d;
          m[i + 4] = e;
          m[i + 5] = f;
          m[i + 6] = g;
          m[i + 7] = h;
        }
      }

      /* fill in the first set of results */
      prng();

      /* prepare to use the first set of results */ gnt = 256;
    }

    /* public: import object and use it to set CSPRNG internal state */
    function set(incoming) {
      var imported = JSON.parse(incoming);
      acc = imported.a;
      brs = imported.b;
      cnt = imported.c;
      m = imported.m;
      r = imported.r;
      gnt = imported.g;
    }

    /* public: show version */
    function version() {
      return _version;
    }

    /* return class object */
    return {
      bytes: bytes,
      chars: chars,
      decipher: decipher,
      double: double,
      encipher: encipher,
      export: get,
      import: set,
      int32: int32,
      internals: internals,
      prng: prng,
      rand: rand,
      range: range,
      random: random,
      reset: reset,
      seed: seed,
      version: version
    };
  })(specifiedSeed);
};
