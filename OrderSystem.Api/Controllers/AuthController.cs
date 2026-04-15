using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderSystem.Api.Data;
using OrderSystem.Api.Models;

namespace OrderSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // DTOs for payloads
        public record AuthRequest(string Email, string Password);

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            
            // In a true production environment, NEVER store plaintext passwords!
            // You must use BCrypt.Net-Next to Hash the passwords. For this LinkedIn Demo, we will simulate.
            if (user == null || user.Password != request.Password)
            {
                return Unauthorized();
            }

            var token = new OrderSystem.Api.Services.AuthService(
                new Microsoft.Extensions.Configuration.ConfigurationBuilder()
                    .AddJsonFile("appsettings.json", optional: true)
                    .AddEnvironmentVariables()
                    .Build()
            ).GenerateJwtToken(user);

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
            {
                return BadRequest("User already explicitly exists in the Global Matrix.");
            }

            var newUser = new User 
            { 
                Email = request.Email, 
                Password = request.Password // Simulated Hash
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            var token = new OrderSystem.Api.Services.AuthService(
                new Microsoft.Extensions.Configuration.ConfigurationBuilder()
                    .AddJsonFile("appsettings.json", optional: true)
                    .AddEnvironmentVariables()
                    .Build()
            ).GenerateJwtToken(newUser);

            return Ok(new { 
                id = newUser.Id.ToString(),
                email = newUser.Email,
                name = newUser.Email.Split('@')[0],
                omniToken = token
            });
        }
    }
}
