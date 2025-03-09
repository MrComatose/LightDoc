import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const dynamoDb = new DynamoDBClient({});

const BUCKET_NAME = process.env["bucketName"]!;
const TABLE_NAME = process.env["tableName"]!;

export const getDocuments = async (user: string) => {
    const queryParams = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "#user = :user", // Use ExpressionAttributeNames to avoid reserved keyword
        ExpressionAttributeNames: {
            "#user": "user" // Map "#user" to "user" to avoid the reserved keyword issue
        },
        ExpressionAttributeValues: {
            ":user": { S: user }
        }
    };

    const queryResult = await dynamoDb.send(new QueryCommand(queryParams));
    const documents = queryResult.Items || [];

    const documentsWithUrls = await Promise.all(documents.map(async (doc) => {
        const s3Key = doc.s3Path.S;

        const downloadCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key
        });

        const presignedUrl = await getSignedUrl(s3, downloadCommand, { expiresIn: 3600 * 10 }); // 10 hour expiration

        return {
            fileId: doc.id.S,
            s3Key: s3Key,
            date: doc.date.S,
            email: doc.email.S,
            filename: doc.filename.S,
            presignedUrl
        };
    }));

    return documentsWithUrls;
};
