pwd := ${CURDIR}

dockerbuild:
	docker build -t agario .

start:	dockerbuild
	docker run -it -p 8080:8080 -v $(pwd)/Server:/Server agario gradle build run

clean:
	rm -rf Server/build