import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getConfig } from "../config";
import { UserDocument } from "../../shared/models";

const s3 = new S3Client({});
const dynamoDb = new DynamoDBClient({});

export const getKeyById = async (user: string, id: string): Promise<UserDocument> => {
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

    return {
        id: document.id.S ?? "",
        date: document.date.S ?? "",
        email: document.email.S ?? "",
        name: document.name.S ?? "",
        status: document.status.S ?? "",
        presignedUrl
    };
};
