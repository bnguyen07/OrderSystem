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
            // Trigger a re-seed if we have fewer than 200 products to ensure the catalog feels massive
            var count = await context.Products.CountAsync();
            if (count >= 200) return;

            try
            {
                using var http = new HttpClient();
                http.Timeout = TimeSpan.FromSeconds(15);
                http.DefaultRequestHeaders.Add("User-Agent", "OrderSystem/1.0 (Integration; +http://ordersystem.local)");

                var json = await http.GetStringAsync("https://fakestoreapi.com/products");
                var fakeProducts = JsonSerializer.Deserialize<List<FakeProduct>>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (fakeProducts == null || fakeProducts.Count == 0) return;

                // Clear stale data before re-seeding
                context.Products.RemoveRange(context.Products);
                
                // Specifically for SQL Server, we might want to reset the identity but doing so via EF is clunky.
                // EF core will naturally continue auto-incrementing, which is fine for our purposes.
                await context.SaveChangesAsync();

                var rng = new Random();
                var adjectives = new[] { "Premium", "Pro", "Lite", "Refurbished", "Signature", "Classic", "Limited Edition", "Ultra", "Essential", "Max", "Plus", "V2", "Eco", "Smart", "Vintage" };

                var productsToInsert = new List<Product>();

                foreach (var fp in fakeProducts)
                {
                    // 1. Add the organic original
                    productsToInsert.Add(new Product
                    {
                        // Exclude Id globally so EF correctly auto-increments
                        Name = fp.Title,
                        Price = (decimal)Math.Round(fp.Price, 2),
                        StockQuantity = rng.Next(15, 250),
                        Image = fp.Image,
                        Description = fp.Description,
                        Category = fp.Category,
                        Rating = fp.Rating?.Rate ?? 0,
                        RatingCount = fp.Rating?.Count ?? 0
                    });

                    // 2. Add 14 variations to swell the catalog catalog to 300 records
                    for (int i = 0; i < 14; i++)
                    {
                        var adj = adjectives[rng.Next(adjectives.Length)];
                        // Randomly fluctuate the price +/- 40%
                        var priceModifier = (decimal)(rng.NextDouble() * 0.8 + 0.6); 
                        
                        productsToInsert.Add(new Product
                        {
                            Name = $"{adj} {fp.Title}",
                            Price = (decimal)Math.Round(fp.Price * (double)priceModifier, 2),
                            StockQuantity = rng.Next(5, 500),
                            // Generate completely unique, mathematically diverse stock photos
                            Image = $"https://picsum.photos/seed/{Guid.NewGuid()}/400",
                            // Append a small random query param so the browser assumes it's a unique image caching-wise
                            Description = fp.Description,
                            Category = fp.Category,
                            Rating = Math.Round(Math.Max(1.0, Math.Min(5.0, (fp.Rating?.Rate ?? 3.0) + (rng.NextDouble() * 2 - 1))), 1),
                            RatingCount = rng.Next(1, 4000)
                        });
                    }
                }

                context.Products.AddRange(productsToInsert);
                await context.SaveChangesAsync();
                Console.WriteLine($"[FakeStoreSeeder] Synthesized {productsToInsert.Count} products from FakeStore API base.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FakeStoreSeeder] Failed to seed — {ex.Message}. Using existing data.");
            }
        }
    }
}
