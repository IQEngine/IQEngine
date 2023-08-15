/* 
 * Free FFT and convolution (C)
 * 
 * Copyright (c) 2014 Project Nayuki
 * http://www.nayuki.io/page/free-small-fft-in-multiple-languages
 * 
 * (MIT License)
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

#include <math.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include "fft.h"


// Private function prototypes
static size_t reverse_bits(size_t x, unsigned int n);
static void *memdup(const void *src, size_t n);

#define SIZE_MAX ((size_t)-1)


int transform(double real[], double imag[], size_t n) {
	if (n == 0)
		return 1;
	else if ((n & (n - 1)) == 0)  // Is power of 2
		return transform_radix2(real, imag, n);
	else  // More complicated algorithm for arbitrary sizes
		return transform_bluestein(real, imag, n);
}


int inverse_transform(double real[], double imag[], size_t n) {
	return transform(imag, real, n);
}

tables *precalc(size_t n) {
    unsigned int levels;
    // Compute levels = floor(log2(n))
    {
	size_t temp = n;
	levels = 0;
	while (temp > 1) {
	    levels++;
	    temp >>= 1;
	}
	if (1u << levels != n)
	    return 0;  // n is not a power of 2
    }
    if (SIZE_MAX / sizeof(double) < n / 2) return 0;
    tables *tables = malloc(sizeof(tables));
    if (!tables) return tables;
    tables->levels = levels;
    size_t size = (n / 2) * sizeof(double);
    tables->cos = malloc(size);
    if (!tables->cos) {
	free(tables);
	return 0;
    }
    tables->sin = malloc(size);
    if (!tables->sin) {
	free(tables->cos);
	free(tables);
	return 0;
    }
    int i;
    for (i = 0; i < n / 2; i++) {
	tables->cos[i] = cos(2 * M_PI * i / n);
	tables->sin[i] = sin(2 * M_PI * i / n);
    }
    return tables;
}

tables_f *precalc_f(size_t n) {
    unsigned int levels;
    // Compute levels = floor(log2(n))
    {
	size_t temp = n;
	levels = 0;
	while (temp > 1) {
	    levels++;
	    temp >>= 1;
	}
	if (1u << levels != n)
	    return 0;  // n is not a power of 2
    }
    if (SIZE_MAX / sizeof(float) < n / 2) return 0;
    tables_f *tables = malloc(sizeof(tables_f));
    if (!tables) return tables;
    tables->levels = levels;
    size_t size = (n / 2) * sizeof(float);
    tables->cos = malloc(size);
    if (!tables->cos) {
	free(tables);
	return 0;
    }
    tables->sin = malloc(size);
    if (!tables->sin) {
	free(tables->cos);
	free(tables);
	return 0;
    }
    int i;
    for (i = 0; i < n / 2; i++) {
	tables->cos[i] = cos(2 * M_PI * i / n);
	tables->sin[i] = sin(2 * M_PI * i / n);
    }
    return tables;
}

void dispose(tables *tables) {
    if (!tables) return;
    free(tables->cos);
    free(tables->sin);
    free(tables);
}

void dispose_f(tables_f *tables) {
    if (!tables) return;
    free(tables->cos);
    free(tables->sin);
    free(tables);
}

void transform_radix2_precalc(double real[], double imag[], int n, tables *tables) {
	double *cos_table, *sin_table;
	int size;
	int i;
	
	// Trignometric tables
	cos_table = tables->cos;
	sin_table = tables->sin;

	// Bit-reversed addressing permutation
	for (i = 0; i < n; i++) {
		int j = reverse_bits(i, tables->levels);
		if (j > i) {
			double temp = real[i];
			real[i] = real[j];
			real[j] = temp;
			temp = imag[i];
			imag[i] = imag[j];
			imag[j] = temp;
		}
	}
	
	// Cooley-Tukey decimation-in-time radix-2 FFT
	for (size = 2; size <= n; size *= 2) {
		int halfsize = size / 2;
		int tablestep = n / size;
		for (i = 0; i < n; i += size) {
			int j;
			int k;
			for (j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
				double tpre =  real[j+halfsize] * cos_table[k] + imag[j+halfsize] * sin_table[k];
				double tpim = -real[j+halfsize] * sin_table[k] + imag[j+halfsize] * cos_table[k];
				real[j + halfsize] = real[j] - tpre;
				imag[j + halfsize] = imag[j] - tpim;
				real[j] += tpre;
				imag[j] += tpim;
			}
		}
		if (size == n)  // Prevent overflow in 'size *= 2'
			break;
	}
}

void transform_radix2_precalc_f(float real[], float imag[], int n, tables_f *tables) {
	float *cos_table, *sin_table;
	int size;
	int i;
	
	// Trignometric tables
	cos_table = tables->cos;
	sin_table = tables->sin;

	// Bit-reversed addressing permutation
	for (i = 0; i < n; i++) {
		int j = reverse_bits(i, tables->levels);
		if (j > i) {
			float temp = real[i];
			real[i] = real[j];
			real[j] = temp;
			temp = imag[i];
			imag[i] = imag[j];
			imag[j] = temp;
		}
	}
	
	// Cooley-Tukey decimation-in-time radix-2 FFT
	for (size = 2; size <= n; size *= 2) {
		int halfsize = size / 2;
		int tablestep = n / size;
		for (i = 0; i < n; i += size) {
			int j;
			int k;
			for (j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
				float tpre =  real[j+halfsize] * cos_table[k] + imag[j+halfsize] * sin_table[k];
				float tpim = -real[j+halfsize] * sin_table[k] + imag[j+halfsize] * cos_table[k];
				real[j + halfsize] = real[j] - tpre;
				imag[j + halfsize] = imag[j] - tpim;
				real[j] += tpre;
				imag[j] += tpim;
			}
		}
		if (size == n)  // Prevent overflow in 'size *= 2'
			break;
	}
}

int transform_radix2(double real[], double imag[], size_t n) {
	// Variables
	int status = 0;
	unsigned int levels;
	double *cos_table, *sin_table;
	size_t size;
	size_t i;
	
	// Compute levels = floor(log2(n))
	{
		size_t temp = n;
		levels = 0;
		while (temp > 1) {
			levels++;
			temp >>= 1;
		}
		if (1u << levels != n)
			return 0;  // n is not a power of 2
	}
	
	// Trignometric tables
	if (SIZE_MAX / sizeof(double) < n / 2)
		return 0;
	size = (n / 2) * sizeof(double);
	cos_table = malloc(size);
	sin_table = malloc(size);
	if (cos_table == NULL || sin_table == NULL)
		goto cleanup;
	for (i = 0; i < n / 2; i++) {
		cos_table[i] = cos(2 * M_PI * i / n);
		sin_table[i] = sin(2 * M_PI * i / n);
	}
	
	// Bit-reversed addressing permutation
	for (i = 0; i < n; i++) {
		size_t j = reverse_bits(i, levels);
		if (j > i) {
			double temp = real[i];
			real[i] = real[j];
			real[j] = temp;
			temp = imag[i];
			imag[i] = imag[j];
			imag[j] = temp;
		}
	}
	
	// Cooley-Tukey decimation-in-time radix-2 FFT
	for (size = 2; size <= n; size *= 2) {
		size_t halfsize = size / 2;
		size_t tablestep = n / size;
		for (i = 0; i < n; i += size) {
			size_t j;
			size_t k;
			for (j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
				double tpre =  real[j+halfsize] * cos_table[k] + imag[j+halfsize] * sin_table[k];
				double tpim = -real[j+halfsize] * sin_table[k] + imag[j+halfsize] * cos_table[k];
				real[j + halfsize] = real[j] - tpre;
				imag[j + halfsize] = imag[j] - tpim;
				real[j] += tpre;
				imag[j] += tpim;
			}
		}
		if (size == n)  // Prevent overflow in 'size *= 2'
			break;
	}
	status = 1;
	
cleanup:
	free(sin_table);
	free(cos_table);
	return status;
}


int transform_bluestein(double real[], double imag[], size_t n) {
	// Variables
	int status = 0;
	double *cos_table, *sin_table;
	double *areal, *aimag;
	double *breal, *bimag;
	double *creal, *cimag;
	size_t m;
	size_t size_n, size_m;
	size_t i;
	
	// Find a power-of-2 convolution length m such that m >= n * 2 + 1
	{
		size_t target;
		if (n > (SIZE_MAX - 1) / 2)
			return 0;
		target = n * 2 + 1;
		for (m = 1; m < target; m *= 2) {
			if (SIZE_MAX / 2 < m)
				return 0;
		}
	}
	
	// Allocate memory
	if (SIZE_MAX / sizeof(double) < n || SIZE_MAX / sizeof(double) < m)
		return 0;
	size_n = n * sizeof(double);
	size_m = m * sizeof(double);
	cos_table = malloc(size_n);
	sin_table = malloc(size_n);
	areal = calloc(m, sizeof(double));
	aimag = calloc(m, sizeof(double));
	breal = calloc(m, sizeof(double));
	bimag = calloc(m, sizeof(double));
	creal = malloc(size_m);
	cimag = malloc(size_m);
	if (cos_table == NULL || sin_table == NULL
			|| areal == NULL || aimag == NULL
			|| breal == NULL || bimag == NULL
			|| creal == NULL || cimag == NULL)
		goto cleanup;
	
	// Trignometric tables
	for (i = 0; i < n; i++) {
		double temp = M_PI * (size_t)((unsigned long long)i * i % ((unsigned long long)n * 2)) / n;
		// Less accurate version if long long is unavailable: double temp = M_PI * i * i / n;
		cos_table[i] = cos(temp);
		sin_table[i] = sin(temp);
	}
	
	// Temporary vectors and preprocessing
	for (i = 0; i < n; i++) {
		areal[i] =  real[i] * cos_table[i] + imag[i] * sin_table[i];
		aimag[i] = -real[i] * sin_table[i] + imag[i] * cos_table[i];
	}
	breal[0] = cos_table[0];
	bimag[0] = sin_table[0];
	for (i = 1; i < n; i++) {
		breal[i] = breal[m - i] = cos_table[i];
		bimag[i] = bimag[m - i] = sin_table[i];
	}
	
	// Convolution
	if (!convolve_complex(areal, aimag, breal, bimag, creal, cimag, m))
		goto cleanup;
	
	// Postprocessing
	for (i = 0; i < n; i++) {
		real[i] =  creal[i] * cos_table[i] + cimag[i] * sin_table[i];
		imag[i] = -creal[i] * sin_table[i] + cimag[i] * cos_table[i];
	}
	status = 1;
	
	// Deallocation
cleanup:
	free(cimag);
	free(creal);
	free(bimag);
	free(breal);
	free(aimag);
	free(areal);
	free(sin_table);
	free(cos_table);
	return status;
}


int convolve_real(const double x[], const double y[], double out[], size_t n) {
	double *ximag, *yimag, *zimag;
	int status = 0;
	ximag = calloc(n, sizeof(double));
	yimag = calloc(n, sizeof(double));
	zimag = calloc(n, sizeof(double));
	if (ximag == NULL || yimag == NULL || zimag == NULL)
		goto cleanup;
	
	status = convolve_complex(x, ximag, y, yimag, out, zimag, n);
cleanup:
	free(zimag);
	free(yimag);
	free(ximag);
	return status;
}


int convolve_complex(const double xreal[], const double ximag[], const double yreal[], const double yimag[], double outreal[], double outimag[], size_t n) {
	int status = 0;
	size_t size;
	size_t i;
	double *xr, *xi, *yr, *yi;
	if (SIZE_MAX / sizeof(double) < n)
		return 0;
	size = n * sizeof(double);
	xr = memdup(xreal, size);
	xi = memdup(ximag, size);
	yr = memdup(yreal, size);
	yi = memdup(yimag, size);
	if (xr == NULL || xi == NULL || yr == NULL || yi == NULL)
		goto cleanup;
	
	if (!transform(xr, xi, n))
		goto cleanup;
	if (!transform(yr, yi, n))
		goto cleanup;
	for (i = 0; i < n; i++) {
		double temp = xr[i] * yr[i] - xi[i] * yi[i];
		xi[i] = xi[i] * yr[i] + xr[i] * yi[i];
		xr[i] = temp;
	}
	if (!inverse_transform(xr, xi, n))
		goto cleanup;
	for (i = 0; i < n; i++) {  // Scaling (because this FFT implementation omits it)
		outreal[i] = xr[i] / n;
		outimag[i] = xi[i] / n;
	}
	status = 1;
	
cleanup:
	free(yi);
	free(yr);
	free(xi);
	free(xr);
	return status;
}


static size_t reverse_bits(size_t x, unsigned int n) {
	size_t result = 0;
	unsigned int i;
	for (i = 0; i < n; i++, x >>= 1)
		result = (result << 1) | (x & 1);
	return result;
}


static void *memdup(const void *src, size_t n) {
	void *dest = malloc(n);
	if (dest != NULL)
		memcpy(dest, src, n);
	return dest;
}
