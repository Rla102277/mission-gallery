import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

const OWNER = 'Rla102277';
const REPO = 'mission-gallery';

const FILES_TO_PUSH = [
  'package.json',
  '.gitignore',
  'README.md',
  'admin/_redirects',
  'admin/index.html',
  'assets/js/tia-data.js',
  'assets/js/components.js',
  'assets/js/tia.js',
  'assets/css/tia.css',
  'assets/svg/wordmark_dark.svg',
  'assets/svg/medallion_gold.svg',
  'assets/svg/wordmark_light.svg',
  'assets/svg/medallion_white.svg',
  'pages/contact.html',
  'pages/hope-hike.html',
  'pages/about.html',
  'pages/gallery.html',
  'pages/prints.html',
  'pages/portfolio.html',
  'netlify.toml',
  'index.html',
  'script/build.cjs',
  'server/index.ts',
];

async function main() {
  const token = await getAccessToken();
  const octokit = new Octokit({ auth: token });

  console.log(`Pushing ${FILES_TO_PUSH.length} files to ${OWNER}/${REPO}...`);

  // Check if repo exists and get default branch
  let defaultBranch = 'main';
  let baseSha: string | undefined;
  try {
    const { data: repo } = await octokit.repos.get({ owner: OWNER, repo: REPO });
    defaultBranch = repo.default_branch;
    console.log(`Repository found. Default branch: ${defaultBranch}`);

    // Get the latest commit SHA
    try {
      const { data: ref } = await octokit.git.getRef({ owner: OWNER, repo: REPO, ref: `heads/${defaultBranch}` });
      baseSha = ref.object.sha;
      console.log(`Latest commit: ${baseSha}`);
    } catch {
      console.log('No existing commits found, creating initial commit.');
    }
  } catch (e: any) {
    if (e.status === 404) {
      console.log('Repository not found or no access. Please ensure the repo exists.');
      process.exit(1);
    }
    throw e;
  }

  // Create blobs for all files
  const treeItems: any[] = [];
  for (const filePath of FILES_TO_PUSH) {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`  Skipping ${filePath} (not found)`);
      continue;
    }

    const content = fs.readFileSync(fullPath);
    const isBinary = filePath.endsWith('.svg') || filePath.endsWith('.jpg') || filePath.endsWith('.png');

    const { data: blob } = await octokit.git.createBlob({
      owner: OWNER,
      repo: REPO,
      content: content.toString(isBinary ? 'base64' : 'utf-8'),
      encoding: isBinary ? 'base64' : 'utf-8',
    });

    treeItems.push({
      path: filePath,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: blob.sha,
    });
    console.log(`  Uploaded: ${filePath}`);
  }

  // Create tree
  const treeParams: any = {
    owner: OWNER,
    repo: REPO,
    tree: treeItems,
  };
  if (baseSha) {
    // Get the tree of the base commit to build on top of
    const { data: baseCommit } = await octokit.git.getCommit({ owner: OWNER, repo: REPO, commit_sha: baseSha });
    treeParams.base_tree = baseCommit.tree.sha;
  }

  const { data: tree } = await octokit.git.createTree(treeParams);
  console.log(`Created tree: ${tree.sha}`);

  // Create commit
  const commitParams: any = {
    owner: OWNER,
    repo: REPO,
    message: 'Sync from Replit: The Infinite Arch portfolio site',
    tree: tree.sha,
  };
  if (baseSha) {
    commitParams.parents = [baseSha];
  }

  const { data: commit } = await octokit.git.createCommit(commitParams);
  console.log(`Created commit: ${commit.sha}`);

  // Update branch reference
  try {
    await octokit.git.updateRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${defaultBranch}`,
      sha: commit.sha,
    });
    console.log(`Updated ${defaultBranch} to ${commit.sha}`);
  } catch {
    // Branch might not exist yet, create it
    await octokit.git.createRef({
      owner: OWNER,
      repo: REPO,
      ref: `refs/heads/${defaultBranch}`,
      sha: commit.sha,
    });
    console.log(`Created branch ${defaultBranch} at ${commit.sha}`);
  }

  console.log(`\nDone! All files pushed to https://github.com/${OWNER}/${REPO}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
