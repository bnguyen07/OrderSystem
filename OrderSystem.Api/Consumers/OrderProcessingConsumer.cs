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
        private readonly IHttpClientFactory _httpClientFactory;

        public OrderProcessingConsumer(IOrderService orderService, ILogger<OrderProcessingConsumer> logger, IHttpClientFactory httpClientFactory)
        {
            _orderService = orderService;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        public async Task Consume(ConsumeContext<OrderSubmittedEvent> context)
        {
            _logger.LogInformation("🐇 RabbitMQ Worker picked up a Checkout Event for User ID: {UserId}", context.Message.UserId);

            // 1. Physically Network to the Catalog Microservice to confirm Products exist!
            var httpClient = _httpClientFactory.CreateClient();
            var catalogHost = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Docker" ? "catalog-api:8080" : "localhost:5056";

            foreach (var productId in context.Message.ProductIds)
            {
                _logger.LogInformation("🌐 Requesting Inventory Check from Catalog Service for Product {ProductId}...", productId);
                var response = await httpClient.GetAsync($"http://{catalogHost}/api/Product/{productId}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("🛑 Product {ProductId} doesn't exist in the Catalog Database! Order aborted.", productId);
                    return; // Gracefully abort the entire MassTransit Consumer thread
                }
            }

            var dto = new OrderSystem.Api.DTOs.OrderCreateDto 
            { 
                UserId = context.Message.UserId, 
                ProductIds = context.Message.ProductIds 
            };
            
            // 2. Execute the heavy, slow SQL Database logic perfectly in the background, out of sight!
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
