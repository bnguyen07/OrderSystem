using OrderSystem.Api.DTOs;

namespace OrderSystem.Api.Services
{
    public interface IOrderService
    {
        Task<IEnumerable<OrderResponseDto>> GetUserOrdersAsync(int userId);
        Task<OrderResponseDto> CreateOrderAsync(OrderCreateDto dto);
    }
}
