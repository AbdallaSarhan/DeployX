import { S3 } from "aws-sdk";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// This file is responsible for uploading files to AWS S3
// It uses the AWS SDK to upload files to S3
// The AWS credentials are loaded from the environment variables
const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_S3_ENDPOINT,
});

// fileName => output/12345/src/App.jsx
// localFilePath => /Users/abdalla/deployx/dist/output/12345/src/App.jsx
export const uploadFileToS3 = async (fileName: string, localFilePath: string) => {
    // Load the AWS/Cloudflare credentials from the environment variables
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
        throw new Error("AWS credentials are not set in environment variables");
    }
    // Read the file from the local filesystem
    const fileContent = fs.readFileSync(localFilePath);

    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
    };

    // Upload the file to S3
    try {
        await s3.upload(params).promise();
        console.log(`File uploaded successfully at https://s3.amazonaws.com/${process.env.AWS_S3_BUCKET_NAME}/${fileName}`);
    } catch (error) {
        console.error("Error uploading file:", error);
    }
}