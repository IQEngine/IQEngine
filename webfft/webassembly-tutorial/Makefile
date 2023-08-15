matrixMultiply.wasm: matrixMultiply.js
matrixMultiply.js: matrixMultiply.c
	emcc --no-entry matrixMultiply.c -o matrixMultiply.js  \
	  --pre-js locateFile.js  \
	  -s ENVIRONMENT='web'  \
	  -s EXPORT_NAME='testModule'  \
	  -s USE_ES6_IMPORT_META=0  \
	  -s WASM=1 \
	  -s MODULARIZE=1 \
	  -s EXPORTED_FUNCTIONS='["_add", "_matrixMultiply", "_malloc", "_free"]'  \
	  -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'  \
	  -O3

.PHONY: clean
clean:
	rm matrixMultiply.wasm matrixMultiply.js