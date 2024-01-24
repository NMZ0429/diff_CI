import { getInput, setFailed, error, warning, notice } from "@actions/core";
import { Octokit } from "@octokit/rest";

const { GITHUB_REPOSITORY, GITHUB_SHA } = process.env;
if (!GITHUB_REPOSITORY) {
	setFailed("GITHUB_REPOSITORY is not defined");
}
if (!GITHUB_SHA) {
	setFailed("GITHUB_SHA is not defined");
}
const [owner, repo] = GITHUB_REPOSITORY.split("/");
const pull_number = process.env.GITHUB_REF.split("/").slice(-2)[0];
const token = getInput("github-token");
const goodNumLines = +getInput("good-num-lines");
const maxNumLines = +getInput("max-num-lines");
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
			(line) =>
				(line.startsWith("+") && !line.startsWith("+++")) ||
				(line.startsWith("-") && !line.startsWith("---"))
		).length;
		if (count > maxNumLines) {
			setFailed(
				`Error: ${owner}/${repo}#${pull_number} has too many lines (${count} > ${maxNumLines})`
			);
			error(
				`${owner}/${repo}#${pull_number} has too many lines (${count} > ${maxNumLines})`
			);
		} else if (count > goodNumLines) {
			postWarning(count);
			warning(
				`${owner}/${repo}#${pull_number} has too many lines (${count} > ${goodNumLines})`
			);
		} else {
			notice(
				`${owner}/${repo}#${pull_number} has a good number of lines (${count} < ${goodNumLines})`
			);
		}
	})
	.catch((err) => {
		setFailed(`Error: ${owner}/${repo}#${pull_number} ${err.message}`);
	});

function postWarning(lineCount: number) {
	octokit.issues.createComment({
		owner: owner,
		repo: repo,
		issue_number: +pull_number,
		body: `## Commit Size Warning\n\nThis PR has too many diff lines (${lineCount} > ${goodNumLines})`,
	});
}
