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

        // Seed data removed — FakeStoreSeeder handles population dynamically on startup
    }
}
