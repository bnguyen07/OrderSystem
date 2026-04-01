using MassTransit;
using OrderSystem.Api.Events;
using OrderSystem.Api.Services;

namespace OrderSystem.Api.Consumers
{
    // MassTransit automatically detects any class running 'IConsumer' and secretly powers it 
    // to listen to RabbitMQ 24 hours a day, 7 days a week in the background!
    public class OrderProcessingConsumer : IConsumer<OrderSubmittedEvent>
    {
        private readonly IOrderService _orderService;
        private readonly ILogger<OrderProcessingConsumer> _logger;

        public OrderProcessingConsumer(IOrderService orderService, ILogger<OrderProcessingConsumer> logger)
        {
            _orderService = orderService;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<OrderSubmittedEvent> context)
        {
            _logger.LogInformation("🐇 RabbitMQ Worker picked up a Checkout Event for User ID: {UserId}", context.Message.UserId);

            var dto = new OrderSystem.Api.DTOs.OrderCreateDto 
            { 
                UserId = context.Message.UserId, 
                ProductIds = context.Message.ProductIds 
            };
            
            // Execute the heavy, slow SQL Database logic perfectly in the background, out of sight!
            var result = await _orderService.CreateOrderAsync(dto);

            if (result != null)
            {
                _logger.LogInformation("✅ Background Order Successfully Saved to SQL Database for User ID: {UserId}", context.Message.UserId);
            }
            else
            {
                // If this crashes (e.g., SQL was busy), MassTransit is so smart it will 
                // automatically throw the event back into RabbitMQ and Retry it for us later!
                throw new Exception("SQL Server rejected the order creation.");
            }
        }
    }
}
