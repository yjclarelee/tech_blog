// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostComment {
  id: string;
  nickname: string;
  passwordHash: string;
  text: string;
  timestamp: number;
}

interface BlogPost {
  id: string;
  title: string;
  date: string;
  readTime: string;
  body: string;
  likes: number;
  liked: boolean;
  comments: PostComment[];
}

interface AdminAuth {
  passwordHash: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POSTS_KEY = "techpulse_posts";
const ADMIN_KEY = "techpulse_admin";
const SESSION_KEY = "techpulse_session";
const HEART_SVG = `<svg class="heart-icon" viewBox="0 0 24 24" width="22" height="22">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
           2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
           C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
           c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
</svg>`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function sanitize(input: string): string {
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}

function formatDate(dateStr: string): string {
  return dateStr;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

function loadPosts(): BlogPost[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (raw) return JSON.parse(raw) as BlogPost[];
  } catch { /* ignore */ }
  return [];
}

function savePosts(posts: BlogPost[]): void {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

function loadAdmin(): AdminAuth | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (raw) return JSON.parse(raw) as AdminAuth;
  } catch { /* ignore */ }
  return null;
}

function saveAdmin(admin: AdminAuth): void {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

function isLoggedIn(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

function setLoggedIn(val: boolean): void {
  if (val) {
    sessionStorage.setItem(SESSION_KEY, "1");
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

function seedPosts(): BlogPost[] {
  const posts: BlogPost[] = [
    {
      id: "seed-1",
      title: "The Rise of Edge Computing in 2026",
      date: "April 8, 2026",
      readTime: "5 min read",
      body: `Edge computing continues to reshape how we process data. By moving computation closer to the source, latency drops and real-time decision-making becomes viable at scale. From autonomous vehicles to smart factories, the implications are vast and accelerating.

The key drivers behind this shift include the explosion of IoT devices, 5G rollouts, and the demand for real-time analytics. Traditional cloud architectures simply can't meet the sub-millisecond latency requirements of modern applications.

Companies like Cloudflare, Fastly, and AWS are investing heavily in edge infrastructure. Developers now have access to serverless edge functions that execute code in data centers closest to the end user, reducing round-trip times dramatically.

Looking ahead, edge computing will become the default deployment model for latency-sensitive applications. The question isn't whether to adopt edge — it's how quickly you can get there.`,
      likes: 0,
      liked: false,
      comments: [],
    },
    {
      id: "seed-2",
      title: "TypeScript 6.0: What Developers Need to Know",
      date: "April 5, 2026",
      readTime: "4 min read",
      body: `The latest TypeScript release brings pattern matching, improved type narrowing, and a faster compiler pipeline. These additions make TypeScript an even stronger choice for large-scale applications.

Pattern matching allows developers to write more expressive conditional logic, reducing boilerplate and improving readability. The new 'match' expression works seamlessly with union types and discriminated unions.

The compiler itself has been rewritten in Rust for critical hot paths, resulting in 40% faster build times for large projects. This addresses one of the most common complaints from enterprise teams.

Other notable features include decorator metadata improvements, better ESM interop, and a new 'using' keyword for resource management that aligns with the TC39 Explicit Resource Management proposal.`,
      likes: 0,
      liked: false,
      comments: [],
    },
    {
      id: "seed-3",
      title: "Building Accessible Web Apps: A Practical Guide",
      date: "April 2, 2026",
      readTime: "6 min read",
      body: `Accessibility isn't optional — it's a core requirement. This guide walks through ARIA roles, keyboard navigation, color contrast, and screen-reader testing.

Start with semantic HTML. Using the correct elements — <nav>, <main>, <article>, <button> — gives assistive technologies the context they need without extra work from you.

Keyboard navigation is often overlooked. Every interactive element must be reachable and operable via keyboard. Test by unplugging your mouse and navigating your entire app with Tab, Enter, and arrow keys.

Color contrast ratios should meet WCAG AA standards at minimum: 4.5:1 for normal text, 3:1 for large text. Tools like axe DevTools and Lighthouse can audit your pages automatically.

Finally, test with actual screen readers. VoiceOver on macOS, NVDA on Windows, and TalkBack on Android each have quirks that automated tools can't catch. Small, deliberate changes in your markup can unlock your product for millions of additional users.`,
      likes: 0,
      liked: false,
      comments: [],
    },
  ];
  savePosts(posts);
  return posts;
}

function ensurePosts(): BlogPost[] {
  let posts = loadPosts();
  if (posts.length === 0) {
    posts = seedPosts();
  }
  return posts;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

type Route =
  | { page: "home" }
  | { page: "articles" }
  | { page: "about" }
  | { page: "post"; id: string }
  | { page: "admin" };

function parseRoute(): Route {
  const hash = location.hash || "#/";
  if (hash.startsWith("#/post/")) {
    return { page: "post", id: hash.slice(7) };
  }
  switch (hash) {
    case "#/articles":
      return { page: "articles" };
    case "#/about":
      return { page: "about" };
    case "#/admin":
      return { page: "admin" };
    default:
      return { page: "home" };
  }
}

function updateActiveNav(route: Route): void {
  document.querySelectorAll<HTMLAnchorElement>(".nav-link").forEach((link) => {
    const r = link.dataset.route;
    link.classList.toggle("active", r === route.page);
  });
}

// ---------------------------------------------------------------------------
// Render: Home
// ---------------------------------------------------------------------------

function renderHome(app: HTMLElement): void {
  const posts = ensurePosts();
  const recent = posts.slice(0, 3);

  app.innerHTML = `
    <section class="hero">
      <div class="container">
        <h2>Stay Ahead of the Curve</h2>
        <p>Your daily source for the latest in software engineering, AI, and emerging technologies.</p>
      </div>
    </section>
    <main class="container posts-section">
      ${recent.map((p) => postCardHTML(p)).join("")}
    </main>
  `;

  bindPostCards(app);
}

// ---------------------------------------------------------------------------
// Render: Articles
// ---------------------------------------------------------------------------

function renderArticles(app: HTMLElement): void {
  const posts = ensurePosts();

  app.innerHTML = `
    <main class="container posts-section">
      <h2 style="font-size:1.8rem;font-weight:700;margin-bottom:1.5rem;">All Articles</h2>
      ${posts.length === 0 ? '<p class="admin-msg">No articles yet.</p>' : posts.map((p) => postCardHTML(p)).join("")}
    </main>
  `;

  bindPostCards(app);
}

// ---------------------------------------------------------------------------
// Render: About
// ---------------------------------------------------------------------------

function renderAbout(app: HTMLElement): void {
  app.innerHTML = `
    <main class="container page-content">
      <h2>About TechPulse</h2>
      <p>
        TechPulse is an independent technology publication founded in 2026. We cover the latest
        developments in software engineering, artificial intelligence, cloud infrastructure, and
        developer tools.
      </p>
      <h3>Our Mission</h3>
      <p>
        We believe that staying informed shouldn't require sifting through noise. Every article on
        TechPulse is written to be concise, technically accurate, and immediately useful to working
        developers and engineering leaders.
      </p>
      <h3>The Team</h3>
      <p>
        TechPulse is run by a small team of engineers and writers who are passionate about technology.
        We don't accept sponsored content — every piece reflects our honest analysis and perspective.
      </p>
      <h3>Contact</h3>
      <p>
        Have a story tip, correction, or just want to say hello? Reach out at
        <strong>hello@techpulse.dev</strong>. We read every message.
      </p>
    </main>
  `;
}

// ---------------------------------------------------------------------------
// Render: Post detail
// ---------------------------------------------------------------------------

function renderPost(app: HTMLElement, postId: string): void {
  const posts = ensurePosts();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    app.innerHTML = `
      <main class="container page-content">
        <a href="#/" class="back-link">&larr; Back to Home</a>
        <h2>Post not found</h2>
        <p>The article you're looking for doesn't exist or has been removed.</p>
      </main>
    `;
    return;
  }

  app.innerHTML = `
    <main class="container post-detail">
      <a href="#/articles" class="back-link">&larr; Back to Articles</a>
      <h1 class="post-title">${sanitize(post.title)}</h1>
      <p class="post-meta">${sanitize(post.date)} &middot; ${sanitize(post.readTime)}</p>
      <div class="post-body">${sanitize(post.body)}</div>

      <div class="post-actions">
        <button class="like-btn" aria-label="Like this post">
          ${HEART_SVG}
          <span class="like-count">${post.likes}</span>
        </button>
      </div>

      <section class="comments-section">
        <h4>Comments</h4>
        <div class="comments-list"></div>
        <form class="comment-form">
          <input type="text" class="input-nickname" placeholder="Nickname" required />
          <input type="password" class="input-password" placeholder="Password (5+ chars)" required />
          <textarea class="input-comment" placeholder="Write a comment…" required></textarea>
          <button type="submit" class="btn-submit">Post Comment</button>
          <p class="form-error"></p>
        </form>
      </section>
    </main>
  `;

  // Like
  const likeBtn = app.querySelector(".like-btn") as HTMLButtonElement;
  const likeCount = app.querySelector(".like-count") as HTMLSpanElement;
  likeBtn.classList.toggle("liked", post.liked);

  likeBtn.addEventListener("click", () => {
    if (post.liked) {
      post.likes = Math.max(0, post.likes - 1);
      post.liked = false;
    } else {
      post.likes += 1;
      post.liked = true;
    }
    likeBtn.classList.toggle("liked", post.liked);
    likeCount.textContent = String(post.likes);
    savePosts(posts);
  });

  // Comments
  renderComments(app, post.comments);
  bindCommentForm(app, post, posts);
  bindCommentDelete(app, post, posts);
}

// ---------------------------------------------------------------------------
// Render: Admin
// ---------------------------------------------------------------------------

function renderAdmin(app: HTMLElement): void {
  const admin = loadAdmin();

  // Not set up yet — show registration
  if (!admin) {
    renderAdminSetup(app);
    return;
  }

  // Not logged in — show login
  if (!isLoggedIn()) {
    renderAdminLogin(app, admin);
    return;
  }

  // Logged in — show dashboard
  renderAdminDashboard(app);
}

function renderAdminSetup(app: HTMLElement): void {
  app.innerHTML = `
    <main class="container admin-section">
      <h2>Admin Setup</h2>
      <div class="admin-login">
        <h3>Create your admin password</h3>
        <p style="font-size:0.88rem;color:#555;margin-bottom:1rem;">
          This password protects your admin panel. You'll use it to log in and manage posts.
        </p>
        <form class="admin-form" id="setup-form">
          <input type="password" id="setup-pw" placeholder="Password (5+ chars)" required />
          <input type="password" id="setup-pw2" placeholder="Confirm password" required />
          <button type="submit" class="btn-submit">Create Admin Account</button>
          <p class="form-error" id="setup-error"></p>
        </form>
      </div>
    </main>
  `;

  const form = document.getElementById("setup-form") as HTMLFormElement;
  const pw1 = document.getElementById("setup-pw") as HTMLInputElement;
  const pw2 = document.getElementById("setup-pw2") as HTMLInputElement;
  const err = document.getElementById("setup-error") as HTMLParagraphElement;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";

    if (pw1.value.length < 5) {
      err.textContent = "Password must be at least 5 characters.";
      return;
    }
    if (pw1.value !== pw2.value) {
      err.textContent = "Passwords do not match.";
      return;
    }

    const hash = await hashPassword(pw1.value);
    saveAdmin({ passwordHash: hash });
    setLoggedIn(true);
    renderAdmin(app);
  });
}

function renderAdminLogin(app: HTMLElement, admin: AdminAuth): void {
  app.innerHTML = `
    <main class="container admin-section">
      <h2>Admin Login</h2>
      <div class="admin-login">
        <form class="admin-form" id="login-form">
          <input type="password" id="login-pw" placeholder="Admin password" required />
          <button type="submit" class="btn-submit">Log In</button>
          <p class="form-error" id="login-error"></p>
        </form>
      </div>
    </main>
  `;

  const form = document.getElementById("login-form") as HTMLFormElement;
  const pw = document.getElementById("login-pw") as HTMLInputElement;
  const err = document.getElementById("login-error") as HTMLParagraphElement;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";

    const hash = await hashPassword(pw.value);
    if (hash !== admin.passwordHash) {
      err.textContent = "Incorrect password.";
      return;
    }

    setLoggedIn(true);
    renderAdmin(app);
  });
}

function renderAdminDashboard(app: HTMLElement): void {
  const posts = ensurePosts();

  app.innerHTML = `
    <main class="container admin-section">
      <div class="admin-bar">
        <h2 style="margin-bottom:0">Dashboard</h2>
        <div style="display:flex;gap:0.5rem;">
          <button class="btn-submit" id="new-post-btn">+ New Post</button>
          <button class="btn-secondary" id="logout-btn">Log Out</button>
        </div>
      </div>

      <div class="admin-post-list" id="admin-posts">
        ${posts.length === 0 ? '<p class="admin-msg">No posts yet. Create your first one!</p>' : ""}
        ${posts
          .map(
            (p) => `
          <div class="admin-post-item" data-id="${sanitize(p.id)}">
            <div class="post-info">
              <strong>${sanitize(p.title)}</strong>
              <span>${sanitize(p.date)} &middot; ${p.likes} likes &middot; ${p.comments.length} comments</span>
            </div>
            <div class="post-actions-admin">
              <button class="btn-danger edit-btn">Edit</button>
              <button class="btn-danger delete-btn">Delete</button>
            </div>
          </div>`
          )
          .join("")}
      </div>

      <div id="editor-area"></div>
    </main>
  `;

  // Logout
  document.getElementById("logout-btn")!.addEventListener("click", () => {
    setLoggedIn(false);
    renderAdmin(app);
  });

  // New post
  document.getElementById("new-post-btn")!.addEventListener("click", () => {
    showPostEditor(app, null);
  });

  // Edit / Delete
  const list = document.getElementById("admin-posts")!;
  list.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const item = target.closest(".admin-post-item") as HTMLElement | null;
    if (!item) return;
    const id = item.dataset.id!;

    if (target.classList.contains("edit-btn")) {
      const post = posts.find((p) => p.id === id);
      if (post) showPostEditor(app, post);
    }

    if (target.classList.contains("delete-btn")) {
      if (!confirm("Delete this post? This cannot be undone.")) return;
      const idx = posts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        posts.splice(idx, 1);
        savePosts(posts);
        renderAdminDashboard(app);
      }
    }
  });
}

function showPostEditor(app: HTMLElement, existing: BlogPost | null): void {
  const area = document.getElementById("editor-area")!;
  const isEdit = existing !== null;
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  area.innerHTML = `
    <div style="border-top:1px solid #e0e0e0;padding-top:1.5rem;margin-top:1rem;">
      <h3 style="font-size:1.1rem;font-weight:600;margin-bottom:1rem;">
        ${isEdit ? "Edit Post" : "New Post"}
      </h3>
      <form class="admin-form" id="post-editor">
        <label>Title</label>
        <input type="text" id="ed-title" value="${isEdit ? sanitize(existing!.title) : ""}" required />
        <label>Read time (e.g. "5 min read")</label>
        <input type="text" id="ed-readtime" value="${isEdit ? sanitize(existing!.readTime) : ""}" placeholder="5 min read" />
        <label>Body</label>
        <textarea id="ed-body" required>${isEdit ? sanitize(existing!.body) : ""}</textarea>
        <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
          <button type="submit" class="btn-submit">${isEdit ? "Save Changes" : "Publish"}</button>
          <button type="button" class="btn-secondary" id="cancel-editor">Cancel</button>
        </div>
        <p class="form-error" id="ed-error"></p>
      </form>
    </div>
  `;

  document.getElementById("cancel-editor")!.addEventListener("click", () => {
    area.innerHTML = "";
  });

  const form = document.getElementById("post-editor") as HTMLFormElement;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = (document.getElementById("ed-title") as HTMLInputElement).value.trim();
    const readTime = (document.getElementById("ed-readtime") as HTMLInputElement).value.trim() || "3 min read";
    const body = (document.getElementById("ed-body") as HTMLTextAreaElement).value.trim();
    const err = document.getElementById("ed-error") as HTMLParagraphElement;

    if (!title || !body) {
      err.textContent = "Title and body are required.";
      return;
    }

    const posts = loadPosts();

    if (isEdit) {
      const post = posts.find((p) => p.id === existing!.id);
      if (post) {
        post.title = title;
        post.readTime = readTime;
        post.body = body;
      }
    } else {
      posts.unshift({
        id: generateId(),
        title,
        date: today,
        readTime,
        body,
        likes: 0,
        liked: false,
        comments: [],
      });
    }

    savePosts(posts);
    renderAdminDashboard(app);
  });
}

// ---------------------------------------------------------------------------
// Shared: Post card
// ---------------------------------------------------------------------------

function postCardHTML(post: BlogPost): string {
  const excerpt =
    post.body.length > 180 ? post.body.slice(0, 180) + "…" : post.body;
  return `
    <article class="post-card" data-post-id="${sanitize(post.id)}">
      <h3 class="post-title">${sanitize(post.title)}</h3>
      <p class="post-meta">${sanitize(post.date)} &middot; ${sanitize(post.readTime)}</p>
      <p class="post-excerpt">${sanitize(excerpt)}</p>
      <div class="post-footer">
        <span>${HEART_SVG} ${post.likes}</span>
        <span>${post.comments.length} comment${post.comments.length !== 1 ? "s" : ""}</span>
        <span class="read-more">Read more &rarr;</span>
      </div>
    </article>
  `;
}

function bindPostCards(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>(".post-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.postId;
      location.hash = `#/post/${id}`;
    });
  });
}

// ---------------------------------------------------------------------------
// Shared: Comments
// ---------------------------------------------------------------------------

function renderComments(container: HTMLElement, comments: PostComment[]): void {
  const list = container.querySelector(".comments-list") as HTMLElement;
  list.innerHTML = "";

  if (comments.length === 0) {
    list.innerHTML = '<p class="no-comments">No comments yet. Be the first!</p>';
    return;
  }

  comments.forEach((c) => {
    const el = document.createElement("div");
    el.classList.add("comment");
    el.dataset.commentId = c.id;
    el.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${sanitize(c.nickname)}</span>
        <span class="comment-time">${formatTimestamp(c.timestamp)}</span>
      </div>
      <p class="comment-body">${sanitize(c.text)}</p>
      <button class="comment-delete">Delete</button>
    `;
    list.appendChild(el);
  });
}

function bindCommentForm(
  container: HTMLElement,
  post: BlogPost,
  posts: BlogPost[]
): void {
  const form = container.querySelector(".comment-form") as HTMLFormElement;
  const nicknameInput = form.querySelector(".input-nickname") as HTMLInputElement;
  const passwordInput = form.querySelector(".input-password") as HTMLInputElement;
  const commentInput = form.querySelector(".input-comment") as HTMLTextAreaElement;
  const formError = form.querySelector(".form-error") as HTMLParagraphElement;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.textContent = "";

    const nickname = nicknameInput.value.trim();
    const password = passwordInput.value;
    const text = commentInput.value.trim();

    if (!nickname) {
      formError.textContent = "Please enter a nickname.";
      return;
    }
    if (password.length < 5) {
      formError.textContent = "Password must be at least 5 characters.";
      return;
    }
    if (!text) {
      formError.textContent = "Please write a comment.";
      return;
    }

    const comment: PostComment = {
      id: generateId(),
      nickname,
      passwordHash: await hashPassword(password),
      text,
      timestamp: Date.now(),
    };

    post.comments.push(comment);
    savePosts(posts);
    renderComments(container, post.comments);

    nicknameInput.value = "";
    passwordInput.value = "";
    commentInput.value = "";
  });
}

function bindCommentDelete(
  container: HTMLElement,
  post: BlogPost,
  posts: BlogPost[]
): void {
  const list = container.querySelector(".comments-list") as HTMLElement;
  list.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("comment-delete")) return;

    const commentEl = target.closest(".comment") as HTMLElement;
    const commentId = commentEl.dataset.commentId!;
    const comment = post.comments.find((c) => c.id === commentId);
    if (!comment) return;

    showDeleteModal(async (password: string) => {
      const hash = await hashPassword(password);
      if (hash === comment.passwordHash) {
        post.comments = post.comments.filter((c) => c.id !== commentId);
        savePosts(posts);
        renderComments(container, post.comments);
        return true;
      }
      return false;
    });
  });
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

function showDeleteModal(onConfirm: (password: string) => Promise<boolean>): void {
  const overlay = document.createElement("div");
  overlay.classList.add("modal-overlay");

  overlay.innerHTML = `
    <div class="modal">
      <h4>Enter password to delete</h4>
      <input type="password" class="modal-password" placeholder="Password" />
      <p class="modal-error"></p>
      <div class="modal-actions">
        <button class="modal-cancel">Cancel</button>
        <button class="modal-confirm">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = overlay.querySelector(".modal-password") as HTMLInputElement;
  const errorEl = overlay.querySelector(".modal-error") as HTMLParagraphElement;
  const cancelBtn = overlay.querySelector(".modal-cancel") as HTMLButtonElement;
  const confirmBtn = overlay.querySelector(".modal-confirm") as HTMLButtonElement;

  const close = () => overlay.remove();

  cancelBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  const handleConfirm = async () => {
    const pw = input.value;
    if (!pw) {
      errorEl.textContent = "Please enter your password.";
      return;
    }
    const success = await onConfirm(pw);
    if (success) {
      close();
    } else {
      errorEl.textContent = "Incorrect password.";
    }
  };

  confirmBtn.addEventListener("click", handleConfirm);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleConfirm();
  });

  input.focus();
}

// ---------------------------------------------------------------------------
// Router init
// ---------------------------------------------------------------------------

function render(): void {
  const app = document.getElementById("app")!;
  const route = parseRoute();
  updateActiveNav(route);
  window.scrollTo(0, 0);

  switch (route.page) {
    case "home":
      renderHome(app);
      break;
    case "articles":
      renderArticles(app);
      break;
    case "about":
      renderAbout(app);
      break;
    case "post":
      renderPost(app, route.id);
      break;
    case "admin":
      renderAdmin(app);
      break;
  }
}

window.addEventListener("hashchange", render);
document.addEventListener("DOMContentLoaded", () => {
  ensurePosts();
  render();
});
