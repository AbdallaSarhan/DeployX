import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function buildProject(id: string) {
    const projectPath = path.join(__dirname, `output/${id}`);
    const dockerfilePath = path.join(projectPath, "Dockerfile");

    // Create a Dockerfile dynamically
    const dockerfileContent = `
    FROM node:18-alpine
    WORKDIR /app
    COPY . .
    RUN npm install && npm run build
    CMD ["echo", "Build complete"]
    `;

    fs.writeFileSync(dockerfilePath, dockerfileContent);

    // Build and run the container
    const buildCmd = `docker build -t project-${id} ${projectPath}`;
    const runCmd = `docker run --rm project-${id}`;

    try {
        await new Promise<void>((resolve, reject) => {
            const child = exec(`${buildCmd} && ${runCmd}`);

            child.stdout?.on("data", (data) => console.log("stdout: " + data));
            child.stderr?.on("data", (data) => console.log("stderr: " + data));

            child.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Build failed with exit code ${code}`));
                }
            });
        });
        return "Build completed successfully";
    } catch (error) {
        throw error;
    }
}