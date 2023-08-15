
#ifndef CROSS_H
#define CROSS_H

#ifdef __cplusplus
extern "C" {
#endif

    extern void fftCross(unsigned int n, int inverse,
			 const double *ri, const double *ii,
			 double *ro, double *io);

#ifdef __cplusplus
}
#endif

#endif
