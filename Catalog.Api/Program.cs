using Microsoft.EntityFrameworkCore;
using Catalog.Api.Data;
using Catalog.Api.Repositories;
using Catalog.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Enable Cross-Origin Resource Sharing (CORS) so the Next.js UI can communicate securely
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowUI", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // Specifically allow Next.js
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();

// 1. Setup independent SQL Server Database Context just for Products
builder.Services.AddDbContext<CatalogDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Setup independent Redis Cache Connection just for Products
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["RedisCache:Configuration"];
    options.InstanceName = builder.Configuration["RedisCache:InstanceName"];
});

// 3. Register Microservice Dependencies
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 4. On Boot, automatically build the Database and seed real product data from FakeStore API
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
    context.Database.Migrate();
    await FakeStoreSeeder.SeedAsync(context);
}

// Apply the CORS pipeline rule exactly before routing
app.UseCors("AllowUI");

if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.Run();
