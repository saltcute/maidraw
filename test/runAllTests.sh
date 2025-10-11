#!/bin/bash

npm run make

NAME=${KAMAI_NAME} node test/test.js maimai render kamai
NAME=${KAMAI_NAME} node test/test.js maimai level50
NAME=${KAMAI_NAME} node test/test.js maimai chart

NAME=${KAMAI_NAME} node test/test.js chunithm render kamai
NAME=${KAMAI_NAME} node test/test.js chunithm chart

NAME=${KAMAI_NAME} node test/test.js ongeki render kamai
NAME=${KAMAI_NAME} node test/test.js ongeki chart

AUTH=${LXNS_AUTH} NAME=${LXNS_MAIMAI_NAME} node test/test.js maimai render lxns
AUTH=${LXNS_AUTH} NAME=${LXNS_CHUNITHM_NAME} node test/test.js chunithm render lxns

NAME=${MAISHIFT_NAME} node test/test.js maimai render maishift