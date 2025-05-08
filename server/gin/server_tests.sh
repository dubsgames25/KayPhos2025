##!/bin/bash
#
## user_endpoints=("http://localhost:8080/api/login" "http://localhost:8080/api/new-account")
#new_account="http://server:8080/new-account/"
#login="http://server:8080/"
#dashboard="http://server:8080/dashboard/"
#iterations=100
#
## test users
#
## Insert new users
#for ((i = 0; i < iterations; i++)); do
#    echo "Inserting user js$i."
#    curl "$new_account" --request "POST" --data "{\"firstname\": \"Joseph\",\"lastname\": \"Smith\",\"username\": \"js$i\",\"inputpassword\": \"p$i\"}"
#done
## # Insert new users again
## for ((i = 0; i < iterations; i++)); do
##     echo "Inserting user js$i again."
##     curl "$new_account" --request "POST" --data "{\"firstname\": \"Joseph\",\"lastname\": \"Smith\",\"username\": \"js$i\",\"inputpassword\": \"p$i\"}"
## done
## # Login users with correct username and password
## for ((i = 0; i < iterations; i++)); do
##     echo "User js$i login with correct username and password."
##     curl "$login" --request "POST" --data "{\"username\": \"js$i\",\"inputpassword\": \"p$i\"}"
## done
## # Login users with non-existent username
## for ((i = 0; i < iterations; i++)); do
##     echo "User js$i login with non-existent username."
##     curl "$login" --request "POST" --data "{\"username\": \"tk$i\",\"inputpassword\": \"p$i\"}"
## done
## # Login users with incorrect password
## for ((i = 0; i < iterations; i++)); do
##     echo "User js$i login with incorrect password."
##     curl "$login" --request "POST" --data "{\"username\": \"js$i\",\"inputpassword\": \"p\"}"
## done
## Access dashboard with fresh token
#for ((i = 0; i < iterations; i++)); do
#    echo "User js$i correct login and go to dashboard."
#    curl -c cookies$i.txt "$login" --request "POST" --data "{\"username\": \"js$i\",\"inputpassword\": \"p$i\"}"
#    curl -b cookies$i.txt "$dashboard" --request "GET"
#done
#sleep 5
## Access dashboard with expired token
#for ((i = 0; i < iterations; i++)); do
#    echo "User js$i dashboard with expired token."
#    curl -b cookies$i.txt "$dashboard" --request "GET"
#done
