.PHONY: clean
clean:
	rm -rf ./dist

.PHONY: build
build: clean
	./node_modules/.bin/tsc --build --verbose
	cp ./src/index.html ./dist/index.html
	cp ./src/styles.css ./dist/styles.css
	mkdir -p ./dist/images
	cp ./src/images/chopper.jpeg ./dist/images/chopper.jpeg
	cp ./src/images/move.svg ./dist/images/move.svg