# TodoApp

A small microservice-based todo application. It is intentionally simple: the goal is to demonstrate a distributed architecture, not a feature-complete product.

## 1. What it does

Users can create tasks, list them, and mark them as completed. A statistics view shows the number of total, completed and pending tasks.

| Method | Endpoint | Service | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | TaskService | List all tasks |
| `POST` | `/api/tasks` | TaskService | Create a task |
| `PUT` | `/api/tasks/{id}/complete` | TaskService | Mark a task as completed |
| `GET` | `/api/stats` | StatsService | Total, completed and pending counts |

To be useful in a real setting the application would need user accounts and authentication, per-user task lists, editing and deletion of tasks, pagination and notifications. None of this is required to demonstrate the architecture.

## 2. Architecture

Two microservices, one database and a static web client.

```
Browser
   │
   ▼
Ingress (nginx)
   ├── /api/tasks ──► TaskService ──► PostgreSQL
   ├── /api/stats ──► StatsService ──► TaskService
   └── / ──────────► TodoFrontend (static files)
```

| Component | Implemented as | Responsibility |
|---|---|---|
| User interface | TodoFrontend (static web client, **not** a microservice) | Lets a user create, list and complete tasks. |
| Task management | TaskService (**microservice**) | Owns the task data. REST API and EF Core migrations. |
| Statistics | StatsService (**microservice**) | Stateless. Reads tasks from TaskService's REST API and aggregates counts. Owns no data. |
| Data storage | PostgreSQL (separate service) | Persistent storage through a PersistentVolumeClaim (1 Gi). |
| External entry point | ingress-nginx (infrastructure) | Single HTTP entry point; routes requests by path to the services. |

The two microservices are of different types: TaskService is a data-owning CRUD service, StatsService is a read-only aggregator that consumes another service's API.

### Principles used

- **API gateway** – a single ingress is the only entry point from outside.
- **Database per service** – only TaskService owns data; StatsService is stateless.
- **Stateless services** – both microservices can scale horizontally and independently.
- **Externalized configuration** – the same image runs everywhere; connection strings and URLs come from environment variables.
- **Declarative deployment** – everything is described in Kubernetes YAML.
- **Persistent storage** – the database uses a PVC, so data survives pod restarts.

## 3. Discussion

### Benefits

- Each microservice can be scaled independently of the others.
- Services can be deployed and updated without touching each other.
- Clear separation of responsibility and a small, understandable codebase per service.
- The frontend and the API are independent; the client could be replaced without changing the backend.

### Challenges

- Calls between services can fail or be slow; StatsService depends on TaskService being available.
- Debugging is harder than in a monolith, since logs are spread across pods.
- No transaction can span services, so data consistency must be handled at the application level.
- More moving parts to build, deploy and operate.
- Running database migrations at startup can race when TaskService is scaled to several replicas.

### Security

In place today:

- The database password is stored in a Kubernetes Secret, never in git.
- `.env` is excluded from both version control and the Docker build context.
- All services are `ClusterIP`; only the ingress is exposed.

Known limitations:

- No authentication or authorization on any API.
- No TLS, neither between browser and ingress nor between services.
- Kubernetes Secrets are base64-encoded, not encrypted.
- CORS is open in development.
- No `NetworkPolicy`, resource limits or rate limiting.

### Mitigations

Security, implemented: secrets externalized from the repository, no credentials in images, no direct external exposure of services.

Security, recommended next steps: authentication with JWT/OIDC, TLS via cert-manager, `NetworkPolicy` to restrict service-to-service traffic, Sealed Secrets or External Secrets for real secret management, resource requests/limits, and moving migrations to a Kubernetes Job.

For the other challenges:

- **Service calls can fail** – retries with backoff and timeouts, plus readiness probes so traffic only reaches healthy pods.
- **Debugging across pods** – centralised logging and correlation IDs; both services already log to stdout, which Kubernetes collects.
- **No cross-service transactions** – StatsService is read-only, so no write coordination is needed; all writes stay inside TaskService and its database.
- **Migration race** – run migrations as a Kubernetes Job before the Deployment rolls out, instead of at application startup.
- **More moving parts** – declarative manifests, one image per service, and a CI/CD pipeline keep deployments repeatable.

## 4. Running it

Requirements: Docker Desktop with Kubernetes enabled.

```bash
kubectl config use-context docker-desktop

# Ingress controller (once per cluster)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.15.1/deploy/static/provider/cloud/deploy.yaml
kubectl -n ingress-nginx wait --for=condition=ready pod -l app.kubernetes.io/component=controller --timeout=240s

# Secret with the database password
kubectl create secret generic todo-postgres --from-literal=POSTGRES_PASSWORD=<password>

# Database first, then the application
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/applications.yaml -f k8s/ingress.yaml
```

Open <http://localhost/> in a browser.

Docker Compose is included only as a local development convenience and is not part of the deployment model.
