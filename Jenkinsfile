// Pipeline CI/CD de JefNet
// Tests Laravel -> lint React -> build des images -> déploiement Docker -> vérification
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 45, unit: 'MINUTES')
    }

    parameters {
        booleanParam(name: 'REMPLIR_DEMO', defaultValue: false,
                     description: 'Remplir la base avec les données de démonstration (seeders). Attention : à faire sur une base vide.')
    }

    environment {
        COMPOSE = 'docker compose -p jefnet'
    }

    stages {
        stage('Récupération du code') {
            steps {
                checkout scm
                sh 'git log -1 --pretty="Commit %h : %s (%an)"'
            }
        }

        stage('Tests Laravel') {
            steps {
                // l'étape « test » du Dockerfile lance php artisan test : si un test échoue, le pipeline s'arrête
                sh 'docker build --target test -t jefnet-api-test ./backend'
            }
        }

        stage('Lint React') {
            steps {
                // un avertissement de style ne bloque pas le déploiement : l'étape passe en « instable »
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                    sh 'docker build --target lint -t jefnet-web-lint ./frontend'
                }
            }
        }

        stage('Construction des images') {
            steps {
                withCredentials([file(credentialsId: 'jefnet-env', variable: 'FICHIER_ENV')]) {
                    sh 'cp "$FICHIER_ENV" .env'
                    sh '$COMPOSE build'
                }
            }
        }

        stage('Déploiement') {
            steps {
                // les conteneurs sont recréés avec les nouvelles images ; la base et les fichiers sont conservés (volumes)
                sh '$COMPOSE up -d --remove-orphans'
                sh '$COMPOSE exec -T api php artisan migrate --force'
            }
        }

        stage('Données de démonstration') {
            when { expression { params.REMPLIR_DEMO } }
            steps {
                sh '$COMPOSE exec -T api php artisan db:seed --force'
            }
        }

        stage('Vérification') {
            steps {
                // le site et l'API doivent répondre (10 essais, 3 s d'écart)
                // 127.0.0.1 et pas « localhost » : dans le conteneur, localhost désigne d'abord l'adresse IPv6 (::1),
                // sur laquelle nginx n'écoute pas
                sh '''
                    for i in $(seq 1 10); do
                      if $COMPOSE exec -T web wget -q -O /dev/null http://127.0.0.1/ \
                         && $COMPOSE exec -T web wget -q -O /dev/null http://127.0.0.1/up; then
                        echo "JefNet répond : site et API OK"; exit 0
                      fi
                      echo "Pas encore prêt, nouvel essai..."; sleep 3
                    done
                    echo "JefNet ne répond pas"; $COMPOSE ps; $COMPOSE logs --tail=50 api; exit 1
                '''
            }
        }
    }

    post {
        always {
            sh 'rm -f .env'
            sh 'docker image prune -f || true'
        }
        success { echo 'Déploiement réussi : http://localhost' }
        failure { echo 'Échec : regarde l\'étape en rouge et ses journaux.' }
    }
}
