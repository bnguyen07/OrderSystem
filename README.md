# OrderSystem API

A .NET 9 Web API built with Entity Framework Core, SQL Server, and JWT Authentication.

## Tech Stack
- .NET 9 (C# 13)
- EF Core & SQL Server
- JWT Bearer Authentication
- Clean Architecture (Controllers, Services, Repositories)

## How to Run
1. Ensure SQL Server is running and accessible via the `appsettings.json` connection string.
2. Run database migrations to create the schema:
   ```bash
   dotnet ef database update
   ```
3. Start the application:
   ```bash
   dotnet run
   ```
4. Access the Swagger UI for testing endpoints: `https://localhost:<port>/swagger`

## API Endpoints

### Auth
- `POST /api/auth/register` - Create a new user (`Email`, `Password`)
- `POST /api/auth/login` - Authenticate and receive JWT token

### Products
- `GET /api/product` - Get all products
- `GET /api/product/{id}` - Get product by ID
- `POST /api/product` - Create new product
- `PUT /api/product/{id}` - Update product
- `DELETE /api/product/{id}` - Delete product

### Orders (Requires Token)
- `POST /api/order` - Create a new order (reads user ID from token) (`ProductIds` list)
- `GET /api/order/user` - Get authenticated user's orders
