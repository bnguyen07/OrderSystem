using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using OrderSystem.Api.Data;
using OrderSystem.Api.Services;
using OrderSystem.Api.Repositories;
using Microsoft.OpenApi.Models;
using MassTransit;
using OrderSystem.Api.Consumers;

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
if (!builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
}

// Redis has been officially migrated to the Catalog.Api Microservice!
builder.Services.AddMassTransit(x =>
{
    // Tell MassTransit to legally register our Background Worker
    x.AddConsumer<OrderProcessingConsumer>();
    
    x.UsingRabbitMq((context, cfg) =>
    {
        // When we run in Docker, RabbitMQ is named "rabbitmq", but when debugging locally it's "localhost"
        var hostname = builder.Environment.IsEnvironment("Docker") ? "rabbitmq" : "localhost";
        
        cfg.Host(hostname, "/", h => {
            h.Username("guest");
            h.Password("guest");
        });

        // Automatically build Queues in RabbitMQ and attach them to the Background Worker
        cfg.ConfigureEndpoints(context);
    });
});

builder.Services.AddHttpClient();

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "BearerGateway";
    options.DefaultChallengeScheme = "BearerGateway";
})
.AddPolicyScheme("BearerGateway", "BearerGateway", options =>
{
    // Dynamically forward the request to Google or our Local Authentication Scheme based on the Token!
    options.ForwardDefaultSelector = context =>
    {
        string authorization = context.Request.Headers["Authorization"];
        if (!string.IsNullOrEmpty(authorization) && authorization.StartsWith("Bearer "))
        {
            var token = authorization.Substring("Bearer ".Length).Trim();
            var jwtHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            if (jwtHandler.CanReadToken(token))
            {
                var jwt = jwtHandler.ReadJwtToken(token);
                if (jwt.Issuer == "https://accounts.google.com")
                {
                    return "Google";
                }
            }
        }
        return "Local";
    };
})
.AddJwtBearer("Local", options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
})
.AddJwtBearer("Google", options =>
{
    options.Authority = "https://accounts.google.com";
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = "https://accounts.google.com",
        ValidateAudience = true,
        // The exact Client ID you supplied!
        ValidAudience = "396860985031-3huj88f0sg6csnbbe8bllmpcvto1lp2c.apps.googleusercontent.com",
        ValidateLifetime = true
    };
});
builder.Services.AddAuthorization();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "OrderSystem API", Version = "v1" });

    // Add JWT Authentication support to Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.\r\nEnter 'Bearer' [space] and then your token.\r\nExample: 'Bearer 12345abcdef'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        if (context.Database.IsRelational())
        {
            context.Database.Migrate();
        }
        DataSeeder.SeedData(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred seeding the DB.");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            await Microsoft.AspNetCore.Http.HttpResponseJsonExtensions.WriteAsJsonAsync(context.Response, new { Error = "An unexpected error occurred." });
        });
    });
}

// Apply the CORS pipeline rule exactly before routing
app.UseCors("AllowUI");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }
