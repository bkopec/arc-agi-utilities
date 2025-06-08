# arc-agi-utilities

# Run instructions

## Spring Backend
### Specify custom backend port :
```bash
java -jar arc-agi-backend/target/arc-agi-backend-1.0.0.jar --server.port=9000
```

### Override CORS Allowed Origins:
```bash
java -jar arc-agi-backend/target/arc-agi-backend-1.0.0.jar --app.cors.allowedOrigin=https://yourdomain.com,http://localhost:4200
```
## Angular Frontend

### Configure API URL:
Open src/environments/environment.development.ts (for Angular v15+ projects) or src/environments/environment.ts (for older Angular versions) and ensure apiUrl points to your running backend:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/', // Make sure this matches your backend's running port
};
```
