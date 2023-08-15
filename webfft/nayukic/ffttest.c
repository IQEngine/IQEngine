/* 
 * FFT and convolution test (C)
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
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "fft.h"


// Private function prototypes
static void test_fft(int n);
static void test_convolution(int n);
static void naive_dft(const double *inreal, const double *inimag, double *outreal, double *outimag, int inverse, int n);
static void naive_convolve(const double *xreal, const double *ximag, const double *yreal, const double *yimag, double *outreal, double *outimag, int n);
static double log10_rms_err(const double *xreal, const double *ximag, const double *yreal, const double *yimag, int n);
static double *random_reals(int n);
static void *memdup(const void *src, size_t n);

static double max_log_error = -INFINITY;


/* Main and test functions */

int main(int argc, char **argv) {
	int i;
	int prev;
	srand(time(NULL));
	
	// Test power-of-2 size FFTs
	for (i = 0; i <= 12; i++)
		test_fft(1 << i);
	
	// Test small size FFTs
	for (i = 0; i < 30; i++)
		test_fft(i);
	
	// Test diverse size FFTs
	prev = 0;
	for (i = 0; i <= 100; i++) {
		int n = (int)lround(pow(1500, i / 100.0));
		if (n > prev) {
			test_fft(n);
			prev = n;
		}
	}
	
	// Test power-of-2 size convolutions
	for (i = 0; i <= 12; i++)
		test_convolution(1 << i);
	
	// Test diverse size convolutions
	prev = 0;
	for (i = 0; i <= 100; i++) {
		int n = (int)lround(pow(1500, i / 100.0));
		if (n > prev) {
			test_convolution(n);
			prev = n;
		}
	}
	
	printf("\n");
	printf("Max log err = %.1f\n", max_log_error);
	printf("Test %s\n", max_log_error < -10 ? "passed" : "failed");
	return 0;
}


static void test_fft(int n) {
	double *inputreal, *inputimag;
	double *refoutreal, *refoutimag;
	double *actualoutreal, *actualoutimag;
	
	inputreal = random_reals(n);
	inputimag = random_reals(n);
	
	refoutreal = malloc(n * sizeof(double));
	refoutimag = malloc(n * sizeof(double));
	naive_dft(inputreal, inputimag, refoutreal, refoutimag, 0, n);
	
	actualoutreal = memdup(inputreal, n * sizeof(double));
	actualoutimag = memdup(inputimag, n * sizeof(double));
	transform(actualoutreal, actualoutimag, n);
	
	printf("fftsize=%4d  logerr=%5.1f\n", n, log10_rms_err(refoutreal, refoutimag, actualoutreal, actualoutimag, n));
	
	free(inputreal);
	free(inputimag);
	free(refoutreal);
	free(refoutimag);
	free(actualoutreal);
	free(actualoutimag);
}


static void test_convolution(int n) {
	double *input0real, *input0imag;
	double *input1real, *input1imag;
	double *refoutreal, *refoutimag;
	double *actualoutreal, *actualoutimag;
	
	input0real = random_reals(n);
	input0imag = random_reals(n);
	input1real = random_reals(n);
	input1imag = random_reals(n);
	
	refoutreal = malloc(n * sizeof(double));
	refoutimag = malloc(n * sizeof(double));
	naive_convolve(input0real, input0imag, input1real, input1imag, refoutreal, refoutimag, n);
	
	actualoutreal = malloc(n * sizeof(double));
	actualoutimag = malloc(n * sizeof(double));
	convolve_complex(input0real, input0imag, input1real, input1imag, actualoutreal, actualoutimag, n);
	
	printf("convsize=%4d  logerr=%5.1f\n", n, log10_rms_err(refoutreal, refoutimag, actualoutreal, actualoutimag, n));
	
	free(input0real);
	free(input0imag);
	free(input1real);
	free(input1imag);
	free(refoutreal);
	free(refoutimag);
	free(actualoutreal);
	free(actualoutimag);
}


/* Naive reference computation functions */

static void naive_dft(const double *inreal, const double *inimag, double *outreal, double *outimag, int inverse, int n) {
	double coef = (inverse ? 2 : -2) * M_PI;
	int k;
	for (k = 0; k < n; k++) {  // For each output element
		double sumreal = 0;
		double sumimag = 0;
		int t;
		for (t = 0; t < n; t++) {  // For each input element
			double angle = coef * ((long long)t * k % n) / n;
			sumreal += inreal[t]*cos(angle) - inimag[t]*sin(angle);
			sumimag += inreal[t]*sin(angle) + inimag[t]*cos(angle);
		}
		outreal[k] = sumreal;
		outimag[k] = sumimag;
	}
}


static void naive_convolve(const double *xreal, const double *ximag, const double *yreal, const double *yimag, double *outreal, double *outimag, int n) {
	int i;
	for (i = 0; i < n; i++) {
		double sumreal = 0;
		double sumimag = 0;
		int j;
		for (j = 0; j < n; j++) {
			int k = (i - j + n) % n;
			sumreal += xreal[k] * yreal[j] - ximag[k] * yimag[j];
			sumimag += xreal[k] * yimag[j] + ximag[k] * yreal[j];
		}
		outreal[i] = sumreal;
		outimag[i] = sumimag;
	}
}


/* Utility functions */

static double log10_rms_err(const double *xreal, const double *ximag, const double *yreal, const double *yimag, int n) {
	double err = 0;
	int i;
	for (i = 0; i < n; i++)
		err += (xreal[i] - yreal[i]) * (xreal[i] - yreal[i]) + (ximag[i] - yimag[i]) * (ximag[i] - yimag[i]);
	
	err /= n > 0 ? n : 1;
	err = sqrt(err);  // Now this is a root mean square (RMS) error
	err = err > 0 ? log10(err) : -99.0;
	if (err > max_log_error)
		max_log_error = err;
	return err;
}


static double *random_reals(int n) {
	double *result = malloc(n * sizeof(double));
	int i;
	for (i = 0; i < n; i++)
		result[i] = (rand() / (RAND_MAX + 1.0)) * 2 - 1;
	return result;
}


static void *memdup(const void *src, size_t n) {
	void *dest = malloc(n);
	if (dest != NULL)
		memcpy(dest, src, n);
	return dest;
}
