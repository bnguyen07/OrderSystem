using Microsoft.EntityFrameworkCore;
using Catalog.Api.Data;
using Catalog.Api.Repositories;
using Catalog.Api.Services;

var builder = WebApplication.CreateBuilder(args);

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

// 4. On Boot, automatically build the Database and inject baseline Seed data!
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
    context.Database.Migrate();
}

if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.Run();
