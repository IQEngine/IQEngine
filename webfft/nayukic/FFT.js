'use strict';

var nayukiCModule = NayukiCModule({});

var nc_precalc = nayukiCModule.cwrap('precalc', 'number', ['number']);

var nc_dispose = nayukiCModule.cwrap('dispose', 'void', ['number']);

var nc_transform_radix2_precalc = nayukiCModule.cwrap('transform_radix2_precalc', 'void', [
  'number',
  'number',
  'number',
  'number',
]);

var nc_precalc_f = nayukiCModule.cwrap('precalc_f', 'number', ['number']);

var nc_dispose_f = nayukiCModule.cwrap('dispose_f', 'void', ['number']);

var nc_transform_radix2_precalc_f = nayukiCModule.cwrap('transform_radix2_precalc_f', 'void', [
  'number',
  'number',
  'number',
  'number',
]);

function FFTNayukiC(n) {
  this.n = n;
  this.rptr = nayukiCModule._malloc(n * 4 + n * 4);
  this.iptr = this.rptr + n * 4;
  this.rarr = new Float32Array(nayukiCModule.HEAPU8.buffer, this.rptr, n);
  this.iarr = new Float32Array(nayukiCModule.HEAPU8.buffer, this.iptr, n);
  this.tables = nc_precalc_f(n);

  this.forward = function (real, imag) {
    this.rarr.set(real);
    this.iarr.set(imag);
    nc_transform_radix2_precalc_f(this.rptr, this.iptr, this.n, this.tables);
    real.set(this.rarr);
    imag.set(this.iarr);
  };

  this.dispose = function () {
    nayukiCModule._free(this.rptr);
    nc_dispose_f(this.tables);
  };
}
