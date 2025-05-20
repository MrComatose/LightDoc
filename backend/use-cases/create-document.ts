import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { uuidv7 } from "uuidv7";
import { getConfig } from "../config";
import { ALLOWED_DOC_EXTENSIONS, CreateDocumentResponse, isValidDocExtension, UserDocumentStatus } from "../../shared/models";

const s3 = new S3Client({});
const dynamoDb = new DynamoDBClient({});

export const createDocument = async (filename: string, user: string, email?: string): Promise<CreateDocumentResponse> => {
    if (!isValidDocExtension(filename)) {
        throw new Error(`Invalid file extension. Allowed extensions: ${ALLOWED_DOC_EXTENSIONS.join(", ")}`);
    }

    const { TABLE_NAME, BUCKET_NAME } = getConfig();
    const id = `document-${uuidv7()}`;
    const s3Key = `uploads/${user}/${id}/${filename}`;
    const createdAt = new Date().toISOString();

    const { url, fields } = await createPresignedPost(s3, {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Expires: 3600,
    });

    const putItemParams = {
        TableName: TABLE_NAME,
        Item: {
            id: { S: id },
            user: { S: user },
            email: { S: email ?? "" },
            name: { S: filename },
            date: { S: createdAt },
            s3Path: { S: s3Key },
            status: { S: UserDocumentStatus.NonSigned },
            hash: { S: "" },
            sign: { S: "" }
        }
    };

    await dynamoDb.send(new PutItemCommand(putItemParams));

    return { id, presignedUrl: { url, fields } };
};
