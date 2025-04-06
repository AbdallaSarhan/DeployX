import { useState } from "react";
import "./App.css";

function App() {
  const [githubUrl, setGithubUrl] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState("");
  const [deploymentId, setDeploymentId] = useState("");
  const [error, setError] = useState("");

  const handleDeploy = async () => {
    if (!githubUrl) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    try {
      setIsDeploying(true);
      setDeploymentStatus("Initiating deployment...");
      setError("");

      const response = await fetch("http://localhost:3000/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl: githubUrl }),
      });

      if (!response.ok) {
        throw new Error(`Deployment failed: ${response.statusText}`);
      }

      const data = await response.json();
      setDeploymentId(data.id);
      setDeploymentStatus(
        `Deployment started! Your site will be available at: ${data.id}.localhost:3001`
      );

      // Start polling for status updates
      startStatusPolling(data.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setIsDeploying(false);
    }
  };

  const startStatusPolling = (id: string) => {
    // In a real implementation, you would poll a status endpoint
    // For now, we'll simulate the deployment process
    const statuses = [
      "Cloning repository...",
      "Uploading files to storage...",
      "Building project...",
      "Deployment in progress...",
      "Deployment completed!",
    ];

    let currentStatusIndex = 0;

    const interval = setInterval(() => {
      if (currentStatusIndex < statuses.length) {
        setDeploymentStatus(statuses[currentStatusIndex]);
        currentStatusIndex++;
      } else {
        clearInterval(interval);
        setIsDeploying(false);
      }
    }, 2000);
  };

  return (
    <div className="landing-container">
      <div className="card">
        <h4>Enter the URL of your GitHub repository to deploy it</h4>
        <input
          type="url"
          placeholder="https://github.com/your-repo"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
        />
        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className={isDeploying ? "deploying" : ""}
        >
          {isDeploying ? "Deploying..." : "Deploy"}
        </button>

        {error && <div className="error-message">{error}</div>}

        {deploymentStatus && (
          <div className="status-container">
            <div className="status-message">{deploymentStatus}</div>
            {deploymentId && (
              <div className="deployment-link">
                <a
                  href={`http://${deploymentId}.localhost:3001`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View your deployed site
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
