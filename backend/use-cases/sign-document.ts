
import { Readable } from 'stream';

import { GetItemCommand, DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getConfig } from '../config';

const encoding = require("encoding");
const gost89 = require("gost89");
const jk = require("jkurwa");
import * as http from "./legacy/http";

const algos = gost89.compat.algos;
const Certificate = jk.models.Certificate;
const Priv = jk.models.Priv;
const Box = jk.Box;

const s3 = new S3Client({});
const dynamoDb = new DynamoDBClient({});

export const fetchFileById = async (id: string, user: string): Promise<Buffer> => {
    const { TABLE_NAME, BUCKET_NAME } = getConfig();

    const queryParams = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "#user = :user AND #id = :id",
        ExpressionAttributeNames: {
            "#user": "user",
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":user": { S: user },
            ":id": { S: id },
        }
    };

    const queryResult = await dynamoDb.send(new QueryCommand(queryParams));
    const documents = queryResult.Items || [];

    if (documents.length === 0) {
        throw new Error("Document not found");
    }

    const Item = documents[0];

    if (!Item) {
        throw new Error(`Key with id ${id} not found in DynamoDB`);
    }

    const s3Path = Item.s3Path.S;
    if (!s3Path) {
        throw new Error(`S3 path not found for key with id ${id}`);
    }

    const getObjectParams = {
        Bucket: BUCKET_NAME,
        Key: s3Path,
    };

    const s3Response = await s3.send(new GetObjectCommand(getObjectParams));

    const chunks: Buffer[] = [];
    for await (const chunk of s3Response.Body as Readable) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
};

const openKey = (buf: Buffer, password: string) => {
    return Priv.from_protected(buf, password, algos());
}

export const signDocument = async (docId: string, keyId: string, user: string, keyPassword: string) => {
    const docFileTask = fetchFileById(docId, user);
    const keyFileTask = fetchFileById(keyId, user);

    const [keyFile, docFile] = await Promise.all([keyFileTask, docFileTask]);

    var result = openKey(keyFile, keyPassword); // todo validation

    const box = new Box({ algo: algos(), query: http.query });
    box.load({ keyBuffers: [keyFile], password: keyPassword });


    // download https://iit.com.ua/download/productfiles/CAs.json
    // download https://iit.com.ua/download/productfiles/CACertificates.p7b

    await box.findCertsCmp(['http://ca.vchasno.ua/services/cmp/', 'http://acskidd.gov.ua/services/cmp/', 'http://czo.gov.ua/services/cmp/'])

    const ipn_ext = box.keys[0].cert.extension.ipn;
    const subject = box.keys[0].cert.subject;

    const signedData = await box.sign(docFile, null, null, {
        detached: false,
        tax: true,
        tsp: true,
        time: Date.now()
    });

    console.log(signedData);
    console.log(signedData.type);

    console.log('signedData type:', typeof signedData);
    // Upload signed file back to S3
    const signedFilePath = `signed/${user}/${docId}.p7s`;
    await s3.send(new PutObjectCommand({
        Bucket: getConfig().BUCKET_NAME,
        Key: signedFilePath,
        Body: signedData,
    }));

    return { ipn_ext, subject };

}