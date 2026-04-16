using System.Text.Json;
using Catalog.Api.Data;
using Catalog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Catalog.Api.Data
{
    public static class FakeStoreSeeder
    {
        // DTOs to deserialize from https://fakestoreapi.com/products
        private record FakeRating(double Rate, int Count);
        private record FakeProduct(int Id, string Title, double Price, string Description, string Category, string Image, FakeRating Rating);

        public static async Task SeedAsync(CatalogDbContext context)
        {
            // Only seed if we have fewer than 10 products (i.e., first boot or stale data)
            var count = await context.Products.CountAsync();
            if (count >= 10) return;

            try
            {
                using var http = new HttpClient();
                http.Timeout = TimeSpan.FromSeconds(15);

                var json = await http.GetStringAsync("https://fakestoreapi.com/products");
                var fakeProducts = JsonSerializer.Deserialize<List<FakeProduct>>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (fakeProducts == null || fakeProducts.Count == 0) return;

                // Clear stale data before re-seeding
                context.Products.RemoveRange(context.Products);
                await context.SaveChangesAsync();

                var rng = new Random();
                foreach (var fp in fakeProducts)
                {
                    context.Products.Add(new Product
                    {
                        Id = fp.Id,
                        Name = fp.Title,
                        Price = (decimal)Math.Round(fp.Price, 2),
                        StockQuantity = rng.Next(15, 250),
                        Image = fp.Image,
                        Description = fp.Description,
                        Category = fp.Category,
                        Rating = fp.Rating?.Rate ?? 0,
                        RatingCount = fp.Rating?.Count ?? 0
                    });
                }

                await context.SaveChangesAsync();
                Console.WriteLine($"[FakeStoreSeeder] Seeded {fakeProducts.Count} products from FakeStore API.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FakeStoreSeeder] Failed to seed — {ex.Message}. Using existing data.");
            }
        }
    }
}
