namespace OrderSystem.Api.DTOs
{
    public class OrderCreateDto
    {
        public int UserId { get; set; }
        public List<int> ProductIds { get; set; } = new();
    }

    public class OrderResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public List<int> ProductIds { get; set; } = new();
    }
}
