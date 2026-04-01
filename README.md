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

## Docker Architecture

### The Multi-Stage Dockerfile
Our application is intentionally built using an industry-standard **"Multi-Stage Build"** `Dockerfile`. This ensures our cloud servers remain extremely lightweight and exponentially more secure.

Here is exactly how it works:
1. **Stage 1 (Build):** Docker temporarily downloads the massive 1.5 Gigabyte `.NET SDK` image. The SDK contains powerful compilers, NuGet packet managers, and build engines. It uses all this heavyweight tooling merely to turn your C# source code into a tiny optimized ZIP file (`publish`).
2. **Stage 2 (Run):** Because we are shipping this to production, we don't want a massive 1.5GB server wasting RAM! So Docker instantly *throws away Stage 1*, downloads a microscopic 100 Megabyte `.NET Runtime` image, copies only your raw compiled ZIP file into it, and serves that! 

If a hacker ever manages to break into our server, they won't even find a compiler or source code to exploit. We get all the benefits of the massive Microsoft compilation SDK, but only pay the server costs for the microscopic runtime.
