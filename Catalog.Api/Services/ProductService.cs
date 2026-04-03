using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Catalog.Api.Models;
using Catalog.Api.Repositories;

namespace Catalog.Api.Services
{
    public interface IProductService
    {
        Task<IEnumerable<Product>> GetAllProductsAsync();
        Task<Product?> GetProductByIdAsync(int id);
    }

    public class ProductService : IProductService
    {
        private readonly IProductRepository _repository;
        private readonly IDistributedCache _cache;
        private readonly ILogger<ProductService> _logger;
        private const string CacheKeyPrefix = "Product_";

        public ProductService(IProductRepository repository, IDistributedCache cache, ILogger<ProductService> logger)
        {
            _repository = repository;
            _cache = cache;
            _logger = logger;
        }

        public async Task<IEnumerable<Product>> GetAllProductsAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<Product?> GetProductByIdAsync(int id)
        {
            string cacheKey = $"{CacheKeyPrefix}{id}";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                _logger.LogInformation($"[Catalog Microservice] ⚡ Cache HIT for Product {id}!");
                return JsonSerializer.Deserialize<Product>(cachedData);
            }

            _logger.LogInformation($"[Catalog Microservice] 🐌 Cache MISS for Product {id}. Hitting SQL Server.");
            var product = await _repository.GetByIdAsync(id);

            if (product != null)
            {
                var options = new DistributedCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(10));
                await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(product), options);
            }

            return product;
        }
    }
}
