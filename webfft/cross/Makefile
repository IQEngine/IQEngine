
Cross.js:	Cross.c Cross.h
	emcc -O3 --memory-init-file 0 -s NO_FILESYSTEM=1 -s NO_BROWSER=1 -s MODULARIZE=1 -s EXPORT_NAME="'CrossModule'" -s EXPORTED_FUNCTIONS="['_fftCross']" -o Cross.js Cross.c

clean:
	rm -f Cross.js
