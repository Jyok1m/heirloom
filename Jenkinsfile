// Heirloom monorepo CI/CD — single root pipeline (matches the one Jenkins job
// triggered by .github/workflows/trigger_jenkins.yml on push to main).
//
// Point the Jenkins job at THIS file: "Pipeline script from SCM" -> Jenkinsfile.
//
// Flow: detect which apps changed -> build only those (native amd64 images,
// SHA + main tags) -> push -> run DB migrations -> deploy over SSH.
//
// Agent prerequisite: docker (talks to the daemon over the TLS env). Images are
// linux/amd64 only, so no buildx/QEMU is needed. Jenkins credentials used:
//   - dockerhub-credentials (username/password) : registry push + remote pull
//   - host-ssh-key          (ssh private key)   : deploy target
//   - host-ssh-port         (secret text)       : deploy SSH port

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 40, unit: 'MINUTES')
    }

    parameters {
        // "Build with Parameters" -> force a rebuild even when no app files
        // changed (first run, manual redeploy, or a CI-only change).
        booleanParam(
            name: 'FORCE_BUILD',
            defaultValue: false,
            description: 'Build & deploy all apps (api, app, web) regardless of change detection',
        )
    }

    environment {
        REGISTRY   = 'jyok1m'
        API_IMAGE  = "${REGISTRY}/heirloom-api"
        APP_IMAGE  = "${REGISTRY}/heirloom-app"
        WEB_IMAGE  = "${REGISTRY}/heirloom-web"

        // Deploy target — self-hosted host running docker compose at REMOTE_DIR.
        PROJECT     = 'heirloom'
        SSH_HOST    = 'host.docker.internal'
        REMOTE_DIR  = '/opt/heirloom'

        // Product app domain — absolute public URL baked into the frontend
        // (canonical/OG/sitemap). Distinct from the marketing site below.
        PUBLIC_URL  = 'https://heirloom.joachimjasmin.com'

        // Marketing site (heirloom-web) build-time vars — Astro inlines PUBLIC_*.
        // WEB_PUBLIC_URL is the vitrine's own domain (heirloom-app.com), separate
        // from the product app. WEB_DEMO_URL points at a seeded public tree view
        // on the app (https://heirloom.joachimjasmin.com/view/<token>); empty
        // falls back to the docs.
        WEB_PUBLIC_URL = 'https://heirloom-app.com'
        WEB_GITHUB_URL = 'https://github.com/Jyok1m/heirloom'
        WEB_DEMO_URL   = 'https://heirloom.joachimjasmin.com/view/2PRi8WGkxq5lV4qnCg2x6bPvl3I4OLzj'
    }

    stages {
        stage('Detect changes') {
            when { branch 'main' }
            steps {
                script {
                    env.GIT_SHA = sh(
                        script: 'git rev-parse --short=8 HEAD',
                        returnStdout: true,
                    ).trim()

                    // Baseline for change detection: the last SUCCESSFULLY built
                    // commit, not HEAD~1. A push can carry several commits at once
                    // (e.g. a migration commit + front-end commits on top); diffing
                    // only HEAD~1 would miss the migration. Fall back to HEAD~1, then
                    // to a full rebuild, when no usable baseline is reachable.
                    def prev = ''
                    def lastGood = env.GIT_PREVIOUS_SUCCESSFUL_COMMIT?.trim()
                    if (lastGood) {
                        // Guard: the ref must exist in the fetched history and be an
                        // ancestor of HEAD (force-push / rebase can invalidate it).
                        def ok = sh(
                            script: "git cat-file -e ${lastGood}^{commit} 2>/dev/null && git merge-base --is-ancestor ${lastGood} HEAD && echo yes || true",
                            returnStdout: true,
                        ).trim()
                        if (ok == 'yes' && lastGood != env.GIT_SHA) { prev = lastGood }
                    }
                    if (!prev) {
                        prev = sh(
                            script: 'git rev-parse --verify --quiet HEAD~1 || true',
                            returnStdout: true,
                        ).trim()
                    }

                    def files
                    if (params.FORCE_BUILD) {
                        // Manual override: rebuild everything.
                        files = ['__ALL__']
                        echo 'FORCE_BUILD set — building both apps.'
                    } else if (prev) {
                        echo "Diffing against baseline ${prev}"
                        files = sh(
                            script: "git diff --name-only ${prev} HEAD",
                            returnStdout: true,
                        ).trim().split('\n').findAll { it }
                    } else {
                        files = ['__ALL__']
                    }

                    // Shared changes (lockfile, workspace config, root manifest,
                    // shared packages) force both apps to rebuild.
                    def sharedRoots = ['pnpm-lock.yaml', 'pnpm-workspace.yaml', 'package.json']
                    def shared = files.contains('__ALL__') || files.any { f ->
                        sharedRoots.contains(f) || f.startsWith('packages/')
                    }

                    env.BUILD_API = (shared || files.any { it.startsWith('apps/heirloom-api/') }) ? 'true' : 'false'
                    env.BUILD_APP = (shared || files.any { it.startsWith('apps/heirloom-app/') }) ? 'true' : 'false'
                    env.BUILD_WEB = (shared || files.any { it.startsWith('apps/heirloom-web/') }) ? 'true' : 'false'

                    // Run migrations only when a Prisma migration is actually added.
                    // This is a subset of BUILD_API (migrations live under the API dir),
                    // so the migrate image is always freshly built before it runs.
                    env.RUN_MIGRATE = (
                        files.contains('__ALL__') ||
                        files.any { it.startsWith('apps/heirloom-api/prisma/migrations/') }
                    ) ? 'true' : 'false'

                    echo "commit=${env.GIT_SHA}  build-api=${env.BUILD_API}  build-app=${env.BUILD_APP}  build-web=${env.BUILD_WEB}  migrate=${env.RUN_MIGRATE}"
                    if (env.BUILD_API == 'false' && env.BUILD_APP == 'false' && env.BUILD_WEB == 'false') {
                        echo 'No app changes — nothing to build or deploy.'
                    }
                }
            }
        }

        stage('Build & push API') {
            when {
                branch 'main'
                expression { env.BUILD_API == 'true' }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS',
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        # Runtime image: immutable SHA tag + moving main tag.
                        docker build \
                            -f apps/heirloom-api/Dockerfile \
                            --target runtime \
                            -t "$API_IMAGE:$GIT_SHA" \
                            -t "$API_IMAGE:main" .

                        # One-shot migration image (prisma migrate deploy), run before deploy.
                        docker build \
                            -f apps/heirloom-api/Dockerfile \
                            --target migrate \
                            -t "$API_IMAGE:migrate" .

                        docker push "$API_IMAGE:$GIT_SHA"
                        docker push "$API_IMAGE:main"
                        docker push "$API_IMAGE:migrate"

                        docker logout
                    '''
                }
            }
        }

        stage('Build & push App') {
            when {
                branch 'main'
                expression { env.BUILD_APP == 'true' }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS',
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        docker build \
                            -f apps/heirloom-app/Dockerfile \
                            --build-arg PUBLIC_URL="$PUBLIC_URL" \
                            -t "$APP_IMAGE:$GIT_SHA" \
                            -t "$APP_IMAGE:main" .

                        docker push "$APP_IMAGE:$GIT_SHA"
                        docker push "$APP_IMAGE:main"

                        docker logout
                    '''
                }
            }
        }

        stage('Build & push Web') {
            when {
                branch 'main'
                expression { env.BUILD_WEB == 'true' }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS',
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        docker build \
                            -f apps/heirloom-web/Dockerfile \
                            --build-arg PUBLIC_URL="$WEB_PUBLIC_URL" \
                            --build-arg PUBLIC_GITHUB_URL="$WEB_GITHUB_URL" \
                            --build-arg PUBLIC_DEMO_URL="$WEB_DEMO_URL" \
                            -t "$WEB_IMAGE:$GIT_SHA" \
                            -t "$WEB_IMAGE:main" .

                        docker push "$WEB_IMAGE:$GIT_SHA"
                        docker push "$WEB_IMAGE:main"

                        docker logout
                    '''
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
                expression { env.BUILD_API == 'true' || env.BUILD_APP == 'true' || env.BUILD_WEB == 'true' }
            }
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'host-ssh-key',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER',
                    ),
                    string(credentialsId: 'host-ssh-port', variable: 'HOST_PORT'),
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS',
                    ),
                ]) {
                    script {
                        // Only pull/restart what changed. RUN_MIGRATE is decided in the
                        // 'Detect changes' stage (a new Prisma migration was added).
                        // Service names match docker-compose.prod.yml (and the nginx upstream `api`).
                        def services = []
                        if (env.BUILD_API == 'true') { services << 'api' }
                        if (env.BUILD_APP == 'true') { services << 'app' }
                        if (env.BUILD_WEB == 'true') { services << 'web' }
                        env.SERVICES = services.join(' ')
                    }
                    // Remote script passed as a single SSH argument (not a heredoc:
                    // its terminator is indentation-sensitive and breaks easily).
                    // Agent-side vars are expanded inside the double quotes before
                    // the string is sent; $SERVICES stays unquoted to split into args.
                    sh '''
                        ssh -i "$SSH_KEY" -p "$HOST_PORT" \
                            -o StrictHostKeyChecking=accept-new \
                            "$SSH_USER@$SSH_HOST" "
                                set -e
                                cd \"$REMOTE_DIR\"
                                echo \"$DOCKER_PASS\" | docker login -u \"$DOCKER_USER\" --password-stdin
                                docker compose pull $SERVICES
                                if [ \"$RUN_MIGRATE\" = true ]; then docker compose pull migrate && docker compose run --rm migrate; fi
                                docker compose up -d --force-recreate $SERVICES
                                docker compose ps
                                docker image prune -f
                                docker logout
                            "
                    '''
                }
            }
        }
    }

    post {
        success { echo "Deployed heirloom @ ${env.GIT_SHA} (api=${env.BUILD_API}, app=${env.BUILD_APP}, web=${env.BUILD_WEB})" }
        failure { echo 'Pipeline failed — nothing deployed.' }
    }
}
