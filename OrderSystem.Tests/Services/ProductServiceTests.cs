using Moq;
using FluentAssertions;
using OrderSystem.Api.Repositories;
using OrderSystem.Api.Services;
using OrderSystem.Api.Models;
using OrderSystem.Api.DTOs;

namespace OrderSystem.Tests.Services
{
    public class ProductServiceTests
    {
        private readonly Mock<IProductRepository> _mockRepo;
        private readonly ProductService _service;

        public ProductServiceTests()
        {
            _mockRepo = new Mock<IProductRepository>();
            _service = new ProductService(_mockRepo.Object);
        }

        [Fact]
        public async Task GetAllProductsAsync_ShouldReturnAllProducts()
        {
            // Arrange
            var mockProducts = new List<Product>
            {
                new Product { Id = 1, Name = "Laptop", Price = 1000 },
                new Product { Id = 2, Name = "Mouse", Price = 50 }
            };
            
            _mockRepo.Setup(repo => repo.GetAllAsync()).ReturnsAsync(mockProducts);

            // Act
            var result = await _service.GetAllProductsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result.First().Name.Should().Be("Laptop");
        }

        [Fact]
        public async Task GetProductByIdAsync_WhenExists_ShouldReturnProduct()
        {
            // Arrange
            var mockProduct = new Product { Id = 1, Name = "Laptop", Price = 1000 };
            _mockRepo.Setup(repo => repo.GetByIdAsync(1)).ReturnsAsync(mockProduct);

            // Act
            var result = await _service.GetProductByIdAsync(1);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(1);
            result.Name.Should().Be("Laptop");
        }

        [Fact]
        public async Task GetProductByIdAsync_WhenNotExists_ShouldReturnNull()
        {
            // Arrange
            _mockRepo.Setup(repo => repo.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Product?)null);

            // Act
            var result = await _service.GetProductByIdAsync(999);

            // Assert
            result.Should().BeNull();
        }
        
        [Fact]
        public async Task CreateProductAsync_ShouldReturnCreatedProductDto()
        {
            // Arrange
            var dto = new ProductCreateDto { Name = "Keyboard", Price = 150 };
            var productToReturn = new Product { Id = 3, Name = "Keyboard", Price = 150 };
            
            _mockRepo.Setup(repo => repo.AddAsync(It.IsAny<Product>())).ReturnsAsync(productToReturn);

            // Act
            var result = await _service.CreateProductAsync(dto);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(3);
            result.Name.Should().Be("Keyboard");
            
            // Verify repo was called exactly once to ensure the DB write was actually requested
            _mockRepo.Verify(repo => repo.AddAsync(It.IsAny<Product>()), Times.Once);
        }
    }
}
