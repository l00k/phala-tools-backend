#!/bin/bash

run_crawler() {
    while true; do
        yarn prod crawler
        sleep 10
    done
}

run_api() {
    while true; do
        yarn prod api
        sleep 10
    done
}

case $1 in
    process)
        run_crawler
        ;;
    api)
        run_api
        ;;
esac
