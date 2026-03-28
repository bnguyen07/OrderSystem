using OrderSystem.Api.Models;

namespace OrderSystem.Api.Data
{
    public static class DataSeeder
    {
        public static void SeedData(AppDbContext context)
        {
            if (!context.Products.Any())
            {
                context.Products.AddRange(
                    new Product { Name = "Laptop", Price = 1200.00m },
                    new Product { Name = "Smartphone", Price = 800.00m },
                    new Product { Name = "Headphones", Price = 150.00m },
                    new Product { Name = "Mechanical Keyboard", Price = 100.00m }
                );
                context.SaveChanges();
            }

            if (!context.Users.Any())
            {
                context.Users.Add(new User 
                { 
                    Email = "test@example.com", 
                    Password = "password123" 
                });
                context.SaveChanges();
            }
        }
    }
}
