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


/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This is a wrapper function. Returns 1 (true) if successful, 0 (false) otherwise (out of memory).
 */
int transform(double real[], double imag[], size_t n);

/* 
 * Computes the inverse discrete Fourier transform (IDFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This is a wrapper function. This transform does not perform scaling, so the inverse is not a true inverse.
 * Returns 1 (true) if successful, 0 (false) otherwise (out of memory).
 */
int inverse_transform(double real[], double imag[], size_t n);

/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
 * Returns 1 (true) if successful, 0 (false) otherwise (n is not a power of 2, or out of memory).
 */
int transform_radix2(double real[], double imag[], size_t n);

/* Test versions with precalculated structures -- this API is
   absolutely not for production use! */
typedef struct {
    double *cos;
    double *sin;
    int levels;
} tables;

tables *precalc(size_t n);
void dispose(tables *);
void transform_radix2_precalc(double real[], double imag[], int n, tables *tables);

typedef struct {
    float *cos;
    float *sin;
    int levels;
} tables_f;

tables_f *precalc_f(size_t n);
void dispose_f(tables_f *);
void transform_radix2_precalc_f(float real[], float imag[], int n, tables_f *tables);

/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This requires the convolution function, which in turn requires the radix-2 FFT function.
 * Uses Bluestein's chirp z-transform algorithm. Returns 1 (true) if successful, 0 (false) otherwise (out of memory).
 */
int transform_bluestein(double real[], double imag[], size_t n);

/* 
 * Computes the circular convolution of the given real vectors. Each vector's length must be the same.
 * Returns 1 (true) if successful, 0 (false) otherwise (out of memory).
 */
int convolve_real(const double x[], const double y[], double out[], size_t n);

/* 
 * Computes the circular convolution of the given complex vectors. Each vector's length must be the same.
 * Returns 1 (true) if successful, 0 (false) otherwise (out of memory).
 */
int convolve_complex(const double xreal[], const double ximag[], const double yreal[], const double yimag[], double outreal[], double outimag[], size_t n);

