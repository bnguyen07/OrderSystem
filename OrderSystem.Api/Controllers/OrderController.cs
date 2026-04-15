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
            
            // If the user logged in via Local JWT, this is an Integer.
            // If the user logged in via Google, this is a massive String!
            // For now, map all Google users to Enterprise System ID 1.
            int userId = 1;
            if (int.TryParse(userIdString, out int parsedId)) 
            {
                userId = parsedId;
            }
            else if (string.IsNullOrEmpty(userIdString))
            {
                return Unauthorized();
            }

            var orders = await _service.GetUserOrdersAsync(userId);
            return Ok(orders);
        }

        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<OrderResponseDto>>> GetAllOrders()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (email != "brian.nguyen2447@gmail.com")
            {
                // MATHEMATICAL SECURE BLOCKADE
                return Forbid();
            }

            var orders = await _service.GetAllOrdersAsync();
            return Ok(orders);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder(OrderCreateDto dto)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            // Convert Google identity strings into integer System IDs seamlessly
            int userId = 1;
            if (int.TryParse(userIdString, out int parsedId)) 
            {
                userId = parsedId;
            }
            else if (string.IsNullOrEmpty(userIdString))
            {
                return Unauthorized();
            }

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
