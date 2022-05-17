#!/bin/sh
git pull
docker rm -f admin
docker images
read IMAGE
docker image rm $IMAGE
docker build . -t server-admin
docker run -d -p 127.0.0.1:9090:9090 --restart always --link mongodb:mongodb --name admin server-admin
docker logs -f admin