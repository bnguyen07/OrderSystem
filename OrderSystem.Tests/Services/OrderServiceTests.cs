using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Moq;
using FluentAssertions;
using OrderSystem.Api.Repositories;
using OrderSystem.Api.Services;
using OrderSystem.Api.Models;
using OrderSystem.Api.DTOs;

namespace OrderSystem.Tests.Services
{
    public class OrderServiceTests
    {
        private readonly Mock<IOrderRepository> _mockRepo;
        private readonly OrderService _service;

        public OrderServiceTests()
        {
            _mockRepo = new Mock<IOrderRepository>();
            _service = new OrderService(_mockRepo.Object);
        }

        [Fact]
        public async Task CreateOrderAsync_ShouldCreateOrderAndItems()
        {
            // Arrange
            var dto = new OrderCreateDto
            {
                UserId = 10,
                ProductIds = new List<int> { 1, 2, 3 }
            };

            var returnedOrder = new Order { Id = 100, UserId = 10 };

            _mockRepo.Setup(repo => repo.CreateOrderAsync(It.IsAny<Order>(), It.IsAny<List<OrderItem>>()))
                     .ReturnsAsync(returnedOrder);

            // Act
            var result = await _service.CreateOrderAsync(dto);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(100);
            result.UserId.Should().Be(10);
            result.ProductIds.Should().BeEquivalentTo(new[] { 1, 2, 3 });

            _mockRepo.Verify(repo => repo.CreateOrderAsync(
                It.Is<Order>(o => o.UserId == 10),
                It.Is<List<OrderItem>>(items => items.Count == 3 && items.Any(i => i.ProductId == 1))
            ), Times.Once);
        }

        [Fact]
        public async Task GetUserOrdersAsync_ShouldReturnOrdersWithProductIds()
        {
            // Arrange
            var userId = 10;
            var orders = new List<Order>
            {
                new Order { Id = 100, UserId = userId },
                new Order { Id = 101, UserId = userId }
            };

            var order100Items = new List<OrderItem>
            {
                new OrderItem { OrderId = 100, ProductId = 1 },
                new OrderItem { OrderId = 100, ProductId = 2 }
            };

            var order101Items = new List<OrderItem>
            {
                new OrderItem { OrderId = 101, ProductId = 3 }
            };

            _mockRepo.Setup(repo => repo.GetUserOrdersAsync(userId)).ReturnsAsync(orders);
            _mockRepo.Setup(repo => repo.GetOrderItemsAsync(100)).ReturnsAsync(order100Items);
            _mockRepo.Setup(repo => repo.GetOrderItemsAsync(101)).ReturnsAsync(order101Items);

            // Act
            var result = await _service.GetUserOrdersAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);

            var firstOrder = result.First(o => o.Id == 100);
            firstOrder.UserId.Should().Be(userId);
            firstOrder.ProductIds.Should().BeEquivalentTo(new[] { 1, 2 });

            var secondOrder = result.First(o => o.Id == 101);
            secondOrder.UserId.Should().Be(userId);
            secondOrder.ProductIds.Should().BeEquivalentTo(new[] { 3 });
        }
    }
}
