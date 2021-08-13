IMAGES := $(shell docker images -f "dangling=true" -q)
CONTAINERS := $(shell docker ps -a -q -f status=exited)
VOLUME := cardnumber

clean:
	docker rm -f $(CONTAINERS)
	docker rmi -f $(IMAGES)

build:
	docker build -t osc.repo.kopla.jyu.fi/hahelle/myjyuapi:latest .

push:
	docker build -t osc.repo.kopla.jyu.fi/hahelle/myjyuapi:latest

pull:
	docker build -t osc.repo.kopla.jyu.fi/hahelle/myjyuapi:latest

start:
	docker run -d --name myjyu-api \
			-v $(VOLUME):/usr/src/app/logs \
			-p 3006:3000 osc.repo.kopla.jyu.fi/hahelle/myjyuapi

restart:
	docker stop myjyu-api
	docker rm myjyu-api
	$(MAKE) start

bash:
	docker exec -it myjyu-api bash