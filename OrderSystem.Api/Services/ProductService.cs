using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using OrderSystem.Api.DTOs;
using OrderSystem.Api.Models;
using OrderSystem.Api.Repositories;

namespace OrderSystem.Api.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _repository;
        private readonly IDistributedCache _cache; // Injected Redis connection interface

        public ProductService(IProductRepository repository, IDistributedCache cache)
        {
            _repository = repository;
            _cache = cache;
        }

        public async Task<IEnumerable<ProductResponseDto>> GetAllProductsAsync()
        {
            var cacheKey = "PRODUCTS_ALL";
            
            // 1. Ask Redis for the data first
            var cachedProducts = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedProducts)) // Cache Hit!
            {
                return JsonSerializer.Deserialize<IEnumerable<ProductResponseDto>>(cachedProducts)!;
            }

            // 2. Cache Miss: Ask SQL Server (slow operation)
            var products = await _repository.GetAllAsync();
            var response = products.Select(p => new ProductResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price
            });

            // 3. Save the result backward into Redis for the next 15 minutes!
            var cacheOptions = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15) };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(response), cacheOptions);

            return response;
        }

        public async Task<ProductResponseDto?> GetProductByIdAsync(int id)
        {
            var cacheKey = $"PRODUCT_{id}";
            var cachedProduct = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedProduct))
            {
                return JsonSerializer.Deserialize<ProductResponseDto>(cachedProduct)!;
            }

            var product = await _repository.GetByIdAsync(id);
            if (product == null) return null;

            var response = new ProductResponseDto
            {
                Id = product.Id,
                Name = product.Name,
                Price = product.Price
            };

            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(response), 
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15) });

            return response;
        }

        public async Task<ProductResponseDto> CreateProductAsync(ProductCreateDto dto)
        {
            var product = new Product { Name = dto.Name, Price = dto.Price };
            var createdProduct = await _repository.AddAsync(product);

            // Important: Trash the old list of products in Redis because a new product just got added!
            await _cache.RemoveAsync("PRODUCTS_ALL");

            return new ProductResponseDto
            {
                Id = createdProduct.Id,
                Name = createdProduct.Name,
                Price = createdProduct.Price
            };
        }

        public async Task<bool> UpdateProductAsync(int id, ProductUpdateDto dto)
        {
            var existingProduct = await _repository.GetByIdAsync(id);
            if (existingProduct == null) return false;

            existingProduct.Name = dto.Name;
            existingProduct.Price = dto.Price;

            await _repository.UpdateAsync(existingProduct);
            
            // Trash the old cache keys containing the stale product data
            await _cache.RemoveAsync("PRODUCTS_ALL");
            await _cache.RemoveAsync($"PRODUCT_{id}");
            return true;
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var existingProduct = await _repository.GetByIdAsync(id);
            if (existingProduct == null) return false;

            await _repository.DeleteAsync(id);
            
            await _cache.RemoveAsync("PRODUCTS_ALL");
            await _cache.RemoveAsync($"PRODUCT_{id}");
            return true;
        }
    }
}
