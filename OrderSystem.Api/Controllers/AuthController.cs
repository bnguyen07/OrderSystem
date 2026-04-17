using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderSystem.Api.Data;
using OrderSystem.Api.Models;
using OrderSystem.Api.Services;

namespace OrderSystem.Api.Controllers
{
    [Route("api/Identity")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AuthService _authService;

        public AuthController(AppDbContext context, AuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        public record AuthRequest(string Email, string Password);

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || user.Password != request.Password)
                return Unauthorized();

            var token = _authService.GenerateToken(user);

            return Ok(new {
                id = user.Id.ToString(),
                email = user.Email,
                name = user.Email.Split('@')[0],
                omniToken = token
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest("User already exists.");

            var newUser = new User { Email = request.Email, Password = request.Password };
            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            var token = _authService.GenerateToken(newUser);

            return Ok(new {
                id = newUser.Id.ToString(),
                email = newUser.Email,
                name = newUser.Email.Split('@')[0],
                omniToken = token
            });
        }
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                // To prevent email enumeration, we still return Ok even if it doesn't exist
                return Ok(new { Message = "If an account exists with that email, a password reset link has been sent." });
            }

            // In a real system, we'd fire an event to a NotificationService via RabbitMQ here.
            // For now, simply return a 200 OK.
            return Ok(new { Message = "If an account exists with that email, a password reset link has been sent." });
        }
    }

    public record ForgotPasswordRequest(string Email);
}
