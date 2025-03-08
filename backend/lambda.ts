import express from 'express';
import awsServerlessExpress from 'aws-serverless-express';
import { APIGatewayEvent, Context } from 'aws-lambda';
import { decryptKey } from './open-user-key';

export const app = express();

// Your Express routes
app.get('/', (req, res) => {

    decryptKey("../parovenko.dat", "6041")
    res.json({ message: 'Hello from Lambda with Express 2!' });
});

// Create the server with aws-serverless-express
const server = awsServerlessExpress.createServer(app);

// The Lambda handler function
export const handler = (event: APIGatewayEvent, context: Context) => {
    return awsServerlessExpress.proxy(server, event, context);
};