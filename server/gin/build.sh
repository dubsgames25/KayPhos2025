#!/bin/bash

# BUILD WEB APP
go mod tidy
# go build -tags=jsoniter cmd/server/main.go
go build cmd/server/main.go

# POSTGRES SETUP
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    echo "Running on Windows"
    cd ../../database/startup
    bash windows_db.sh
    cd ../../server/gin
    export DB_CONNECTION_STR="postgresql://postgres:localhost@localhost:5432/kayphos"
else
    echo "Running on Unix-like OS"
    cd ../../database/startup
    ./unix_db.sh
    cd ../../server/gin
    DBUSER=$(whoami)
    export DB_CONNECTION_STR="postgresql://$DBUSER@localhost/kayphos"
fi

# JWT SECRET KEY
jwt_secret=$(openssl rand -base64 32)
export JWT_SECRET="$jwt_secret"

# RUN WEB APP
./main
