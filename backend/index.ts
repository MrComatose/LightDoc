import { app } from "./lambda";

process.env["bucketName"] = "lightdoc-files-453543543";
process.env["tableName"] = "LightDocUserDocuemntsTable";

app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});