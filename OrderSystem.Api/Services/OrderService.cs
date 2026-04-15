using OrderSystem.Api.DTOs;
using OrderSystem.Api.Models;
using OrderSystem.Api.Repositories;

namespace OrderSystem.Api.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repository;

        public OrderService(IOrderRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<OrderResponseDto>> GetUserOrdersAsync(int userId)
        {
            var orders = await _repository.GetUserOrdersAsync(userId);
            var result = new List<OrderResponseDto>();

            foreach (var order in orders)
            {
                var items = await _repository.GetOrderItemsAsync(order.Id);
                result.Add(new OrderResponseDto
                {
                    Id = order.Id,
                    UserId = order.UserId,
                    ProductIds = items.Select(i => i.ProductId).ToList()
                });
            }

            return result;
        }

        public async Task<IEnumerable<OrderResponseDto>> GetAllOrdersAsync()
        {
            var orders = await _repository.GetAllOrdersAsync();
            var result = new List<OrderResponseDto>();

            foreach (var order in orders)
            {
                var items = await _repository.GetOrderItemsAsync(order.Id);
                result.Add(new OrderResponseDto
                {
                    Id = order.Id,
                    UserId = order.UserId,
                    ProductIds = items.Select(i => i.ProductId).ToList()
                });
            }

            return result;
        }

        public async Task<OrderResponseDto> CreateOrderAsync(OrderCreateDto dto)
        {
            var order = new Order { UserId = dto.UserId };
            
            var orderItems = dto.ProductIds.Select(pid => new OrderItem
            {
                ProductId = pid
            }).ToList();

            var createdOrder = await _repository.CreateOrderAsync(order, orderItems);

            return new OrderResponseDto
            {
                Id = createdOrder.Id,
                UserId = createdOrder.UserId,
                ProductIds = dto.ProductIds
            };
        }
    }
}
