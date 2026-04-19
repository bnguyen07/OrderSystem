# Horizontal Pod Autoscaling (HPA) Implemented ☸️

I have successfully updated the Kubernetes infrastructure to support automated, elastic scaling for the `ordersystem-api`. The system is now factually "Black Friday ready" and follows the technical description in your README.

## What was Accomplished?

### 1. Resource Request Initialization
- Modified [`order-api.yaml`](file:///C:/Users/Brian/Documents/Develop/OrderSystem/k8s/apis/order-api.yaml) to include a `resources` block for the `ordersystem-api` container.
- **CPU Requests**: Set to `100m` (0.1 CPU core) to provide a baseline for the autoscaler metrics.
- **Memory Limits**: Set to `512Mi` to prevent runaway memory consumption.

### 2. The "Digital Foreman" (HPA) Deployment
- Created a new manifest: [`hpa.yaml`](file:///C:/Users/Brian/Documents/Develop/OrderSystem/k8s/apis/hpa.yaml).
- **Elastic Boundaries**: Configured to maintain a minimum of **3 pods** and scale up to **10 pods** dynamically.
- **Scaling Trigger**: The autoscaler will "organically" clone pods once the average CPU utilization across the cluster exceeds **70%**.

## How to Verify

You can apply these changes and monitor the status of your autoscaler with the following commands:

```bash
# 1. Apply the updated deployment and new HPA
kubectl apply -f k8s/apis/order-api.yaml
kubectl apply -f k8s/apis/hpa.yaml

# 2. Monitor the autoscaler status
kubectl get hpa ordersystem-api-hpa --watch
```

> [!NOTE]
> Once your AKS cluster starts under pressure, you'll see the `REPLICAS` count in the `kubectl get hpa` output jump from 3 up towards 10 automatically!
