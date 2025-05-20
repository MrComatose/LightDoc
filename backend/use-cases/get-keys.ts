import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UserKey, UserKeyStatus } from "../../shared/models";
import { getConfig } from "../config";

const s3 = new S3Client({});
const dynamoDb = new DynamoDBClient({});

export const getKeys = async (user: string): Promise<UserKey[]> => {
    const { TABLE_NAME, BUCKET_NAME } = getConfig();

    const queryParams = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "#user = :user AND begins_with(#id, :prefix)",
        ExpressionAttributeNames: {
            "#user": "user",
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":user": { S: user },
            ":prefix": { S: "key-" }
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

        var status = doc.status.S as UserKeyStatus;

        var issuerStr = doc.issuer.S;
        var issuer = issuerStr && JSON.parse(issuerStr);

        return {
            id: doc.id.S ?? "",
            date: doc.date.S ?? "",
            email: doc.email.S ?? "",
            name: doc.name.S ?? "",
            status,
            issuer,
            presignedUrl
        };
    }));

    return documentsWithUrls;
};
