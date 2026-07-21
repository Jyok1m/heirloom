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
            description: 'Build & deploy both apps regardless of change detection',
        )
    }

    environment {
        REGISTRY   = 'jyok1m'
        API_IMAGE  = "${REGISTRY}/heirloom-api"
        APP_IMAGE  = "${REGISTRY}/heirloom-app"

        // Deploy target — self-hosted host running docker compose at REMOTE_DIR.
        PROJECT     = 'heirloom'
        SSH_HOST    = 'host.docker.internal'
        REMOTE_DIR  = '/opt/heirloom'

        // Absolute public URL baked into the frontend (canonical/OG/sitemap).
        // Leave empty to fall back to relative behaviour; set to the prod domain.
        PUBLIC_URL  = 'https://heirloom.joachimjasmin.com'
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

                    // Compare against the previous commit; on a shallow/first build
                    // (no parent), rebuild everything to stay safe.
                    def prev = sh(
                        script: 'git rev-parse --verify --quiet HEAD~1 || true',
                        returnStdout: true,
                    ).trim()

                    def files
                    if (params.FORCE_BUILD) {
                        // Manual override: rebuild everything.
                        files = ['__ALL__']
                        echo 'FORCE_BUILD set — building both apps.'
                    } else if (prev) {
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

                    echo "commit=${env.GIT_SHA}  build-api=${env.BUILD_API}  build-app=${env.BUILD_APP}"
                    if (env.BUILD_API == 'false' && env.BUILD_APP == 'false') {
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

        // stage('Deploy') {
        //     when {
        //         branch 'main'
        //         expression { env.BUILD_API == 'true' || env.BUILD_APP == 'true' }
        //     }
        //     steps {
        //         withCredentials([
        //             sshUserPrivateKey(
        //                 credentialsId: 'host-ssh-key',
        //                 keyFileVariable: 'SSH_KEY',
        //                 usernameVariable: 'SSH_USER',
        //             ),
        //             string(credentialsId: 'host-ssh-port', variable: 'HOST_PORT'),
        //             usernamePassword(
        //                 credentialsId: 'dockerhub-credentials',
        //                 usernameVariable: 'DOCKER_USER',
        //                 passwordVariable: 'DOCKER_PASS',
        //             ),
        //         ]) {
        //             script {
        //                 // Only pull/restart what changed. Migrations run when the API changed.
        //                 // Service names match docker-compose.prod.yml (and the nginx upstream `api`).
        //                 def services = []
        //                 if (env.BUILD_API == 'true') { services << 'api' }
        //                 if (env.BUILD_APP == 'true') { services << 'app' }
        //                 env.SERVICES = services.join(' ')
        //                 env.RUN_MIGRATE = env.BUILD_API
        //             }
        //             sh '''
        //                 ssh -i "$SSH_KEY" -p "$HOST_PORT" \
        //                     -o StrictHostKeyChecking=accept-new \
        //                     "$SSH_USER@$SSH_HOST" bash -s <<REMOTE
        //                     set -euo pipefail
        //                     cd "$REMOTE_DIR"
        //                     echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

        //                     docker compose pull $SERVICES
        //                     if [ "$RUN_MIGRATE" = "true" ]; then
        //                         docker compose pull migrate
        //                         docker compose run --rm migrate
        //                     fi
        //                     docker compose up -d --force-recreate $SERVICES
        //                     docker compose ps
        //                     docker image prune -f
        //                     docker logout
        //                     REMOTE
        //             '''
        //         }
        //     }
        // }
    }

    post {
        success { echo "Deployed heirloom @ ${env.GIT_SHA} (api=${env.BUILD_API}, app=${env.BUILD_APP})" }
        failure { echo 'Pipeline failed — nothing deployed.' }
    }
}
