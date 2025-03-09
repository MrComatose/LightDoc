import express, { Request, Response } from "express";
import awsServerlessExpress from "aws-serverless-express";
import { APIGatewayEvent, Context } from "aws-lambda";
import { saveDocument } from "./use-cases/save-document";
import jwt from "jsonwebtoken";
import { getDocuments } from "./use-cases/get-documents";
import cors from "cors";  // Import cors

export const app = express();

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin === 'http://localhost:8081') {
            callback(null, true);
        } else {
            callback(null, '*'); // Allow all other origins
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Access-Control-Allow-Headers', 'Access-Control-Allow-Origin'],  // Allow required headers
}
));

app.use(express.json());

app.get("/api/documents", async (req: Request, res: Response): Promise<any> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.decode(token) as { sub?: string };

        if (!decoded || !decoded.sub) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const result = await getDocuments(decoded.sub);
        return res.json(result);
    } catch (error) {
        console.error("Error saving document:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
app.post("/api/documents", async (req: Request, res: Response): Promise<any> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.decode(token) as { sub?: string, email?: string };

        if (!decoded || !decoded.sub) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { filename } = req.body;
        if (!filename) {
            return res.status(400).json({ error: "Filename is required" });
        }

        const result = await saveDocument(filename, decoded.sub, decoded.email);
        return res.json(result);
    } catch (error) {
        console.error("Error saving document:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Create the server with aws-serverless-express
const server = awsServerlessExpress.createServer(app);

// The Lambda handler function
export const handler = (event: APIGatewayEvent, context: Context) => {
    return awsServerlessExpress.proxy(server, event, context);
};
