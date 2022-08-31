#!/bin/bash

run_process() {
    while true; do
        yarn prod process
        sleep 60
    done
}

run_api() {
    while true; do
        yarn prod api
        sleep 1
    done
}

case $1 in
    process)
        run_process
        ;;
    api)
        run_api
        ;;
esac
