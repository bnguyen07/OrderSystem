using OrderSystem.Api.Models;

namespace OrderSystem.Api.Repositories
{
    public interface IOrderRepository
    {
        Task<IEnumerable<Order>> GetUserOrdersAsync(int userId);
        Task<IEnumerable<OrderItem>> GetOrderItemsAsync(int orderId);
        Task<Order> CreateOrderAsync(Order order, IEnumerable<OrderItem> orderItems);
    }
}
