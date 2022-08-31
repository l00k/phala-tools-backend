#!/bin/bash

run_process() {
    while true; do
        yarn prod app process
        sleep 60
    done
}

run_api() {
    while true; do
        yarn prod app api
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
