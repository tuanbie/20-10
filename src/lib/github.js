// Commit ảnh + photos.json vào repo bằng GitHub API, gộp tất cả trong MỘT commit.
const API = "https://api.github.com";

const decodeB64Utf8 = (b64) =>
  new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));

export async function commitPhotos({ owner, repo, branch, token }, { photos, files }, message) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const gh = async (method, url, body) => {
    const res = await fetch(API + url, {
      method,
      headers: body ? { ...headers, "Content-Type": "application/json" } : headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let detail = "";
      try {
        detail = (await res.json()).message || "";
      } catch {
        /* không có nội dung */
      }
      const hint =
        res.status === 401 ? " (token sai hoặc đã hết hạn)" :
        res.status === 403 ? " (token chưa có quyền Contents: Read and write)" :
        res.status === 404 ? " (không tìm thấy repo hoặc nhánh)" : "";
      const err = new Error(`GitHub báo lỗi ${res.status}${hint}${detail ? ": " + detail : ""}`);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  };

  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const refPath = branch.split("/").map(encodeURIComponent).join("/");

  const ref = await gh("GET", `${base}/git/ref/heads/${refPath}`);
  const headSha = ref.object.sha;
  const head = await gh("GET", `${base}/git/commits/${headSha}`);

  let old = [];
  try {
    const file = await gh("GET", `${base}/contents/public/photos/photos.json?ref=${encodeURIComponent(branch)}`);
    old = JSON.parse(decodeB64Utf8(file.content));
  } catch (err) {
    if (err.status !== 404) throw err;
  }

  const tree = [];
  for (const [file, content] of Object.entries(files)) {
    const blob = await gh("POST", `${base}/git/blobs`, { content, encoding: "base64" });
    tree.push({ path: `public/photos/${file}`, mode: "100644", type: "blob", sha: blob.sha });
  }
  const keep = new Set(photos.map((p) => p.file));
  for (const p of Array.isArray(old) ? old : []) {
    if (p?.file && !keep.has(p.file)) {
      tree.push({ path: `public/photos/${p.file}`, mode: "100644", type: "blob", sha: null });
    }
  }
  tree.push({
    path: "public/photos/photos.json",
    mode: "100644",
    type: "blob",
    content: JSON.stringify(photos, null, 2) + "\n",
  });

  const newTree = await gh("POST", `${base}/git/trees`, { base_tree: head.tree.sha, tree });
  const commit = await gh("POST", `${base}/git/commits`, { message, tree: newTree.sha, parents: [headSha] });
  await gh("PATCH", `${base}/git/refs/heads/${refPath}`, { sha: commit.sha });
  return commit.sha;
}
