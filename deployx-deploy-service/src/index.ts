import { createClient, commandOptions } from "redis";
import { downloadS3Folder } from "./aws";
const subscriber = createClient();
subscriber.connect().catch(console.error);

async function main(){
    while(1){
        const response = await subscriber.brPop(
            commandOptions({isolated: true}),
            "build-queue",
            0
        )
        await downloadS3Folder(`output/${response?.element}`);
    }
}
main().catch(console.error);