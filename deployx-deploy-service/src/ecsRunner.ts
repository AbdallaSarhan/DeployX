// ecsRunner.ts
import {
  ECSClient,
  RegisterTaskDefinitionCommand,
  RunTaskCommand,
} from "@aws-sdk/client-ecs";
import dotenv from "dotenv";
dotenv.config();

const ecs = new ECSClient({ region: process.env.AWS_REGION });

const TASK_EXECUTION_ROLE_ARN = process.env.TASK_EXECUTION_ROLE_ARN;
const SUBNETS = process.env.SUBNETS!.split(",");
const SECURITY_GROUPS = process.env.SECURITY_GROUPS!.split(",");

export async function deployEcsTask(projectId: string, imageUri: string) {
  const familyName = `deployx-${projectId}`;

  // Register Task Definition
  const registerCmd = new RegisterTaskDefinitionCommand({
    family: familyName,
    requiresCompatibilities: ["FARGATE"],
    networkMode: "awsvpc",
    cpu: "256",
    memory: "512",
    executionRoleArn: TASK_EXECUTION_ROLE_ARN,
    containerDefinitions: [
      {
        name: "web",
        image: imageUri,
        essential: true,
        portMappings: [
          {
            containerPort: 3000,
            protocol: "tcp",
          },
        ],
      },
    ],
  });

  const taskDefResponse = await ecs.send(registerCmd);
  const taskDefArn = taskDefResponse.taskDefinition?.taskDefinitionArn;
  console.log("Task registered:", taskDefArn);

  // Run ECS Task
  const runCmd = new RunTaskCommand({
    cluster: "deployx-cluster",
    launchType: "FARGATE",
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: SUBNETS,
        securityGroups: SECURITY_GROUPS,
        assignPublicIp: "ENABLED",
      },
    },
    taskDefinition: taskDefArn!,
  });

  const runResponse = await ecs.send(runCmd);
  const taskArn = runResponse.tasks?.[0]?.taskArn;
  console.log("Task launched:", taskArn);
  if (!taskArn) {
    throw new Error("Failed to launch ECS task");
  }
  return taskArn;
}
