#!/bin/sh

openssl genrsa -out server.key
openssl req -new -key server.key -out server.csr -subj "/C=IT/ST=Italy/L=Bari/O=poliba/OU=poliba/CN=eth-voting.com/emailAddress=info@eth-voting.com"
openssl x509 -req -days 3650 -in server.csr -signkey server.key -out server.crt
