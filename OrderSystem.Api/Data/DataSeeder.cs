using OrderSystem.Api.Models;

namespace OrderSystem.Api.Data
{
    public static class DataSeeder
    {
        public static void SeedData(AppDbContext context)
        {
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
