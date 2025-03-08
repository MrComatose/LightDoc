# TODO
* download certificated
* create ts lambda that will:
1. download certificates from https://iit.com.ua/download/productfiles/CACertificates.p7b?d=27022025
1.1 openssl pkcs7 -in CACertificates.p7b -inform DER -print_certs -out certs.pem
2. There will be crud endpoints for documents it will save them to dynamo db and s3 
3. endpoint to get jwt token by ключ електронного підпису


