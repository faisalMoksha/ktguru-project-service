<!-- # Pull latest mongodb image -->

docker pull mongo:latest

<!-- # Run MongoDB image as a container -->

docker run -d --name ktguru-mongodb -p 27017:27017 mongo

docker run -d --rm --name ktguru-mongodb -p 27017:27017 -v /path/on/host:/data/db mongo

docker build -t ktguru_test_prod_image -f docker/prod/Dockerfile .
