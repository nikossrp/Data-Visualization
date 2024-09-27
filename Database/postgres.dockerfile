FROM postgres:15.1-alpine

LABEL author="Your Name"
LABEL description="Postgres Image from demo"
LABEL version="1.0"

# This command will copy all the sql files in our source folder and add them in /docker-entrypoint-initdb.d/ 
COPY *.sql /docker-entrypoint-initdb.d/  

