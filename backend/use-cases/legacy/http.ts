import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { URL } from "url";

type QueryCallback = (response: Buffer | null, statusCode: number) => void;

const query = (
  method: string,
  toUrl: string,
  headers: Record<string, string>,
  payload: string | Buffer,
  cb: QueryCallback
): void => {
  const parsedUrl = new URL(toUrl);
  const requestModule = parsedUrl.protocol === 'https:' ? httpsRequest : httpRequest;

  console.log('query to url:', toUrl);

  const req = requestModule(
    {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      headers,
      method,
    },
    (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        // console.log('Response:', toUrl, res.statusCode);
        cb(Buffer.concat(chunks), res.statusCode ?? 0);
      });
    }
  );

  req.on('error', (err) => {
    console.error('Error to err:', toUrl, err);
    cb(null, 599); // Return a custom error code for network issues
  });

  req.write(payload);
  req.end();
};

const query_promise = (
  method: string,
  toUrl: string,
  headers: Record<string, string>,
  payload: string | Buffer
): Promise<{ response: Buffer | null; statusCode: number }> => {
  return new Promise((resolve) => {
    query(method, toUrl, headers, payload, (response, statusCode) => {
      resolve({ response, statusCode });
    });
  });
};

export { query, query_promise };
