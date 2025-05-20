import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, DeleteItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { getConfig } from "../config";

const s3 = new S3Client({});
const dynamoDb = new DynamoDBClient({});

export const deleteFile = async (user: string, id: string): Promise<void> => {
    const { TABLE_NAME, BUCKET_NAME } = getConfig();

    const getItemParams = {
        TableName: TABLE_NAME,
        Key: {
            id: { S: id },
            user: { S: user }
        }
    };

    const document = await dynamoDb.send(new GetItemCommand(getItemParams));

    if (!document.Item) {
        throw new Error(`Document with id ${id} not found.`);
    }

    const s3Key = document.Item.s3Path.S;

    const deleteS3Params = {
        Bucket: BUCKET_NAME,
        Key: s3Key
    };

    await s3.send(new DeleteObjectCommand(deleteS3Params));

    const signedS3Key = document.Item.s3SignedPath.S;
    if (signedS3Key) {
        const deleteSignedS3Params = {
            Bucket: BUCKET_NAME,
            Key: signedS3Key
        };

        await s3.send(new DeleteObjectCommand(deleteSignedS3Params));
    }

    const deleteDynamoParams = {
        TableName: TABLE_NAME,
        Key: {
            id: { S: id },
            user: { S: user }
        }
    };

    await dynamoDb.send(new DeleteItemCommand(deleteDynamoParams));

    console.log(`Document with id ${id} has been deleted successfully.`);
};
