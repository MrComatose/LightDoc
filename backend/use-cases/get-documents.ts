import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getConfig } from "../config";
import { UserDocument, UserDocumentStatus } from "../../shared/models";

const s3 = new S3Client({});
const dynamoDb = new DynamoDBClient({});

export const getDocuments = async (user: string): Promise<UserDocument[]> => {
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
            ":prefix": { S: "document-" }
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

        var status = doc.status.S as UserDocumentStatus;
        const presignedUrl = await getSignedUrl(s3, downloadCommand, { expiresIn: 3600 * 10 }); // 10 hour expiration


        let signedFileUrl = status === UserDocumentStatus.Signed ? await getSignedUrl(s3, new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: doc.s3SignedPath.S
        }), { expiresIn: 3600 * 10 }) : '';

        return {
            id: doc.id.S ?? "",
            date: doc.date.S ?? "",
            email: doc.email.S ?? "",
            name: doc.name.S ?? "",
            status,
            presignedUrl,
            signedFileUrl
        };
    }));

    return documentsWithUrls;
};
