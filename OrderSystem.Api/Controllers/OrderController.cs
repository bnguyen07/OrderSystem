using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using OrderSystem.Api.DTOs;
using OrderSystem.Api.Services;
using MassTransit;
using OrderSystem.Api.Events;

namespace OrderSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _service;
        private readonly IPublishEndpoint _publishEndpoint;

        public OrderController(IOrderService service, IPublishEndpoint publishEndpoint)
        {
            _service = service;
            _publishEndpoint = publishEndpoint;
        }

        [HttpGet("user")]
        public async Task<ActionResult<IEnumerable<OrderResponseDto>>> GetMyOrders()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

            var orders = await _service.GetUserOrdersAsync(userId);
            return Ok(orders);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder(OrderCreateDto dto)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

            if (dto.ProductIds == null || !dto.ProductIds.Any())
            {
                return BadRequest("Order must contain at least one product.");
            }

            // FIRE AND FORGET! We instantly drop the payload into RabbitMQ.
            // Entity Framework SQL is absolutely bypassed at this exact step!
            await _publishEndpoint.Publish(new OrderSubmittedEvent(userId, dto.ProductIds));

            // Tell the user "HTTP 202 Accepted: We received your request."
            return Accepted(new { Message = "Your order was received and is processing securely in the background." });
        }
    }
}
