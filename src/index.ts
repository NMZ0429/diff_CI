import { getInput, setFailed, error, warning, notice } from "@actions/core";
import { Octokit } from "@octokit/rest";
import { minimatch } from "minimatch";

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
const ignorePatterns = JSON.parse(getInput("ignore"));
const disableBranch = JSON.parse(getInput("disable-branches"));

const octokit = new Octokit({ auth: `token ${token}` });
const getBaseBranch = async (
	owner: string,
	repo: string,
	pull_number: number
) => {
	const { data } = await octokit.pulls.get({
		owner,
		repo,
		pull_number,
	});

	return data.base.ref;
};

if (disableBranch.length > 0) {
	const baseBranch = await getBaseBranch(owner, repo, +pull_number);
	for (const branch of disableBranch) {
		if (baseBranch === branch) {
			notice(
				`${owner}/${repo}#${pull_number} is targeting ${branch}, skipping`
			);
			process.exit(0);
		}
	}
}

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
		const linesPerFile = splitList(lines);
		const totalCount = linesPerFile.reduce(
			(totalCount, lines) => totalCount + countLines(lines, ignorePatterns),
			0
		);
		if (totalCount > maxNumLines) {
			setFailed(
				`Error: ${owner}/${repo}#${pull_number} has too many lines (${totalCount} > ${maxNumLines})`
			);
			error(
				`${owner}/${repo}#${pull_number} has too many lines (${totalCount} > ${maxNumLines})`
			);
		} else if (totalCount > goodNumLines) {
			postWarning(totalCount);
			warning(
				`${owner}/${repo}#${pull_number} has too many lines (${totalCount} > ${goodNumLines})`
			);
		} else {
			notice(
				`${owner}/${repo}#${pull_number} has a good number of lines (${totalCount} < ${goodNumLines})`
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

function splitList(inputList: string[]): string[][] {
	let result: string[][] = [];
	let tempList: string[] = [];

	inputList.forEach((item) => {
		if (item.startsWith("diff --git")) {
			if (tempList.length > 0) {
				result.push(tempList);
			}
			tempList = [item];
		} else {
			tempList.push(item);
		}
	});

	// Push the last sublist if it's not empty
	if (tempList.length > 0) {
		result.push(tempList);
	}

	return result;
}

function countLines(lines: string[], ignorePatterns: string[]): number {
	if (ignoreCount(lines, ignorePatterns)) return 0;
	const count = lines.filter(
		(line) =>
			(line.startsWith("+") && !line.startsWith("+++")) ||
			(line.startsWith("-") && !line.startsWith("---"))
	).length;
	return count;
}

function ignoreCount(lines: string[], ignorePatterns: string[]): boolean {
	// Extract file name and path from the first line of liens
	// The first line is in the format of "diff --git a/path/to/file b/path/to/file"
	const firstLine = lines[0];
	const fileNameA = firstLine.split(" ")[2];
	const fileNameB = firstLine.split(" ")[3];
	const fileName = fileNameA === "/dev/null" ? fileNameB : fileNameA;
	// check if the file name matches any of the ignore patterns
	const ignore = ignorePatterns.some((pattern) => minimatch(fileName, pattern));
	return ignore;
}
