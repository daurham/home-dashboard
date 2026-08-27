# Workflow

This project **is** a sub-repo of the home-ai server.

| Repo | Path | Remote | What it is |
|------|------|--------|------------|
| home-dashboard | `/home/daurham/home-ai/home-dashboard` | `github.com/daurham/home-dashboard` | Vite/React UI (nested clone, **not** a git submodule) |

Dashboard in the browser: `http://192.168.1.161/dashboard/`

---

## Dashboard → prod

Typical loop: edit locally on a laptop, push, then pull on home-ai server.

**On the laptop** (hot reload): see `home-dashboard/LOCAL_DEVELOPMENT.md` and `LOCAL_DEVELOPMENT.md` in this repo.
  Or run: `npm run dev` for a quick start on a pre-configured laptop
  
```bash
cd home-dashboard
git checkout main
git pull origin main
# ... edit ...
git add -A && git commit -m "why this change"
git push origin main