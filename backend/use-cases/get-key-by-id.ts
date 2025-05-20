import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UserKey, UserKeyStatus } from "../../shared/models";
import { getConfig } from "../config";

const s3 = new S3Client({});
const dynamoDb = new DynamoDBClient({});

export const getKeyById = async (user: string, id: string): Promise<UserKey> => {
    const { TABLE_NAME, BUCKET_NAME } = getConfig();

    if (!id.startsWith("key-")) {
        throw new Error(`Invalid document id: ${id}`);
    }

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

    const document = documents[0];

    const s3Key = document.s3Path.S;

    const downloadCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
    });

    const presignedUrl = await getSignedUrl(s3, downloadCommand, { expiresIn: 3600 * 10 });
    var status = document.status.S as UserKeyStatus;

    var issuerStr = document.issuer.S;
    var issuer = issuerStr && JSON.parse(issuerStr);

    return {
        id: document.id.S ?? "",
        date: document.date.S ?? "",
        email: document.email.S ?? "",
        name: document.name.S ?? "",
        status,
        issuer,
        presignedUrl
    };
};
