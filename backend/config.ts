export const getConfig = () => {
    const BUCKET_NAME = process.env["bucketName"]!;
    const TABLE_NAME = process.env["tableName"]!;

    return { BUCKET_NAME, TABLE_NAME };
}