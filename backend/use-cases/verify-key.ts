import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { getConfig } from "../config";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { CertificateAuthority, UserKeyStatus } from "../../shared/models";

const dynamoDb = new DynamoDBClient({});

export const verifyKey = async (user: string, keyId: string, issuer: CertificateAuthority) => {
    const { TABLE_NAME } = getConfig();

    const updateParams = {
        TableName: TABLE_NAME,
        Key: {
            user: { S: user },
            id: { S: keyId }
        },
        UpdateExpression: "SET #status = :verified, #issuer = :issuer",
        ExpressionAttributeNames: {
            "#status": "status",
            "#issuer": "issuer"
        },
        ExpressionAttributeValues: {
            ":verified": { S: UserKeyStatus.Verified },
            ":issuer": { S: JSON.stringify(issuer) }
        }
    };

    await dynamoDb.send(new UpdateItemCommand(updateParams));
};