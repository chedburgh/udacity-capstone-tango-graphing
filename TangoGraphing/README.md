test run:

docker run -it -e INPUT_BUCKET=tango-graphing-staging-sjames-dev -e OUTPUT_BUCKET=tango-graphing-storage-sjames-dev -e INPUT_FILE_FORMAT=xmi -e OUTPUT_FILE_FORMAT=png -e FILENAME=HdbppHealthCheck.xmi chedburgh/tango-device-graphing:latest


https://tango-graphing-staging-sjames-dev.s3-eu-west-1.amazonaws.com
https://tango-graphing-storage-sjames-dev.s3-eu-west-1.amazonaws.com

tango-graphing-staging-sjames-dev tango-graphing-storage-sjames-dev hello.xmi xmi png 