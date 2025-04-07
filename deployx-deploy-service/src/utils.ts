import fs from "fs";
import path from "path";
import { exec } from "child_process";

function findProjectRoot(basePath: string): string | null {
  const queue: string[] = [basePath];

  while (queue.length > 0) {
    const current = queue.pop()!;
    const files = fs.readdirSync(current);

    if (files.includes("package.json")) {
      return current;
    }
    // Add subdirectories to the queue
    for (const file of files) {
      const fullPath = path.join(current, file);
      if (fs.statSync(fullPath).isDirectory()) {
        queue.push(fullPath);
      }
    }
  }
  return null;
}

export async function buildProject(id: string) {
  const basePath = path.join(__dirname, `input/${id}`);
  const projectPath = findProjectRoot(basePath);

  if (!projectPath) {
    throw new Error(
      "Could not find a package.json inside the project directory."
    );
  }
  // Write Dockerfile in the detected project root
  const dockerfilePath = path.join(projectPath, "Dockerfile");
  const dockerfileContent = `
    FROM node:18-alpine

    # Install serve
    RUN npm install -g serve

    # Set working directory
    WORKDIR /app

    # Copy all project files
    COPY . .

    # Install deps and build the app
    RUN npm install && npm run build

    # Serve the build on port 3000
    EXPOSE 3000
    CMD ["serve", "-s", "build", "-l", "3000"]
  `;
  fs.writeFileSync(dockerfilePath, dockerfileContent);

  fs.writeFileSync(
    path.join(projectPath, ".dockerignore"),
    `
    node_modules
    dist
    Dockerfile
    `
  );
  // Build the Docker image
  // Use docker buildx to build the image for linux/amd64
  // This is necessary because Faregate is running on a linux/amd64 machine
  const buildCmd = `docker buildx build --platform linux/amd64 -t project-${id} ${projectPath} --load`;

  try {
    await new Promise<void>((resolve, reject) => {
      const child = exec(buildCmd);

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
