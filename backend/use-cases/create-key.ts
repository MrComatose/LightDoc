import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { uuidv7 } from "uuidv7";
import { getConfig } from "../config";
import { ALLOWED_DSTU_KEY_EXTENSIONS, CreateDocumentResponse, isValidDstuKeyExtension, UserKeyStatus } from "../../shared/models";

const s3 = new S3Client({});
const dynamoDb = new DynamoDBClient({});

export const createKey = async (filename: string, user: string, email?: string): Promise<CreateDocumentResponse> => {
    if (!isValidDstuKeyExtension(filename)) {
        throw new Error(`Invalid file extension. Allowed extensions: ${ALLOWED_DSTU_KEY_EXTENSIONS.join(", ")}`);
    }

    const { TABLE_NAME, BUCKET_NAME } = getConfig();
    const id = `key-${uuidv7()}`;
    const s3Key = `uploads/${user}/${id}/${filename}`;
    const createdAt = new Date().toISOString();

    const { url, fields } = await createPresignedPost(s3, {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Expires: 3600,
    });

    // Craetes key without check if its valid
    const putItemParams = {
        TableName: TABLE_NAME,
        Item: {
            id: { S: id },
            user: { S: user },
            email: { S: email ?? "" },
            name: { S: filename },
            date: { S: createdAt },
            s3Path: { S: s3Key },
            status: { S: UserKeyStatus.NonVerified },
        }
    };

    await dynamoDb.send(new PutItemCommand(putItemParams));

    return { id, presignedUrl: { url, fields } };
};
