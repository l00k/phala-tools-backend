#!/bin/bash

run_process() {
    while true; do
        yarn prod process_$1
        sleep 30
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
        run_process $2
        ;;
    api)
        run_api
        ;;
esac
