
import { Readable } from 'stream';

import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getConfig } from '../config';
import * as http from "./legacy/http";
import { CertificateAuthority } from '../../shared/models';
const gost89 = require("gost89");
const jk = require("jkurwa");

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
        throw new Error("Document not found " + id);
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
    return jk.models.Priv.from_protected(buf, password, gost89.compat.algos());
}

export const signDocument = async (docId: string, keyId: string, user: string, keyPassword: string, issuer: string) => {
    const algos = gost89.compat.algos;
    const Certificate = jk.models.Certificate;
    const Priv = jk.models.Priv;
    const Box = jk.Box;

    const docFileTask = fetchFileById(docId, user);
    const keyFileTask = fetchFileById(keyId, user);

    const [keyFile, docFile] = await Promise.all([keyFileTask, docFileTask]);

    const box = new Box({ algo: algos(), query: http.query });
    box.load({ keyBuffers: [keyFile], password: keyPassword });


    // download https://iit.com.ua/download/productfiles/CAs.json
    // download https://iit.com.ua/download/productfiles/CACertificates.p7b

    const CA = require("./CA.json");
    var certAuth = CA.find(x => x.codeEDRPOU === issuer) as CertificateAuthority | null;

    if (!certAuth) {
        throw new Error('Invalid issuer ' + issuer);
    }

    var cmps = [`https://${certAuth.cmpAddress}/services/cmp/`];

    await box.findCertsCmp(cmps)

    const ipn_ext = box.keys[0].cert.extension.ipn;
    const subject = box.keys[0].cert.subject;

    console.log("Signing document", docId, "with key", keyId, "for user", user);

    const signedData = await box.sign(docFile, null, null, {
        tax: true,
        tsp: "content",
        time: Date.now()
    });

    console.log("Document signed successfully");
    console.log("Uploading signed document to S3");
    // Upload signed file back to S3
    const signedFilePath = `signed/${user}/${docId}.pdf.p7`;
    await s3.send(new PutObjectCommand({
        Bucket: getConfig().BUCKET_NAME,
        Key: signedFilePath,
        Body: signedData.as_asn1(),
    }));
    console.log("Document uploaded to S3");

    if (box && box.sock) {
        box.sock.destroy();
    }

    return { ipn_ext, subject };

}