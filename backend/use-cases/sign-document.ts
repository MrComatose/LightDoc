
import { Readable } from 'stream';

import { DynamoDBClient, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getConfig } from '../config';
import * as http from "./legacy/http";
import { CertificateAuthority, UserDocumentStatus } from '../../shared/models';
import { verifyKey } from './verify-key';
const gost89 = require("gost89");
const jk = require("jkurwa");

const CA = require("./CA.json");
const s3 = new S3Client({});
const dynamoDb = new DynamoDBClient({});

export const fetchFileById = async (id: string, user: string): Promise<{ id: string, name: string, body: Buffer }> => {
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

    return { id: Item.id.S ?? '', name: Item.name.S ?? '', body: Buffer.concat(chunks) };
};

const openKey = (buf: Buffer, password: string) => {
    return jk.models.Priv.from_protected(buf, password, gost89.compat.algos());
}

export const saveSignedDocument = async (user: string, id: string, s3SignedPath: string) => {
    const { TABLE_NAME } = getConfig();

    const updateParams = {
        TableName: TABLE_NAME,
        Key: {
            user: { S: user },
            id: { S: id }
        },
        UpdateExpression: "SET #status = :signed, #s3SignedPath = :path",
        ExpressionAttributeNames: {
            "#status": "status",
            "#s3SignedPath": "s3SignedPath"
        },
        ExpressionAttributeValues: {
            ":signed": { S: UserDocumentStatus.Signed },
            ":path": { S: s3SignedPath }
        }
    };

    await dynamoDb.send(new UpdateItemCommand(updateParams));
};

export const signDocument = async (docId: string, keyId: string, user: string, keyPassword: string, issuer: string) => {
    const algos = gost89.compat.algos;
    const Box = jk.Box;

    const docFileTask = fetchFileById(docId, user);
    const keyFileTask = fetchFileById(keyId, user);

    const [keyFile, docFile] = await Promise.all([keyFileTask, docFileTask]);

    const box = new Box({ algo: algos(), query: http.query });
    box.load({ keyBuffers: [keyFile.body], password: keyPassword });

    var certAuth = CA.find(x => x.codeEDRPOU === issuer) as CertificateAuthority | null;

    if (!certAuth) {
        throw new Error('Invalid issuer ' + issuer);
    }

    var cmps = [`https://${certAuth.cmpAddress}/services/cmp/`];

    await box.findCertsCmp(cmps)

    const ipn_ext = box.keys[0].cert.extension.ipn;
    const subject = box.keys[0].cert.subject;

    await verifyKey(user, keyId, certAuth);

    const signedData = await box.sign(docFile.body, null, null, {
        tax: true,
        tsp: "content",
        time: Date.now()
    });

    const signedFilePath = `${user}/signed/${docFile.id}/${docFile.name}`;
    await s3.send(new PutObjectCommand({
        Bucket: getConfig().BUCKET_NAME,
        Key: signedFilePath,
        Body: signedData.as_asn1(),
    }));

    if (box && box.sock) {
        box.sock.destroy();

    }

    await saveSignedDocument(user, docId, signedFilePath);

    return { docId, ipn_ext, subject };
}