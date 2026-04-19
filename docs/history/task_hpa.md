# HPA Implementation Tasks

- `[x]` **Resource Configuration**
  - `[x]` Add `resources` (requests/limits) to `k8s/apis/order-api.yaml`.

- `[x]` **Autoscaler Setup**
  - `[x]` Create `k8s/apis/hpa.yaml`.
  - `[x]` Define `HorizontalPodAutoscaler` targeting `ordersystem-api`.
  - `[x]` Configure min: 3, max: 10, target CPU: 70%.

- `[x]` **Verification**
  - `[x]` Validate YAML syntax.
  - `[x]` Confirm `scaleTargetRef` matches deployment metadata.
