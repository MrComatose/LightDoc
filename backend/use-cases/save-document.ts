import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { uuidv7 } from "uuidv7";

const s3 = new S3Client({});
const dynamoDb = new DynamoDBClient({});

const BUCKET_NAME = process.env["bucketName"]!;
const TABLE_NAME = process.env["tableName"]!;

export const saveDocument = async (filename: string, user: string, email?: string) => {
    const fileId = uuidv7();
    const s3Key = `uploads/${user}/${fileId}/${filename}`;
    const createdAt = new Date().toISOString();

    const { url, fields } = await createPresignedPost(s3, {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Expires: 3600, // 1 hour
    });

    const putItemParams = {
        TableName: TABLE_NAME,
        Item: {
            id: { S: fileId },
            user: { S: user },
            email: { S: email ?? "" },
            name: { S: filename },
            date: { S: createdAt },
            s3Path: { S: s3Key },
            status: { S: "created" },
            hash: { S: "" },
            sign: { S: "" }
        }
    };

    await dynamoDb.send(new PutItemCommand(putItemParams));

    return { fileId, presignedUrl: { url, fields } };
};
