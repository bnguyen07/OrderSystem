<div align="center">
  <h1>🚀 Enterprise Order System</h1>
  <p>A highly scalable, distributed microservices architecture built to demonstrate modern e-commerce engineering, from monolithic foundations to Kubernetes auto-scaling.</p>

  <!-- Badges -->
  <img src="https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet" alt=".NET 9" />
  <img src="https://img.shields.io/badge/Next.js-14.0-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Azure_Kubernetes_Service-0078D4?logo=microsoftazure&logoColor=white" alt="AKS" />
  <img src="https://img.shields.io/badge/RabbitMQ-FF6600?logo=rabbitmq&logoColor=white" alt="RabbitMQ" />
  <img src="https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white" alt="Redis" />
</div>

<br/>

<div align="center">
  <strong>🔴 Live Demo Application:</strong> <a href="http://20.241.206.202.nip.io/">http://20.241.206.202.nip.io/</a>
</div>

<br/>

## 📖 Overview

The **Enterprise Order System** is a full-stack, distributed application designed to seamlessly handle massive retail scale. It was purposefully built in distinct phases to emulate the exact evolutionary patterns used by global e-commerce companies. 

This repository isn't just a static project; it is a **living roadmap** demonstrating how to scale a simple API into a resilient, message-driven, Kubernetes-orchestrated ecosystem.

---

## 🏗️ Phase-by-Phase Execution

A major goal of this project was to document the exact implementation plans required to evolve an architecture. If you are a developer looking to understand *how* to build this, follow these phases:

### Phase 1: The Monolith & Clean Architecture 🏢
**Plan:** Build a single .NET 9 Web API serving both Products and Orders connected to a SQL Server database.
**Execution:** 
- Strict adherence to the **Repository Pattern**.
- **Result:** A functioning, but tightly-coupled codebase where an influx of Order processing could freeze the entire Product Catalog.

### Phase 2: Enter Containers & Caching 🐳
**Plan:** Eliminate "it works on my machine" and optimize read-heavy endpoints.
**Execution:** 
- Dockerized the monolith.
- Injected **Redis** to cache the Product Catalog.
- **Result:** Identical deployment consistency and millisecond catalog load times, but still a monolith limited by vertical scaling.

### Phase 3: The Microservices Split ✂️
**Plan:** Decouple domains to allow independent scaling.
**Execution:** 
- Separated the monolithic API into **Catalog.Api** and **OrderSystem.Api**.
- **Result:** Complete fault isolation. If the Order API crashed, users globally could still browse the Catalog. 

### Phase 4: Event-Driven Asynchrony 🐇
**Plan:** Fix the "Synchronous Blocking" problem. Users shouldn't wait for a database row lock to see an "Order Received" message.
**Execution:** 
- Integrated **RabbitMQ** via MassTransit. The UI publishes an `OrderSubmittedEvent` and instantly returns success. OrderSystem.Api consumes it quietly in the background.
- **Result:** Instantaneous UI responses regardless of backend processing pressure.

### Phase 5: Kubernetes & "The Black Friday Problem" ☸️
**Plan:** Automate horizontal scaling and traffic routing.
**Execution:** 
- Deployed to **Azure Kubernetes Service (AKS)**.
- Integrated **Nginx Ingress** as an API load balancer.
- **Result:** The cluster organically tracks CPU spikes and spins up infinite replicas of the Order API during traffic surges, before dynamically scaling back down to save resources.

---

## ⚖️ Architecture Decision Logic (Trade-offs)

In enterprise engineering, every decision has a cost. Here is the reasoning behind our core stack choices:

### 1. The Repository Pattern
- **Why we chose it:** It completely abstracts Entity Framework Core away from the Controllers. This is an industry standard that allows developers to mock data access instantly when writing Unit Tests without spinning up a real SQL database.
- **The Trade-off:** High boilerplate. For a simple CRUD app, creating an Interface, an Implementation, and a DTO mapping for every single model is exhausting. We accepted this overhead for testability.

### 2. RabbitMQ vs. Apache Kafka
- **Why we chose RabbitMQ:** RabbitMQ is a "Smart Broker, Dumb Consumer". It excels at *Complex Routing*. In an e-commerce order system, a `PaymentFailedEvent` must be routed precisely to the Billing team, while an `InventoryLowEvent` goes to Warehousing. RabbitMQ handles this natively.
- **The Trade-off:** Kafka is superior for raw event-sourcing and holding millions of historical analytical logs forever. RabbitMQ deletes messages once acknowledged, making it poor for historical replay but perfect for task queuing.

### 3. Decoupling into Microservices
- **Why we chose it:** Distinct resource requirements. The Catalog API receives 99% reads. The Order API receives 99% writes. Microservices allow us to assign massive CPU limits exclusively to the Order API during peak checkout, without wasting money scaling the Catalog API unnecessarily.
- **The Trade-off:** Immense networking complexity. We lost the ability to do SQL `JOINs` between Orders and Products, forcing us to rely on eventual consistency and complex JWT Authentication pipelines across boundaries.

---

## 📸 Application Gallery

To visualize the system's modularity and frontend aesthetic, here are a few core workflows:

![Product Catalog & Shopping Cart](docs/catalog-dashboard.png)
<br>
![My Orders History](docs/my-orders.png)
<br>
![Custom Identity Sign-In](docs/sign-in.png)
<br>
![Custom Identity Sign-Up](docs/sign-up.png)
<br>
![AI Copilot Chatbot](docs/ai-copilot-chatbot.png)
<br>
![Administrative Console](docs/admin-console.png)

---

## 🚀 The Ultimate Getting Started Guide

If you want to reverse-engineer this platform on your own machine, follow this foolproof execution guide exactly.

### Prerequisites
1. **Docker Desktop** (You must open settings and explicitly check **"Enable Kubernetes"**).
2. `kubectl` CLI tool.
3. Node.js (v20+) & NPM.
4. .NET 9.0 SDK.

### Step 1: Obtain Google OAuth Secrets (For SSO)
To authenticate the Next.js frontend, you need a Google Platform Application.
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a New Project.
3. Navigate to **APIs & Services** > **Credentials**.
4. Click **Create Credentials** > **OAuth client ID**. 
   - Set Application Type to **Web Application**.
   - Add Authorized JavaScript Origins: `http://localhost:3000` and `http://localhost`
   - Add Authorized Redirect URIs: `http://localhost:3000/api/auth/callback/google` and `http://localhost/api/auth/callback/google`
5. Save the generated **Client ID** and **Client Secret**.

### Step 2: Inject Environment Variables
We use Kubernetes Secrets to securely pass tokens into the application without hardcoding them. 

Open `k8s/ui/nextjs-auth-patch.yaml` in your editor and drop in your secrets:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: nextjs-auth
type: Opaque
stringData:
  # NextAuth requires a random string to encrypt JWTs. Generate one here:
  NEXTAUTH_SECRET: "your_randomly_generated_string_here"
  NEXTAUTH_URL: "http://localhost"
  GOOGLE_CLIENT_ID: "your_google_client_id_here"
  GOOGLE_CLIENT_SECRET: "your_google_client_secret_here"
```

Apply the secret to your local cluster immediately:
```bash
kubectl apply -f k8s/ui/nextjs-auth-patch.yaml
```

### Step 3: Compile the Target Binaries
You must build the raw source code into Docker Images so Kubernetes can pull them. Open your terminal at the root directory:

```bash
# 1. Containerize the Catalog Engine
docker build -f Catalog.Api/Dockerfile -t ordersystem/catalog-api:latest .

# 2. Containerize the Order Processor
docker build -f OrderSystem.Api/Dockerfile -t ordersystem/ordersystem-api:latest .

# 3. Containerize the Next.js Client
docker build -t ordersystem/ordersystem-ui:latest ordersystem-ui
```

### Step 4: Stand up the Infrastructure
This repository uses declarative Networking. By executing the commands below, your machine will organically spin up SQL Server, Redis, RabbitMQ, and wire them to your Microservices via an Nginx Load Balancer.

Execute these commands strictly in this order:

```bash
# 1. State Infrastructure (SQL, Redis, RabbitMQ)
kubectl apply -f k8s/database/
kubectl apply -f k8s/caching/
kubectl apply -f k8s/messaging/

# Wait 30 seconds for SQL Server to boot before running the APIs.

# 2. Backend Logic (Microservices)
kubectl apply -f k8s/api/

# 3. Frontend Layer 
kubectl apply -f k8s/ui/

# 4. Proxy Networking Controller
kubectl apply -f k8s/load-balancer/
```

### Step 5: System Verification

Wait approximately 60 seconds, then run:
```bash
kubectl get pods
```
When all pods say **Running**, the system is online.

- **Main Application:** Navigate to `http://localhost`
- **RabbitMQ Dashboard:** To view orders queuing in real time, securely bind the pod to your machine:
  ```bash
  kubectl port-forward svc/rabbitmq 15672:15672
  ```
  Navigate to `http://localhost:15672` (Login: `guest` / `guest`).

### End-to-End Walkthrough
1. Go to `http://localhost`, click **Sign In** (via credentials or Google SSO).
2. Click **Add to Cart** on a product in the catalog.
3. Open `http://localhost:15672/#/queues` horizontally next to your UI window.
4. Click **Submit Order**. 
5. Watch the RabbitMQ graph cleanly spike to 1 message, pause dynamically, and organically slide down to 0 as the C# API finishes processing the transaction into SQL!
