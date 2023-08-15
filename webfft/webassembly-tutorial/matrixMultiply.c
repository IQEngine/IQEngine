#include <emscripten/emscripten.h>
#include <stdlib.h>

EMSCRIPTEN_KEEPALIVE float *matrixMultiply(float *arg1, float *arg2, float *result, int length)
/**
 * matrixMultiply multiplies two square matrices (arg1, arg2) and places the result in (result).
 *
 * arg1, arg2: pointers to NxN input matrices, as a flat array of N^2 floats
 * result: pointer to NxN output matrix
 * length: the side-length N of the NxN matrices to multiply
 */
{
    // zero out the result array
    for (unsigned int i = 0; i < length * length; i++)
    {
        result[i] = 0;
    }

    // naive matrix multiply (on square inputs)
    for (unsigned int i = 0; i < length; i++)
    {

        for (unsigned int j = 0; j < length; j++)
        {

            for (unsigned int k = 0; k < length; k++)
            {
                result[i * length + j] += (arg1[i * length + k] * arg2[k * length + j]);
            }
        }
    }

    return result;
}

EMSCRIPTEN_KEEPALIVE int add(int a, int b)
{
    // trivial function for testing
    return a + b;
}