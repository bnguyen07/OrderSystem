using System.Collections.Generic;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using OrderSystem.Api.DTOs;
using Xunit;

namespace OrderSystem.Tests.Integration
{
    public class ProductIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly System.Net.Http.HttpClient _client;

        public ProductIntegrationTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetProducts_ShouldReturnOkAndSeedData()
        {
            // Act: Fire a literal HTTP request to the running server!
            var response = await _client.GetAsync("/api/Product");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue();
            
            var products = await response.Content.ReadFromJsonAsync<List<ProductResponseDto>>();
            
            products.Should().NotBeNull();
            products.Should().HaveCountGreaterThan(0); // The InMemory Db automatically gets seeded by DataSeeder!
            products![0].Name.Should().NotBeNullOrWhiteSpace();
        }
        
        [Fact]
        public async Task GetProductById_ShouldReturnProduct()
        {
            // Act
            var response = await _client.GetAsync("/api/Product/1");
            
            // Assert
            response.IsSuccessStatusCode.Should().BeTrue();
            
            var product = await response.Content.ReadFromJsonAsync<ProductResponseDto>();
            product.Should().NotBeNull();
            product!.Id.Should().Be(1);
        }
    }
}
