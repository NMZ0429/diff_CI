import { getInput, setFailed } from "@actions/core";
import { Octokit } from "@octokit/rest";

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const pull_number = process.env.GITHUB_REF.split("/").slice(-1)[0];
const token = getInput("github-token");
const octokit = new Octokit({ auth: `token ${token}` });
octokit.pulls
	.get({
		owner: owner,
		repo: repo,
		pull_number: +pull_number,
		mediaType: {
			format: "diff",
		},
	})
	.then(({ data }) => {
		const lines = data.toString().split("\n");
		const count = lines.filter(
			(line) => line.startsWith("+ ") || line.startsWith("- ")
		).length;
		// TODO: return the result
		console.log(count);
	})
	.catch((err) => {
		setFailed(err.message);
	});
