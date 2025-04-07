import { createClient, commandOptions } from "redis";
import { copyFinalDistToS3, downloadS3Folder } from "./aws";
import { buildProject } from "./utils";
import { execSync } from "child_process";
import { deployEcsTask } from "./ecsRunner";
import { ECSClient, DescribeTasksCommand } from "@aws-sdk/client-ecs";
const subscriber = createClient();
subscriber.connect().catch(console.error);
const ecs = new ECSClient({ region: "us-east-1" });

async function main() {
  while (1) {
    const response = await subscriber.brPop(
      commandOptions({ isolated: true }),
      "build-queue",
      0
    );

    if (!response?.element) {
      throw new Error("Response element is undefined");
    }

    // Get the id of the project from the response
    const projectId = response.element;
    console.log("Dequeued:", projectId);

    // Download the folder from S3
    await downloadS3Folder(`input/${projectId}`);

    // Build the project
    await buildProject(projectId);

    // Tag & Push Docker Image to ECR
    const imageUri = `847160020139.dkr.ecr.us-east-1.amazonaws.com/project-images:project-${projectId}`;
    const tagCmd = `docker tag project-${projectId} ${imageUri}`;
    const pushCmd = `docker push ${imageUri}`;

    try {
      execSync(tagCmd, { stdio: "inherit" });
      execSync(pushCmd, { stdio: "inherit" });
    } catch (err) {
      console.error("Error pushing Docker image to ECR", err);
      continue;
    }

    // Deploy to ECS
    await deployEcsTask(projectId, imageUri);
    const taskArn = await deployEcsTask(projectId, imageUri);

    // Fetch public IP from ECS Task metadata
    const describeCmd = new DescribeTasksCommand({
      cluster: "deployx-cluster",
      tasks: [taskArn],
    });
    const describeResp = await ecs.send(describeCmd);
    const attachmentDetails =
      describeResp.tasks?.[0]?.attachments?.[0]?.details;
    const eni = attachmentDetails?.find(
      (d) => d.name === "networkInterfaceId"
    )?.value;

    if (!eni) {
      console.log("No ENI found for the task");
      continue;
    }

    const { EC2Client, DescribeNetworkInterfacesCommand } = await import(
      "@aws-sdk/client-ec2"
    );
    const ec2 = new EC2Client({ region: "us-east-1" });
    const eniDetails = await ec2.send(
      new DescribeNetworkInterfacesCommand({ NetworkInterfaceIds: [eni] })
    );
    const publicIp = eniDetails.NetworkInterfaces?.[0]?.Association?.PublicIp;
    if (publicIp) {
      console.log(`Your app is live at: http://${publicIp}:3000`);
    } else {
      console.log("Failed to retrieve public IP");
    }
    // await copyFinalDistToS3(projectId);
  }
}
main().catch(console.error);
