import { createClient, commandOptions } from "redis";
import { copyFinalDistToS3, downloadS3Folder } from "./aws";
import { buildProject } from "./utils";
const subscriber = createClient();
subscriber.connect().catch(console.error);

async function main(){
    while(1){
        const response = await subscriber.brPop(
            commandOptions({isolated: true}),
            "build-queue",
            0
        )

        if (!response?.element) {
            throw new Error("Response element is undefined");
        }

        // Get the id of the project from the response
        const projectId = response.element;

        // Download the folder from S3
        await downloadS3Folder(`input/${projectId}`);

        // Build the project
        await buildProject(projectId);

        await copyFinalDistToS3(projectId);
    }
}
main().catch(console.error);