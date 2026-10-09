# Security model

EduTechProject is a public learning site, not a proctored or high-stakes exam system. Its public practice bank can be studied before taking a self-assessment. Timed exam answer keys are never returned in active exam responses, but the question bank is not confidential.

## Boundaries

- Dedicated Unix identity, application directory, SQLite database, session store and backup directory. No access to another project's database or credentials.
- Application binds only to loopback; Caddy supplies trusted HTTPS. Secure HttpOnly SameSite cookies, explicit same-origin + CSRF checks, server-side authorization and no public moderator signup.
- Passwords use salted scrypt; sessions rotate on login/logout, are hashed at rest, and are invalidated by password reset. Do not reuse the VPS root password for moderator access.
- Bounded request bodies, validated plain-text/KaTeX content, no arbitrary file uploads, SQL parameters, login/API throttling, content revisions and an audit trail.
- CSP disallows third-party scripts and framing. Inline styles are allowed for KaTeX layout; KaTeX runs with trust disabled.
- Separate service CPU, memory, process and individual-file-size limits reduce impact on neighbors. Durable session/exam/content/revision admission caps return a controlled capacity error before accepting more writes. These are not a separate virtual machine or a total filesystem quota.

**A URL path is not a browser-origin boundary.** At `/edutechproject/`, other applications on the same IP HTTPS origin remain a browser security dependency. A compromised same-origin application could access this application's API as a logged-in browser user. Use a dedicated domain/subdomain when DNS is available for stronger isolation. Never log in over HTTP or ignore certificate warnings.

## Production requirements

Use Node 24 LTS with current security updates, HTTPS, production mode, an unprivileged service identity and a private data directory. Never commit `.env`, SQLite databases, SSH keys or passwords. Deploy source/builds as root-owned files so the web process cannot alter code. Do not enable public debug output or remote database ports.

The CLI supports account creation and reset. Reset revokes the account's sessions. Provision named accounts for individual moderators. There are no built-in credentials or password reset emails. MFA is not implemented; use unique long passwords and add a private administrative gateway if a stronger access policy is needed.

Student lesson/practice progress stays in local storage. Anonymous timed attempts use server sessions. Completed exams are retained for seven days, and expired sessions and their remaining attempts are removed after 24 hours; content revisions and audit records are retained subject to admission caps. Local database backups retain three copies, and require separate off-server copies for disaster recovery.

Automated tests and a dependency audit are checks, not a security certification. OS patches, SSH access, firewall rules, certificates, available disk and backups remain operator responsibilities. Do not alter unrelated projects as part of routine EduTechProject deployment.

## Report a vulnerability

Do not post secrets or exploit details in a public issue. Contact the repository owner privately. Until a dedicated reporting address is configured, do not claim a formal security-response SLA.
