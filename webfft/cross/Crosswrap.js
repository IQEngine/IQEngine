"use strict";

document.write("<p>start</p>");

var fftCross = Module.cwrap(
    'fftCross', 'void', ['number', 'number', 'number', 'number', 'number', 'number' ]
);

function FFTCross(size) {
    this.size = size;
    this.n = size * 8;
    this.ptr = Module._malloc(this.n * 4);
    this.ri = new Uint8Array(Module.HEAPU8.buffer, this.ptr, this.n);
    this.ii = new Uint8Array(Module.HEAPU8.buffer, this.ptr + this.n, this.n);
    this.transform = function(real, imag, inverse) {
	var ptr = this.ptr;
	var n = this.n;
	this.ri.set(new Uint8Array(real.buffer));
	this.ii.set(new Uint8Array(imag.buffer));
	fftCross(this.size, inverse,
		 ptr, ptr + n, ptr + n * 2, ptr + n * 3);
	var ro = new Float64Array(Module.HEAPU8.buffer,
				  ptr + n * 2, this.size);
	var io = new Float64Array(Module.HEAPU8.buffer,
				  ptr + n * 2, this.size);
	return { real: ro, imag: io };
    }
    this.discard = function() {
	Module._free(this.ptr);
    }
}

var f = new FFTCross(8);
var real = new Float64Array([1,1,1,1,1,1,1,1]);
var imag = new Float64Array([0,0,0,0,0,0,0,0]);
var out = f.transform(real, imag, false);
document.write("output: ");
for (var i = 0; i < 8; ++i) {
    document.write(out.real[i] + "," + out.imag[i] + " ");
}


document.write("<p>end</p>");
