import express, { Request, Response } from "express";
import awsServerlessExpress from "aws-serverless-express";
import { APIGatewayEvent, Context } from "aws-lambda";
import { createDocument } from "./use-cases/create-document";
import jwt from "jsonwebtoken";
import { getDocuments } from "./use-cases/get-documents";
import cors from "cors";  // Import cors
import { getDocumentById } from "./use-cases/get-document-by-id";
import { deleteDocument } from "./use-cases/delete-document";
import { createKey } from "./use-cases/create-key";
import { getKeys } from "./use-cases/get-keys";
import { getKeyById } from "./use-cases/get-key-by-id";
import { signDocument } from "./use-cases/sign-document";
import middy from "@middy/core";
import axios from "axios";
import doNotWaitForEmptyEventLoop from "@middy/do-not-wait-for-empty-event-loop";

export const app = express();

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

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

app.get("/api/documents/:fileId", async (req: Request, res: Response): Promise<any> => {
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

        const fileId = req.params.fileId;

        const result = await getDocumentById(decoded.sub, fileId);

        return res.json(result);
    } catch (error) {
        console.error("Error fetching document:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.delete("/api/documents/:fileId", async (req: Request, res: Response): Promise<any> => {
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

        const fileId = req.params.fileId;

        await deleteDocument(decoded.sub, fileId);

        return res.status(204).json({});
    } catch (error) {
        console.error("Error deleting document:", error);
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

        const result = await createDocument(filename, decoded.sub, decoded.email);
        return res.json(result);
    } catch (error) {
        console.error("Error saving document:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


app.post("/api/documents/:docId/sign", async (req: Request, res: Response): Promise<any> => {
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

        const { docId } = req.params;
        const { keyId, password, issuer } = req.body;
        if (!keyId || !password || !docId) {
            return res.status(400).json({ error: "Invalid request." });
        }

        const result = await signDocument(docId, keyId, decoded.sub, password, issuer);

        console.log("Result", result);

        return res.json(result.subject);
    } catch (error) {
        console.error("Error saving document:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});



app.get("/api/keys", async (req: Request, res: Response): Promise<any> => {
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

        const result = await getKeys(decoded.sub);
        return res.json(result);
    } catch (error) {
        console.error("Error saving key:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/keys/:fileId", async (req: Request, res: Response): Promise<any> => {
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

        const fileId = req.params.fileId;

        const result = await getKeyById(decoded.sub, fileId);

        return res.json(result);
    } catch (error) {
        console.error("Error fetching key:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.delete("/api/keys/:fileId", async (req: Request, res: Response): Promise<any> => {
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

        const fileId = req.params.fileId;

        await deleteDocument(decoded.sub, fileId);

        return res.status(204).json({});
    } catch (error) {
        console.error("Error deleting key:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
app.post("/api/keys", async (req: Request, res: Response): Promise<any> => {
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

        const result = await createKey(filename, decoded.sub, decoded.email);
        return res.json(result);
    } catch (error) {
        console.error("Error saving key:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});



app.get("/api/issuers", async (req: Request, res: Response): Promise<any> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const response = await axios.get("https://iit.com.ua/download/productfiles/CAs.json");
        return res.json(response.data);
    } catch (error) {
        console.error("Error fetching key:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Create the server with aws-serverless-express
const server = awsServerlessExpress.createServer(app);

// The Lambda handler function
const baseHandler = async (event: APIGatewayEvent, context: Context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    return await awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
};



export const handler = middy()
    .use(doNotWaitForEmptyEventLoop()) // handles common http errors and returns proper responses
    .handler(baseHandler)