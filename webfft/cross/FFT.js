"use strict";

var crossModule = CrossModule({});

var fftCross = crossModule.cwrap("fftCross", "void", ["number", "number", "number", "number", "number", "number"]);

function FFTCross(size) {
  this.size = size;
  this.n = size * 8;
  this.ptr = crossModule._malloc(this.n * 4);
  this.ri = new Uint8Array(crossModule.HEAPU8.buffer, this.ptr, this.n);
  this.ii = new Uint8Array(crossModule.HEAPU8.buffer, this.ptr + this.n, this.n);

  this.transform = function (real, imag, inverse) {
    var ptr = this.ptr;
    var n = this.n;
    this.ri.set(new Uint8Array(real.buffer));
    this.ii.set(new Uint8Array(imag.buffer));
    fftCross(this.size, inverse, ptr, ptr + n, ptr + n * 2, ptr + n * 3);
    var ro = new Float64Array(crossModule.HEAPU8.buffer, ptr + n * 2, this.size);
    var io = new Float64Array(crossModule.HEAPU8.buffer, ptr + n * 3, this.size);
    return { real: ro, imag: io };
  };

  this.dispose = function () {
    crossModule._free(this.ptr);
  };
}
