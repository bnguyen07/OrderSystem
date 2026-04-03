using Microsoft.EntityFrameworkCore;
using Catalog.Api.Models;

namespace Catalog.Api.Data
{
    // Notice how this Microservice exclusively only has a DbSet for Products!
    // It physically cannot access Orders or Users. Total architectural separation!
    public class CatalogDbContext : DbContext
    {
        public CatalogDbContext(DbContextOptions<CatalogDbContext> options) : base(options) { }

        public DbSet<Product> Products { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Product>().HasData(
                new Product { Id = 1, Name = "Laptop", Price = 999.99m, StockQuantity = 50 },
                new Product { Id = 2, Name = "Smartphone", Price = 699.99m, StockQuantity = 100 },
                new Product { Id = 3, Name = "Wireless Mouse", Price = 29.99m, StockQuantity = 200 }
            );
        }
    }
}
