/*
  Poll Netlify API for a deploy preview of the current PR branch and run a simple smoke test.
  Required secrets: NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID
*/

const token = process.env.NETLIFY_AUTH_TOKEN;
const siteId = process.env.NETLIFY_SITE_ID;
const headRef = process.env.GITHUB_HEAD_REF || '';
const sha = process.env.GITHUB_SHA || '';

if (!token || !siteId) {
  console.error('Missing NETLIFY_AUTH_TOKEN or NETLIFY_SITE_ID. Add repo secrets and re-run.');
  process.exit(1);
}

const apiBase = 'https://api.netlify.com/api/v1';

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function getDeploys() {
  const url = `${apiBase}/sites/${siteId}/deploys?per_page=50`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Failed to fetch deploys (${resp.status}): ${txt}`);
  }
  return resp.json();
}

function pickPreviewDeploy(deploys) {
  const previews = deploys.filter((d) => d.context === 'deploy-preview');
  if (previews.length === 0) return null;

  // Prefer exact branch match if available
  const byBranch = headRef ? previews.find((d) => d.branch === headRef) : null;
  if (byBranch) return byBranch;

  // Fallback: try to match commit SHA if present in deploy metadata
  const bySha = sha ? previews.find((d) => (d.commit_ref || '').startsWith(sha.substring(0, 7))) : null;
  if (bySha) return bySha;

  // Otherwise take the most recent preview
  return previews[0];
}

function resolveDeployUrl(d) {
  return d.ssl_url || d.https_url || d.deploy_ssl_url || d.deploy_url || d.url;
}

async function waitForReadyPreview(maxMinutes = 10) {
  const maxAttempts = Math.ceil((maxMinutes * 60) / 10); // poll every 10s
  for (let i = 1; i <= maxAttempts; i++) {
    const deploys = await getDeploys();
    const d = pickPreviewDeploy(deploys);
    if (!d) {
      console.log(`[${i}/${maxAttempts}] No deploy-preview found yet for branch="${headRef}". Retrying...`);
      await sleep(10_000);
      continue;
    }

    const url = resolveDeployUrl(d);
    console.log(`[${i}/${maxAttempts}] Found preview: state=${d.state}, id=${d.id}, branch=${d.branch}, url=${url}`);

    if (d.state === 'ready' && url) {
      return url;
    }
    await sleep(10_000);
  }
  throw new Error('Timed out waiting for Netlify deploy preview to become ready');
}

async function smokeTest(url) {
  const target = url.endsWith('/') ? url : `${url}/`;
  console.log(`Running smoke test against ${target}`);
  const resp = await fetch(target, { redirect: 'follow' });
  if (!resp.ok) {
    throw new Error(`Smoke test failed: GET ${target} -> ${resp.status}`);
  }
  console.log(`Smoke test passed with status ${resp.status}`);
}

(async () => {
  try {
    const previewUrl = await waitForReadyPreview(10);
    await smokeTest(previewUrl);
  } catch (err) {
    console.error(String(err && err.stack) || String(err));
    process.exit(1);
  }
})();
