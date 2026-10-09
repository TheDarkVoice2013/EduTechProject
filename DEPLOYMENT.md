# EduTechProject operations

## Deployed shape

- URL: `https://79.108.160.80/edutechproject/` (URL path, not DNS subdomain).
- Repository: `git@github.com:TheDarkVoice2013/EduTechProject.git` at `/opt/edutechproject`.
- Own patched Node 24 runtime: `/opt/edutechproject-runtime/bin/node`. Other projects keep their existing Node versions.
- App user/group and systemd unit: `edutechproject`, no interactive login.
- Only network listener: `127.0.0.1:3847`, behind the existing Caddy HTTPS IP virtual host.
- Private database: `/var/lib/edutechproject/edutech.sqlite`, never under the public document root.
- Root-only configuration: `/etc/edutechproject/environment` (0600).
- Local online backups: `/var/lib/edutechproject/backups/`, three verified copies retained.

The service is capped at 256 MB RAM, 64 MB swap, 50% of one CPU, 32 tasks and 128 MB per file. The small-VPS configuration also caps durable sessions at 1000, exams at 200/2 MiB of snapshots, question content at 500/2 MiB, revisions at 1000/4 MiB and audit entries at 5000. Capacity errors are explicit; no recent active data is silently evicted. Completed exams are cleaned after seven days, expired sessions after 24 hours. Raise these limits only after adding capacity. It cannot write application code or other projects' directories. The host, disk and Caddy are still shared. There is no total project disk quota or high-availability guarantee. Monitor disk space and move backups off the host.

The current small VPS was almost full before deployment. **Increase disk capacity before adding substantial content or traffic.** A backup is verified before old copies are removed, so budget space for four backup copies at peak, in addition to the live database, WAL and other server files. A failed copy or integrity check removes only that invocation's incomplete destination and preserves existing backups; abrupt process termination may still require operator review. Build frontend bundles off-server; do not run a full development dependency installation on the VPS. React, KaTeX and the UI/build packages are build-time dependencies; their browser output is in `dist/`. Production installs only the backend packages. Security-audit the full lockfile, including build dependencies, before publishing.

## Install/update

Source changes should be committed in this repository, and may be committed/pushed from `/opt/edutechproject` using the server's existing GitHub SSH identity. Do not give the running application access to that identity. Keep the checkout root-owned, application-readable and not application-writable.

1. Review and test the exact source revision locally: `npm ci`, `npm test`, `BASE_PATH=/edutechproject npm run build`, `npm audit`.
2. Back up the live database with `systemctl start edutechproject-backup.service` and verify success. Copy a backup off-server.
3. Transfer only reviewed source and `dist/`. Exclude `.git`, `.env`, `data/`, `.tools/`, `.qa/`, secrets and local `node_modules`. Pull source with `git pull --ff-only` only when the server checkout is clean.
4. For dependency changes, run `PATH=/opt/edutechproject-runtime/bin:$PATH npm ci --omit=dev --ignore-scripts --no-audit --no-fund` as the deployment operator. Put temporary npm cache in `/tmp`, not the private application data directory.
5. Install the supplied systemd units in `/etc/systemd/system/`. The environment file must contain the settings in `.env.example`. Run `systemctl daemon-reload` only when the units change.
6. Insert the small `deploy/Caddyfile.fragment` **inside the existing IP host block**, preserving all other routes. Save a root-readable configuration backup, run `caddy validate --config /etc/caddy/Caddyfile` and reload only if validation succeeds. Never replace the whole shared Caddy configuration with this fragment.
7. Restart only `edutechproject.service`. Verify health and browser flows, and verify the unrelated public sites still respond. Enable the service and backup timer for boot.
8. Commit/push the reviewed source from the server checkout. Never add runtime files or secrets. Use a clean working tree or a separate branch to avoid overwriting collaborators' work.

For a new host, create the dedicated system user and private state/config directories first. Obtain Node only from the official distribution, verify its SHA-256 against the official checksum list, and install it in this project's runtime directory without replacing `/usr/bin/node`.

## Moderator accounts

```sh
sudo bash /opt/edutechproject/scripts/moderator.sh create cosmin admin
sudo bash /opt/edutechproject/scripts/moderator.sh create editor_name moderator
sudo bash /opt/edutechproject/scripts/moderator.sh reset editor_name moderator
```

Passwords are read through a hidden prompt and stdin, never command arguments. Use at least 14 characters and unique credentials. Reset invalidates that user's active sessions. There is no public registration, password recovery email or MFA. Keep server access restricted to the operator. Open **Moderator** in the website to sign in and create/edit/import questions. Unpublishing preserves the record and history.

## Checks and backups

```sh
curl --fail https://79.108.160.80/edutechproject/api/health
systemctl status edutechproject.service --no-pager
systemctl list-timers edutechproject-backup.timer --no-pager
journalctl -u edutechproject.service -n 50 --no-pager
df -h /
```

The health response intentionally contains only `{"status":"ok"}`. Logs must not contain credentials or student answers. Backups use SQLite's online backup API and run an integrity check. The daily timer is a system maintenance task, not a Codex notification automation.

For recovery, stop **only** the EduTechProject service, preserve the current database and WAL/SHM files as a timestamped recovery copy, and restore a verified backup with owner `edutechproject:edutechproject` and mode0600. Do not mix an old database with newer WAL/SHM files. Start the service and recheck health, question counts, moderation and exam creation. Restore source to a known compatible commit if necessary; never use a destructive reset against an unreviewed dirty checkout.

## Domain and security follow-up

The requested IP/path is served over trusted HTTPS. For stronger browser security isolation, point a dedicated hostname such as `edutechproject.YOUR_DOMAIN` to the VPS, add a dedicated Caddy virtual host and adjust `APP_ORIGIN`/`BASE_PATH` plus the frontend build together. Do not pretend a path is a subdomain. A hostname requires owner-controlled DNS; no DNS changes are included here.

Keep the OS, dedicated Node runtime and locked dependencies patched. Rotate the root credential shared during setup. Existing services/firewall/database exposure belong to their respective projects and were not silently modified by this deployment.
